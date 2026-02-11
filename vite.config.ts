/// <reference types="vitest" />
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite plugin that stamps __BUILD_TIMESTAMP__ into sw.js during build.
 * This ensures each deploy gets a unique cache version, forcing old
 * caches to be cleaned automatically.
 */
function swVersionStamp(): Plugin {
  return {
    name: 'sw-version-stamp',
    writeBundle(options) {
      const outDir = options.dir || 'dist';
      const swPath = path.resolve(outDir, 'sw.js');
      if (fs.existsSync(swPath)) {
        const timestamp = Date.now().toString(36); // compact: e.g. 'lz1abc'
        let content = fs.readFileSync(swPath, 'utf-8');
        content = content.replace(/__BUILD_TIMESTAMP__/g, timestamp);
        fs.writeFileSync(swPath, content, 'utf-8');
        console.log(`[sw-version-stamp] Stamped sw.js with version: ${timestamp}`);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/app/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      css: false,
    },
    plugins: [
      react(),
      VitePWA({
        // VitePWA generates manifest.json — we use our own custom sw.js
        registerType: 'autoUpdate',
        selfDestroying: false,
        includeAssets: [
          'default-avatar.png',
          'default-avatar.svg',
          'fundo-prosperus-app.webp'
        ],
        manifest: {
          // =============================================
          // IDENTIDADE DO APP
          // =============================================
          name: 'Prosperus Club',
          short_name: 'Prosperus',
          description: 'Plataforma exclusiva para membros do Prosperus Club — networking, negócios, eventos e ferramentas de crescimento.',
          id: '/app/',
          start_url: '/app/',
          scope: '/app/',

          // =============================================
          // LOCALIZAÇÃO
          // =============================================
          lang: 'pt-BR',
          dir: 'ltr',

          // =============================================
          // APARÊNCIA
          // =============================================
          display: 'standalone',
          display_override: [
            'standalone',
            'minimal-ui'
          ] as any,
          background_color: '#0f172a',
          theme_color: '#0f172a',
          orientation: 'portrait',

          // =============================================
          // CATEGORIAS & CLASSIFICAÇÃO
          // =============================================
          categories: ['business', 'social', 'productivity'] as any,

          // =============================================
          // ÍCONES (separar any e maskable por spec)
          // =============================================
          icons: [
            {
              src: '/app/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/app/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/app/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],

          // =============================================
          // SCREENSHOTS (para prompt de instalação)
          // =============================================
          screenshots: [
            {
              src: '/app/fundo-prosperus-app.webp',
              sizes: '1080x1920',
              type: 'image/webp',
              form_factor: 'narrow',
              label: 'Prosperus Club — Dashboard'
            }
          ] as any,

          // =============================================
          // ATALHOS RÁPIDOS (long-press no ícone)
          // =============================================
          shortcuts: [
            {
              name: 'Dashboard',
              short_name: 'Início',
              description: 'Ir para o Dashboard',
              url: '/app/?view=dashboard',
              icons: [{ src: '/app/icons/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Chat',
              short_name: 'Chat',
              description: 'Abrir conversas',
              url: '/app/?view=chat',
              icons: [{ src: '/app/icons/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Academia',
              short_name: 'Academia',
              description: 'Acessar vídeos e conteúdos',
              url: '/app/?view=academy',
              icons: [{ src: '/app/icons/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Agenda',
              short_name: 'Agenda',
              description: 'Ver eventos e reuniões',
              url: '/app/?view=events',
              icons: [{ src: '/app/icons/icon-192x192.png', sizes: '192x192' }]
            }
          ] as any,

          // =============================================
          // COMPORTAMENTO DE INICIALIZAÇÃO
          // =============================================
          launch_handler: {
            client_mode: ['focus-existing', 'auto']
          } as any,

          // =============================================
          // COMPARTILHAMENTO (OS Share Sheet)
          // =============================================
          share_target: {
            action: '/app/?share=true',
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url'
            }
          } as any,

          // =============================================
          // EDGE SIDE PANEL
          // =============================================
          edge_side_panel: {
            preferred_width: 400
          } as any
        },
        devOptions: {
          enabled: false
        }
      }),
      // Stamps build timestamp into sw.js for automatic cache versioning
      swVersionStamp()
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
