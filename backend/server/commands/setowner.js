const { storage } = require("../storage");

async function setOwnerCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        if (args.length === 0) {
            return await sock.sendMessage(chatId, { text: "❌ Please provide the new owner number.\nExample: *.setowner 2349164898577*" });
        }

        const newOwner = args[0].replace(/\D/g, '');
        if (userId) {
            await storage.updateUserSettings(userId, { ownerNumber: newOwner });
        } else {
            await storage.updateSettings({ ownerNumber: newOwner });
        }

        await sock.sendMessage(chatId, { 
            text: `✅ *Owner Updated*\n\nNew owner number: ${newOwner}\nThis number will now be displayed as the owner in commands.` 
        });
    } catch (error) {
        console.error("Error in setowner command:", error);
        await sock.sendMessage(chatId, { text: "❌ Failed to update owner." });
    }
}

module.exports = setOwnerCommand;
