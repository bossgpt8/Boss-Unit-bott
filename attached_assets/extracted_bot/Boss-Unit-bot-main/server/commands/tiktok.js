const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const processedMessages = new Set();

async function tiktokCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const url = args && args.length > 0 ? args.join(' ').trim() : '';
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "📥 *TikTok Downloader*\n\nUsage: .tiktok <link>\nExample: .tiktok https://vm.tiktok.com/..."
            }, { quoted: message });
        }

        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "❌ That is not a valid TikTok link."
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });
        await sock.sendMessage(chatId, { text: '⏳ Downloading TikTok video...' }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const filePath = path.join(tmpDir, `tiktok_${Date.now()}.mp4`);

        const command = `yt-dlp --output "${filePath}" "${url}"`;
        
        exec(command, async (error) => {
            if (error) {
                return await sock.sendMessage(chatId, { text: "❌ TikTok download failed." }, { quoted: message });
            }

            // Get metadata using yt-dlp --print
            const metaCommand = `yt-dlp --print "%(title)s - %(uploader)s" "${url}"`;
            exec(metaCommand, async (metaError, metaOut) => {
                const title = metaOut ? metaOut.trim() : "TikTok Video";
                
                await sock.sendMessage(chatId, {
                    video: { url: filePath },
                    mimetype: "video/mp4",
                    caption: `*${title}*\n\n> *_Downloaded by Boss MD_*`
                }, { quoted: message });

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        });

    } catch (error) {
        console.error('Error in TikTok command:', error);
    }
}

module.exports = tiktokCommand;
