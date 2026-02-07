const axios = require('axios');

async function characterCommand(sock, chatId, message) {
    let userToAnalyze;

    // Get mentioned or replied user
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToAnalyze) {
        await sock.sendMessage(chatId, { 
            text: '❌ Please mention someone or reply to their message to analyze their character!' 
        });
        return;
    }

    try {
        // Fetch profile picture
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/fRaOmQH.jpeg'; // Your preview Imgur link
        }

        const traits = [
            "😎 Confident", "💡 Intelligent", "🎨 Creative", "💖 Caring", "🔥 Passionate",
            "💪 Strong", "🤝 Loyal", "🌟 Ambitious", "😆 Humorous", "🤔 Thoughtful",
            "🌈 Optimistic", "🧠 Logical", "💫 Charismatic", "👀 Observant", "🌹 Romantic",
            "🧩 Curious", "🏃 Energetic", "🕵️ Mysterious", "🎯 Determined", "🤗 Friendly",
            "💼 Professional", "👑 Boss Energy", "🌻 Kind", "🎶 Musical", "📚 Knowledgeable",
            "🧘 Calm", "💬 Communicative", "🎁 Generous", "🛡️ Protective", "🍀 Lucky",
            "⚡ Dynamic", "⏱️ Patient", "🖋️ Creative Writer", "👟 Adventurous", "🎮 Playful",
            "💎 Unique", "💋 Flirty", "🕺 Fun-Loving", "🎲 Risk-Taker", "🤹 Multitasker",
            "🔮 Visionary", "🌊 Emotional", "🦸 Helpful", "🌟 Inspiring", "🧩 Quirky", 
            "🤖 Tech-Savvy", "🏔️ Brave", "🎭 Dramatic", "🌙 Dreamer", "🍰 Sweet",
            "🧗 Ambitious", "🎨 Artistic", "💃 Energetic", "⚖️ Fair", "🎯 Goal-Oriented",
            "💌 Romantic", "🎸 Musical", "🏆 Competitive", "🎤 Confident Speaker", "🛡️ Loyal",
            "🧭 Adventurous", "🌈 Optimistic", "🕊️ Peaceful", "🎵 Harmonious", "💡 Innovative",
            "💪 Motivated", "🧠 Intelligent", "🖌️ Expressive", "🤝 Supportive", "⚡ Charismatic",
            "🎯 Focused", "🌟 Ambitious", "💖 Compassionate", "🎲 Playful", "🛡️ Dependable",
            "🧩 Creative Thinker", "🦄 Unique", "🏞️ Nature-Lover", "💬 Talkative", "💎 Valuable",
            "🕶️ Cool", "🍿 Entertaining", "🎮 Gamer", "🎨 Visionary", "🌙 Dreamer", 
            "⚡ Energetic", "🌻 Cheerful", "💼 Responsible", "🎵 Musical", "🖋️ Writer", 
            "🏃 Active", "🧘 Calm", "🤗 Approachable", "💫 Inspirational", "🎁 Generous", 
            "💋 Charming", "🦸 Helpful", "🌟 Motivating", "🛡️ Protective", "🧭 Adventurous", 
            "🎤 Expressive", "🎭 Dramatic", "💡 Insightful", "🧠 Brainy", "🎲 Fun-Loving", 
            "💖 Loving", "🕺 Outgoing", "🌈 Optimistic", "🌊 Emotional", "⚡ Bold"
        ];

        // Pick 5–7 random traits
        const numTraits = Math.floor(Math.random() * 3) + 5; // 5-7 traits
        const selectedTraits = [];
        while (selectedTraits.length < numTraits) {
            const trait = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(trait)) selectedTraits.push(trait);
        }

        // Generate random percentages for each trait
        const traitPercentages = selectedTraits.map(trait => {
            const percentage = Math.floor(Math.random() * 21) + 80; // 80-100%
            return `${trait}: ${percentage}%`;
        });

        // Fun comment based on overall rating
        const overallRating = Math.floor(Math.random() * 21) + 80; // 80-100%
        let comment = "";
        if (overallRating > 95) comment = "🌟 Absolute legend!";
        else if (overallRating > 90) comment = "💖 Superstar vibes!";
        else if (overallRating > 85) comment = "🔥 Impressive energy!";
        else comment = "😎 Cool & charming!";

        // Create analysis message
        const analysis = `🔮 *Character Analysis* 🔮\n\n` +
                         `👤 *User:* @${userToAnalyze.split('@')[0]}\n\n` +
                         `✨ *Key Traits:*\n${traitPercentages.join('\n')}\n\n` +
                         `🎯 *Overall Rating:* ${overallRating}%\n` +
                         `💬 Comment: ${comment}\n\n` +
                         `Note: This is just for fun!`;

        // Send the message with profile pic
        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: analysis,
            mentions: [userToAnalyze]
        });

    } catch (error) {
        console.error('Error in character command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to analyze character! Try again later.' });
    }
}

module.exports = characterCommand;