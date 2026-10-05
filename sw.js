/* Service worker: deixa o app abrir sem internet depois da primeira visita.
   Ao publicar uma versão nova, aumente VERSAO para forçar a troca do cache. */
const VERSAO = 'v3';
const CACHE = 'horario-' + VERSAO;
const ARQUIVOS = [
  './',
  'index.html',
  'dados/dados.js',
  'manifest.webmanifest',
  'icones/icone-192.png',
  'icones/icone-512.png',
  'icones/icone-maskable-512.png',
  'icones/apple-touch-icon.png',
  'icones/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n.startsWith('horario-') && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // fontes do Google: do cache primeiro, rede só na primeira vez
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return resp;
    })));
    return;
  }

  // arquivos do app: rede primeiro (pega atualizações), cache quando estiver offline
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)) }
      return resp;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined))));
  }
});
