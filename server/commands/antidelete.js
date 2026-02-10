const fs = require('fs');
const path = require('path');

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

async function storeMessage(sock, msg) {
    // Always store messages if we want to catch deletions, 
    // but check if enabled during the actual revocation handling
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
    
    // Don't store protocol messages (revocations etc)
    if (msg.message.protocolMessage) return;

    const storage = readStorage();
    const chatId = msg.key.remoteJid;
    const msgId = msg.key.id;
    
    if (!storage[chatId]) storage[chatId] = {};
    storage[chatId][msgId] = JSON.parse(JSON.stringify(msg)); // Deep copy to preserve message content
    
    // Keep only last 100 messages per chat
    const keys = Object.keys(storage[chatId]);
    if (keys.length > 100) {
        delete storage[chatId][keys[0]];
    }
    
    writeStorage(storage);
}

async function handleMessageRevocation(sock, msg) {
    const chatId = msg.key.remoteJid;
    const { enabled } = readState(chatId);
    if (!enabled) return;
    try {
        const protocolMsg = msg.message.protocolMessage;
        if (!protocolMsg || protocolMsg.type !== 0) return; // type 0 is REVOKE

        const targetId = protocolMsg.key.id;
        
        const storage = readStorage();
        const { channelInfo } = require("../lib/messageConfig");
        if (storage[chatId] && storage[chatId][targetId]) {
            const deletedMsg = storage[chatId][targetId];
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

async function antideleteCommand(sock, chatId, senderId, mentionedJids, message, args) {
    const cmd = args[0]?.toLowerCase();
    if (cmd === 'on') {
        updateState(chatId, { enabled: true });
        await sock.sendMessage(chatId, { text: '✅ Antidelete enabled for this chat.' });
    } else if (cmd === 'off') {
        updateState(chatId, { enabled: false });
        await sock.sendMessage(chatId, { text: '❌ Antidelete disabled for this chat.' });
    } else {
        const { enabled } = readState(chatId);
        await sock.sendMessage(chatId, { text: `Antidelete is currently *${enabled ? 'ON' : 'OFF'}*\nUsage: .antidelete on/off` });
    }
}

module.exports = { storeMessage, handleMessageRevocation, antideleteCommand };