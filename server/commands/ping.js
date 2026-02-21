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
        
        // Use a lightweight message to test latency
        const { key } = await sock.sendMessage(chatId, { text: "Testing latency..." });
        
        const end = Date.now();
        const ping = end - start;

        const botInfo = `🏓 *ᴘᴏɴɢ! ${ping} ᴍs*`;

        // Create a clean contextInfo without externalAdReply
        const cleanContextInfo = { ...channelInfo.contextInfo };
        delete cleanContextInfo.externalAdReply;

        await sock.sendMessage(
            chatId,
            {
                text: botInfo,
                edit: key,
                contextInfo: cleanContextInfo,
                footer: channelInfo.footer,
                mentions: [senderId]
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
