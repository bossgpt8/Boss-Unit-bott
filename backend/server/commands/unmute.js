const isAdmin = require('../lib/isAdmin');

async function unmuteCommand(sock, chatId, senderId, mentionedJids, message) {
    if (!chatId.endsWith('@g.us')) return;
    
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) return;
    if (!isSenderAdmin && !message.key.fromMe) return;

    await sock.groupSettingUpdate(chatId, 'not_announcement'); // Unmute the group
    await sock.sendMessage(chatId, { text: 'The group has been unmuted.' }, { quoted: message });
}

module.exports = unmuteCommand;
