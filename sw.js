const CACHE_NAME = 'fh-gestao-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://i.postimg.cc/zDRJMSTn/69420f5a-5b80-457e-8146-00485162d7f2.jpg',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js'
];

// Instala o Service Worker e guarda os ficheiros em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto com sucesso');
        // Tenta fazer o cache dos recursos, ignorando os que falharem para não parar o processo
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(err => console.log('Falha ao fazer cache de:', url)))
        );
      })
  );
  self.skipWaiting(); // Força a ativação imediata
});

// Interceta os pedidos: Se estiver offline, serve o que está no cache!
self.addEventListener('fetch', event => {
  // Ignora chamadas diretas ao Firebase Firestore/Autenticação para não interferir com a base de dados
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o cache se encontrar, senão vai à internet (fetch)
        return response || fetch(event.request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
                // Guarda o novo ficheiro no cache para o futuro
                cache.put(event.request.url, fetchResponse.clone());
                return fetchResponse;
            });
        });
      }).catch(() => {
          // Se falhar (sem internet) e for um pedido de navegação, retorna a página principal
          if (event.request.mode === 'navigate') {
              return caches.match('./index.html') || caches.match('./');
          }
      })
  );
});

// Limpa caches antigos quando o sistema é atualizado
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
