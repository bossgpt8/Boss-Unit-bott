const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

async function clearSessionCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        const isFromMe = message.key?.fromMe || false;
        
        if (!isFromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used by the owner!' }, { quoted: message });
            return;
        }

        const sessionDir = path.join(process.cwd(), 'session');

        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { text: '❌ Session directory not found!' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🔍 Optimizing session files for better performance...' }, { quoted: message });

        const files = fs.readdirSync(sessionDir);
        let filesCleared = 0;
        let errors = 0;

        for (const file of files) {
            if (file === 'creds.json') continue;
            try {
                const filePath = path.join(sessionDir, file);
                fs.unlinkSync(filePath);
                filesCleared++;
            } catch (error) {
                errors++;
            }
        }

        const resultMessage = `✅ Session files cleared successfully!\n\n` +
                       `📊 Statistics:\n` +
                       `• Total files cleared: ${filesCleared}\n` +
                       (errors > 0 ? `\n⚠️ Errors encountered: ${errors}` : '');

        await sock.sendMessage(chatId, { text: resultMessage }, { quoted: message });

    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to clear session files!' }, { quoted: message });
    }
}

module.exports = clearSessionCommand;
