const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

async function banCommand(sock, chatId, senderId, mentionedJids, message, args, quotedParticipant) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
        return;
    }

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Please make the bot an admin first.' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can use the ban command.' }, { quoted: message });
        return;
    }

    let usersToBan = mentionedJids || [];
    if (quotedParticipant) usersToBan.push(quotedParticipant);
    
    if (usersToBan.length === 0) {
        await sock.sendMessage(chatId, { text: '❌ Please mention the user or reply to their message to ban!' }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToBan, "remove");
        await sock.sendMessage(chatId, { text: `✅ User(s) banned from the group.` });
    } catch (error) {
        console.error('Ban error:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to ban user(s).' });
    }
}

module.exports = banCommand;
