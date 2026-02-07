const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function songCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const searchQuery = args && args.length > 0 ? args.join(' ').trim() : '';
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "🎵 ᴡʜᴀᴛ sᴏɴɢ ᴅᴏ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ?\n\nUsage: .song <song name>"
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: "🎧 ᴘʀᴏᴄᴇssɪɴɢ ʏᴏᴜʀ ʀᴇQᴜᴇsᴛ..."
        }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        
        const metaCommand = `yt-dlp --print "%(title)s|%(duration_string)s|%(view_count)s|%(uploader)s|%(thumbnail)s" "ytsearch1:${searchQuery}"`;
        exec(metaCommand, async (metaError, metaOut) => {
            if (metaError || !metaOut) {
                return await sock.sendMessage(chatId, { text: "❌ ғᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ ᴠɪᴅᴇᴏ ᴍᴇᴛᴀᴅᴀᴛᴀ." }, { quoted: message });
            }

            const [title, duration, views, author, thumbnail] = metaOut.trim().split('|');
            const fileName = `${title.replace(/[/\\?%*:|"<>]/g, '-')}.mp3`;
            const filePath = path.join(tmpDir, `song_${Date.now()}.mp3`);

            const metadataMsg = `🎧 *ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 🎶

• *ᴛɪᴛʟᴇ   : ${title}*
• *ᴅᴜʀᴀᴛɪᴏɴ: ${duration}*
• *ᴠɪᴇᴡs   : ${views}*
• *ᴀᴜᴛʜᴏʀ   : ${author}*
• *sᴛᴀᴛᴜs   : ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...*

🔥 [Click here for thumbnail](${thumbnail})

> *© Pᴏᴡᴇʀᴇᴅ Bʏ Bᴏss Bᴏᴛ*`;

            await sock.sendMessage(chatId, { 
                text: metadataMsg,
                linkPreview: true
            }, { quoted: message });

            const command = `yt-dlp -x --audio-format mp3 --output "${filePath}" "ytsearch1:${searchQuery}"`;
            
            exec(command, async (error) => {
                if (error) {
                    return await sock.sendMessage(chatId, { text: "❌ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ." }, { quoted: message });
                }

                const stats = fs.statSync(filePath);
                const fileSizeMB = stats.size / (1024 * 1024);

                if (fileSizeMB > 100) {
                    await sock.sendMessage(chatId, {
                        document: { url: filePath },
                        mimetype: "audio/mpeg",
                        fileName: fileName,
                        caption: `*${title}*\n\n> ᴠɪᴇᴡ ᴜᴘᴅᴀᴛᴇs ʜᴇʀᴇ: 120363426051727952@newsletter`
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        audio: { url: filePath },
                        mimetype: "audio/mpeg",
                        fileName: fileName,
                        caption: `> ᴠɪᴇᴡ ᴜᴘᴅᴀᴛᴇs ʜᴇʀᴇ: 120363426051727952@newsletter`
                    }, { quoted: message });
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        });

    } catch (error) {
        console.error('Error in song command:', error);
    }
}

module.exports = songCommand;