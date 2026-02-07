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

async function storeMessage(sock, msg) {
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
    const storage = readStorage();
    const chatId = msg.key.remoteJid;
    const msgId = msg.key.id;
    
    if (!storage[chatId]) storage[chatId] = {};
    storage[chatId][msgId] = msg;
    
    // Keep only last 100 messages per chat
    const keys = Object.keys(storage[chatId]);
    if (keys.length > 100) {
        delete storage[chatId][keys[0]];
    }
    
    writeStorage(storage);
}

async function handleMessageRevocation(sock, msg) {
    try {
        const protocolMsg = msg.message.protocolMessage;
        const targetId = protocolMsg.key.id;
        const chatId = msg.key.remoteJid;
        
        const storage = readStorage();
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
                mentions: [sender]
            }, { quoted: deletedMsg });
        }
    } catch (e) {
        console.error("Antidelete error:", e);
    }
}

module.exports = { storeMessage, handleMessageRevocation };