const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');

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
        printQRInTerminal: true, // Afișează codul QR direct în terminal
        browser: ["BMW_XMD", "Chrome", "10.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('Deconectat. Șterge folderul auth_info și scanează din nou.');
            }
        } else if (connection === 'open') {
            console.log('🎉 BMW_XMD s-a conectat cu succes la WhatsApp prin QR Code!');
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
            } 
            else if (command === 'alive') {
                const aliveText = `━━━━━━ 🤖 ʙᴏᴛ ɪɴғᴏ ━━━━━━\n◉ 🎉 ꨄ BMW_XMD ꨄ\n◉ 👑 ᴏᴡɴᴇʀ: Cosmin\n◉ ⏱️ sᴛᴀᴛᴜs: Online & Activ\n◉ 📦 ᴘʀᴇғɪx: .\n┗━━━━━━━━━━━━━━`;
                await sock.sendMessage(mek.key.remoteJid, { text: aliveText }, { quoted: mek });
            }
            else if (command === 'menu' || command === 'help') {
                const menuText = `
╭━━━〔 🤖 *BMW_XMD* 🤖 〕━━━
┃ 
┃ 👑 *Owner:* Cosmin
┃ ⏱️ *Status:* Online & Activ
┃ 📦 *Prefix:* .
┃
┣━━━〔 📂 *CATEGORII* 〕━━━
┃ ➢ .menu ai
┃ ➢ .menu downloader
┃ ➢ .menu fun
┃ ➢ .menu owner
┃
╰━━━━━━━━━━━━━━━━━━━`.trim();
                await sock.sendMessage(mek.key.remoteJid, { text: menuText }, { quoted: mek });
            }
        } catch (err) {
            console.error('Erore:', err);
        }
    });
}

startBot();
