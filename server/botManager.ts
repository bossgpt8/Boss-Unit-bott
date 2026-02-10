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
  private instances: Map<string, {
    sock: WASocket | null;
    qr: string | null;
    pairingCode: string | null;
    status: "offline" | "starting" | "online" | "error";
    reconnectAttempts: number;
  }> = new Map();
  private maxReconnectAttempts = 10;
  private authDir = path.join(process.cwd(), "session");

  constructor() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  private getInstance(userId: string = "default") {
    if (!this.instances.has(userId)) {
      this.instances.set(userId, {
        sock: null,
        qr: null,
        pairingCode: null,
        status: "offline",
        reconnectAttempts: 0,
      });
    }
    return this.instances.get(userId)!;
  }

  public getStatus(userId: string = "default") {
    const instance = this.getInstance(userId);
    return {
      status: instance.status,
      qr: instance.qr,
      pairingCode: instance.pairingCode,
      uptime: process.uptime(),
      currentUserId: userId === "default" ? null : userId,
    };
  }

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
    userId: string = "default",
    useRemotePairing: boolean = false
  ) {
    const instance = this.getInstance(userId);
    if (instance.status === "online" || instance.status === "starting") return;
    
    instance.status = "starting";
    instance.pairingCode = null;
    instance.qr = null;
    
    this.log(userId, "info", `Starting Boss Bot for user ${userId}...`);

    try {
      const userAuthDir = userId === "default" ? this.authDir : path.join(this.authDir, userId);

      if (forceNewSession && !useRemotePairing && phoneNumber && fs.existsSync(userAuthDir)) {
        this.log(userId, "info", `Clearing previous LOCAL session for user ${userId}`);
        fs.rmSync(userAuthDir, { recursive: true, force: true });
      }

      if (!fs.existsSync(userAuthDir)) {
        fs.mkdirSync(userAuthDir, { recursive: true });
      }

      let authState;
      let saveCreds: () => Promise<void>;

      if (useRemotePairing && userId !== "default") {
        this.log(userId, "info", `Attempting to load session from pairing server for user ${userId}`);
        const remoteState = await this.fetchSessionFromServer(userId);
        if (remoteState) {
          authState = {
            creds: remoteState.creds,
            keys: makeCacheableSignalKeyStore(remoteState.keys, pino({ level: "silent" }) as any),
          };
          const { saveCreds: localSave } = await useMultiFileAuthState(userAuthDir);
          saveCreds = localSave;
          this.log(userId, "info", "✅ Remote session loaded successfully!");
        } else {
          this.log(userId, "warn", "No remote session found. Falling back to local auth.");
          const localState = await useMultiFileAuthState(userAuthDir);
          authState = {
            creds: localState.state.creds,
            keys: makeCacheableSignalKeyStore(localState.state.keys, pino({ level: "silent" }) as any),
          };
          saveCreds = localState.saveCreds;
        }
      } else {
        const localState = await useMultiFileAuthState(userAuthDir);
        authState = {
          creds: localState.state.creds,
          keys: makeCacheableSignalKeyStore(localState.state.keys, pino({ level: "silent" }) as any),
        };
        saveCreds = localState.saveCreds;
      }

      const { version } = await fetchLatestBaileysVersion();

      instance.sock = makeWASocket({
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

      instance.sock.ev.on("creds.update", saveCreds);

      const requestPairingCode = async () => {
        if (pairingCodeRequested || useRemotePairing) return;
        try {
          if (instance.sock && !instance.sock.authState.creds.registered && targetPhoneNumber) {
            pairingCodeRequested = true;
            this.log(userId, "info", "Socket ready - Requesting pairing code from WhatsApp...");
            const cleanNumber = targetPhoneNumber.replace(/\D/g, '');
            await new Promise(resolve => setTimeout(resolve, 6000));
            const code = await instance.sock.requestPairingCode(cleanNumber);
            if (code) {
              instance.pairingCode = code;
              instance.status = "online"; // Set to online temporarily to show the code
              this.log(userId, "info", `Pairing code generated: ${instance.pairingCode}`);
              instance.qr = null;
            }
          }
        } catch (err: any) {
          this.log(userId, "error", `Failed to get pairing code: ${err.message || err}`);
          pairingCodeRequested = false;
        }
      };

      instance.sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === "connecting" && targetPhoneNumber && !pairingCodeRequested && !useRemotePairing) {
          setTimeout(requestPairingCode, 5000);
        }

        if (connection === "open") {
          const user = instance.sock?.user;
          if (user) {
            const connectedNumber = user.id.split(":")[0];
            this.log(userId, "info", `Connected! Instance Owner: ${connectedNumber}`);

            if (forceNewSession && targetPhoneNumber) {
              await instance.sock.sendMessage(user.id, {
                text: `🚀 *WELCOME TO BOSS BOT*\n\nYour bot is now active and linked to this account.\n\n*Quick Start:*\n• Type *.menu* to see all commands\n• Type *.setbotname* to change bot name\n• Type *.setbotpic* to change profile pic\n\nEnjoy your premium automation! ⚡\n\n > View updates here: 120363426051727952@newsletter`
              });
            }

            if (userId !== "default") {
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
          instance.qr = qr;
          instance.pairingCode = null;
          this.log(userId, "info", "QR Code generated. Scan with WhatsApp to connect.");
        } else if (qr && targetPhoneNumber && !pairingCodeRequested && !useRemotePairing) {
          requestPairingCode();
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const errorMessage = (lastDisconnect?.error as any)?.message || 'Unknown error';
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.connectionReplaced;

          this.log(userId, "warn", `Connection closed: ${errorMessage}, status: ${statusCode}, reconnecting: ${shouldReconnect}`);
          instance.status = "offline";
          instance.qr = null;
          instance.pairingCode = null;

          if (shouldReconnect && instance.reconnectAttempts < this.maxReconnectAttempts) {
            instance.reconnectAttempts++;
            const delay = Math.min(2000 * instance.reconnectAttempts, 10000);
            setTimeout(() => this.start(undefined, false, userId, useRemotePairing), delay);
          } else if (statusCode === DisconnectReason.loggedOut) {
            if (fs.existsSync(userAuthDir)) fs.rmSync(userAuthDir, { recursive: true, force: true });
            instance.sock = null;
          }
        } else if (connection === "open") {
          instance.status = "online";
          instance.qr = null;
          instance.reconnectAttempts = 0;
          this.log(userId, "info", "Connected to WhatsApp!");
        }
      });

      instance.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (instance.sock) {
              const remoteJid = msg.key.remoteJid;
              if (!remoteJid) continue;
              
              const senderId = msg.key.participant || msg.key.remoteJid;
              
              // Handle TicTacToe Move
              try {
                const tictactoe = require("./commands/tictactoe.js");
                const text = (msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption || 
                             msg.message?.videoMessage?.caption || "").trim();
                
                if (/^\.(ttt|tictactoe)$/i.test(text)) {
                  await tictactoe.tictactoeCommand(instance.sock, remoteJid, senderId, [], msg, [text]);
                } else if (text && (!text.startsWith('.') || /^(surrender|give up|.surrender|.stop)$/i.test(text))) {
                  await tictactoe.handleTicTacToeMove(instance.sock, remoteJid, senderId, [], msg, [text]);
                }
              } catch (e) {}

              await handleCommand(instance.sock, msg, userId === "default" ? null : userId);
            }
          }
        }
      });

    } catch (err: any) {
      this.log(userId, "error", `Failed to start bot: ${err.message}`);
      instance.status = "error";
    }
  }

  public async stop(userId: string = "default") {
    const instance = this.getInstance(userId);
    if (instance.sock) {
      instance.sock.end(undefined);
      instance.sock = null;
      instance.status = "offline";
      instance.qr = null;
      this.log(userId, "info", "Bot stopped.");
    }
  }

  public async logout(userId: string = "default") {
    const instance = this.getInstance(userId);
    if (instance.sock) {
      await instance.sock.logout();
      instance.sock = null;
      instance.status = "offline";
      instance.qr = null;
      const userDir = userId === "default" ? this.authDir : path.join(this.authDir, userId);
      if (fs.existsSync(userDir)) fs.rmSync(userDir, { recursive: true, force: true });
      this.log(userId, "info", "Logged out and session cleared.");
    }
  }

  private async log(userId: string, level: "info" | "warn" | "error", message: string) {
    console.log(`[${userId.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
    if (userId !== "default") {
      await storage.addUserLog(userId, level, message);
    } else {
      await storage.addLog(level, message);
    }
  }
}

export const botManager = new BotManager();
