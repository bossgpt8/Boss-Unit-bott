const fetch = require('node-fetch');

async function flirtCommand(sock, chatId, message) {
    try {
        const flirts = [
            "Are you a magician? ✨ Because whenever I look at you, everyone else disappears 😍",
            "Do you have a map? 🗺️ I just got lost in your eyes 👀❤️",
            "Is your name Google? 🤓 Because you have everything I'm searching for 💖",
            "If you were a triangle, you'd be acute one 🔺😉",
            "Are you made of copper and tellurium? 🧪 Because you're CuTe 😘",
            "If I could rearrange the alphabet, I’d put ‘U’ and ‘I’ together 💕",
            "Is it hot in here, or is it just you? 🔥🥰",
            "Are you a campfire? 🔥 Because you're hot and I want s'more 😏",
            "Do you believe in love at first sight, or should I walk by again? 😘💌",
            "Your hand looks heavy—can I hold it for you? 🤲❤️",
            "Are you a Wi-Fi signal? 📶 Because I’m feeling a strong connection 💞",
            "If you were a fruit, you’d be a fine-apple 🍍😍",
            "I'm not a photographer, but I can definitely picture us together 📸💖",
            "Did it hurt? 😢 When you fell from heaven? 😇",
            "Are you an interior decorator? 🏡 Because when you walked in, the room became beautiful ✨",
            "Do you have a Band-Aid? 🩹 Because I just scraped my knee falling for you 😘",
            "Are you French? 🇫🇷 Because Eiffel for you 😍",
            "If beauty were time, you'd be an eternity ⏳💖",
            "Are you a parking ticket? 🅿️ Because you've got 'FINE' written all over you 😏",
            "Are you a loan? 💰 Because you have my interest 💕",
            "Are you a star? ⭐ Because your beauty lights up the night ✨",
            "Can I follow you home? 🏠 Cause my parents always told me to follow my dreams 😘",
            "You must be tired 😴 because you've been running through my mind all day 💭❤️",
            "Do you like Star Wars? 🌌 Because Yoda one for me 😏",
            "Are you an angel? 😇 Because heaven is missing one 💖",
            "Are you a keyboard? ⌨️ Because you're just my type 😘",
            "If I were a cat 🐱, I'd spend all 9 lives with you 💕",
            "Are you a camera? 📷 Every time I look at you, I smile 😍",
            "You must be Wi-Fi 📶, because I'm feeling a connection 💖",
            "Is your dad a boxer? 🥊 Because you're a knockout! 😘",
            "Are you a magnet? 🧲 Because I'm attracted to you 💞",
            "If you were words on a page, you’d be fine print 📝❤️",
            "Are you a volcano? 🌋 Because I lava you 🔥",
            "You must be a time traveler ⏳, because I see you in my future 😍",
            "Do you have a sunburn ☀️, or are you always this hot? 🔥",
            "Are you chocolate? 🍫 Because you make life sweet 😘",
            "Are you a cloud ☁️? Because you make my heart float 💖",
            "You must be a magician ✨, because every time I look at you, everyone else disappears 😍",
            "Are you a light bulb? 💡 Because you brighten up my day 🌞",
            "Are you a dictionary? 📚 Because you add meaning to my life 💕",
            "If you were a song 🎵, you'd be the best track on the album 😏",
            "Are you sugar? 🍬 Because you make everything better 😘",
            "Are you a rainbow 🌈? Because you brighten up my world 💖",
            "You must be a campfire 🔥, because you bring warmth to my heart ❤️",
            "Are you a battery 🔋? Because you give me energy 😍",
            "Are you a sunrise 🌅? Because you make my mornings beautiful 💕",
            "Are you music? 🎶 Because you strike a chord in my heart ❤️",
            "Are you a puzzle 🧩? Because I’m lost without you 😘",
            "Are you ice cream? 🍦 Because you’re sweet and irresistible 💖",
            "Are you a flame 🔥? Because you light up my soul 😍",
            "Are you a pearl? 🐚 Because you’re rare and precious 💕",
            "Are you a treasure? 🏆 Because I’ve been searching for someone like you 😘"
        ];

        const flirtMessage = flirts[Math.floor(Math.random() * flirts.length)];

        await sock.sendMessage(chatId, { 
            text: `╭━━〔 💖 *FLIRT* 〕━━╮\n\n${flirtMessage}\n\n╰━━━━━━━━━━━━━━━╯`,
            contextInfo: {
                externalAdReply: {
                    title: "BOSS UNIT - FLIRT",
                    body: "Smooth operator... 😏",
                    thumbnailUrl: "https://i.imgur.com/fRaOmQH.jpeg",
                    mediaType: 1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in flirt command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get flirt message. Please try again later!' }, { quoted: message });
    }
}

module.exports = { flirtCommand };