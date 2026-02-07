import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { handleCommand } from "./commands";

// 🔴 REPLACE THIS WITH YOUR ACTUAL RAILWAY PAIRING SERVER URL
const PAIRING_SERVER_URL = "https://boss-bot-pair.up.railway.app";

export class BotManager {
  private sock: WASocket | null = null;
  private qr: string | null = null;
  private pairingCode: string | null = null;
  private status: "offline" | "starting" | "online" | "error" = "offline";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private authDir = path.join(process.cwd(), "session");
  private currentUserId: string | null = null;

  constructor() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  public getStatus(userId?: string) {
    return {
      status: this.status,
      qr: this.qr,
      pairingCode: this.pairingCode,
      uptime: process.uptime(),
      currentUserId: this.currentUserId,
    };
  }

  // 🔻 NEW: Fetch session from pairing server
  private async fetchSessionFromServer(sessionId: string): Promise<{ creds: any; keys: any } | null> {
    try {
      const res = await fetch(`${PAIRING_SERVER_URL}/session/${sessionId}/auth-state`);
      if (!res.ok) {
        console.warn(`[REMOTE] Session ${sessionId} not found on server (HTTP ${res.status})`);
        return null;
      }
      const data = await res.json();
      return {
        creds: data.creds,
        keys: data.keys,
      };
    } catch (e) {
      console.error(`[REMOTE] Failed to fetch session ${sessionId}:`, e);
      return null;
    }
  }

  public async start(
    phoneNumber?: string,
    forceNewSession: boolean = true,
    userId?: string,
    useRemotePairing: boolean = false // ← NEW FLAG
  ) {
    if (this.status === "online" || this.status === "starting") return;
    this.status = "starting";
    this.pairingCode = null;
    this.qr = null;
    this.currentUserId = userId || null;
    this.log("info", `Starting Boss Bot for user ${userId || 'default'}...`);

    try {
      const userAuthDir = userId ? path.join(this.authDir, userId) : this.authDir;

      // Clear local session only if forcing new AND not using remote pairing
      if (forceNewSession && !useRemotePairing && phoneNumber && fs.existsSync(userAuthDir)) {
        this.log("info", `Clearing previous LOCAL session for user ${userId || 'default'}`);
        fs.rmSync(userAuthDir, { recursive: true, force: true });
      }

      if (!fs.existsSync(userAuthDir)) {
        fs.mkdirSync(userAuthDir, { recursive: true });
      }

      let authState;
      let saveCreds: () => Promise<void>;

      if (useRemotePairing && userId) {
        // 🔽 LOAD FROM REMOTE SERVER
        this.log("info", `Attempting to load session from pairing server for user ${userId}`);
        const remoteState = await this.fetchSessionFromServer(userId);
        if (remoteState) {
          authState = {
            creds: remoteState.creds,
            keys: makeCacheableSignalKeyStore(remoteState.keys, pino({ level: "silent" }) as any),
          };
          // Still save future updates locally (optional: could sync back to server)
          const { saveCreds: localSave } = await useMultiFileAuthState(userAuthDir);
          saveCreds = localSave;
          this.log("info", "✅ Remote session loaded successfully!");
        } else {
          this.log("warn", "No remote session found. Falling back to local auth.");
          const localState = await useMultiFileAuthState(userAuthDir);
          authState = {
            creds: localState.state.creds,
            keys: makeCacheableSignalKeyStore(localState.state.keys, pino({ level: "silent" }) as any),
          };
          saveCreds = localState.saveCreds;
        }
      } else {
        // 🔽 LOCAL AUTH (QR or local pairing)
        const localState = await useMultiFileAuthState(userAuthDir);
        authState = {
          creds: localState.state.creds,
          keys: makeCacheableSignalKeyStore(localState.state.keys, pino({ level: "silent" }) as any),
        };
        saveCreds = localState.saveCreds;
      }

      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }) as any,
        printQRInTerminal: false,
        auth: authState,
        browser: ["BOSS BOT", "Chrome", "20.0.04"],
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: new Map() as any,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        retryRequestDelayMs: 5000,
      });

      const targetPhoneNumber = phoneNumber;
      let pairingCodeRequested = false;

      this.sock.ev.on("creds.update", saveCreds);

      if (targetPhoneNumber && !useRemotePairing) {
        this.log("info", `Will request pairing code for ${targetPhoneNumber}...`);
      } else if (!targetPhoneNumber) {
        this.log("info", "Checking for existing session or waiting for QR...");
      }

      // Request pairing code ONLY if NOT using remote pairing
      const requestPairingCode = async () => {
        if (pairingCodeRequested || useRemotePairing) return;

        try {
          if (this.sock && !this.sock.authState.creds.registered && targetPhoneNumber) {
            pairingCodeRequested = true;
            this.log("info", "Socket ready - Requesting pairing code from WhatsApp...");
            const cleanNumber = targetPhoneNumber.replace(/\D/g, '');

            await new Promise(resolve => setTimeout(resolve, 3000));

            const code = await this.sock.requestPairingCode(cleanNumber);
            if (code) {
              this.pairingCode = code;
              this.log("info", `Pairing code generated: ${this.pairingCode}`);
              this.log("info", "Go to WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number");
              this.qr = null;
            }
          }
        } catch (err: any) {
          this.log("error", `Failed to get pairing code: ${err.message || err}`);
          pairingCodeRequested = false;
        }
      };

      this.sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        // Only auto-request pairing code if NOT using remote pairing
        if (connection === "connecting" && targetPhoneNumber && !pairingCodeRequested && !useRemotePairing) {
          setTimeout(requestPairingCode, 5000);
        }

        if (connection === "open") {
          const user = this.sock?.user;
          if (user) {
            const connectedNumber = user.id.split(":")[0];
            this.log("info", `Connected! Instance Owner: ${connectedNumber}`);

            if (forceNewSession && targetPhoneNumber) {
              await this.sock.sendMessage(user.id, {
                text: `🚀 *WELCOME TO BOSS BOT*\n\nYour bot is now active and linked to this account.\n\n*Quick Start:*\n• Type *.menu* to see all commands\n• Type *.setbotname* to change bot name\n• Type *.setbotpic* to change profile pic\n\nEnjoy your premium automation! ⚡\n\n > View updates here: 120363426051727952@newsletter`
              });
            }

            if (userId) {
              await storage.updateUserSession(userId, {
                linkedWhatsAppNumber: connectedNumber,
                botActiveStatus: true
              });
              await storage.updateUserSettings(userId, { ownerNumber: connectedNumber });
            } else {
              await storage.updateSettings({ ownerNumber: connectedNumber });
            }
          }
        }

        if (qr && !targetPhoneNumber) {
          this.qr = qr;
          this.pairingCode = null;
          this.log("info", "QR Code generated. Scan with WhatsApp to connect.");
        } else if (qr && targetPhoneNumber && !pairingCodeRequested && !useRemotePairing) {
          requestPairingCode();
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const errorMessage = (lastDisconnect?.error as any)?.message || 'Unknown error';

          const shouldReconnect = statusCode !== DisconnectReason.loggedOut &&
                                  statusCode !== DisconnectReason.connectionReplaced;

          if (statusCode === DisconnectReason.connectionReplaced) {
            this.log("error", "Conflict detected: This session is being used elsewhere.");
          }

          this.log("warn", `Connection closed: ${errorMessage}, status: ${statusCode}, reconnecting: ${shouldReconnect}`);

          this.status = "offline";
          this.qr = null;
          this.pairingCode = null;

          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(2000 * this.reconnectAttempts, 10000);
            this.log("info", `Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay / 1000}s...`);
            setTimeout(() => this.start(undefined, false, userId, useRemotePairing), delay);
          } else {
            if (statusCode === DisconnectReason.loggedOut) {
              this.log("info", "Logged out from device. Session cleared.");
              if (fs.existsSync(userAuthDir)) {
                fs.rmSync(userAuthDir, { recursive: true, force: true });
              }
              this.sock = null;
              this.status = "offline";
            } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              this.log("error", "Max reconnection attempts reached.");
              this.reconnectAttempts = 0;
              this.status = "error";
            }
          }
        } else if (connection === "open") {
          this.status = "online";
          this.qr = null;
          this.reconnectAttempts = 0;
          this.log("info", "Connected to WhatsApp!");

          const user = this.sock?.user;
          if (user) {
            this.log("info", `Logged in as ${user.id.split(":")[0]}`);
          }
        }
      });

      // 👇 Keep all your existing event handlers (group, messages, calls, etc.) — unchanged
      this.sock.ev.on("group-participants.update", async (ev) => {
        try {
          const { id, participants, action } = ev;
          if (action === 'add') {
            const welcomeModule = require("./commands/welcome.js");
            if (welcomeModule.handleJoinEvent) {
              await welcomeModule.handleJoinEvent(this.sock, id, participants);
            }
          } else if (action === 'remove') {
            const goodbyeModule = require("./commands/goodbye.js");
            if (goodbyeModule.handleLeaveEvent) {
              await goodbyeModule.handleLeaveEvent(this.sock, id, participants);
            }
          }
        } catch (e) {
          console.error("Welcome/Goodbye error: ", e);
        }
      });

      this.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (msg.message?.protocolMessage?.type === 0) {
              const remoteJid = msg.key.remoteJid;
              if (remoteJid && this.sock) {
                const antideleteModule = require("./commands/antidelete.js");
                if (antideleteModule.handleMessageRevocation) {
                  await antideleteModule.handleMessageRevocation(this.sock, msg);
                }
              }
            }
          }
        }
      });

      this.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (this.sock) {
              const remoteJid = msg.key.remoteJid;
              if (!remoteJid) continue;

              try {
                if (remoteJid === 'status@broadcast') {
                  const autostatusModule = require("./commands/autostatus.js");
                  await autostatusModule.handleStatusUpdate(this.sock, m);
                }
              } catch (e) {}

              try {
                const settings = await storage.getSettings();
                if (settings.autoRead && this.sock) {
                  await this.sock.sendPresenceUpdate('composing', remoteJid);
                }
              } catch (e) {}

              try {
                const settings = await storage.getSettings();
                if (settings.autoRead && this.sock) {
                  await this.sock.readMessages([msg.key]);
                }
              } catch (e) {}

              try {
                const antideleteModule = require("./commands/antidelete.js");
                if (antideleteModule.storeMessage) {
                  await antideleteModule.storeMessage(this.sock, msg);
                }
              } catch (e) {}

              if (remoteJid === 'status@broadcast') {
                try {
                  await this.sock.readMessages([msg.key]);
                  this.log("info", `Automatically viewed status from ${msg.pushName || 'someone'}`);
                } catch (e) {}
              }

              try {
                const isPrivate = remoteJid && !remoteJid.endsWith('@g.us') && !remoteJid.endsWith('@broadcast');
                const isFromMe = msg.key.fromMe;

                if (isPrivate && !isFromMe) {
                  const pmblockerModule = require("./commands/pmblocker.js");
                  const state = pmblockerModule.readState();
                  if (state.enabled) {
                    const isOwnerOrSudo = require('./lib/isOwner');
                    const senderId = msg.key.participant || msg.key.remoteJid || "";
                    const isOwner = await isOwnerOrSudo(senderId, this.sock, remoteJid);
                    if (!isOwner) {
                      await this.sock.sendMessage(remoteJid, { text: state.message });
                      continue;
                    }
                  }
                }
              } catch (e) {}

              try {
                if (msg.message?.protocolMessage?.type === 0) {
                  const antideleteModule = require("./commands/antidelete.js");
                  if (antideleteModule.handleMessageRevocation) {
                    await antideleteModule.handleMessageRevocation(this.sock, msg);
                  }
                }
              } catch (e) {}

              await handleCommand(this.sock, msg, this.currentUserId);
            }
          }
        }
      });

      this.sock.ev.on("call", async (calls) => {
        try {
          const anticallModule = require("./commands/anticall.js");
          const state = anticallModule.readState();

          if (state.enabled && this.sock) {
            for (const call of calls) {
              if (call.status === "offer") {
                await this.sock.rejectCall(call.id, call.from);
                const callerNumber = call.from.split('@')[0];
                await this.sock.sendMessage(call.from, {
                  text: `❌ *Call Rejected*\n\nCalls are blocked on this bot. Please send a text message instead.`
                });
                this.log("info", `Rejected call from ${callerNumber}`);
              }
            }
          }
        } catch (e) {
          console.error("Anticall error: ", e);
        }
      });

    } catch (err: any) {
      this.log("error", `Failed to start bot: ${err.message}`);
      this.status = "error";
    }
  }

  public async stop() {
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
      this.status = "offline";
      this.qr = null;
      this.log("info", "Bot stopped.");
    }
  }

  public async logout() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.status = "offline";
      this.qr = null;
      const userDir = this.currentUserId ? path.join(this.authDir, this.currentUserId) : this.authDir;
      if (fs.existsSync(userDir)) {
        fs.rmSync(userDir, { recursive: true, force: true });
      }
      this.log("info", "Logged out and session cleared.");
    }
  }

  private async log(level: "info" | "warn" | "error", message: string) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    await storage.addLog(level, message);
  }
}

export const botManager = new BotManager();