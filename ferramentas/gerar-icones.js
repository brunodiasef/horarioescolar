// Gera os ícones PNG do PWA sem dependências: node ferramentas/gerar-icones.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');

const FUNDO = [0x2f, 0x5d, 0x62], CELULA = [0xff, 0xfe, 0xfc], DESTAQUE = [0xe0, 0xa3, 0x64];
// células da grade 4x4 que aparecem em destaque (aula marcada)
const MARCADAS = new Set(['0-1', '1-3', '2-0', '2-2', '3-1']);

function dentroRet(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

// cor de um ponto em coordenadas normalizadas 0..1; null = transparente
function cor(u, v, { arredondado, margem }) {
  if (arredondado && !dentroRet(u, v, 0, 0, 1, 1, 0.2)) return null;
  const a = margem, b = 1 - margem, n = 4, gap = (b - a) * 0.06;
  const passo = (b - a + gap) / n, lado = passo - gap;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = a + j * passo, y0 = a + i * passo;
    if (dentroRet(u, v, x0, y0, x0 + lado, y0 + lado, lado * 0.18))
      return MARCADAS.has(i + '-' + j) ? DESTAQUE : CELULA;
  }
  return FUNDO;
}

function png(tam, opcoes) {
  const SS = 4, linhas = [];
  for (let y = 0; y < tam; y++) {
    const linha = Buffer.alloc(1 + tam * 4);
    for (let x = 0; x < tam; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = cor((x + (sx + .5) / SS) / tam, (y + (sy + .5) / SS) / tam, opcoes);
        if (c) { r += c[0]; g += c[1]; b += c[2]; a++ }
      }
      const o = 1 + x * 4;
      if (a) { linha[o] = r / a; linha[o + 1] = g / a; linha[o + 2] = b / a }
      linha[o + 3] = Math.round(255 * a / (SS * SS));
    }
    linhas.push(linha);
  }
  const crcTab = Array.from({ length: 256 }, (_, n) => {
    let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
  });
  const crc = buf => { let c = 0xffffffff; for (const x of buf) c = crcTab[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 };
  const bloco = (tipo, dados) => {
    const t = Buffer.from(tipo), len = Buffer.alloc(4), c = Buffer.alloc(4);
    len.writeUInt32BE(dados.length); c.writeUInt32BE(crc(Buffer.concat([t, dados])));
    return Buffer.concat([len, t, dados, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(Buffer.concat(linhas))), bloco('IEND', Buffer.alloc(0)),
  ]);
}

const destino = path.join(__dirname, '..', 'icones');
fs.mkdirSync(destino, { recursive: true });
const saidas = [
  ['icone-192.png', 192, { arredondado: true, margem: 0.2 }],
  ['icone-512.png', 512, { arredondado: true, margem: 0.2 }],
  // maskable: fundo cheio, desenho dentro da zona segura (80% central)
  ['icone-maskable-512.png', 512, { arredondado: false, margem: 0.28 }],
  // iOS aplica o próprio arredondamento
  ['apple-touch-icon.png', 180, { arredondado: false, margem: 0.22 }],
  ['favicon-32.png', 32, { arredondado: true, margem: 0.16 }],
];
for (const [nome, tam, op] of saidas) {
  fs.writeFileSync(path.join(destino, nome), png(tam, op));
  console.log('gerado', nome);
}
