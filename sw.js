// 予備トレの Service Worker（ビルド時に vite.config.ts で版番号と事前保存の一覧を埋め込む）
// ・アプリ本体と組み込み教材（JSに含まれる）を事前に保存し、オフラインでも起動・学習できるようにする
// ・画面（HTML）は通信を優先し、つながらないときは保存したものを使う
// ・学習記録（IndexedDB）には触れない。外部サイトへの通信は扱わない（ブラウザに任せる）
const VERSION = '0.1.0-mvdhtn50'
const CACHE = `yobi-tore-${VERSION}`
const PRECACHE = ["./","./assets/index-DWjiLXT2.js","./assets/index-DLVz8qQV.css","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./samples/materials-sample.csv","./samples/materials-sample.json"]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('yobi-tore-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put('./', copy))
          }
          return res
        })
        .catch(() => caches.match('./', { ignoreSearch: true }).then((hit) => hit || caches.match(req))),
    )
    return
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.includes('/assets/') || url.pathname.includes('/samples/'))) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
