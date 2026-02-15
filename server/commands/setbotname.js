const { storage } = require('../storage');

async function setbotnameCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        const isOwner = message.key?.fromMe || settings.ownerNumber === senderId.split('@')[0] || settings.ownerNumber === senderId.split(':')[0];

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '❌ Only bot owner can use this command!' }, { quoted: message });
            return;
        }

        if (!args || args.length === 0) {
            await sock.sendMessage(chatId, { text: "Please provide a name. Example: .setbotname MyBot" }, { quoted: message });
            return;
        }

        const newName = args.join(" ");
        
        if (userId) {
            await storage.updateUserSettings(userId, { botName: newName });
        } else {
            await storage.updateSettings({ botName: newName });
        }

        await sock.sendMessage(chatId, { text: `✅ Bot name updated to: *${newName}*` }, { quoted: message });
    } catch (err) {
        console.error("Error setting bot name:", err);
        await sock.sendMessage(chatId, { text: "❌ Failed to update bot name." }, { quoted: message });
    }
}

module.exports = setbotnameCommand;
