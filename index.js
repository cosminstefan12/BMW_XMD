
const http = require("http");

const PORT = process.env.PORT || 3000;

const menu = [
  "╭─── 🤖 COSMIN-MD ───",
  "│ .menu  - Lista comenzilor",
  "│ .ping  - Test bot",
  "│ .about - Despre bot",
  "│ .help  - Ajutor",
  "╰───────────────────"
].join("\n");

const server = http.createServer((req, res) => {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  if (path === "/") {
    res.end("COSMIN-MD 🤖\nBotul este pornit!\nDeschide /menu pentru comenzi.");
  } else if (path === "/menu") {
    res.end(menu);
  } else if (path === "/ping") {
    res.end("Pong! COSMIN-MD funcționează ✅");
  } else if (path === "/about") {
    res.end("COSMIN-MD v0.1 — în dezvoltare.");
  } else {
    res.end("Comandă necunoscută. Deschide /menu.");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`COSMIN-MD rulează pe portul ${PORT}`);
});
