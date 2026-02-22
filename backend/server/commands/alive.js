const settings = require("../settings");
const fs = require("fs");
const path = require("path");

// Your Imgur direct link
const BOT_IMAGE = "https://i.imgur.com/fRaOmQH.jpeg";

async function aliveCommand(
    sock,
    chatId,
    senderId,
    mentionedJids,
    message,
    args,
) {
    try {
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const d = Math.floor(uptimeSeconds / (3600 * 24));
        const h = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const m = Math.floor((uptimeSeconds % 3600) / 60);
        const s = Math.floor(uptimeSeconds % 60);
        const uptime = `${d}d ${h}h ${m}m ${s}s`;

        // Get bot mode
        let mode = "PUBLIC";
        try {
            const modeFile = path.join(
                process.cwd(),
                "data",
                "messageCount.json",
            );
            if (fs.existsSync(modeFile)) {
                const modeData = JSON.parse(fs.readFileSync(modeFile, "utf-8"));
                mode = modeData.isPublic ? "PUBLIC" : "PRIVATE";
            }
        } catch (e) {}

        // Send as clickable link preview with channel info
        const { channelInfo } = require("../lib/messageConfig");
        const settingsData = await require("../storage").storage.getSettings();
        
        await sock.sendMessage(
            chatId,
            {
                text: `⚔️ *ʙᴏss ᴜɴɪᴛ sᴛᴀᴛᴜs* ⚔️

🤖 *sʏsᴛᴇᴍ : ᴀᴄᴛɪᴠᴇ*
🔖 *ᴠᴇʀsɪᴏɴ : ${settings.version}*
⏱️ *ᴜᴘᴛɪᴍᴇ : ${uptime}*
🛡️ *ᴍᴏᴅᴇ   : ${mode}*
👤 *ᴏᴡɴᴇʀ  : ${settingsData.ownerNumber || 'ɪsʀᴀᴇʟ'}*

🔥 ᴄᴏᴍᴍᴀɴᴅ ᴄᴇɴᴛᴇʀ ɪs ʟɪᴠᴇ

Type *.menu* to access all features.

*Powered by Israel*`,
                contextInfo: {
                    ...channelInfo.contextInfo,
                    externalAdReply: {
                        ...channelInfo.contextInfo.externalAdReply,
                        thumbnailUrl: BOT_IMAGE,
                        renderLargerThumbnail: true
                    }
                },
                buttons: channelInfo.buttons,
                footer: channelInfo.footer,
                headerType: 4
            },
            { quoted: message },
        );
    } catch (error) {
        console.error("Error in alive command:", error);
        await sock.sendMessage(
            chatId,
            { text: "Bot is alive and running!" },
            { quoted: message },
        );
    }
}

module.exports = aliveCommand;