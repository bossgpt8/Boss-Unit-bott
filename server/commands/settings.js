async function settingsCommand(sock, chatId, senderId, mentionedJids, message, args, userId) {
    try {
        const { storage } = await import('../storage.js');
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
        lines.push('📊 *ʙᴏᴛ sᴇᴛᴛɪɴɢs*');
        lines.push('');
        lines.push(`• ʙᴏᴛ ɴᴀᴍᴇ: ${settings.botName}`);
        lines.push(`• ᴏᴡɴᴇʀ: ${settings.ownerNumber || 'ɴᴏᴛ sᴇᴛ'}`);
        lines.push(`• ᴍᴏᴅᴇ: ${settings.publicMode ? '🌐 ᴘᴜʙʟɪᴄ' : '🔒 ᴘʀɪᴠᴀᴛᴇ'}`);
        lines.push(`• ᴀᴜᴛᴏ ʀᴇᴀᴅ: ${settings.autoRead ? '✅ ᴏɴ' : '❌ ᴏғғ'}`);
        lines.push(`• ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʀᴇᴀᴅ: ${settings.autoStatusRead ? '✅ ᴏɴ' : '❌ ᴏғғ'}`);
        lines.push(`• ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ: ${settings.autoTyping ? '✅ ᴏɴ' : '❌ ᴏғғ'}`);
        lines.push(`• ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ: ${settings.antiDelete ? '✅ ᴏɴ' : '❌ ᴏғғ'}`);
        lines.push(`• ᴘᴍ ʙʟᴏᴄᴋᴇʀ: ${settings.pmBlocker ? '✅ ᴏɴ' : '❌ ᴏғғ'}`);
        lines.push(`• ᴀɴᴛɪ ᴄᴀʟʟ: ${settings.antiCall ? '✅ ᴏɴ' : '❌ ᴏғғ'}`);
        lines.push('');
        lines.push('*ᴀᴠᴀɪʟᴀʙʟᴇ ᴄᴏᴍᴍᴀɴᴅs:*');
        lines.push('• .sᴇᴛʙᴏᴛɴᴀᴍᴇ <ɴᴀᴍᴇ> - ᴄʜᴀɴɢᴇ ʙᴏᴛ ɴᴀᴍᴇ');
        lines.push('• .sᴇᴛᴏᴡɴᴇʀ <ɴᴜᴍʙᴇʀ> - ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴏᴡɴᴇʀ');
        lines.push('• .sᴇᴛʙᴏᴛᴘɪᴄ - ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ');
        lines.push('• .ᴍᴏᴅᴇ ᴘᴜʙʟɪᴄ/ᴘʀɪᴠᴀᴛᴇ - ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴍᴏᴅᴇ');
        lines.push('• .ᴀᴜᴛᴏʀᴇᴀᴅ ᴏɴ/ᴏғғ - ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴅ');
        lines.push('• .ᴀᴜᴛᴏsᴛᴀᴛᴜs ᴏɴ/ᴏғғ - ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʀᴇᴀᴅ');
        lines.push('• .ᴀᴜᴛᴏᴛʏᴘɪɴɢ ᴏɴ/ᴏғғ - ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ');
        lines.push('• .ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴏɴ/ᴏғғ - ᴛᴏɢɢʟᴇ ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ');
        lines.push('• .ᴘᴍʙʟᴏᴄᴋᴇʀ ᴏɴ/ᴏғғ - ᴛᴏɢɢʟᴇ ᴘᴍ ʙʟᴏᴄᴋᴇʀ');
        lines.push('• .ᴀɴᴛɪᴄᴀʟʟ ᴏɴ/ᴏғғ - ᴛᴏɢɢʟᴇ ᴀɴᴛɪ ᴄᴀʟʟ');
        lines.push('');
        lines.push('> ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ ʙᴏss ʙᴏᴛ');
        lines.push('> ᴠɪᴇᴡ ᴜᴘᴅᴀᴛᴇs ʜᴇʀᴇ: 120363426051727952@ɴᴇᴡsʟᴇᴛᴛᴇʀ');

        const { channelInfo } = await import("../lib/messageConfig.js");
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

export default settingsCommand;
