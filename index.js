const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba terhubung kembali...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🎉 Bot Berhasil Terhubung ke WhatsApp!');
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
                await sock.sendMessage(mek.key.remoteJid, { text: 'Pong! Bot aktif 🚀' }, { quoted: mek });
            } else if (command === 'alive') {
                await sock.sendMessage(mek.key.remoteJid, { text: '◉ 🎉 ꨄ BMW-XMD ꨄ\n◉ ⚙️ Status: Online & Stabil' }, { quoted: mek });
            }
        } catch (err) {
            console.error('Error pada handler pesan:', err);
        }
    });
}

startBot();
