/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.{ts,tsx}'],
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['services/**/*.ts', 'hooks/**/*.ts', 'components/**/*.tsx'],
            exclude: ['**/*.d.ts', '**/index.ts']
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    }
});
