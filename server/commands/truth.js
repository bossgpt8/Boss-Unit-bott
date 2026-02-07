const fetch = require('node-fetch');

async function truthCommand(sock, chatId, message) {
    try {
        const truths = [
            "What is your biggest fear?",
            "What is the most embarrassing thing you've ever done?",
            "Who is your secret crush?",
            "What is the biggest lie you've ever told?",
            "Have you ever cheated on a test?",
            "What is one thing you would change about yourself?",
            "What is the most childish thing you still do?",
            "Who do you think is the most attractive person in this group?",
            "What is your most awkward date story?",
            "If you could be invisible for a day, what would you do?",
            "What is the most expensive thing you've ever stolen?",
            "Who was your first kiss?",
            "What is your biggest regret?",
            "Have you ever peed in a pool?",
            "What is the strangest dream you've ever had?",
            "If you had to delete one app from your phone forever, which one?",
            "What is the dumbest thing you believed as a kid?",
            "Have you ever lied to your best friend?",
            "What is the weirdest food combination you secretly like?",
            "Who do you pretend to like but actually dislike?",
            "What is the worst gift you've ever received?",
            "Have you ever faked being sick to skip school?",
            "What is the most awkward moment you had in public?",
            "Have you ever cried over a TV show or movie?",
            "What is one secret you've never told anyone?",
            "Have you ever stolen something from a friend or family?",
            "What is the weirdest habit you have?",
            "Have you ever ghosted someone?",
            "What is the most ridiculous argument you've had?",
            "If you could switch lives with someone for a day, who would it be?",
            "What is your guilty pleasure?",
            "Have you ever accidentally insulted someone without realizing?",
            "What is the silliest thing you're afraid of?",
            "What is the most rebellious thing you've done?",
            "Have you ever pretended to understand something you didn't?",
            "What's the weirdest lie you've told to get out of trouble?",
            "If you could erase one memory, what would it be?",
            "What's the most awkward text you've sent to the wrong person?",
            "Have you ever stalked someone on social media?",
            "What is the funniest way you've embarrassed yourself?",
            "If you were invisible for a day, what mischief would you do?",
            "What's a secret talent no one knows about?",
            "Have you ever been caught doing something you shouldn't?",
            "What is your most awkward family moment?",
            "Who in this chat would you trust the least with a secret?",
            "What's a habit you're too lazy to break?",
            "What's the dumbest thing you've done for attention?",
            "Have you ever laughed at someone else's misfortune?",
            "What is your weirdest obsession?"
        ];

        const truthMessage = truths[Math.floor(Math.random() * truths.length)];

        const title = "BOSS UNIT - TRUTH";

        await sock.sendMessage(chatId, { 
            text: `╭━━〔 💡 *${title}* 〕━━╮\n\n${truthMessage}\n\n╰━━━━━━━━━━━━━━━╯`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "Answer honestly or face the consequences! 😎",
                    thumbnailUrl: "https://i.imgur.com/fRaOmQH.jpeg", // Your Imgur link
                    mediaType: 1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to get truth. Please try again later!' 
        }, { quoted: message });
    }
}

module.exports = { truthCommand };