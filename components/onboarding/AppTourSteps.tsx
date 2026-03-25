// components/AppTourSteps.tsx
// Defines the 10-step tour with CSS selectors targeting data-tour-id attributes
// Uses selector-based approach to avoid threading refs through the entire component tree

import type { TourStep } from '../../hooks/useAppTour';
import { ViewState } from '../../types';

/**
 * Build the 10-step App Tour.
 * @param onNavigate  callback to navigate to a specific ViewState
 */
export function buildTourSteps(
    onNavigate: (view: ViewState) => void
): TourStep[] {
    return [
        // ── STEP 1: Welcome (fullscreen) ──
        {
            id: 'welcome',
            icon: '🏆',
            title: 'Bem-vindo ao Prosperus Club!',
            description:
                'Você está a poucos passos de aproveitar tudo que o clube tem a oferecer. Deixa a gente te mostrar o essencial em menos de 2 minutos.',
            tooltipPosition: 'center',
        },

        // ── STEP 2: Dashboard ──
        {
            id: 'dashboard',
            targetSelector: '[data-tour-id="dashboard"]',
            icon: '🏠',
            title: 'Seu painel de controle',
            description:
                'No Dashboard você acompanha eventos em destaque, novidades do clube e seu ROI — tudo em um só lugar.',
            tooltipPosition: 'bottom',
            highlightPadding: 6,
            onEnter: () => onNavigate(ViewState.DASHBOARD),
        },

        // ── STEP 3: Agenda ──
        {
            id: 'agenda',
            targetSelector: '[data-tour-id="agenda"]',
            icon: '📅',
            title: 'Agenda de eventos',
            description:
                'Confira todos os eventos do clube, confirme sua presença e adicione direto ao seu Google Calendar.',
            tooltipPosition: 'top',
            highlightPadding: 10,
        },

        // ── STEP 4: Sócios ──
        {
            id: 'members',
            targetSelector: '[data-tour-id="members"]',
            icon: '🤝',
            title: 'Conecte-se com sócios',
            description:
                'O Member\'s Book mostra automaticamente quem tem perfil compatível com o seu. Negócios acontecem aqui.',
            tooltipPosition: 'top',
            highlightPadding: 10,
        },

        // ── STEP 5: Chat ──
        {
            id: 'chat',
            targetSelector: '[data-tour-id="chat"]',
            icon: '💬',
            title: 'Mensagens diretas',
            description:
                'Envie mensagens para qualquer sócio diretamente pelo app — sem precisar trocar contato primeiro.',
            tooltipPosition: 'bottom',
            highlightPadding: 10,
        },

        // ── STEP 6: Prosperus Tools ★ NOVO ──
        {
            id: 'tools',
            targetSelector: '[data-tour-id="prosperus-tools"]',
            icon: '🧰',
            title: 'Prosperus Tools: seu arsenal',
            description:
                'Acesse videoaulas exclusivas, diagnósticos estratégicos e acompanhe seu progresso de perto.',
            tooltipPosition: 'top',
            highlightPadding: 10,
        },

        // ── STEP 7: Galeria ★ NOVO ──
        {
            id: 'gallery',
            targetSelector: '[data-tour-id="gallery"]',
            icon: '📸',
            title: 'Galeria de eventos',
            description:
                'Reviva cada encontro pelas fotos oficiais. Toque no ❤️ para salvar seus álbuns favoritos.',
            tooltipPosition: 'top',
            highlightPadding: 10,
        },

        // ── STEP 8: Business Core (ROI) ──
        {
            id: 'roi',
            targetSelector: '[data-tour-id="roi-widget"]',
            icon: '📈',
            title: 'Registre seus negócios',
            description:
                'Sempre que fechar uma venda, compra ou indicação pelo clube, registre aqui. Seu ROI aparece no ranking.',
            tooltipPosition: 'bottom',
            highlightPadding: 6,
            onEnter: () => onNavigate(ViewState.DASHBOARD),
        },

        // ── STEP 9: Favoritos ★ NOVO ──
        {
            id: 'favorites',
            targetSelector: '[data-tour-id="favorites"]',
            icon: '❤️',
            title: 'Seus favoritos, sempre à mão',
            description:
                'Tudo que você curtir — vídeos, álbuns, eventos e sócios — fica salvo aqui para acesso rápido.',
            tooltipPosition: 'bottom',
            highlightPadding: 10,
        },

        // ── STEP 10: Perfil ──
        {
            id: 'profile',
            targetSelector: '[data-tour-id="profile"]',
            icon: '⭐',
            title: 'Seu perfil é sua vitrine',
            description:
                'Quanto mais completo seu perfil, mais matches você recebe. Adicione o que você vende e o que precisa.',
            tooltipPosition: 'bottom',
            highlightPadding: 10,
        },
    ];
}
