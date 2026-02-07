const fetch = require("node-fetch");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function aiCommand(sock, chatId, senderId, mentionedJids, message, args) {
    try {
        const query = args && args.length > 0 ? args.join(" ").trim() : "";

        if (!query) {
            return await sock.sendMessage(
                chatId,
                {
                    text: "🤖 *AI Command*\n\nUsage: .ai <your question>\nExample: .ai What is the capital of France?",
                },
                { quoted: message },
            );
        }

        await sock.sendMessage(chatId, {
            react: { text: "🤖", key: message.key },
        });

        const systemPrompt = `
        You are Boss AI, an intelligent and friendly WhatsApp assistant.

        Behavior:
        - Think before responding.
        - Be clear, direct, and practical.
        - Explain things step-by-step when needed, but keep it concise.
        - Challenge wrong assumptions politely.
        - Keep replies structured, readable, and easy to understand.

        Style:
        - Sound human, confident, and calm.
        - Use short words and casual chat style when appropriate.
        - Use light slang or emojis only if it fits the context.
        - Keep responses concise unless the user asks for more details.

        Limits:
        - Do not guess or hallucinate.
        - Say “I don’t know” when unsure.
        - Never claim abilities you don’t have.
        - Avoid filler, hype, or unnecessary apologies.

        Goal:
        - Be helpful, informative, and friendly.
        - Adapt tone to the user and situation.
        - Make the conversation feel natural and human.
        `;

        // Try OpenRouter first (qwen 2.5 and llama 3.1 405b)
        if (OPENROUTER_API_KEY) {
            const models = [
                "qwen/qwen-2.5-72b-instruct",
                "meta-llama/llama-3.1-405b-instruct",
                "qwen/qwen-2.5-7b-instruct",
            ];

            for (const model of models) {
                try {
                    const response = await fetch(
                        "https://openrouter.ai/api/v1/chat/completions",
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                                "Content-Type": "application/json",
                                "HTTP-Referer": "https://boss-unit.replit.app",
                                "X-Title": "Boss Unit Bot",
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [
                                    { role: "system", content: systemPrompt },
                                    { role: "user", content: query },
                                ],
                                max_tokens: 1000,
                                temperature: 0.7,
                            }),
                        },
                    );

                    const data = await response.json();
                    if (data.choices?.[0]?.message?.content) {
                        await sock.sendMessage(
                            chatId,
                            { text: data.choices[0].message.content.trim() },
                            { quoted: message },
                        );
                        return;
                    }
                } catch (e) {
                    console.error(`OpenRouter ${model} error:`, e.message);
                    continue;
                }
            }
        }

        // Fallback to free APIs
        const freeApis = [
            `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
            `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
            `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`,
        ];

        for (const apiUrl of freeApis) {
            try {
                const response = await fetch(apiUrl, { timeout: 30000 });
                const data = await response.json();

                if (data.message || data.data || data.answer || data.result) {
                    const answer =
                        data.message || data.data || data.answer || data.result;
                    await sock.sendMessage(
                        chatId,
                        { text: answer.trim() },
                        { quoted: message },
                    );
                    return;
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error("All AI APIs failed");
    } catch (error) {
        console.error("AI Command Error:", error);
        await sock.sendMessage(
            chatId,
            {
                text: "❌ Failed to get response. Please try again later.",
            },
            { quoted: message },
        );
    }
}

module.exports = aiCommand;
