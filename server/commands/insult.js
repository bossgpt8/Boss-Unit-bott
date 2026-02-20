const insults = [
"You're like a cloud. When you disappear, it's a beautiful day.",
"You're the human embodiment of a typo.",
"If I wanted to kill myself, I’d climb your ego and jump to your IQ.",
"You're like a software bug—annoying, unnecessary, and impossible to ignore.",
"You have something special: the ability to ruin a good day for everyone.",
"You're proof that evolution sometimes takes a coffee break.",
"Your brain has more cobwebs than a haunted house.",
"You're like a Wi-Fi signal—weak, unreliable, and everyone avoids you.",
"You bring people together… to talk about how annoying you are.",
"You're living proof that bad decisions can breed humans.",
"You're the human version of a participation trophy—present but meaningless.",
"You're like a mosquito at 3 AM—annoying and relentless.",
"You're the reason they put instructions on shampoo bottles.",
"You're like decaf coffee—pointless and disappointing.",
"Your face could scare a hungry lion away.",
"You have the charisma of wet cardboard.",
"You're like soggy cereal—disappointing and sad.",
"You're as useful as a screen door on a submarine.",
"You're like a flat tire—stopping everyone in their tracks.",
"You're the human equivalent of buffering… forever.",
"Your jokes are so bad, they should come with hazard warnings.",
"You're like an expired coupon—useless and forgotten.",
"You have the personality of a damp sock.",
"You're like a speed bump—annoying, unavoidable, and nobody likes you.",
"You're like burnt toast—unappetizing and regrettable.",
"You're the human embodiment of spam emails.",
"You're like cold soup—disappointing and weird.",
"You're a puzzle nobody asked to solve.",
"You're the glitch in everyone's happy day.",
"You're like a shadow—always there, rarely useful.",
"You're a storm in a teacup: overdramatic and unnecessary.",
"You're like a broken compass—leading everyone the wrong way.",
"You're the human equivalent of a missed deadline.",
"You're like soggy bread—unappealing and soft.",
"You're as welcome as a pop quiz on a Friday.",
"You're like a typo in a love letter—unwanted and confusing.",
"You're the human version of '404 Not Found.'",
"You're living proof that even mistakes can be productive.",
"You're like an umbrella with holes—useless and sad.",
"You're a speed bump in everyone's good mood.",
"You're like Wi-Fi with no internet—useless and frustrating.",
"You're the human embodiment of a paper cut.",
"You're as inspiring as wet paper.",
"You're the human version of a canceled flight—disruptive and annoying.",
"You're like a sunroof in a submarine—pointless.",
"You're like burnt popcorn—smelly and unbearable.",
"You're a broken chair—awkward and unhelpful.",
"You're like an unsalted soup—bland and disappointing.",
"You're like a dead battery—useless at the worst times.",
"You're like ketchup on a steak—wrong in every way.",
"You're like soggy fries—sad and disappointing.",
"You're like a fire alarm at 3 AM—loud, annoying, and pointless.",
"You're the human equivalent of a spam call.",
"You're like a flat soda—fizzy, tasteless, and unwanted.",
"You're like a typo in the dictionary—nobody wants you here.",
"You're a riddle nobody wants to solve.",
"You're like a wet blanket—cold, annoying, and useless.",
"You're like elevator music—forgettable and dull.",
"You're like a broken alarm clock—wrong all the time.",
"You're the human embodiment of 'try again later.'",
"You're like a low battery warning—stressful and unwelcome.",
"You're like a puzzle missing pieces—confusing and pointless.",
"You're the human version of buffering… and never finishes loading.",
"You're like a stale cracker—dry, tasteless, and sad.",
"You're as subtle as a fire truck in a library.",
"You're like a broken pencil—completely pointless.",
"You're like soggy bread—unappealing and soft.",
"You're like cold porridge—bland and sad.",
"You're like an ad nobody wants to see.",
"You're the human embodiment of a typo in an essay.",
"You're like a pop quiz nobody studied for.",
"You're like a storm in a cup—loud, messy, and useless.",
"You're like burnt marshmallows—charred and unappealing.",
"You're like decaf tea—pointless and bitter.",
"You're like soggy noodles—gross and disappointing.",
"You're a traffic jam in everyone's happiness.",
"You're like a microwave on fire—dangerous and unnecessary.",
"You're the human embodiment of 'wrong number.'",
"You're like a broken GPS—leading everyone the wrong way.",
"You're like a flat tire—everyone avoids you but still gets stuck.",
"You're like cold fries—sad, disappointing, and unwanted.",
"You're a bug in everyone's software of life.",
"You're like expired milk—sour and unwanted.",
"You're like a broken umbrella—useless in every storm.",
"You're like a Wi-Fi hotspot with no internet—pointless.",
"You're like soggy cereal—nobody asked for it.",
"You're a human speed bump—everyone slows down around you.",
"You're like a broken CD—skipping and irritating.",
"You're like a cloud—always blocking the sun.",
"You're like a mosquito—tiny, annoying, and everywhere.",
"You're the human version of a missed step on the stairs.",
"You're like cold soup—never satisfying.",
"You're the human version of spam notifications.",
"You're like soggy bread—nobody wants a piece.",
"You're like a dull knife—useless when needed.",
"You're like a burned toast—unwanted and regrettable.",
"You're like a raincloud—always bringing gloom.",
"You're like an unsalted soup—bland and sad.",
"You're like a broken lamp—dark and useless.",
"You're like a flat tire—everyone has to deal with you.",
"You're like a canceled flight—ruining plans and mood.",
"You're like a dead battery—useless at critical times.",
"You're like a broken keyboard—nothing makes sense.",
"You're like an expired coupon—nobody cares.",
"You're like a broken spoon—useless for every meal.",
"You're like soggy noodles—disgusting and disappointing.",
"You're like an empty chocolate box—promising but useless.",
"You're like a typo in a novel—annoying and unnecessary.",
"You're like burnt popcorn—everyone regrets it.",
"You're like decaf coffee—never wakes anyone up.",
"You're like a broken alarm clock—always too late.",
"You're like cold fries—nobody wants them.",
"You're like a traffic light stuck on red—everyone hates it.",
"You're like a software crash—frustrating and sudden.",
"You're like a broken window—pointless and dangerous.",
"You're like soggy cereal—everyone avoids it.",
"You're like a microwave with no power—useless.",
"You're like a cloud blocking the sun—annoying and unwelcome.",
"You're like expired milk—everywhere you go, things spoil.",
"You're like a speed bump—everyone hates encountering you.",
"You're like a dead battery—no energy, no life.",
"You're like a flat soda—unpleasant and disappointing.",
"You're like a typo in the dictionary—useless and confusing.",
"You're like soggy fries—unwanted and sad.",
"You're like a broken CD—skipping and annoying.",
"You're like a wet blanket—cold, annoying, and useless.",
"You're like a dull knife—dangerous by being useless.",
"You're like a traffic jam—everyone hates being near you.",
"You're like a canceled flight—ruining everyone's plans.",
"You're like a broken compass—always leading the wrong way.",
"You're like a mosquito bite—small but painfully irritating.",
"You're like a human speed bump—unnecessary and annoying.",
"You're like a cloud that never rains—useless and bland.",
"You're like an empty chocolate box—full of disappointment.",
"You're like decaf tea—pointless and bitter.",
"You're like soggy noodles—unwanted and messy.",
"You're like stale crackers—dry and tasteless.",
"You're like a broken keyboard—everything you type is wrong.",
"You're like a burnt marshmallow—blackened and sad."
];

// The command function
async function insultCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) return;

        let userToInsult;

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToInsult) {
            await sock.sendMessage(chatId, { 
                text: 'Please mention someone or reply to their message to roast them!'
            });
            return;
        }

        const insult = insults[Math.floor(Math.random() * insults.length)];

        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `Hey @${userToInsult.split('@')[0]}, ${insult}`,
            mentions: [userToInsult]
        });
    } catch (error) {
        console.error('Error in insult command:', error);
        try {
            await sock.sendMessage(chatId, { 
                text: 'An error occurred while sending the insult.'
            });
        } catch (sendError) {
            console.error('Error sending error message:', sendError);
        }
    }
}

module.exports = { insultCommand };