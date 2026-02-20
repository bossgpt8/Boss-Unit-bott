const fetch = require('node-fetch');

async function dareCommand(sock, chatId, message) {
    try {
        const dares = [
            "Do a dance for 30 seconds and send a video.",
            "Send a screenshot of your search history.",
            "Prank call a friend and record it.",
            "Text your crush 'I love you' and send a screenshot of the reaction.",
            "Send the 5th picture in your gallery.",
            "Eat a spoonful of hot sauce or mustard.",
            "Send a voice note singing your favorite song.",
            "Change your profile picture to something embarrassing for 24 hours.",
            "Let someone in the group write a status for you.",
            "Send an audio of you barking like a dog.",
            "Tell the person you like why you like them.",
            "Show your last 5 messages in another chat.",
            "Send a video of you doing 20 pushups.",
            "Send a selfie without any filters.",
            "Ask a random person for their number.",
            "Do 10 squats and send a video.",
            "Record yourself doing your best celebrity impression.",
            "Share the weirdest thing in your fridge right now.",
            "Post your most embarrassing photo in this group.",
            "Speak in a funny accent for the next 10 messages.",
            "Send a text using only emojis.",
            "Imitate a popular TikTok trend and send a video.",
            "Share the last DM you sent to someone.",
            "Text 'I have a secret' to someone random.",
            "Send a funny voice note pretending to be a news reporter.",
            "Sing the chorus of your favorite song loudly.",
            "Do 10 jumping jacks and send a video.",
            "Make a silly TikTok-style dance and send it here.",
            "Send a video of you lip-syncing to a trending song.",
            "Tell the group your most embarrassing childhood memory.",
            "Send a screenshot of your home screen.",
            "Pretend to be a superhero for the next 5 messages.",
            "Draw a funny picture and send a photo of it.",
            "Send a video of you trying to touch your nose with your tongue.",
            "Ask someone in the group a weird question.",
            "Do a funny walk across the room and send a video.",
            "Act like a famous movie character for the next 3 messages.",
            "Record yourself saying tongue twisters 3 times fast.",
            "Send a silly selfie making the funniest face you can.",
            "Text someone 'Guess what?' and reply with something weird.",
            "Send a voice note pretending to be a robot.",
            "Try to balance something on your head for 10 seconds and record it.",
            "Act like an animal of your choice for the next 30 seconds on video.",
            "Send a photo of the weirdest thing in your room.",
            "Write a funny poem about someone in the group.",
            "Send a video of you attempting to do a cartwheel.",
            "Try to juggle three items and record it.",
            "Make a silly hat from anything around you and send a photo.",
            "Do your best impression of a baby crying and send it.",
            "Record yourself singing the alphabet backward."
        ];
        
        const dareMessage = dares[Math.floor(Math.random() * dares.length)];

        await sock.sendMessage(chatId, { 
            text: `╭━━〔 🔥 *DARE* 〕━━╮\n\n${dareMessage}\n\n╰━━━━━━━━━━━━━━━╯`,
            contextInfo: {
                externalAdReply: {
                    title: "BOSS UNIT - DARE",
                    body: "Are you brave enough to do it?",
                    thumbnailUrl: "https://i.imgur.com/fRaOmQH.jpeg", // your Imgur preview
                    mediaType: 1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in dare command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get dare. Please try again later!' }, { quoted: message });
    }
}

module.exports = { dareCommand };