const { storage } = require('../storage');

async function settingsCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        // Check if user is owner
        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        const isOwner = message.key?.fromMe || settings.ownerNumber === senderId.split('@')[0] || settings.ownerNumber === senderId.split(':')[0];

        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ Only bot owner can use this command!\n\n> View updates here: 120363426051727952@newsletter'
            }, { quoted: message });
            return;
        }

        const lines = [];
        lines.push('*📊 BOT SETTINGS*');
        lines.push('');
        lines.push(`• Bot Name: ${settings.botName}`);
        lines.push(`• Owner: ${settings.ownerNumber || 'Not set'}`);
        lines.push(`• Mode: ${settings.publicMode ? '🌐 Public' : '🔒 Private'}`);
        lines.push(`• Auto Read: ${settings.autoRead ? '✅ ON' : '❌ OFF'}`);
        lines.push(`• Auto Status Read: ${settings.autoStatusRead ? '✅ ON' : '❌ OFF'}`);
        lines.push(`• Auto Typing: ${settings.autoTyping ? '✅ ON' : '❌ OFF'}`);
        lines.push(`• Anti Delete: ${settings.antiDelete ? '✅ ON' : '❌ OFF'}`);
        lines.push(`• PM Blocker: ${settings.pmBlocker ? '✅ ON' : '❌ OFF'}`);
        lines.push(`• Anti Call: ${settings.antiCall ? '✅ ON' : '❌ OFF'}`);
        lines.push('');
        lines.push('*Available Commands:*');
        lines.push('• .setbotname <name> - Change bot name');
        lines.push('• .setowner <number> - Change bot owner');
        lines.push('• .setbotpic - Change bot profile picture');
        lines.push('• .mode public/private - Change bot mode');
        lines.push('• .autoread on/off - Toggle auto read');
        lines.push('• .autostatus on/off - Toggle auto status read');
        lines.push('• .autotyping on/off - Toggle auto typing');
        lines.push('• .antidelete on/off - Toggle anti delete');
        lines.push('• .pmblocker on/off - Toggle PM blocker');
        lines.push('• .anticall on/off - Toggle anti call');
        lines.push('');
        lines.push('> View updates here: 120363426051727952@newsletter');

        const { channelInfo } = require("../lib/messageConfig");
        await sock.sendMessage(chatId, {
            text: lines.join('\n'),
            contextInfo: {
                ...channelInfo.contextInfo,
                externalAdReply: {
                    ...channelInfo.contextInfo.externalAdReply,
                    thumbnailUrl: "https://i.imgur.com/fRaOmQH.jpeg",
                    renderLargerThumbnail: true
                }
            },
            buttons: channelInfo.buttons,
            footer: channelInfo.footer,
            headerType: 4
        }, { quoted: message });
    } catch (error) {
        console.error('Settings error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error loading settings.\n\n> View updates here: 120363426051727952@newsletter'
        }, { quoted: message });
    }
}

module.exports = settingsCommand;
