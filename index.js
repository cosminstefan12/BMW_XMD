const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scanează acest cod QR cu aplicația WhatsApp!');
});

client.on('ready', () => {
    console.log('Botul este gata!');
});

client.on('message', async (message) => {
    // Meniu principal
    if (message.body === '.meniu') {
        await message.reply(
            '*Meniu Bot:*\n' +
            '1. .fun - Comenzi amuzante\n' +
            '2. .grup - Comenzi pentru grup\n' +
            '3. .jocuri - Jocuri simple\n'
        );
    }

    // Comenzi fun
    if (message.body === '.fun') {
        await message.reply(
            '*Comenzi Fun:*\n' +
            '- .banc - Banc random\n' +
            '- .meme - Meme random\n'
        );
    }
    if (message.body === '.banc') {
        const bancuri = [
            '– De ce râde pisica? – Pentru că a citit o glumă MIAUră!',
            '– Ce face un matematician la plajă? Își calculează valurile!',
            'Doctorul către pacient: – Aveți o viață sedentară? – Nu, am doar Netflix.'
        ];
        const random = bancuri[Math.floor(Math.random() * bancuri.length)];
        await message.reply(random);
    }

    // Comenzi de grup
    if (message.body === '.grup') {
        await message.reply(
            '*Comenzi Grup:*\n' +
            '- .numar [tag] - Afișează numărul unui membru\n' +
            '- .tagall - Dă tag la tot grupul\n'
        );
    }

    if (message.body === '.tagall' && message.from.includes('-')) { // doar în grupuri
        let chat = await message.getChat();
        let text = '';
        for (let participant of chat.participants) {
            text += `@${participant.id.user} `;
        }
        chat.sendMessage(text, { mentions: chat.participants.map(p => p.id) });
    }

    // Jocuri simple
    if (message.body === '.jocuri') {
        await message.reply(
            '*Jocuri:*\n' +
            '- .ghiceste - Ghiceste numărul între 1-10\n'
        );
    }

    if (message.body === '.ghiceste') {
        const numar = Math.floor(Math.random() * 10) + 1;
        await message.reply('Am ales un număr între 1 și 10. Răspunde cu ".rasp [număr]"!');
        client.once('message', async m => {
            if (m.body.startsWith('.rasp')) {
                const guess = parseInt(m.body.split(' ')[1]);
                if (guess === numar) {
                    await m.reply('Felicitări! Ai ghicit!');
                } else {
                    await m.reply(`Nu ai ghicit. Numărul era ${numar}.`);
                }
            }
        });
    }
});

client.initialize();


