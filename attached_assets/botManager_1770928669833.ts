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

export class BotManager {
  private sock: WASocket | null = null;
  private qr: string | null = null;
  private pairingCode: string | null = null;
  private status: "offline" | "starting" | "online" | "error" = "offline";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private authDir = path.join(process.cwd(), "session");

  constructor() {
    // Ensure session directory exists
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  public getStatus() {
    return {
      status: this.status,
      qr: this.qr,
      pairingCode: this.pairingCode,
      uptime: process.uptime(),
    };
  }

  public async start(phoneNumber?: string) {
    if (this.status === "online" || this.status === "starting") return;

    this.status = "starting";
    this.pairingCode = null;
    this.qr = null;
    this.log("info", "Starting Boss Bot...");

    try {
      const settings = await storage.getSettings();
      const ownerNumbers = (settings.ownerNumbers as string[]) || ['2349164898577'];
      const defaultOwner = ownerNumbers[0];
      
      // Check if we already have an active session for any owner
      // In a multi-user environment, we'd need multiple authDirs or a dynamic authDir
      // For now, let's keep it simple: one active session at a time, but allow ANY of the owners to be the initial pairing target
      
      if (fs.existsSync(this.authDir)) {
        if (phoneNumber) {
          this.log("info", "Clearing previous session for new pairing...");
          fs.rmSync(this.authDir, { recursive: true, force: true });
          fs.mkdirSync(this.authDir, { recursive: true });
        }
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        logger: pino({ level: "debug" }) as any,
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

      if (!this.sock.authState.creds.registered && !phoneNumber) {
        this.log("info", `Auto-pairing with default owner: ${defaultOwner}`);
        phoneNumber = defaultOwner;
      }

      if (phoneNumber && !this.sock.authState.creds.registered) {
        this.log("info", `Requesting pairing code for ${phoneNumber}...`);
        // Increase delay to ensure socket is ready for pairing code request
        setTimeout(async () => {
          try {
            if (this.sock && !this.sock.authState.creds.registered) {
              this.log("info", "Generating pairing code...");
              // Ensure we are connected before requesting
              if (this.sock.ws.isOpen) {
                const code = await this.sock.requestPairingCode(phoneNumber);
                this.pairingCode = code?.match(/.{1,4}/g)?.join("-") || code || null;
                this.log("info", `Pairing code generated: ${this.pairingCode}`);
                this.qr = null; // Clear QR when using pairing code
              } else {
                this.log("error", "Socket closed before pairing code could be generated.");
                this.pairingCode = null;
              }
            }
          } catch (err) {
            this.log("error", `Failed to generate pairing code: ${err}`);
            this.pairingCode = null;
          }
        }, 15000); // Increased to 15 seconds for better stability
      }

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !phoneNumber) {
          this.qr = qr;
          this.log("info", "QR Code generated. Scan to connect.");
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                statusCode !== DisconnectReason.connectionClosed &&
                                statusCode !== DisconnectReason.connectionLost;

          this.log(
            "warn",
            `Connection closed due to ${lastDisconnect?.error}, status: ${statusCode}, reconnecting: ${shouldReconnect}`
          );

          this.status = "offline";
          this.qr = null;
          this.pairingCode = null;

          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log("info", `Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.start(), 5000); 
          } else {
             if (statusCode === DisconnectReason.loggedOut) {
               this.log("info", "Logged out from device.");
               // Clean session dir
               fs.rmSync(this.authDir, { recursive: true, force: true });
               this.sock = null;
               this.status = "offline";
             } else {
               this.log("error", "Connection failed permanently. Please try linking again.");
               this.status = "error";
             }
          }
        } else if (connection === "open") {
          this.status = "online";
          this.qr = null;
          this.reconnectAttempts = 0;
          this.log("info", "Connected to WhatsApp!");
          
          // Send a self-message or log info
          const user = this.sock?.user;
          if (user) {
            this.log("info", `Logged in as ${user.id.split(":")[0]}`);
          }
        }
      });

      this.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (this.sock) {
              await handleCommand(this.sock, msg);
            }
          }
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
      // Clean session dir
      fs.rmSync(this.authDir, { recursive: true, force: true });
      this.log("info", "Logged out and session cleared.");
    }
  }

  private async log(level: "info" | "warn" | "error", message: string) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    await storage.addLog(level, message);
  }
}

export const botManager = new BotManager();
