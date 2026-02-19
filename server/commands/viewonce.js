import { downloadContentFromMessage } from '@whiskeysockets/baileys';

async function viewonceCommand(sock, chatId, sender, mentionedJids, message, args, quotedParticipant) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                       message.message?.imageMessage?.contextInfo?.quotedMessage ||
                       message.message?.videoMessage?.contextInfo?.quotedMessage;
                       
        if (!quoted) {
            await sock.sendMessage(chatId, { text: '❌ Please reply to a view-once image or video with .vv' }, { quoted: message });
            return;
        }

        const viewOnceMessage = quoted?.viewOnceMessage?.message || 
                               quoted?.viewOnceMessageV2?.message || 
                               quoted?.viewOnceMessageV2Extension?.message ||
                               quoted;
        
        const quotedImage = viewOnceMessage?.imageMessage;
        const quotedVideo = viewOnceMessage?.videoMessage;

        if (quotedImage) {
            await sock.sendMessage(chatId, { text: '⏳ Unlocking view-once image...' }, { quoted: message });
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await sock.sendMessage(chatId, { 
                image: buffer, 
                caption: `🔓 *View Once Unlocked*\n\n${quotedImage.caption || ''}` 
            }, { quoted: message });
        } else if (quotedVideo) {
            await sock.sendMessage(chatId, { text: '⏳ Unlocking view-once video...' }, { quoted: message });
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await sock.sendMessage(chatId, { 
                video: buffer, 
                caption: `🔓 *View Once Unlocked*\n\n${quotedVideo.caption || ''}` 
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: '❌ The replied message is not a view-once media. Please reply to a view-once image or video.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in viewonce command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to unlock view-once media. The media may have expired or been deleted.' }, { quoted: message });
    }
}

export default viewonceCommand;
