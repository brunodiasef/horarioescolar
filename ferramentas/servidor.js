// Servidor local para testar o PWA: node ferramentas/servidor.js  ->  http://localhost:5173
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), PORTA = Number(process.env.PORT) || 5173;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8',
};
http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const arq = path.join(RAIZ, rel);
  if (!arq.startsWith(RAIZ)) { res.writeHead(403); return res.end() }
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); return res.end('não encontrado') }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log('Servindo em http://localhost:' + PORTA));
