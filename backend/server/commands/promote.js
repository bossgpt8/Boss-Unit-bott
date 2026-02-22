const isAdmin = require('../lib/isAdmin');

async function promoteCommand(sock, chatId, senderId, mentionedJids, message, args, quotedParticipant) {
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
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use the promote command.' }, { quoted: message });
            return;
        }

        let userToPromote = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            userToPromote = mentionedJids;
        } else if (quotedParticipant) {
            userToPromote = [quotedParticipant];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        
        if (userToPromote.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '❌ Please mention the user or reply to their message to promote!\n\nUsage: .promote @user'
            }, { quoted: message });
            return;
        }

        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        
        const usernames = userToPromote.map(jid => `@${jid.split('@')[0]}`);
        const promoterJid = sock.user.id;
        
        const promotionMessage = `*『 GROUP PROMOTION 』*\n\n` +
            `👥 *Promoted User${userToPromote.length > 1 ? 's' : ''}:*\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `👑 *Promoted By:* @${promoterJid.split('@')[0]}\n\n` +
            `📅 *Date:* ${new Date().toLocaleString()}`;
            
        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: [...userToPromote, promoterJid]
        });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to promote user(s)!' }, { quoted: message });
    }
}

module.exports = promoteCommand;
