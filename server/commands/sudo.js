const { storage } = require('../storage');

function extractMentionedJid(message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return match[1] + '@s.whatsapp.net';
    return null;
}

async function sudoCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    const isOwner = message.key.fromMe || (userId && await checkIsOwner(senderId, userId));

    const sub = (args[0] || '').toLowerCase();

    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
        await sock.sendMessage(chatId, { 
            text: 'Usage:\n.sudo add <@user|number>\n.sudo del <@user|number>\n.sudo list\n\n> View updates here: 120363426051727952@newsletter' 
        }, { quoted: message });
        return;
    }

    // For now, sudo is global - could be made user-specific later
    const settings = await storage.getSettings();

    if (sub === 'list') {
        // This would need a sudo users table - for now just show owner
        await sock.sendMessage(chatId, { 
            text: `Sudo users:\n1. ${settings.ownerNumber || 'Not set'}\n\n> View updates here: 120363426051727952@newsletter` 
        }, { quoted: message });
        return;
    }

    if (!isOwner) {
        await sock.sendMessage(chatId, { 
            text: '❌ Only owner can add/remove sudo users. Use .sudo list to view.\n\n> View updates here: 120363426051727952@newsletter' 
        }, { quoted: message });
        return;
    }

    const targetJid = mentionedJids[0] || extractMentionedJid(message);
    if (!targetJid) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention a user or provide a number.\n\n> View updates here: 120363426051727952@newsletter' 
        }, { quoted: message });
        return;
    }

    if (sub === 'add') {
        // For now, just update owner - could extend to sudo list later
        await storage.updateSettings({ ownerNumber: targetJid.split('@')[0] });
        await sock.sendMessage(chatId, { 
            text: `✅ Added ${targetJid.split('@')[0]} as sudo user.\n\n> View updates here: 120363426051727952@newsletter` 
        }, { quoted: message });
    } else if (sub === 'del' || sub === 'remove') {
        await storage.updateSettings({ ownerNumber: '' });
        await sock.sendMessage(chatId, { 
            text: `✅ Removed sudo user.\n\n> View updates here: 120363426051727952@newsletter` 
        }, { quoted: message });
    }
}

async function checkIsOwner(senderId, userId) {
    try {
        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        return settings.ownerNumber === senderId.split('@')[0];
    } catch (e) {
        return false;
    }
}

module.exports = sudoCommand;


