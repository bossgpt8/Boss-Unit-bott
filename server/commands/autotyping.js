const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

function initConfig() {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

async function autotypingCommand(sock, chatId, senderId, mentionedJids, message, args) {
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
                await sock.sendMessage(chatId, { text: '❌ Invalid option! Use: .autotyping on/off' }, { quoted: message });
                return;
            }
        } else {
            config.enabled = !config.enabled;
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await sock.sendMessage(chatId, {
            text: `✅ Auto-typing has been ${config.enabled ? 'enabled' : 'disabled'}!`
        }, { quoted: message });
        
    } catch (error) {
        console.error('Error in autotyping command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error processing command!' }, { quoted: message });
    }
}

function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        return false;
    }
}

async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (isAutotypingEnabled()) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('composing', chatId);
            const typingDelay = Math.max(2000, Math.min(5000, userMessage.length * 100));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            // We don't need to send 'paused' explicitly usually, sending message will clear it
            return true;
        } catch (error) {
            return false;
        }
    }
    return false;
}

module.exports = {
    execute: autotypingCommand,
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage
};
