const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Conversation memory - stores last 15 messages per user
const conversationMemory = new Map();
const MAX_MEMORY = 15;

function loadUserGroupData() {
    try {
        const dir = path.dirname(USER_GROUP_DATA);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(USER_GROUP_DATA)) {
            const defaultData = { groups: [], chatbot: {}, chatbotAll: true };
            fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(defaultData));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        return { groups: [], chatbot: {}, chatbotAll: true };
    }
}

function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {}
}

function getConversation(userId) {
    if (!conversationMemory.has(userId)) {
        conversationMemory.set(userId, []);
    }
    return conversationMemory.get(userId);
}

function addToConversation(userId, role, content) {
    const convo = getConversation(userId);
    convo.push({ role, content, timestamp: Date.now() });
    if (convo.length > MAX_MEMORY) {
        convo.shift();
    }
    conversationMemory.set(userId, convo);
}

async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
    } catch (error) {}
}

async function handleChatbotCommand(sock, chatId, senderId, mentionedJids, message, args) {
    const match = args && args.length > 0 ? args[0].toLowerCase() : '';
    const data = loadUserGroupData();
    
    if (!match) {
        await showTyping(sock, chatId);
        const globalStatus = data.chatbotAll !== false ? 'ON' : 'OFF';
        return sock.sendMessage(chatId, {
            text: `*CHATBOT SETUP*\n\n*.chatbot on* - Enable chatbot here\n*.chatbot off* - Disable chatbot here\n*.chatbot all on* - Enable globally\n*.chatbot all off* - Disable globally\n\n*Global Status:* ${globalStatus}`
        }, { quoted: message });
    }

    const isOwnerOrSudo = require('../lib/isOwner');
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    // In multi-user mode, use currentUserId for owner check
    const currentUserId = sock.user.id.split(':')[0];
    const senderNumber = senderId.split('@')[0].split(':')[0];
    const isBotOwner = (senderNumber === currentUserId) || isOwner;
    
    let isAdmin = false;
    if (chatId.endsWith('@g.us')) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            isAdmin = groupMetadata.participants.some(p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin'));
        } catch (e) {}
    }

    // Handle "chatbot all on/off" - owner only
    if (match === 'all') {
        if (!isBotOwner) {
            await showTyping(sock, chatId);
            return sock.sendMessage(chatId, { text: '❌ Only the instance owner can use .chatbot all' }, { quoted: message });
        }
        
        const subAction = args[1]?.toLowerCase();
        if (subAction === 'on') {
            data.chatbotAll = true;
            saveUserGroupData(data);
            await showTyping(sock, chatId);
            return sock.sendMessage(chatId, { text: '✅ *Chatbot globally enabled!*' }, { quoted: message });
        } else if (subAction === 'off') {
            data.chatbotAll = false;
            saveUserGroupData(data);
            await showTyping(sock, chatId);
            return sock.sendMessage(chatId, { text: '❌ *Chatbot globally disabled!*' }, { quoted: message });
        }
    }

    if (!isAdmin && !isBotOwner && chatId.endsWith('@g.us')) {
        await showTyping(sock, chatId);
        return sock.sendMessage(chatId, { text: '❌ Only group admins or the bot owner can use this command.' }, { quoted: message });
    }

    if (match === 'on') {
        await showTyping(sock, chatId);
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '✅ *Chatbot enabled for this chat!*' }, { quoted: message });
    }

    if (match === 'off') {
        await showTyping(sock, chatId);
        data.chatbot[chatId] = false;
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '❌ *Chatbot disabled for this chat!*' }, { quoted: message });
    }

    await showTyping(sock, chatId);
    return sock.sendMessage(chatId, { text: '*Invalid command. Use .chatbot to see usage*' }, { quoted: message });
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    const isPrivate = !chatId.endsWith('@g.us');
    
    // Check global chatbot status first
    if (data.chatbotAll === false) {
        return; // Globally disabled
    }
    
    // Check per-chat settings
    if (data.chatbot[chatId] === false) {
        return; // Disabled for this chat
    }
    
    // For groups, chatbot must be enabled
    if (!isPrivate && data.chatbot[chatId] !== true) {
        return;
    }

    try {
        const botId = sock.user.id;
        const botNumber = botId.split(':')[0];
        
        let shouldRespond = false;
        let quotedMessage = null;
        let quotedRole = 'assistant'; // Default to assuming they're replying to the bot
        
        if (isPrivate) {
            const senderNumber = senderId.split('@')[0].split(':')[0];
            if (senderNumber !== botNumber) shouldRespond = true;
        } else {
            if (message.message?.extendedTextMessage) {
                const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
                const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;
                const quotedMsg = message.message.extendedTextMessage.contextInfo?.quotedMessage;
                
                const isBotMentioned = mentionedJid.some(jid => jid.split('@')[0].split(':')[0] === botNumber);
                const isReplyToBot = quotedParticipant && quotedParticipant.split('@')[0].split(':')[0] === botNumber;
                
                if (isReplyToBot && quotedMsg) {
                    quotedMessage = quotedMsg.conversation || 
                                   quotedMsg.extendedTextMessage?.text || 
                                   quotedMsg.imageMessage?.caption ||
                                   '';
                }
                
                shouldRespond = isBotMentioned || isReplyToBot;
            } else if (message.message?.conversation) {
                shouldRespond = userMessage.includes(`@${botNumber}`);
            }
        }

        if (!shouldRespond) return;

        let cleanedMessage = userMessage;
        if (!isPrivate) cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();

        // Enhanced context: If replying to a message, find it in history or add it
        const history = getConversation(senderId);
        if (quotedMessage && history.length > 0) {
            // Try to find if the quoted message matches any in history
            const foundIdx = history.findLastIndex(h => h.content === quotedMessage);
            if (foundIdx === -1) {
                // If not found, prepending it to user message as context
                cleanedMessage = `(Replying to: "${quotedMessage}")\n\n${cleanedMessage}`;
            }
        }

        await showTyping(sock, chatId);
        
        // Add user message to conversation memory
        addToConversation(senderId, 'user', cleanedMessage);
        
        const response = await getAIResponse(cleanedMessage, senderId);

        if (response) {
            // Add bot response to memory
            addToConversation(senderId, 'assistant', response);
            await sock.sendMessage(chatId, { text: response }, { quoted: message });
        } else {
            // No error message for user, just log it internally
            console.error('AI failed to respond for', senderId);
        }
    } catch (error) {
        console.error('Error in chatbot response:', error.message);
    }
}

async function getAIResponse(userMessage, senderId) {
    // Build conversation history for context
    const history = getConversation(senderId);
    const conversationMessages = history.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    const systemPrompt = `You are a friendly, casual AI friend chatting on WhatsApp. Your name is Boss.

IMPORTANT GUIDELINES:
- Talk like a real person, not a robot. Use casual language, contractions, and occasional typos
- Use emojis sparingly and naturally (not after every sentence)
- Keep responses SHORT - usually 1-3 sentences max. Nobody reads essays in chat
- Be helpful but also fun and a bit witty
- Remember what the user told you in previous messages
- If someone replies to your previous message, understand they're continuing that conversation
- Never start responses with "I" constantly - vary your sentence structure
- Use "haha", "lol", "ngl", "tbh", "idk" etc naturally but not excessively
- Don't be overly formal or use phrases like "Certainly!" "Of course!" "Absolutely!"
- If you don't know something, just say so casually
- Match the user's energy - if they're excited, be excited. If they're chill, be chill

Examples of good responses:
- "oh nice! that sounds fun 😊"
- "haha yeah thats pretty much how it works"
- "tbh I'm not 100% sure about that one"
- "wait really?? that's wild lol"`;

    // Try OpenRouter first
    if (OPENROUTER_API_KEY) {
        const models = [
            'google/gemini-2.0-flash-exp:free',
            'google/gemini-2.0-flash-thinking-exp:free',
            'qwen/qwen-2.5-72b-instruct',
            'meta-llama/llama-3.1-405b-instruct'
        ];
        
        for (const model of models) {
            try {
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...conversationMessages
                ];
                
                // Add current message if not already in history
                if (!conversationMessages.length || conversationMessages[conversationMessages.length - 1].content !== userMessage) {
                    messages.push({ role: 'user', content: userMessage });
                }

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://replit.com',
                        'X-Title': 'Boss Bot'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        max_tokens: 200,
                        temperature: 0.85
                    })
                });

                const data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    return data.choices[0].message.content.trim();
                }
            } catch (e) {
                console.error(`OpenRouter ${model} error:`, e.message);
                continue;
            }
        }
    }

    // Fallback to free APIs
    const freeApis = [
        `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(userMessage)}`,
        `https://vapis.my.id/api/gemini?q=${encodeURIComponent(userMessage)}`
    ];

    for (const apiUrl of freeApis) {
        try {
            const response = await fetch(apiUrl, { timeout: 30000 });
            const data = await response.json();
            
            if (data.message || data.data || data.answer || data.result) {
                return (data.message || data.data || data.answer || data.result).trim();
            }
        } catch (e) {
            continue;
        }
    }

    return null;
}

module.exports = { 
    execute: handleChatbotCommand,
    handleChatbotCommand, 
    handleChatbotResponse 
};
