const axios = require('axios');

async function factCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 10000 });
        const fact = response.data.text;
        await sock.sendMessage(chatId, { text: `🧠 *Fun Fact:*\n\n${fact}` }, { quoted: message });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, { text: '❌ Sorry, I could not fetch a fact right now.' }, { quoted: message });
    }
}

module.exports = factCommand;
