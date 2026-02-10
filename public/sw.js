// ============================================
// PROSPERUS CLUB - SERVICE WORKER
// ============================================
// Versão: 1.0.0
// Estratégias:
// - Stale-While-Revalidate para assets estáticos
// - Network First para API calls
// - Push Notifications com deep linking

const CACHE_NAME = 'prosperus-v2';
const STATIC_CACHE_NAME = 'prosperus-static-v2';
const DYNAMIC_CACHE_NAME = 'prosperus-dynamic-v2';
const API_CACHE_NAME = 'prosperus-api-v1';

// Assets essenciais para cache inicial (App Shell)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/default-avatar.svg',
    '/pwa-192x192.png',
    '/pwa-512x512.png'
];

// Domínios que NUNCA devem ser cacheados (analytics, auth)
const NO_CACHE_DOMAINS = [
    'googleapis.com',
    'google-analytics.com',
    'googletagmanager.com'
];

// Domínios de API com cache Network-First (dados para offline)
const API_CACHE_DOMAINS = [
    'supabase.co',
    'supabase.io'
];

// Max API cache entries to prevent storage bloat
const MAX_API_CACHE_ENTRIES = 100;

// ============================================
// INSTALL EVENT - Cache App Shell
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v1...');
    
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
// ACTIVATE EVENT - Limpa caches antigos
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Remove caches antigos (versões anteriores)
                            return name.startsWith('prosperus-') && 
                                   name !== STATIC_CACHE_NAME && 
                                   name !== DYNAMIC_CACHE_NAME;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
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
    
    // API requests: Network-First with cache fallback
    if (isApiRequest(url)) {
        // Only cache read requests (SELECT queries, not mutations)
        if (!url.pathname.includes('/auth/') && !url.pathname.includes('/realtime/')) {
            event.respondWith(networkFirst(request));
            return;
        }
        return; // Auth and realtime requests are never cached
    }
    
    // Static assets and navigation: Stale-While-Revalidate
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
 * Network-First Strategy (for API requests)
 * Tries network, falls back to cache if offline
 */
async function networkFirst(request) {
    const cache = await caches.open(API_CACHE_NAME);
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            
            // Trim cache to prevent storage bloat
            trimCache(API_CACHE_NAME, MAX_API_CACHE_ENTRIES);
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed — try cache
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving API from cache (offline):', request.url);
            return cachedResponse;
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
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    let data = {
        title: 'Prosperus Club',
        body: 'Você tem uma nova notificação!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        url: '/'
    };
    
    // Tenta extrair dados do payload
    if (event.data) {
        try {
            const payload = event.data.json();
            data = {
                title: payload.title || data.title,
                body: payload.body || payload.message || data.body,
                icon: payload.icon || data.icon,
                badge: payload.badge || data.badge,
                url: payload.url || payload.target_url || data.url,
                tag: payload.tag || 'prosperus-notification',
                data: payload.data || {}
            };
        } catch (e) {
            // Se não for JSON, usa o texto diretamente
            data.body = event.data.text() || data.body;
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: {
            url: data.url,
            ...data.data
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: '/pwa-192x192.png'
            },
            {
                action: 'close',
                title: 'Fechar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================
// NOTIFICATION CLICK EVENT
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    // Fecha a notificação
    event.notification.close();
    
    // Se clicou em "fechar", não faz nada
    if (event.action === 'close') {
        return;
    }
    
    // URL de destino (do payload ou raiz)
    const targetUrl = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Procura uma janela já aberta com o app
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Navega para a URL de destino e foca
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }
                // Se não encontrou, abre uma nova janela
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// ============================================
// NOTIFICATION CLOSE EVENT (Analytics)
// ============================================
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification dismissed:', event.notification.tag);
    // Pode enviar analytics aqui se necessário
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
});

console.log('[SW] Service Worker loaded successfully!');
