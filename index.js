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
        printQRInTerminal: false,
        browser: ["BMW_XMD", "Chrome", "10.0.0"]
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Introdu numarul tau de WhatsApp (ex: 407xxxxxxxx): ');
        let code = await sock.requestPairingCode(phoneNumber.trim());
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n========================================`);
        console.log(`🔑 CODUL TAU DE IMPERECHERE: ${code}`);
        console.log(`========================================\n`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🎉 BMW_XMD s-a conectat cu succes la WhatsApp!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
