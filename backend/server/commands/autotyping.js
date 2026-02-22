const { storage } = require('../storage');

async function autotypingCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        const isOwner = message.key?.fromMe || settings.ownerNumber === senderId.split('@')[0] || settings.ownerNumber === senderId.split(':')[0];

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '❌ Only bot owner can use this command!' }, { quoted: message });
            return;
        }

        const option = args[0]?.toLowerCase();
        let newValue;

        if (option === 'on') {
            newValue = true;
        } else if (option === 'off') {
            newValue = false;
        } else {
            newValue = !settings.autoTyping;
        }

        if (userId) {
            await storage.updateUserSettings(userId, { autoTyping: newValue });
        } else {
            await storage.updateSettings({ autoTyping: newValue });
        }

        await sock.sendMessage(chatId, { text: `✅ Auto Typing turned ${newValue ? '*ON*' : '*OFF*'}` }, { quoted: message });
    } catch (err) {
        console.error("Error in autotyping:", err);
    }
}

module.exports = {
    execute: autotypingCommand,
    autotypingCommand
};

function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        return false;
    }
}

async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (isAutotypingEnabled()) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('composing', chatId);
            const typingDelay = Math.max(2000, Math.min(5000, userMessage.length * 100));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            // We don't need to send 'paused' explicitly usually, sending message will clear it
            return true;
        } catch (error) {
            return false;
        }
    }
    return false;
}

module.exports = {
    execute: autotypingCommand,
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage
};
