const BOT_IMAGE = "https://i.imgur.com/fRaOmQH.jpeg"; // your Imgur direct link

async function runtimeCommand(
    sock,
    chatId,
    senderId,
    mentionedJids,
    message,
    args,
) {
    try {
        const seconds = process.uptime();
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const uptime = `${d}d ${h}h ${m}m ${s}s`;

        const runtimeInfo = `⚡ *ʙᴏss ᴜɴɪᴛ ʀᴜɴᴛɪᴍᴇ* ⚡

🚀 *ᴜᴘᴛɪᴍᴇ : ${uptime}*
⚡ *sᴛᴀᴛᴜs  : ᴏᴘᴇʀᴀᴛɪᴏɴᴀʟ*

🔥 [Click here for bot image](${BOT_IMAGE})`;

        await sock.sendMessage(
            chatId,
            {
                text: runtimeInfo,
                linkPreview: true, // small clickable preview
            },
            { quoted: message },
        );
    } catch (error) {
        console.error("Error in runtime command:", error);
        await sock.sendMessage(
            chatId,
            { text: "❌ Failed to get runtime." },
            { quoted: message },
        );
    }
}

module.exports = runtimeCommand;