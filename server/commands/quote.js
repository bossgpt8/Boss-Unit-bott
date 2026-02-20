const fetch = require('node-fetch');

async function quoteCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const apis = [
            'https://api.quotable.io/random',
            'https://zenquotes.io/api/random'
        ];

        for (const apiUrl of apis) {
            try {
                const res = await fetch(apiUrl, { timeout: 10000 });
                const data = await res.json();

                let quote = '';
                if (data.content && data.author) {
                    quote = `"${data.content}"\n\n— ${data.author}`;
                } else if (Array.isArray(data) && data[0]?.q && data[0]?.a) {
                    quote = `"${data[0].q}"\n\n— ${data[0].a}`;
                } else if (data.result) {
                    quote = data.result;
                }

                if (quote) {
                    await sock.sendMessage(chatId, { text: `📜 ${quote}` }, { quoted: message });
                    return;
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error('All APIs failed');
    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get quote. Please try again later!' }, { quoted: message });
    }
}

module.exports = quoteCommand;
