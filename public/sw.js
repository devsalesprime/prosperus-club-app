// ============================================
// PROSPERUS CLUB - SERVICE WORKER
// ============================================
// Cache Strategy:
// - Build-timestamp versioning (auto-invalidates on each deploy)
// - Stale-While-Revalidate for static assets
// - Network First for API calls
// - Push Notifications with deep linking
//
// Z-INDEX DE CACHE:
// CACHE_VERSION  → muda a cada build, limpa caches antigos automaticamente
// skipWaiting()  → ativa novo SW imediatamente
// clients.claim() → assume controle sem reload

// ⚡ VERSÃO AUTOMÁTICA - Atualizada a cada build pelo Vite plugin
const CACHE_VERSION = '__BUILD_TIMESTAMP__';
const STATIC_CACHE_NAME = `prosperus-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `prosperus-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `prosperus-api-${CACHE_VERSION}`;

// Assets essenciais para cache inicial (App Shell)
const STATIC_ASSETS = [
    '/app/',
    '/app/index.html',
    '/app/manifest.json',
    '/app/default-avatar.svg',
    '/app/default-avatar.png'
];

// Domínios que NUNCA devem ser cacheados (analytics, auth)
const NO_CACHE_DOMAINS = [
    'googleapis.com',
    'google-analytics.com',
    'googletagmanager.com'
];

// Domínios de API — Supabase REST queries always bypass cache for fresh data
const API_CACHE_DOMAINS = [
    'supabase.co',
    'supabase.io'
];

// Supabase Storage paths that CAN be cached (images, files — not data)
const CACHEABLE_STORAGE_PATHS = ['/storage/v1/'];

// Max API cache entries to prevent storage bloat
const MAX_API_CACHE_ENTRIES = 100;

// ============================================
// INSTALL EVENT - Cache App Shell
// ============================================
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing v${CACHE_VERSION}...`);
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Força ativação imediata (skip waiting)
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// ============================================
// ACTIVATE EVENT - Limpa TODOS os caches antigos
// ============================================
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating v${CACHE_VERSION}...`);
    
    // Lista de caches ATUAIS que devem ser preservados
    const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Remove QUALQUER cache que não esteja na lista atual
                            return name.startsWith('prosperus-') && !currentCaches.includes(name);
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log(`[SW] v${CACHE_VERSION} now active - old caches cleaned`);
                // Assume controle de todas as páginas imediatamente
                return self.clients.claim();
            })
    );
});

// ============================================
// FETCH EVENT - Estratégias de Cache
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignore non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // URLs that should never be cached
    if (shouldBypassCache(url)) {
        return;
    }
    
    // Supabase requests: split between data (no cache) and storage (cache)
    if (isApiRequest(url)) {
        // Supabase Storage (images, files) — Stale-While-Revalidate
        if (CACHEABLE_STORAGE_PATHS.some(p => url.pathname.includes(p))) {
            event.respondWith(staleWhileRevalidate(request));
            return;
        }
        // ALL other Supabase requests (REST API, auth, realtime) — NEVER cache
        // This ensures events/agenda data is always fresh from the database
        return;
    }
    
    // Navigation requests (HTML): Network-First to always get latest
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Static assets (JS, CSS, images): Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request));
});

/**
 * Verifica se a URL deve ignorar o cache (APIs, analytics, etc.)
 */
function shouldBypassCache(url) {
    if (!url.protocol.startsWith('http')) {
        return true;
    }
    return NO_CACHE_DOMAINS.some(domain => url.hostname.includes(domain));
}

/**
 * Check if URL is an API request that should use Network-First caching
 */
function isApiRequest(url) {
    return API_CACHE_DOMAINS.some(domain => url.hostname.includes(domain));
}

/**
 * Network-First Strategy (for API and navigation requests)
 * Tries network, falls back to cache if offline
 */
async function networkFirst(request) {
    const cache = await caches.open(request.mode === 'navigate' ? DYNAMIC_CACHE_NAME : API_CACHE_NAME);
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            
            // Trim API cache to prevent storage bloat
            if (request.mode !== 'navigate') {
                trimCache(API_CACHE_NAME, MAX_API_CACHE_ENTRIES);
            }
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed — try cache
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving from cache (offline):', request.url);
            return cachedResponse;
        }
        
        // For navigation, return cached index.html (SPA fallback)
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/app/index.html');
            if (fallback) return fallback;
        }
        
        // No cache available — return offline JSON response
        return new Response(
            JSON.stringify({ error: 'offline', message: 'No cached data available' }),
            {
                status: 503,
                statusText: 'Service Unavailable (Offline)',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Stale-While-Revalidate Strategy
 * Retorna do cache imediatamente, mas atualiza em background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                cache.put(request, responseClone);
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('[SW] Network request failed:', error);
            return cachedResponse;
        });
    
    return cachedResponse || fetchPromise;
}

/**
 * Trim cache to max entries (LRU eviction)
 */
async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        // Delete oldest entries (FIFO)
        const toDelete = keys.slice(0, keys.length - maxEntries);
        for (const key of toDelete) {
            await cache.delete(key);
        }
    }
}

// ============================================
// PUSH NOTIFICATION EVENT
// ============================================
// ALWAYS shows notification — even when app is open (required for iOS)
// Uses BroadcastChannel to notify app for badge/count refresh
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'Prosperus Club', body: event.data.text() };
    }

    // Notify the open app to refresh badge count via BroadcastChannel
    try {
        const ch = new BroadcastChannel('prosperus-push');
        ch.postMessage({ type: 'PUSH_RECEIVED', data });
        ch.close();
    } catch (e) {
        // BroadcastChannel not supported — app will refresh on next focus
    }

    // Ensure absolute URLs for icons (required by some mobile OS to show banners)
    const baseUrl = self.location.origin;
    const iconUrl = data.icon ? new URL(data.icon, baseUrl).href : new URL('/app/default-avatar.png', baseUrl).href;

    // Build notification options
    const title = data.title || 'Prosperus Club';
    const tagString = data.tag || 'prosperus-notification';
    const options = {
        body: data.body || data.message || '',
        icon: iconUrl,
        badge: iconUrl,
        tag: tagString,
        renotify: true, // IMPORTANT: Forces sound/vibration/banner even if updating the same tag
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            type: data.type || 'notification'
        },
    };

    // ALWAYS show — iOS needs this even when app is in foreground
    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, options),
            // Set app badge (if supported by SW registration)
            ('setAppBadge' in self.registration)
                ? self.registration.setAppBadge().catch(() => {})
                : Promise.resolve(),
        ])
    );
});

// ============================================
// NOTIFICATION CLICK EVENT
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    // Clear badge on click
    if ('clearAppBadge' in self.registration) {
        self.registration.clearAppBadge().catch(() => {});
    }

    // Se clicou em "fechar", não faz nada
    if (event.action === 'close') {
        return;
    }

    // URL de destino (do payload ou raiz)
    let targetUrl = event.notification.data?.url || '/app/';

    // Resolve relative URLs to the app's base path (/app/)
    if (targetUrl.startsWith('/') && !targetUrl.startsWith('/app/')) {
        targetUrl = '/app' + targetUrl;
    }

    const fullUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(async (clientList) => {
                // Focus existing window and navigate
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        await client.navigate(fullUrl);
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(fullUrl);
                }
            })
    );
});

// ============================================
// NOTIFICATION CLOSE EVENT
// ============================================
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification dismissed:', event.notification.tag);
});

// ============================================
// MESSAGE EVENT (Comunicação com App)
// ============================================
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
    
    // Respond with current version
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports?.[0]?.postMessage({ version: CACHE_VERSION });
    }
});

console.log(`[SW] Service Worker v${CACHE_VERSION} loaded!`);
