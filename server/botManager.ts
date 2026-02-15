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
import fs from "fs-extra";
import path from "path";
import { storage } from "./storage";
import { handleCommand } from "./commands";
import { uploadSession, downloadSession } from "./sessionStorage";

export class BotManager {
  private instances: Map<string, {
    sock: WASocket | null;
    qr: string | null;
    pairingCode: string | null;
    status: "offline" | "starting" | "online" | "error";
    reconnectAttempts: number;
  }> = new Map();
  private maxReconnectAttempts = 5;
  private authDir = path.join(process.cwd(), "session");

  constructor() {
    fs.ensureDirSync(this.authDir);
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

  public getStatus(userId: string = "default"): any {
    const instance = this.getInstance(userId);
    return {
      status: instance.status,
      qr: instance.qr,
      pairingCode: instance.pairingCode,
      uptime: process.uptime(),
      currentUserId: userId === "default" ? null : userId,
    };
  }

  public async start(phoneNumber?: string, forceNewSession: boolean = true, userId: string = "default") {
    const instance = this.getInstance(userId);
    if (instance.status === "online" || instance.status === "starting") return;
    
    instance.status = "starting";
    instance.pairingCode = null;
    instance.qr = null;
    
    this.log(userId, "info", `Starting Boss Bot for user ${userId}...`);

    try {
      const userAuthDir = userId === "default" ? this.authDir : path.join(this.authDir, userId);

      if (forceNewSession && phoneNumber) {
        await fs.remove(userAuthDir);
      } else {
        await downloadSession(userId, this.authDir);
      }

      await fs.ensureDir(userAuthDir);

      const { state, saveCreds } = await useMultiFileAuthState(userAuthDir);
      const { version } = await fetchLatestBaileysVersion();

      instance.sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }) as any,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }) as any),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: new Map() as any,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        retryRequestDelayMs: 5000,
      });

      instance.sock.ev.on("creds.update", async () => {
        await saveCreds();
        await uploadSession(userId, this.authDir);
      });

      const targetPhoneNumber = phoneNumber;
      if (targetPhoneNumber && !instance.sock.authState.creds.registered) {
        this.log(userId, "info", `Requesting pairing code for ${targetPhoneNumber}...`);
        setTimeout(async () => {
          try {
            if (instance.sock && !instance.sock.authState.creds.registered && instance.sock.ws.isOpen) {
              const code = await instance.sock.requestPairingCode(targetPhoneNumber.replace(/\D/g, ''));
              instance.pairingCode = code?.match(/.{1,4}/g)?.join("-") || code || null;
              this.log(userId, "info", `Pairing code generated: ${instance.pairingCode}`);
              instance.qr = null;
            }
          } catch (err) {
            this.log(userId, "error", `Failed to generate pairing code: ${err}`);
          }
        }, 10000);
      }

      instance.sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !targetPhoneNumber) {
          instance.qr = qr;
          this.log(userId, "info", "QR Code generated.");
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.connectionReplaced;

          this.log(userId, "warn", `Connection closed: ${statusCode}, reconnecting: ${shouldReconnect}`);
          instance.status = "offline";
          instance.qr = null;
          instance.pairingCode = null;

          if (shouldReconnect && instance.reconnectAttempts < this.maxReconnectAttempts) {
            instance.reconnectAttempts++;
            setTimeout(() => this.start(undefined, false, userId), 5000);
          } else if (statusCode === DisconnectReason.loggedOut) {
            await fs.remove(userAuthDir);
            instance.sock = null;
          }
        } else if (connection === "open") {
          instance.status = "online";
          instance.qr = null;
          instance.reconnectAttempts = 0;
          this.log(userId, "info", "Connected to WhatsApp!");
          
          const user = instance.sock?.user;
          if (user) {
            const connectedNumber = user.id.split(":")[0];
            if (userId !== "default") {
              await storage.updateUserSession(userId, { linkedWhatsAppNumber: connectedNumber, botActiveStatus: true });
              await storage.updateUserSettings(userId, { ownerNumber: connectedNumber });
            } else {
              await storage.updateSettings({ ownerNumber: connectedNumber });
            }
          }
        }
      });

      instance.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (instance.sock) {
              // Ensure we pass the correct userId for session-specific settings
              await handleCommand(instance.sock, msg, userId);
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
      await fs.remove(userDir);
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
