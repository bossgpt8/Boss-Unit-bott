const { exec } = (await import('child_process')).default;
const path = (await import('path')).default;
const fs = (await import('fs')).default;

async function instagramCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const url = args && args.length > 0 ? args[0].trim() : '';
        
        if (!url || !url.includes('instagram.com')) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide an Instagram video/post URL.\nExample: .ig https://www.instagram.com/reel/..."
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: "⏳ _Downloading Instagram media..._"
        }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const filePath = path.join(tmpDir, `ig_${Date.now()}.mp4`);

        const command = `yt-dlp --output "${filePath}" "${url}"`;
        
        exec(command, async (error) => {
            if (error) {
                return await sock.sendMessage(chatId, { text: "❌ Instagram download failed." }, { quoted: message });
            }

            await sock.sendMessage(chatId, {
                video: { url: filePath },
                mimetype: "video/mp4",
                caption: "> *ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ ʙᴏss ʙᴏᴛ*"
            }, { quoted: message });

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('Error in IG command:', error);
    }
}

export default instagramCommand;