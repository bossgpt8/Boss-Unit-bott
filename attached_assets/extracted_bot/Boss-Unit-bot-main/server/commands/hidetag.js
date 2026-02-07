const isAdmin = require('../lib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `${Date.now()}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function hideTagCommand(sock, chatId, senderId, mentionedJids, message, args) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
        return;
    }

    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Please make the bot an admin first.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only admins can use the .hidetag command.' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const allMembers = participants.map(p => p.id);

        const messageText = args && args.length > 0 ? args.join(' ') : '';
        const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (replyMessage) {
            let content = {};
            if (replyMessage.imageMessage) {
                const filePath = await downloadMediaMessage(replyMessage.imageMessage, 'image');
                content = { image: { url: filePath }, caption: messageText || replyMessage.imageMessage.caption || '', mentions: allMembers };
            } else if (replyMessage.videoMessage) {
                const filePath = await downloadMediaMessage(replyMessage.videoMessage, 'video');
                content = { video: { url: filePath }, caption: messageText || replyMessage.videoMessage.caption || '', mentions: allMembers };
            } else if (replyMessage.conversation || replyMessage.extendedTextMessage) {
                content = { text: replyMessage.conversation || replyMessage.extendedTextMessage.text, mentions: allMembers };
            } else if (replyMessage.documentMessage) {
                const filePath = await downloadMediaMessage(replyMessage.documentMessage, 'document');
                content = { document: { url: filePath }, fileName: replyMessage.documentMessage.fileName, caption: messageText || '', mentions: allMembers };
            }

            if (Object.keys(content).length > 0) {
                await sock.sendMessage(chatId, content);
            }
        } else {
            await sock.sendMessage(chatId, { 
                text: messageText || '📢 Attention everyone!', 
                mentions: allMembers 
            });
        }
    } catch (error) {
        console.error('Error in hidetag command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to send hidetag message.' });
    }
}

module.exports = hideTagCommand;
