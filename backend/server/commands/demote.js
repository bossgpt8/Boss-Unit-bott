const isAdmin = require('../lib/isAdmin');

async function demoteCommand(sock, chatId, senderId, mentionedJids, message, args, quotedParticipant) {
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
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use the demote command.' }, { quoted: message });
            return;
        }

        let userToDemote = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        } else if (quotedParticipant) {
            userToDemote = [quotedParticipant];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        
        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '❌ Please mention the user or reply to their message to demote!\n\nUsage: .demote @user'
            }, { quoted: message });
            return;
        }

        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");
        
        const usernames = userToDemote.map(jid => `@${jid.split('@')[0]}`);
        
        const demotionMessage = `*『 GROUP DEMOTION 』*\n\n` +
            `👤 *Demoted User${userToDemote.length > 1 ? 's' : ''}:*\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `👑 *Demoted By:* @${senderId.split('@')[0]}\n\n` +
            `📅 *Date:* ${new Date().toLocaleString()}`;
        
        await sock.sendMessage(chatId, { 
            text: demotionMessage,
            mentions: [...userToDemote, senderId]
        });
    } catch (error) {
        console.error('Error in demote command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to demote user(s)!' }, { quoted: message });
    }
}

module.exports = demoteCommand;
