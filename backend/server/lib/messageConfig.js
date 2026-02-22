const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363426051727952@newsletter",
            newsletterName: "Boss Bot-MD Updates",
            serverMessageId: -1,
        },
        externalAdReply: {
            title: "Boss Bot-MD Updates",
            body: "Join our official channel",
            thumbnailUrl: "https://i.imgur.com/fRaOmQH.jpeg",
            sourceUrl: "https://whatsapp.com/channel/0029VbCYfhjLikgG5NQ7IN2u",
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: true
        }
    },
    // Adding View Channel button
    buttons: [
        {
            buttonId: 'view_channel_btn',
            buttonText: { displayText: 'View Channel' },
            type: 1
        }
    ],
    footer: 'Forwarded from Boss Bot-MD Updates'
};

module.exports = {
    channelInfo: channelInfo,
};
