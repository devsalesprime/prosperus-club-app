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
        // Desabilita geração automática de SW — usamos nosso próprio sw.js
        // VitePWA fica responsável apenas pelo manifest.json
        registerType: 'autoUpdate',
        selfDestroying: false,
        includeAssets: ['default-avatar.png', 'default-avatar.svg'],
        manifest: {
          name: 'Prosperus Club',
          short_name: 'Prosperus',
          description: 'Plataforma exclusiva para membros do Prosperus Club',
          start_url: '/app/',
          scope: '/app/',
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#0f172a',
          orientation: 'portrait',
          icons: [
            {
              src: '/app/default-avatar.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/app/default-avatar.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
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
