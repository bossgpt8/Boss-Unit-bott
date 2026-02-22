const isAdmin = require('../lib/isAdmin');

async function tagAllCommand(sock, chatId, senderId, mentionedJids, message, args) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
        return;
    }

    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Please make the bot an admin first.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use the .tagall command.' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ No participants found in the group.' });
            return;
        }

        const customMessage = args && args.length > 0 ? args.join(' ') : 'Hello Everyone';

        let messageText = `🔊 *${customMessage}:*\n\n`;
        participants.forEach(participant => {
            messageText += `@${participant.id.split('@')[0]}\n`;
        });

        await sock.sendMessage(chatId, {
            text: messageText,
            mentions: participants.map(p => p.id)
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to tag all members.' });
    }
}

module.exports = tagAllCommand;
