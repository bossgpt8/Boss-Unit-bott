const lyricsFinder = require("lyrics-finder");

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: "🔍 Please enter the song name to get the lyrics!\nUsage: *lyrics <song name>*"
        }, { quoted: message });
        return;
    }

    try {
        // Attempt to find lyrics
        const lyrics = await lyricsFinder("", songTitle);

        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ Sorry, I couldn't find lyrics for: *${songTitle}*`
            }, { quoted: message });
            return;
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars
            ? lyrics.slice(0, maxChars - 3) + "..."
            : lyrics;

        await sock.sendMessage(chatId, { text: output }, { quoted: message });
    } catch (error) {
        console.error("Error in lyrics command:", error);
        await sock.sendMessage(chatId, { 
            text: `❌ An error occurred while fetching the lyrics for: *${songTitle}*.`
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };