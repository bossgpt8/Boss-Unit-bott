const { storage } = require('../storage');
const isOwnerOrSudo = require('../lib/isOwner');

async function modeCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        const isFromMe = message.key?.fromMe || false;

        if (!isFromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '❌ Only bot owner can use this command!' }, { quoted: message });
            return;
        }

        const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
        const option = args && args.length > 0 ? args[0].toLowerCase() : '';

        if (option === 'public' || option === 'pub') {
            if (userId) {
                await storage.updateUserSettings(userId, { publicMode: 'public' });
            } else {
                await storage.updateSettings({ publicMode: 'public' });
            }

            await sock.sendMessage(chatId, {
                text: '🌐 *Bot Mode: PUBLIC*\n\nAnyone can now use the bot commands.'
            }, { quoted: message });

        } else if (option === 'private' || option === 'priv') {
            if (userId) {
                await storage.updateUserSettings(userId, { publicMode: 'private' });
            } else {
                await storage.updateSettings({ publicMode: 'private' });
            }

            await sock.sendMessage(chatId, {
                text: '🔒 *Bot Mode: PRIVATE*\n\nOnly owner and sudo users can use the bot.'
            }, { quoted: message });

        } else if (option === 'inbox') {
            if (userId) {
                await storage.updateUserSettings(userId, { publicMode: 'inbox' });
            } else {
                await storage.updateSettings({ publicMode: 'inbox' });
            }

            await sock.sendMessage(chatId, {
                text: '📥 *Bot Mode: INBOX*\n\nCommands now only work in DMs for non-owners.'
            }, { quoted: message });

        } else {
            const currentMode = settings.publicMode === 'public' ? '🌐 Public' : 
                               settings.publicMode === 'private' ? '🔒 Private' : '📥 Inbox';

            await sock.sendMessage(chatId, {
                text: `*🤖 BOT MODE*\n
Current Mode: ${currentMode}

*Usage:*
• .mode public - Everyone can use
• .mode private - Only owner can use
• .mode inbox - Only work in DMs`
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in mode command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to change mode.' }, { quoted: message });
    }
}

module.exports = modeCommand;