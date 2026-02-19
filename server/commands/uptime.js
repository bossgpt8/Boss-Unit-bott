const BOT_IMAGE = "https://i.imgur.com/fRaOmQH.jpeg"; // your Imgur direct link

async function uptimeCommand(
    sock,
    chatId,
    senderId,
    mentionedJids,
    message,
    args,
) {
    try {
        const uptimeSeconds = process.uptime();
        const d = Math.floor(uptimeSeconds / (3600 * 24));
        const h = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const m = Math.floor((uptimeSeconds % 3600) / 60);
        const s = Math.floor(uptimeSeconds % 60);

        const uptime = `${d}d ${h}h ${m}m ${s}s`;

        const uptimeInfo = `⏱️ *ʙᴏss ᴜᴘᴛɪᴍᴇ* ⚡

🕐 *ʀᴜɴᴛɪᴍᴇ : ${uptime}*
⚡ *sᴛᴀᴛᴜs : ᴏɴʟɪɴᴇ*

🔥 [Click here for bot image](${BOT_IMAGE})`;

        await sock.sendMessage(
            chatId,
            {
                text: uptimeInfo,
                linkPreview: true, // small clickable preview
            },
            { quoted: message },
        );
    } catch (error) {
        console.error("Error in uptime command:", error);
        await sock.sendMessage(
            chatId,
            { text: "❌ Failed to get uptime." },
            { quoted: message },
        );
    }
}

export default uptimeCommand;