const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

async function apkCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const query = args.join(' ').trim();
        if (!query) {
            return await sock.sendMessage(chatId, { text: "❌ Please provide an app name.\nUsage: .apk <app-name>" }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: "🔍 _Searching for APK..._" }, { quoted: message });

        // Using a free APK search API or scraping logic
        // For now, using a placeholder search and direct download link pattern
        // Real-world implementation would use a search API
        const searchUrl = `https://api.shabani.my.id/api/apk/search?q=${encodeURIComponent(query)}`;
        
        const searchRes = await axios.get(searchUrl);
        if (!searchRes.data || !searchRes.data.result || searchRes.data.result.length === 0) {
            return await sock.sendMessage(chatId, { text: "❌ Could not find the APK." }, { quoted: message });
        }

        const app = searchRes.data.result[0];
        const downloadUrl = `https://api.shabani.my.id/api/apk/download?url=${encodeURIComponent(app.link)}`;
        
        const downloadRes = await axios.get(downloadUrl);
        if (!downloadRes.data || !downloadRes.data.result) {
            return await sock.sendMessage(chatId, { text: "❌ Failed to get download link." }, { quoted: message });
        }

        const apkData = downloadRes.data.result;
        // Parse size string safely
        const sizeStr = apkData.size || "0 MB";
        const fileSizeMB = parseFloat(sizeStr.replace(/[^\d.]/g, '')) || 0;

        if (fileSizeMB > 100) {
            return await sock.sendMessage(chatId, { 
                text: `📦 *${apkData.name}*\n\nSize: ${sizeStr}\n\nFile exceeds 100MB. Download here:\n${apkData.download}` 
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: `⬇️ _Downloading ${apkData.name}..._` }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        const filePath = path.join(tmpDir, `${apkData.name}.apk`);
        
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
            url: apkData.download,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        writer.on('finish', async () => {
            await sock.sendMessage(chatId, {
                document: { url: filePath },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${apkData.name}.apk`,
                caption: `✅ *${apkData.name}* Downloaded`
            }, { quoted: message });
            
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('APK Error:', error);
        await sock.sendMessage(chatId, { text: "❌ An error occurred while downloading the APK." }, { quoted: message });
    }
}

module.exports = apkCommand;
