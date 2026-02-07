import { type WASocket, type proto } from "@whiskeysockets/baileys";
import { storage } from "./storage";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const COMMANDS_DIR = path.join(__dirname, "commands");
const loadedCommands = new Map<string, Function>();

const COMMAND_ALIASES: Record<string, string> = {
  "vv": "viewonce",
  "vo": "viewonce",
  "menu": "help",
  "s": "sticker",
  "st": "sticker",
  "tg": "tagall",
  "ht": "hidetag",
  "rm": "kick",
  "remove": "kick",
  "add": "promote",
  "del": "delete",
  "d": "delete",
  "public": "mode",
  "private": "mode",
  "pub": "mode",
  "priv": "mode",
  "audio": "song",
  "mp3": "song",
  "vid": "video",
  "mp4": "video",
  "yt": "play",
  "music": "play",
  "unlink": "logout",
  "logoutbot": "logout"
};

// Load commands on module initialization
function initCommands() {
  if (fs.existsSync(COMMANDS_DIR)) {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".js"));
    for (const file of files) {
      try {
        const commandName = path.basename(file, ".js");
        const filePath = path.join(COMMANDS_DIR, file);
        
        // Clear cache to reload fresh
        delete require.cache[require.resolve(filePath)];
        const cmdModule = require(filePath);
        
        let cmdFunc = null;
        if (typeof cmdModule === 'function') {
          cmdFunc = cmdModule;
        } else if (cmdModule.execute && typeof cmdModule.execute === 'function') {
          cmdFunc = cmdModule.execute;
        } else if (cmdModule.default && typeof cmdModule.default === 'function') {
          cmdFunc = cmdModule.default;
        } else {
          const possibleFunc = Object.values(cmdModule).find(v => typeof v === 'function');
          if (possibleFunc) {
            cmdFunc = possibleFunc;
          }
        }
        
        if (cmdFunc) {
          loadedCommands.set(commandName, cmdFunc);
          console.log(`[INFO] Loaded command: ${commandName}`);
        } else {
          console.warn(`[WARN] No valid function found for command: ${commandName}`);
        }
      } catch (err) {
        console.error(`Failed to load command ${file}:`, err);
      }
    }
  }
}

// Check if bot is in private mode
function isPrivateMode(settings: any): boolean {
  return settings.publicMode === false;
}

// Check if sender is owner or sudo
async function checkIsOwner(senderId: string, sock: WASocket, chatId: string): Promise<boolean> {
  try {
    const isOwnerOrSudo = require('./lib/isOwner');
    return await isOwnerOrSudo(senderId, sock, chatId);
  } catch (e) {
    console.error('Error checking owner:', e);
    return false;
  }
}

// Initial call
initCommands();

export async function handleCommand(sock: WASocket, msg: proto.IWebMessageInfo, userId?: string) {
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid || !msg.message) return;

  const sender = msg.key.participant || msg.key.remoteJid || "";
  
  // Bot's own ID normalization for comparison
  const botId = sock.user?.id.split(':')[0];
  const senderNumber = sender.split('@')[0].split(':')[0];
  const isFromMe = msg.key.fromMe || (botId && senderNumber === botId);

  const content = msg.message.conversation || 
                  msg.message.extendedTextMessage?.text || 
                  msg.message.imageMessage?.caption ||
                  msg.message.videoMessage?.caption ||
                  "";
  
  const prefix = "."; 
  if (!content.startsWith(prefix)) {
    // Handle autoread logic if enabled
    try {
      if (!isFromMe) {
        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        if (settings.autoRead) {
          await sock.readMessages([msg.key]);
        }
      }
    } catch (e) {}

    // Handle chatbot response if enabled (for non-commands)
    if (isFromMe) return;

    try {
      // Handle autotyping for chatbot responses
      const autotypingModule = require("./commands/autotyping.js");
      if (autotypingModule.isAutotypingEnabled && autotypingModule.isAutotypingEnabled()) {
        await sock.sendPresenceUpdate('composing', remoteJid);
      }
      
      const chatbotModule = require("./commands/chatbot.js");
      if (chatbotModule && chatbotModule.handleChatbotResponse) {
        await chatbotModule.handleChatbotResponse(sock, remoteJid, msg, content, sender);
      }
      
      if (autotypingModule.isAutotypingEnabled && autotypingModule.isAutotypingEnabled()) {
        await sock.sendPresenceUpdate('paused', remoteJid);
      }
    } catch (err) {
      console.error("Error in chatbot response handler:", err);
    }
    return;
  }

  const args = content.slice(prefix.length).trim().split(/\s+/);
  let commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  // Resolve command aliases
  const originalCommand = commandName;
  
  // WhatsApp Channel Redirection
  if (remoteJid.includes('@newsletter')) {
    if (commandName === 'ping' || commandName === 'alive' || commandName === 'runtime') {
       await sock.sendMessage(remoteJid, { text: "Join our official channel for updates: https://whatsapp.com/channel/..." });
       return;
    }
  }

  if (COMMAND_ALIASES[commandName]) {
    commandName = COMMAND_ALIASES[commandName];
    
    // For mode aliases, pass the original command as the first argument
    if (commandName === "mode" && (originalCommand === "public" || originalCommand === "private" || originalCommand === "pub" || originalCommand === "priv")) {
      args.unshift(originalCommand);
    }
  }

  const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();

  // Handle Button Responses
  if (msg.message?.buttonsResponseMessage) {
    const id = msg.message.buttonsResponseMessage.selectedButtonId;
    const helpModule = require("./commands/help.js");
    
    if (id === 'help_general') return helpModule.sendGeneralHelp(sock, remoteJid, msg);
    if (id === 'help_admin') return helpModule.sendAdminHelp(sock, remoteJid, msg);
    if (id === 'help_ai') return helpModule.sendAIHelp(sock, remoteJid, msg);
    if (id === 'help_download') return helpModule.sendDownloadHelp(sock, remoteJid, msg);
    if (id === 'help_fun') return helpModule.sendFunHelp(sock, remoteJid, msg);
  }

  // PRIVATE MODE CHECK - Block non-owners if bot is in private mode
  if (isPrivateMode(settings) && !isFromMe) {
    const isOwner = await checkIsOwner(sender, sock, remoteJid);
    if (!isOwner) {
      await sock.sendMessage(remoteJid, { 
        text: "🔒 *PRIVATE ACCESS ONLY*\n\nBoss Bot is currently in private mode. Only the owner can use commands." 
      }, { quoted: msg });
      return;
    }
  }

  // Extract mentioned JIDs from the message
  const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  
  // Extract quoted participant if replying to a message
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  // 1. Try dynamic commands first
  if (loadedCommands.has(commandName)) {
    try {
      const cmdFunc = loadedCommands.get(commandName);
      if (userId) {
        await storage.addUserLog(userId, "info", `Executing command: ${commandName} for ${sender}`);
      } else {
        await storage.addLog("info", `Executing command: ${commandName} for ${sender}`);
      }
      console.log(`[DEBUG] Calling dynamic command function for: ${commandName}`);
      
      if (typeof cmdFunc === 'function') {
        // Pass comprehensive parameters that most commands need
        await (cmdFunc as any)(sock, remoteJid, sender, mentionedJids, msg, args, quotedParticipant);
        return;
      }
    } catch (err) {
      console.error(`Error in command ${commandName}:`, err);
      if (userId) {
        await storage.addUserLog(userId, "error", `Error in command ${commandName}: ${err}`);
      } else {
        await storage.addLog("error", `Error in command ${commandName}: ${err}`);
      }
    }
  }

  // 2. Core Commands / Fallbacks
  switch (commandName) {
    case "hi":
    case "hello":
      await sock.sendPresenceUpdate('composing', remoteJid);
      await sock.sendMessage(remoteJid, { text: "Hello! I am BOSS. How can I help you today?" });
      if (userId) {
        await storage.addUserLog(userId, "info", `Command 'hi' triggered by ${sender}`);
      } else {
        await storage.addLog("info", `Command 'hi' triggered by ${sender}`);
      }
      break;

    case "reboot":
      if (isFromMe) {
        await sock.sendMessage(remoteJid, { text: "Restarting system... 🔄" });
        setTimeout(() => process.exit(1), 1000);
      }
      break;
    
    case "status":
      const statusSettings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
      await sock.sendMessage(remoteJid, { text: `Bot Name: ${statusSettings.botName}\nStatus: Online 🚀` });
      break;
  }
}
