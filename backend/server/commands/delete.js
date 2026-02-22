const isAdmin = require('../lib/isAdmin');

async function deleteCommand(sock, chatId, senderId, mentionedJids, message, args) {
    const isGroup = chatId.endsWith('@g.us');
    
    try {
        if (isGroup) {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: '❌ I need to be an admin to delete messages.' }, { quoted: message });
                return;
            }

            if (!isSenderAdmin && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: '❌ Only admins can use the .delete command.' }, { quoted: message });
                return;
            }
        }

        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const quotedMessage = ctxInfo.quotedMessage;
        const quotedStanzaId = ctxInfo.stanzaId;
        const quotedParticipant = ctxInfo.participant;

        if (!quotedMessage || !quotedStanzaId) {
            await sock.sendMessage(chatId, { 
                text: '❌ Please reply to a message to delete it.\n\nUsage: Reply to a message with .del or .delete'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                fromMe: false,
                id: quotedStanzaId,
                participant: quotedParticipant
            }
        });

    } catch (err) {
        console.error('Error in delete command:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to delete message.' }, { quoted: message });
    }
}

module.exports = deleteCommand;
