async function logoutCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        // Check if user is owner/sudo
        const { storage } = require('../storage');
        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        const isOwner = settings.ownerNumber === senderId.split('@')[0];

        if (!isOwner) {
            return await sock.sendMessage(chatId, {
                text: "❌ Only the bot owner can logout the bot."
            }, { quoted: message });
        }

        const confirmText = args && args.length > 0 ? args.join(' ').toLowerCase() : '';

        if (confirmText === 'confirm') {
            // Proceed with logout
            await sock.sendMessage(chatId, {
                text: "🔄 Logging out bot..."
            }, { quoted: message });

            // Call botManager logout
            const { botManager } = require('../botManager');
            await botManager.logout();

            await sock.sendMessage(chatId, {
                text: "✅ Bot has been logged out successfully."
            });
        } else if (confirmText === 'cancel') {
            await sock.sendMessage(chatId, {
                text: "❌ Logout cancelled."
            }, { quoted: message });
        } else {
            // Ask for confirmation
            await sock.sendMessage(chatId, {
                text: "⚠️ *LOGOUT CONFIRMATION*\n\nAre you sure you want to logout the bot? This will disconnect it from WhatsApp.\n\nType *.logout confirm* to proceed or *.logout cancel* to abort.",
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in logout command:', error);
        await sock.sendMessage(chatId, {
            text: "❌ Error processing logout request."
        }, { quoted: message });
    }
}

module.exports = logoutCommand;