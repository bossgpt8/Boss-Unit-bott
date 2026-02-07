const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const configPath = path.join(__dirname, '..', 'data', 'autoread.json');

function initConfig() {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

async function autoreadCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        const isFromMe = message.key?.fromMe || false;
        
        if (!isFromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner!' }, { quoted: message });
            return;
        }

        const config = initConfig();
        
        if (args && args.length > 0) {
            const action = args[0].toLowerCase();
            if (action === 'on' || action === 'enable') {
                config.enabled = true;
            } else if (action === 'off' || action === 'disable') {
                config.enabled = false;
            } else {
                await sock.sendMessage(chatId, { text: '❌ Invalid option! Use: .autoread on/off' }, { quoted: message });
                return;
            }
        } else {
            config.enabled = !config.enabled;
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await sock.sendMessage(chatId, {
            text: `✅ Auto-read has been ${config.enabled ? 'enabled' : 'disabled'}!`
        }, { quoted: message });
        
    } catch (error) {
        console.error('Error in autoread command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error processing command!' }, { quoted: message });
    }
}

function isAutoreadEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        return false;
    }
}

async function handleAutoread(sock, message) {
    if (isAutoreadEnabled()) {
        const key = { remoteJid: message.key.remoteJid, id: message.key.id, participant: message.key.participant };
        await sock.readMessages([key]);
        return true;
    }
    return false;
}

module.exports = {
    execute: autoreadCommand,
    autoreadCommand,
    isAutoreadEnabled,
    handleAutoread
};
