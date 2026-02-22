const { storage } = require('../storage');

async function autoreadCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
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
            newValue = !settings.autoRead;
        }

        if (userId) {
            await storage.updateUserSettings(userId, { autoRead: newValue });
        } else {
            await storage.updateSettings({ autoRead: newValue });
        }

        await sock.sendMessage(chatId, { text: `✅ Auto Read turned ${newValue ? '*ON*' : '*OFF*'}` }, { quoted: message });
    } catch (err) {
        console.error("Error in autoread:", err);
    }
}

module.exports = {
    execute: autoreadCommand,
    autoreadCommand
};
