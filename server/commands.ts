import { type WASocket, type proto } from "@whiskeysockets/baileys";
import { storage } from "./storage";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const COMMANDS_DIR = path.join(__dirname, "commands");
const loadedCommands = new Map<string, Function>();

const COMMAND_ALIASES: Record<string, string> = {
  "vv": "viewonce", "vo": "viewonce", "menu": "help", "s": "sticker", "st": "sticker",
  "tg": "tagall", "ht": "hidetag", "rm": "kick", "remove": "kick", "add": "promote",
  "del": "delete", "d": "delete", "public": "mode", "private": "mode", "pub": "mode",
  "priv": "mode", "audio": "song", "mp3": "song", "vid": "video", "mp4": "video",
  "yt": "play", "music": "play", "unlink": "logout", "logoutbot": "logout"
};

function initCommands() {
  if (fs.existsSync(COMMANDS_DIR)) {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".js"));
    for (const file of files) {
      try {
        const commandName = path.basename(file, ".js");
        const filePath = path.join(COMMANDS_DIR, file);
        delete require.cache[require.resolve(filePath)];
        const cmdModule = require(filePath);
        let cmdFunc = typeof cmdModule === 'function' ? cmdModule : (cmdModule.execute || cmdModule.default || Object.values(cmdModule).find(v => typeof v === 'function'));
        if (cmdFunc) {
          loadedCommands.set(commandName, cmdFunc);
          console.log(`[INFO] Loaded command: ${commandName}`);
        }
      } catch (err) {
        console.error(`Failed to load command ${file}:`, err);
      }
    }
  }
}

async function checkIsOwner(senderId: string, sock: WASocket, chatId: string): Promise<boolean> {
  try {
    const isOwnerOrSudo = require('./lib/isOwner');
    return await isOwnerOrSudo(senderId, sock, chatId);
  } catch (e) {
    return false;
  }
}

initCommands();

export async function handleCommand(sock: WASocket, msg: proto.IWebMessageInfo, userId?: string) {
  if (!msg.key?.remoteJid || !msg.message) return;
  const remoteJid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid || "";
  const botId = sock.user?.id?.split(':')[0];
  const senderNumber = sender.split('@')[0].split(':')[0];
  const isFromMe = msg.key.fromMe || (botId && senderNumber === botId);

  const content = msg.message.conversation || msg.message.extendedTextMessage?.text || 
                  msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";
  
  const prefix = "."; 
  const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();

  if (!content.startsWith(prefix)) {
    if (!isFromMe && settings.autoRead) await sock.readMessages([msg.key]);
    if (isFromMe) return;
    try {
      const chatbotModule = require("./commands/chatbot.js");
      if (chatbotModule?.handleChatbotResponse) await chatbotModule.handleChatbotResponse(sock, remoteJid, msg, content, sender);
    } catch (e) {}
    return;
  }

  const args = content.slice(prefix.length).trim().split(/\s+/);
  let commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  if (COMMAND_ALIASES[commandName]) {
    const original = commandName;
    commandName = COMMAND_ALIASES[commandName];
    if (commandName === "mode" && ["public", "private", "pub", "priv"].includes(original)) args.unshift(original);
  }

  if (settings.publicMode === false && !isFromMe) {
    if (!(await checkIsOwner(sender, sock, remoteJid))) return;
  }

  const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;

  if (loadedCommands.has(commandName)) {
    try {
      const cmdFunc = loadedCommands.get(commandName);
      await storage.addLog("info", `Executing ${commandName} for ${sender}`);
      if (typeof cmdFunc === 'function') await cmdFunc(sock, remoteJid, sender, mentionedJids, msg, args, quotedParticipant);
    } catch (err) {
      console.error(`Error in ${commandName}:`, err);
    }
  }
}
