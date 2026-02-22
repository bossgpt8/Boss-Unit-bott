const { channelInfo } = require("../lib/messageConfig");

async function pingCommand(
    sock,
    chatId,
    senderId,
    mentionedJids,
    message,
    args,
) {
    try {
        const start = Date.now();
        const end = Date.now();
        const ping = end - start;

        const botInfo = `🏓 ᴘᴏɴɢ! ${ping} ᴍs`;

        await sock.sendMessage(
            chatId,
            { text: botInfo },
            { quoted: message }, // 👈 THIS MAKES IT A REPLY
        );
    } catch (error) {
        console.error("Error in ping command:", error);
        await sock.sendMessage(
            chatId,
            { text: "❌ Failed to get ping: " + error.message },
            { quoted: message },
        );
    }
}

module.exports = pingCommand;
