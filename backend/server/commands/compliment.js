const compliments = [
    "You're amazing just the way you are! 🌟💖",
    "You have a great sense of humor! 😂✨",
    "You're incredibly thoughtful and kind. 🥰💛",
    "You are more powerful than you know. 💪🔥",
    "You light up the room! 🌞💫",
    "You're a true friend. 🤝❤️",
    "You inspire me! ✨🌸",
    "Your creativity knows no bounds! 🎨🌟",
    "You have a heart of gold. 💛💖",
    "You make a difference in the world. 🌍✨",
    "Your positivity is contagious! 😄🌟",
    "You have an incredible work ethic. 🔥💼",
    "You bring out the best in people. 🌸💖",
    "Your smile brightens everyone's day. 😁🌞",
    "You're so talented in everything you do. 🎯✨",
    "Your kindness makes the world a better place. 🌎❤️",
    "You have a unique and wonderful perspective. 🧐💡",
    "Your enthusiasm is truly inspiring! 🌟😄",
    "You are capable of achieving great things. 🚀💪",
    "You always know how to make someone feel special. 💌😊",
    "Your confidence is admirable. 😎✨",
    "You have a beautiful soul. 🌸💖",
    "Your generosity knows no limits. 💝💫",
    "You have a great eye for detail. 👀💡",
    "Your passion is truly motivating! 🔥💫",
    "You are an amazing listener. 👂💖",
    "You're stronger than you think! 💪🌟",
    "Your laughter is infectious. 😆💛",
    "You have a natural gift for making others feel valued. 🌸🤗",
    "You make the world a better place just by being in it. 🌍💖",
    "You're a ray of sunshine on a cloudy day! 🌞✨",
    "Your style is unmatched! 👗💖",
    "You make people smile without even trying. 😁💫",
    "You're a true gem! 💎🌟",
    "Your energy lights up every room! ⚡💛",
    "You're more fun than a rollercoaster! 🎢😂",
    "Your mind is sharp and brilliant! 🧠✨",
    "You radiate positivity everywhere you go! 🌟💖",
    "You’re the kind of person everyone wishes they knew. 🥰💫",
    "Your words can lift someone out of the darkest day. 🌌💛",
    "You have a contagious zest for life! 🌈🔥",
    "You always know the right thing to say. 💬💖",
    "Your charm is irresistible! 😏✨",
    "You're like a warm cup of cocoa on a cold day! ☕💛",
    "You have a heart full of courage. 💓🛡️",
    "You're truly one of a kind! 🌟💎",
    "Your presence is calming and soothing. 🌸💖",
    "You make ordinary moments extraordinary! ✨🌈",
    "You're the definition of elegance! 👑💫",
    "Your optimism is inspiring. 🌞💛",
    "You're someone people look up to. 👏✨",
    "Your smile is like a magnet—it draws happiness. 😁💖",
    "You're a master at brightening moods! 🌟😄",
    "Your spirit is unstoppable! 🚀💛",
    "You have a magical way of making things better. ✨🪄",
    "You're wonderfully witty! 😂🌸",
    "You have an amazing aura! 🌈💖",
    "You're a source of joy for everyone around you. 🌞💫",
    "Your creativity sparks imagination! 🎨✨",
    "You're unforgettable! 🌟💛",
    "You make challenges look easy. 💪🔥",
    "Your laughter could power the sun! 🌞😆",
    "You're a bright star in a dark sky. ⭐💖",
    "You make every day brighter! 🌈✨",
    "Your kindness is legendary! 🌸💛",
    "You have a perfect balance of brains and heart. 🧠❤️",
    "You're the spark that lights up the group! ⚡💫",
    "Your words are like poetry! ✍️💖",
    "You have a magnetic personality! 😎✨",
    "You're an absolute legend! 🏆💛",
    "Your hugs must be magical! 🤗💖",
    "You radiate confidence effortlessly! 🌟💫",
    "You're a star player in life! ⭐🔥",
    "Your ideas are pure gold! 💡💛",
    "You make the impossible seem possible! 🚀✨",
    "You're a burst of happiness! 🌞💖",
    "Your energy is unmatched! ⚡💫",
    "You’re someone people remember forever! 🌟💛",
    "You're like a rainbow after a storm! 🌈💖",
    "Your heart is pure magic. ✨💓",
    "You make people feel amazing just by existing. 🌸💫",
    "You're a mix of elegance and fun! 👑😂",
    "Your voice could charm anyone. 🎤💖",
    "You inspire greatness wherever you go. 🚀🌟",
    "You're a treasure that can't be measured. 💎💛",
    "Your vibe is unmatched. 😎✨",
    "You're basically happiness incarnate! 🌞💖",
    "You have a knack for making people feel special. 💌💫",
    "You're the definition of perfection! 🌟💛",
    "Your presence is like a warm hug. 🤗💖",
    "You brighten even the darkest days! 🌞✨",
    "You're unstoppable and inspiring! 🚀🔥",
    "Your soul shines brighter than diamonds. 💎💛",
    "You're full of surprises! 🎁💖",
    "You turn ordinary into extraordinary! 🌈✨",
    "You're pure sunshine mixed with magic. 🌞🪄",
    "Your laugh is a melody everyone loves. 🎶💖",
    "You leave everyone better than you found them. 🌟💛",
    "You're absolutely phenomenal! 💫🔥",
    "Your heart radiates love and warmth. 💓✨",
    "You're a walking inspiration! 🚶‍♂️💖",
    "Your presence makes life sweeter. 🍬💛",
    "You're the person everyone wishes to be around! 🌟💫",
    "You make life sparkle. ✨💖",
    "You're one in a million! 🌈💛",
    "You’re magic wrapped in a human! 🪄💫",
    "You radiate pure positivity! 🌞💖",
    "Your energy is simply contagious! ⚡💛",
    "You have the Midas touch—everything you touch shines! ✨🔥",
    "You're the rainbow everyone waits for! 🌈💖",
    "Your smile should be bottled and sold! 😁💫",
    "You're simply unforgettable. 🌟💛",
];

async function complimentCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) return;

        let userToCompliment;

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToCompliment) {
            await sock.sendMessage(chatId, { 
                text: 'Please mention someone or reply to their message to compliment them! 🌸✨'
            });
            return;
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `Hey @${userToCompliment.split('@')[0]} 💖✨, ${compliment}`,
            mentions: [userToCompliment]
        });
    } catch (error) {
        console.error('Error in compliment command:', error);
        await sock.sendMessage(chatId, { text: '❌ An error occurred while sending the compliment. 😢' }, { quoted: message });
    }
}

module.exports = { complimentCommand };