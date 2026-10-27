// MolB World 오프라인 일꾼 — `vite build`가 끝날 때 vite.config.ts의 offline()이 이 틀의 VERSION(판)과 FILES(파일 목록) 자리를 채워
// dist/sw.js로 쓴다. 손으로 고치지 말고 이 틀을 고친다.
//
// 사이트는 서버 없이 도는 정적 파일 몇 개(쪽 이동은 해시)라, 빌드의 파일을 전부 미리 받아 두면 비행기 모드에서도 홈 화면 아이콘으로
// 찍먹 · 블랭크북이 그대로 돈다(장부는 원래 localStorage). 판이 바뀌면 이 파일의 글이 바뀌어 브라우저가 새 일꾼을 받고, 새 일꾼은
// 새 판을 다 받은 뒤에 옛 캐시를 지운다 — 다음에 열 때 새 판이 선다.
const VERSION = '__VERSION__';
const CACHE = `molbworld-${VERSION}`;
const FILES = __FILES__;
const at = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['./', ...FILES].map(at)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('molbworld-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // 글꼴 CDN 같은 남의 것은 브라우저에 맡긴다 — 오프라인이면 기기 글꼴로 그린다.
  if (url.origin !== self.location.origin) return;
  // 쪽은 하나(index.html)뿐이다 — 이 판의 것을 곧장 준다(새 판은 새 일꾼이 받아 둔 다음에 선다).
  if (request.mode === 'navigate') {
    event.respondWith(caches.match(at('index.html')).then((hit) => hit || fetch(request)));
    return;
  }
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
