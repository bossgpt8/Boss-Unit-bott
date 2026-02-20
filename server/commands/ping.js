const settings = require("../settings.js");

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

        const botInfo = `🏓 *ᴘᴏɴɢ! ${ping} ᴍs*`;

        const { channelInfo } = require("../lib/messageConfig");

        // Create a clean contextInfo without externalAdReply
        const cleanContextInfo = { ...channelInfo.contextInfo };
        delete cleanContextInfo.externalAdReply; // Completely remove it

        await sock.sendMessage(
            chatId,
            {
                text: botInfo,
                contextInfo: cleanContextInfo,
                footer: channelInfo.footer,
            },
            { quoted: message },
        );
    } catch (error) {
        console.error("Error in ping command:", error);
        await sock.sendMessage(
            chatId,
            { text: "❌ Failed to get bot status: " + error.message },
            { quoted: message },
        );
    }
}

module.exports = pingCommand;
