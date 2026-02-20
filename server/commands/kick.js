const isAdmin = require('../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJids, message, args, quotedParticipant) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
        return;
    }

    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Please make the bot an admin first.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use the kick command.' }, { quoted: message });
            return;
        }
    }

    let usersToKick = [];
    
    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    } else if (quotedParticipant) {
        usersToKick = [quotedParticipant];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, { 
            text: '❌ Please mention the user or reply to their message to kick!\n\nUsage: .kick @user or reply to a message with .kick'
        }, { quoted: message });
        return;
    }

    const botId = sock.user?.id || '';
    const botPhoneNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);

    const isTryingToKickBot = usersToKick.some(userId => {
        const userPhoneNumber = userId.includes(':') ? userId.split(':')[0] : (userId.includes('@') ? userId.split('@')[0] : userId);
        return userPhoneNumber === botPhoneNumber;
    });

    if (isTryingToKickBot) {
        await sock.sendMessage(chatId, { text: "🤖 I can't kick myself!" }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
        
        const usernames = usersToKick.map(jid => `@${jid.split('@')[0]}`);
        
        await sock.sendMessage(chatId, { 
            text: `✅ ${usernames.join(', ')} has been kicked successfully!`,
            mentions: usersToKick
        });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to kick user(s)! Make sure the bot has admin privileges.' }, { quoted: message });
    }
}

module.exports = kickCommand;
