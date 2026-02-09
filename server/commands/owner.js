const fs = require('fs');
const path = require('path');

async function ownerCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        let ownerNumber = '2349164898577';
        let botOwner = 'Boss';
        
        try {
            const settings = require('../settings');
            ownerNumber = settings.ownerNumber || ownerNumber;
            botOwner = settings.botOwner || settings.botName || botOwner;
        } catch (e) {}
        
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const settingsFile = path.join(dataDir, 'settings.json');
            if (fs.existsSync(settingsFile)) {
                const dbSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
                if (dbSettings.ownerNumber) ownerNumber = dbSettings.ownerNumber;
                if (dbSettings.botName) botOwner = dbSettings.botName;
            }
        } catch (e) {}

        const vcard = 'BEGIN:VCARD\n'
                    + 'VERSION:3.0\n' 
                    + 'FN:' + botOwner + '\n'
                    + 'ORG:Boss Unit;\n'
                    + 'TEL;type=CELL;type=VOICE;waid=' + ownerNumber + ':+' + ownerNumber + '\n'
                    + 'END:VCARD';

        const { channelInfo } = require("../lib/messageConfig");
        await sock.sendMessage(
            chatId,
            { 
                contacts: { 
                    displayName: botOwner, 
                    contacts: [{ vcard }] 
                },
                ...channelInfo
            },
            { quoted: message }
        );
    } catch (error) {
        console.error('Error in owner command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to send owner contact.' }, { quoted: message });
    }
}

module.exports = ownerCommand;
