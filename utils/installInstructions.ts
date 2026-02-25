/**
 * Install instructions per platform/browser combination
 * Each platform gets tailored step-by-step guidance
 */

import type { Platform } from './platformDetect';

export interface InstallInstructions {
    type: 'native' | 'guide' | 'info' | 'none';
    title: string;
    subtitle?: string;
    steps?: string[];
    infoText?: string;
    ctaLabel: string;
}

export const INSTALL_INSTRUCTIONS: Record<Platform, InstallInstructions> = {
    // Platforms with native beforeinstallprompt
    android: {
        type: 'native',
        title: 'Instalar Prosperus Club',
        subtitle: 'Acesse direto da tela inicial',
        ctaLabel: 'Instalar',
    },
    desktop_chrome: {
        type: 'native',
        title: 'Instalar Prosperus Club',
        subtitle: 'Acesse como app sem abrir o browser',
        ctaLabel: 'Instalar',
    },
    desktop_edge: {
        type: 'native',
        title: 'Instalar Prosperus Club',
        subtitle: 'Acesse como app sem abrir o browser',
        ctaLabel: 'Instalar',
    },

    // iOS Safari — real Safari share steps
    ios_safari: {
        type: 'guide',
        title: 'Instalar Prosperus Club',
        subtitle: 'Adicione à sua Tela de Início',
        ctaLabel: 'Como instalar',
        steps: [
            'Toque no ícone 🔗 Compartilhar na barra inferior do Safari',
            'Role para baixo e toque em ➕ "Adicionar à Tela de Início"',
            'Confirme tocando em "Adicionar" no canto superior direito',
        ],
    },

    // iOS Chrome — 3-dot menu, not share bar
    ios_chrome: {
        type: 'guide',
        title: 'Instalar Prosperus Club',
        subtitle: 'Adicione à sua Tela de Início',
        ctaLabel: 'Como instalar',
        steps: [
            'Toque nos 3 pontos (⋮) no canto superior direito',
            'Toque em "Adicionar à tela de início"',
            'Confirme tocando em "Adicionar"',
        ],
    },

    // iOS Firefox — hamburger menu
    ios_firefox: {
        type: 'guide',
        title: 'Instalar Prosperus Club',
        subtitle: 'Adicione à sua Tela de Início',
        ctaLabel: 'Como instalar',
        steps: [
            'Toque no ícone ≡ (menu) na barra inferior',
            'Toque em "Compartilhar" e depois em "Adicionar à Tela de Início"',
            'Confirme tocando em "Adicionar"',
        ],
    },

    // iOS other browsers — suggest Safari
    ios_other: {
        type: 'guide',
        title: 'Instalar Prosperus Club',
        ctaLabel: 'Como instalar',
        steps: [
            'Abra este site no Safari para instalar o app',
            'Toque em Compartilhar → Adicionar à Tela de Início',
        ],
    },

    // Desktop Safari — no install support, suggest Chrome
    desktop_safari: {
        type: 'info',
        title: 'Melhor experiência disponível',
        infoText: 'Para instalar o app, acesse pelo Chrome ou Edge.',
        ctaLabel: 'Entendi',
    },

    // Not supported — no banner
    desktop_firefox: { type: 'none', title: '', ctaLabel: '' },
    desktop_other: { type: 'none', title: '', ctaLabel: '' },
};
