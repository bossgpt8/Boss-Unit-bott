const axios = require('axios');

async function jokeCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' },
            timeout: 10000
        });
        const joke = response.data.joke;
        await sock.sendMessage(chatId, { text: `😂 ${joke}` }, { quoted: message });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, { text: '❌ Sorry, I could not fetch a joke right now.' }, { quoted: message });
    }
}

module.exports = jokeCommand;
