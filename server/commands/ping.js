const settings = require("../settings.js");

// You can replace with your Imgur direct link if needed
const BOT_IMAGE = "https://i.imgur.com/fRaOmQH.jpeg";

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = "";
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === "") time += `${seconds}s`;

    return time.trim();
}

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

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        // Sleek small/unicode font style
        const botInfo = `⚔️ *ʙᴏss ᴜɴɪᴛ sᴛᴀᴛᴜs* ⚔️

🚀 *ʟᴀᴛᴇɴᴄʏ  : ${ping} ms*
⏱️ *ᴜᴘᴛɪᴍᴇ  : ${uptimeFormatted}*
🔖 *ᴠᴇʀsɪᴏɴ : v${settings.version}*
🛡️ *sᴛᴀᴛᴜs  : ᴏᴘᴇʀᴀᴛɪᴏɴᴀʟ*

🔥 [Click here for bot image](${BOT_IMAGE})`;

        await sock.sendMessage(
            chatId,
            {
                text: botInfo,
                linkPreview: true, // clickable link preview
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