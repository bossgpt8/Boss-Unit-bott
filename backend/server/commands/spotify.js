const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function spotifyCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const query = args && args.length > 0 ? args.join(' ').trim() : '';
        
        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "🎧 Please provide a Spotify link or song name.\nExample: .spotify https://open.spotify.com/track/..."
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: "⏳ _Downloading from Spotify (via yt-dlp)..._"
        }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const filePath = path.join(tmpDir, `spotify_${Date.now()}.mp3`);

        // Using -x for audio extraction and --audio-format mp3
        const command = `yt-dlp -x --audio-format mp3 --add-metadata --embed-thumbnail --output "${filePath}" "${query}"`;
        
        exec(command, async (error) => {
            if (error) {
                const searchCommand = `yt-dlp -x --audio-format mp3 --add-metadata --embed-thumbnail --output "${filePath}" "ytsearch1:${query}"`;
                exec(searchCommand, async (searchError) => {
                    if (searchError) {
                        return await sock.sendMessage(chatId, { text: "❌ Spotify download failed." }, { quoted: message });
                    }
                    await sendFile(sock, chatId, filePath, query, message);
                });
            } else {
                await sendFile(sock, chatId, filePath, query, message);
            }
        });

    } catch (error) {
        console.error('Error in Spotify command:', error);
    }
}

async function sendFile(sock, chatId, filePath, query, message) {
    if (fs.existsSync(filePath)) {
        const metaCommand = `yt-dlp --print "%(title)s - %(uploader)s" "ytsearch1:${query}"`;
        exec(metaCommand, async (metaError, metaOut) => {
            const title = metaOut ? metaOut.trim() : "spotify_song";
            await sock.sendMessage(chatId, {
                audio: { url: filePath },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`
            }, { quoted: message });
            fs.unlinkSync(filePath);
        });
    }
}

module.exports = spotifyCommand;