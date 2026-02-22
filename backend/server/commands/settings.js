const { storage } = require("../storage");

async function settingsCommand(
    sock,
    chatId,
    senderId,
    mentionedJids,
    message,
    args,
    userId,
) {
    try {
        // Check if user is owner
        const settings = userId
            ? await storage.getUserSettings(userId)
            : await storage.getSettings();
        const isOwner =
            message.key?.fromMe ||
            settings.ownerNumber === senderId.split("@")[0] ||
            settings.ownerNumber === senderId.split(":")[0];

        if (!isOwner) {
            await sock.sendMessage(
                chatId,
                {
                    text: "❌ ᴏɴʟʏ ʙᴏᴛ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!",
                },
                { quoted: message },
            );
            return;
        }

        const lines = [];
        lines.push("*📊 ʙᴏᴛ sᴇᴛᴛɪɴɢs*");
        lines.push("");
        lines.push(`• ʙᴏᴛ ɴᴀᴍᴇ: ${settings.botName}`);
        lines.push(`• ᴏᴡɴᴇʀ: ${settings.ownerNumber || "ɴᴏᴛ sᴇᴛ"}`);
        lines.push(
            `• ᴍᴏᴅᴇ: ${settings.publicMode ? "🌐 ᴘᴜʙʟɪᴄ" : "🔒 ᴘʀɪᴠᴀᴛᴇ"}`,
        );
        lines.push(`• ᴀᴜᴛᴏ ʀᴇᴀᴅ: ${settings.autoRead ? "✅ ᴏɴ" : "❌ ᴏғғ"}`);
        lines.push(
            `• ᴀᴜᴛᴏ sᴛᴀᴛᴜs ʀᴇᴀᴅ: ${settings.autoStatusRead ? "✅ ᴏɴ" : "❌ ᴏғғ"}`,
        );
        lines.push(
            `• ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ: ${settings.autoTyping ? "✅ ᴏɴ" : "❌ ᴏғғ"}`,
        );
        lines.push(
            `• ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ: ${settings.antiDelete ? "✅ ᴏɴ" : "❌ ᴏғғ"}`,
        );
        lines.push(`• ᴘᴍ ʙʟᴏᴄᴋᴇʀ: ${settings.pmBlocker ? "✅ ᴏɴ" : "❌ ᴏғғ"}`);
        lines.push(`• ᴀɴᴛɪ ᴄᴀʟʟ: ${settings.antiCall ? "✅ ᴏɴ" : "❌ ᴏғғ"}`);
        lines.push("");
        lines.push("*ᴀᴠᴀɪʟᴀʙʟᴇ ᴄᴏᴍᴍᴀɴᴅs:*");
        lines.push("• .setbotname <name> - ᴄʜᴀɴɢᴇ ʙᴏᴛ ɴᴀᴍᴇ");
        lines.push("• .setowner <number> - ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴏᴡɴᴇʀ");
        lines.push("• .setbotpic - ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴘɪᴄ");
        lines.push("• .mode public/private - ᴄʜᴀɴɢᴇ ᴍᴏᴅᴇ");
        lines.push("• .autoread on/off - ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴅ");
        lines.push("• .autostatus on/off - ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ sᴛᴀᴛᴜs");
        lines.push("• .autotyping on/off - ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ");
        lines.push("• .antidelete on/off - ᴛᴏɢɢʟᴇ ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ");
        lines.push("• .pmblocker on/off - ᴛᴏɢɢʟᴇ ᴘᴍ ʙʟᴏᴄᴋᴇʀ");
        lines.push("• .anticall on/off - ᴛᴏɢɢʟᴇ ᴀɴᴛɪ ᴄᴀʟʟ");
        lines.push("");

        const { channelInfo } = require("../lib/messageConfig");
        await sock.sendMessage(
            chatId,
            {
                text: lines.join("\n"),
                contextInfo: {
                    ...channelInfo.contextInfo,
                    externalAdReply: {
                        ...channelInfo.contextInfo.externalAdReply,
                        thumbnailUrl: "https://i.imgur.com/fRaOmQH.jpeg",
                        renderLargerThumbnail: false,
                    },
                },
                buttons: channelInfo.buttons,
                footer: channelInfo.footer,
                headerType: 4,
            },
            { quoted: message },
        );
    } catch (error) {
        console.error("Settings error:", error);
        await sock.sendMessage(
            chatId,
            {
                text: "❌ ᴇʀʀᴏʀ ʟᴏᴀᴅɪɴɢ sᴇᴛᴛɪɴɢs.",
            },
            { quoted: message },
        );
    }
}

module.exports = settingsCommand;
