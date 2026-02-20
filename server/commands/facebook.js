const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function facebookCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const url = args && args.length > 0 ? args[0].trim() : '';
        
        if (!url || !url.includes('facebook.com')) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a Facebook video URL.\nExample: .fb https://www.facebook.com/..."
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: "⏳ _Downloading Facebook video (yt-dlp)..._"
        }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const filePath = path.join(tmpDir, `fb_${Date.now()}.mp4`);

        // Use generic mp4 container and re-encode for WhatsApp compatibility
        const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --output "${filePath}" "${url}" && ffmpeg -i "${filePath}" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -movflags +faststart "${filePath}_fixed.mp4" -y`;
        
        exec(command, async (error) => {
            if (error) {
                return await sock.sendMessage(chatId, { text: "❌ Facebook download failed. Try another link." }, { quoted: message });
            }

            const finalPath = fs.existsSync(`${filePath}_fixed.mp4`) ? `${filePath}_fixed.mp4` : filePath;

            await sock.sendMessage(chatId, {
                video: { url: finalPath },
                mimetype: "video/mp4",
                caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗕𝗢𝗦𝗦-𝗕𝗢𝗧"
            }, { quoted: message });

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(`${filePath}_fixed.mp4`)) fs.unlinkSync(`${filePath}_fixed.mp4`);
        });

    } catch (error) {
        console.error('Error in FB command:', error);
    }
}

module.exports = facebookCommand;