const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function videoCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const url = args && args.length > 0 ? args[0].trim() : '';
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "🎬 Please provide a video URL (YouTube, Facebook, etc).\nExample: .video https://www.youtube.com/watch?v=..."
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: "⏳ _Downloading video (yt-dlp)..._"
        }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const filePath = path.join(tmpDir, `video_${Date.now()}.mp4`);

        const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --output "${filePath}" "${url}"`;
        
        exec(command, async (error) => {
            if (error) {
                return await sock.sendMessage(chatId, { text: "❌ Video download failed." }, { quoted: message });
            }

            // Get metadata using yt-dlp --print
            const metaCommand = `yt-dlp --print "%(title)s (%(view_count)s views)" "${url}"`;
            exec(metaCommand, async (metaError, metaOut) => {
                const title = metaOut ? metaOut.trim() : "video";
                
                await sock.sendMessage(chatId, {
                    video: { url: filePath },
                    mimetype: "video/mp4",
                    caption: `*${title}*\n\n> *_Downloaded by Boss MD_*`
                }, { quoted: message });

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        });

    } catch (error) {
        console.error('Error in video command:', error);
    }
}

module.exports = videoCommand;