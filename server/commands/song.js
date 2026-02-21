const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// ✅ Store pending downloads: key = "chatId_senderId"
const pendingDownloads = new Map();

async function songCommand(
    sock,
    chatId,
    senderId,
    mentionedJids,
    message,
    args,
) {
    try {
        const searchQuery =
            args && args.length > 0 ? args.join(" ").trim() : "";

        if (!searchQuery) {
            return await sock.sendMessage(
                chatId,
                {
                    text: "🎵 ᴡʜᴀᴛ sᴏɴɢ ᴅᴏ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ?\n\nUsage: .song <song name>",
                },
                { quoted: message },
            );
        }

        const tmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const metaCommand = `yt-dlp --print "%(title)s|%(duration_string)s|%(view_count)s|%(uploader)s|%(thumbnail)s" "ytsearch1:${searchQuery}"`;

        exec(metaCommand, async (metaError, metaOut) => {
            if (metaError || !metaOut) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: "❌ ғᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ ᴠɪᴅᴇᴏ ᴍᴇᴛᴀᴅᴀᴛᴀ.",
                    },
                    { quoted: message },
                );
            }

            const [title, duration, views, author, thumbnail] = metaOut
                .trim()
                .split("|");
            const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}.mp3`;
            const filePath = path.join(tmpDir, `song_${Date.now()}.mp3`);

            // ✅ Format selection menu - YOUR STYLE PRESERVED
            const metadataMsg = `🎧 *ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 🎶

• *ᴛɪᴛʟᴇ   : ${title}*
• *ᴅᴜʀᴀᴛɪᴏɴ: ${duration}*
• *ᴠɪᴇᴡs   : ${views}*
• *ᴀᴜᴛʜᴏʀ   : ${author}*
• *sᴛᴀᴛᴜs   : ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...*

✦━━━━━━━━━━━━━━━━━━━━━━━━━━━━✦
*ʀᴇᴘʟʏ ᴡɪᴛʜ ɴᴜᴍʙᴇʀ:*
1️⃣ 🎧 *ᴀᴜᴅɪᴏ* (ɴᴏʀᴍᴀʟ - ᴘʟᴀʏs ɪɴ ᴄʜᴀᴛ)
2️⃣ 📁 *ᴅᴏᴄᴜᴍᴇɴᴛ* (ғɪʟᴇ - sᴇɴᴅs ᴀs ᴀᴛᴛᴀᴄʜᴍᴇɴᴛ)
✦━━━━━━━━━━━━━━━━━━━━━━━━━━━━✦
*© Pᴏᴡᴇʀᴇᴅ Bʏ Bᴏss Bᴏᴛ*`;

            // ✅ Store pending download info
            const key = `${chatId}_${senderId}`;
            pendingDownloads.set(key, {
                filePath,
                fileName,
                title,
                thumbnail,
                searchQuery,
                timestamp: Date.now(),
            });

            // ✅ Send metadata with options
            await sock.sendMessage(
                chatId,
                {
                    image: { url: thumbnail },
                    caption: metadataMsg,
                },
                { quoted: message },
            );

            // ✅ Auto-cleanup after 2 minutes if no reply
            const timeoutId = setTimeout(() => {
                const data = pendingDownloads.get(key);
                if (data) {
                    sock.sendMessage(
                        chatId,
                        { text: "⏰ Request expired. Please try again." },
                        { quoted: message },
                    );
                    if (fs.existsSync(data.filePath))
                        try {
                            fs.unlinkSync(data.filePath);
                        } catch (e) {}
                }
                pendingDownloads.delete(key);
            }, 120000);

            pendingDownloads.get(key).timeoutId = timeoutId;
        });
    } catch (error) {
        console.error("Error in song command:", error);
        await sock.sendMessage(
            chatId,
            {
                text: "❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.",
            },
            { quoted: message },
        );
    }
}

// ✅ Reply handler for format selection (1 = Audio, 2 = Document)
async function handleSongReply(sock, chatId, senderId, message, replyText) {
    try {
        const key = `${chatId}_${senderId}`;
        const pendingData = pendingDownloads.get(key);

        if (!pendingData) return false;

        const choice = replyText.trim();
        const { filePath, fileName, title, searchQuery } = pendingData;

        // Download if not already done
        if (!fs.existsSync(filePath)) {
            await sock.sendMessage(
                chatId,
                { text: "🎧 ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ..." },
                { quoted: message },
            );

            const command = `yt-dlp -x --audio-format mp3 --output "${filePath}" "ytsearch1:${searchQuery}"`;

            // ✅ Non-blocking download
            exec(command, async (error) => {
                if (error) {
                    console.error("Download error:", error);
                    await sock.sendMessage(chatId, { text: "❌ Download failed." }, { quoted: message });
                    pendingDownloads.delete(key);
                    return;
                }

                // ✅ Send based on user choice after download finishes
                if (choice === "2") {
                    await sock.sendMessage(
                        chatId,
                        {
                            document: { url: filePath },
                            mimetype: "audio/mpeg",
                            fileName: fileName,
                            caption: `🎵 *${title}*\n\n*© Pᴏᴡᴇʀᴇᴅ Bʏ Bᴏss Bᴏᴛ*`,
                        },
                        { quoted: message },
                    );
                } else {
                    await sock.sendMessage(
                        chatId,
                        {
                            audio: { url: filePath },
                            mimetype: "audio/mpeg",
                            fileName: fileName,
                        },
                        { quoted: message },
                    );
                }

                // Cleanup
                if (pendingData.timeoutId) clearTimeout(pendingData.timeoutId);
                pendingDownloads.delete(key);
                setTimeout(() => {
                    if (fs.existsSync(filePath))
                        try {
                            fs.unlinkSync(filePath);
                        } catch (e) {}
                }, 5000);
            });
            return true;
        }
    } catch (error) {
        console.error("Error handling song reply:", error);
        await sock.sendMessage(
            chatId,
            { text: "❌ ғᴀɪʟᴇᴅ ᴛᴏ sᴇɴᴅ sᴏɴɢ." },
            { quoted: message },
        );
        pendingDownloads.delete(`${chatId}_${senderId}`);
        return true;
    }
}

// ✅ Export BOTH functions
module.exports = { songCommand, handleSongReply };
