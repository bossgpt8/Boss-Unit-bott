const axios = require('axios');

async function weatherCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const city = args && args.length > 0 ? args.join(' ').trim() : '';
        
        if (!city) {
            return await sock.sendMessage(chatId, { 
                text: '🌤️ *Weather Command*\n\nUsage: .weather <city>\nExample: .weather London' 
            }, { quoted: message });
        }

        const apiKey = '4902c0f2550f58298ad4146a92b65e10';
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`, { timeout: 10000 });
        const weather = response.data;
        
        const weatherText = `🌤️ *Weather in ${weather.name}*\n\n` +
            `🌡️ Temperature: ${weather.main.temp}°C\n` +
            `🌡️ Feels like: ${weather.main.feels_like}°C\n` +
            `💧 Humidity: ${weather.main.humidity}%\n` +
            `🌬️ Wind: ${weather.wind.speed} m/s\n` +
            `☁️ Condition: ${weather.weather[0].description}`;
            
        await sock.sendMessage(chatId, { text: weatherText }, { quoted: message });
    } catch (error) {
        console.error('Error fetching weather:', error);
        await sock.sendMessage(chatId, { text: '❌ Could not fetch weather. Please check the city name.' }, { quoted: message });
    }
}

module.exports = weatherCommand;
