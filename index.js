const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false, // Dezactivăm QR-ul clasic
        browser: ["BMW_XMD", "Chrome", "10.0.0"]
    });

    // Dacă botul nu este deja conectat, cerem numărul pentru Pair Code
    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Introdu numărul tău de WhatsApp (ex: 407xxxxxxxx): ');
        let code = await sock.requestPairingCode(phoneNumber.trim());
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n========================================`);
        console.log(`🔑 CODUL TĂU DE ÎMPERECHERE (PAIR CODE): ${code}`);
        console.log(`========================================\n`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexiunea s-a închis, reconectare...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🎉 BMW_XMD s-a conectat cu succes la WhatsApp!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            if (mek.key.fromMe) return;

            const messageType = Object.keys(mek.message)[0];
            const body = (messageType === 'conversation') ? mek.message.conversation :
                         (messageType == 'imageMessage') ? mek.message.imageMessage.caption : '';

            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (command === 'ping') {
                await sock.sendMessage(mek.key.remoteJid, { text: 'Pong! BMW_XMD este activ 🚀' }, { quoted: mek });
            } else if (command === 'alive') {
                const aliveText = `━━━━━━ 🤖 ʙᴏᴛ ɪɴғᴏ ━━━━━━\n◉ 🎉 ꨄ BMW_XMD ꨄ\n◉ 👑 ᴏᴡɴᴇʀ: Cosmin\n◉ ⏱️ sᴛᴀᴛᴜs: Online & Activ\n◉ 📦 ᴘʀᴇғɪx: .\n◉ ⚙️ ᴍᴏᴅᴇ: public\n┗━━━━━━━━━━━━━━`;
                await sock.sendMessage(mek.key.remoteJid, { text: aliveText }, { quoted: mek });
            }
        } catch (err) {
            console.error('Erore:', err);
        }
    });
}

startBot();
