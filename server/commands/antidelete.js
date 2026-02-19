import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_FILE = path.join(__dirname, '../data/deleted_messages.json');

function readStorage() {
    try {
        if (!fs.existsSync(STORAGE_FILE)) return {};
        return JSON.parse(fs.readFileSync(STORAGE_FILE));
    } catch (e) { return {}; }
}

function writeStorage(data) {
    try {
        const dir = path.dirname(STORAGE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    } catch (e) {}
}

// Store settings globally in memory
const antideleteSettings = {};

function readState(chatId) {
    if (!antideleteSettings[chatId]) {
        antideleteSettings[chatId] = { enabled: false };
    }
    return antideleteSettings[chatId];
}

function updateState(chatId, newState) {
    if (!antideleteSettings[chatId]) {
        antideleteSettings[chatId] = { enabled: false };
    }
    if (typeof newState.enabled !== 'undefined') {
        antideleteSettings[chatId].enabled = newState.enabled;
    }
    return antideleteSettings[chatId];
}

export async function storeMessage(sock, msg) {
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
    if (msg.message.protocolMessage) return;

    const storageData = readStorage();
    const chatId = msg.key.remoteJid;
    const msgId = msg.key.id;
    
    if (!storageData[chatId]) storageData[chatId] = {};
    storageData[chatId][msgId] = JSON.parse(JSON.stringify(msg));
    
    const keys = Object.keys(storageData[chatId]);
    if (keys.length > 100) {
        delete storageData[chatId][keys[0]];
    }
    
    writeStorage(storageData);
}

export async function handleMessageRevocation(sock, msg) {
    const chatId = msg.key.remoteJid;
    const { enabled } = readState(chatId);
    
    const { storage } = await import('../storage.js');
    const settings = await storage.getSettings();
    if (!enabled && !settings.antiDelete) return;

    try {
        const protocolMsg = msg.message.protocolMessage;
        if (!protocolMsg || protocolMsg.type !== 0) return;

        const targetId = protocolMsg.key.id;
        const storageData = readStorage();
        const config = await import("../lib/messageConfig.js");
        const channelInfo = config.default || config.channelInfo || config;

        if (storageData[chatId] && storageData[chatId][targetId]) {
            const deletedMsg = storageData[chatId][targetId];
            const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
            const senderName = sender.split('@')[0];
            
            let content = "Unknown content";
            if (deletedMsg.message.conversation) content = deletedMsg.message.conversation;
            else if (deletedMsg.message.extendedTextMessage) content = deletedMsg.message.extendedTextMessage.text;
            else if (deletedMsg.message.imageMessage) content = "[Image with caption: " + (deletedMsg.message.imageMessage.caption || "none") + "]";
            else if (deletedMsg.message.videoMessage) content = "[Video with caption: " + (deletedMsg.message.videoMessage.caption || "none") + "]";
            
            await sock.sendMessage(chatId, {
                text: `Nice try 😏, here is what was deleted from @${senderName}:\n\n"${content}"`,
                mentions: [sender],
                ...channelInfo
            }, { quoted: deletedMsg });
        }
    } catch (e) {
        console.error("Antidelete error:", e);
    }
}

export async function antideleteCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    const cmd = args[0]?.toLowerCase();
    const { storage } = await import('../storage.js');
    
    if (cmd === 'on') {
        if (userId) await storage.updateUserSettings(userId, { antiDelete: true });
        else await storage.updateSettings({ antiDelete: true });
        updateState(chatId, { enabled: true });
        await sock.sendMessage(chatId, { text: '✅ *ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴇɴᴀʙʟᴇᴅ ғᴏʀ ᴛʜɪs ᴄʜᴀᴛ.*' });
    } else if (cmd === 'off') {
        if (userId) await storage.updateUserSettings(userId, { antiDelete: false });
        else await storage.updateSettings({ antiDelete: false });
        updateState(chatId, { enabled: false });
        await sock.sendMessage(chatId, { text: '❌ *ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴅɪsᴀʙʟᴇᴅ ғᴏʀ ᴛʜɪs ᴄʜᴀᴛ.*' });
    } else {
        const { enabled } = readState(chatId);
        await sock.sendMessage(chatId, { text: `*ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ɪs ᴄᴜʀʀᴇɴᴛʟʏ* *${enabled ? 'ᴏɴ' : 'ᴏғғ'}\nᴜsᴀɢᴇ: .ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴏɴ/ᴏғғ*` });
    }
}

export default { storeMessage, handleMessageRevocation, antideleteCommand };
