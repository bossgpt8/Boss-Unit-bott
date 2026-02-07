const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

async function unbanCommand(sock, chatId, senderId, mentionedJids, message, args, quotedParticipant) {
    const isGroup = chatId.endsWith('@g.us');
    
    if (isGroup) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Please make the bot an admin to use .unban' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use .unban' }, { quoted: message });
            return;
        }
    } else {
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ Only owner can use .unban in private chat' }, { quoted: message });
            return;
        }
    }

    let userToUnban;
    
    if (mentionedJids && mentionedJids.length > 0) {
        userToUnban = mentionedJids[0];
    } else if (quotedParticipant) {
        userToUnban = quotedParticipant;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToUnban) {
        await sock.sendMessage(chatId, { 
            text: '❌ Please mention the user or reply to their message to unban!\n\nUsage: .unban @user'
        }, { quoted: message });
        return;
    }

    try {
        const dataDir = path.join(process.cwd(), 'data');
        const bannedFile = path.join(dataDir, 'banned.json');
        
        if (!fs.existsSync(bannedFile)) {
            await sock.sendMessage(chatId, { 
                text: `⚠️ @${userToUnban.split('@')[0]} is not banned!`,
                mentions: [userToUnban]
            });
            return;
        }
        
        const bannedUsers = JSON.parse(fs.readFileSync(bannedFile, 'utf-8'));
        const index = bannedUsers.indexOf(userToUnban);
        
        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync(bannedFile, JSON.stringify(bannedUsers, null, 2));
            
            await sock.sendMessage(chatId, { 
                text: `✅ Successfully unbanned @${userToUnban.split('@')[0]}!`,
                mentions: [userToUnban]
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: `⚠️ @${userToUnban.split('@')[0]} is not banned!`,
                mentions: [userToUnban]
            });
        }
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to unban user!' }, { quoted: message });
    }
}

module.exports = unbanCommand;
