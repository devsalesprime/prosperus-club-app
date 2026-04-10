// ============================================
// APP LAYOUT — Application Shell
// ============================================
// SOLUÇÃO DEFINITIVA — Março 2026
// FIX ANDROID SCROLL — Março 2026
//
// ============================================================
// REGRAS DE NÃO-REGRESSÃO — Bottom Nav + Scroll
// Não alterar sem entender o impacto em AMBAS as plataformas
// ============================================================
//
// WRAPPER EXTERNO (este div):
//   height: '100dvh'    → fixa altura no viewport (Android scrolla dentro do <main>)
//   overflow: 'hidden'  → impede body scroll (força scroll no <main>)
//   NÃO usar minHeight  → permitiria body scroll (quebraria Android)
//
// <main> (filho direto):
//   flex: 1             → ocupa o espaço restante
//   minHeight: 0        → permite scroll em flex children (CRÍTICO)
//   overflowY: 'auto'   → ativa scroll vertical
//
// BottomNav:
//   position: 'fixed'   → fora do fluxo (iOS: labels visíveis)
//   padding-bottom CSS  → safe area iOS via CSS (não inline)
//   NÃO usar position: relative/static → quebraria iOS
//
// index.html:
//   body: min-height: 100dvh (não height) → sem overflow:hidden
//   NÃO adicionar overflow:hidden no body/html/#root → quebraria iOS
// ============================================================

import React from 'react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { DesktopSidebar } from './DesktopSidebar';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { SupportWidget } from '../SupportWidget';
import { OfflineBanner } from '../OfflineBanner';
import { InstallPrompt } from '../push/InstallPrompt';
import { AppTour } from '../onboarding/AppTour';
import { BirthdayGreetingModal } from '../ui/BirthdayGreetingModal';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isMobile, currentUser, tour, tourSteps, view, mobileView } = useApp();

    return (
        <div
            className="bg-prosperus-navy text-prosperus-white font-sans flex flex-col md:flex-row"
            style={{
                // ─── ANDROID SCROLL FIX ────────────────────────────────
                // height (não minHeight) → trava o wrapper no viewport
                // overflow: hidden → body não scrolla, só <main> scrolla
                // Sem isso: Android body scroll domina, <main> não ativa
                // ──────────────────────────────────────────────────────
                height:   '100dvh',
                display:  'flex',
                overflow: 'hidden',
            }}
        >
            {/* NUNCA adicionar overflow:hidden em html/body/#root */}
            {/* Essas regras ficam SOMENTE no index.html */}
            {/* NUNCA adicionar overflow:hidden em html/body/#root */}
            {/* Essas regras ficam SOMENTE no index.html e substituem display:none para manter JS scroll */}
            <style>{`
                .app-scroll-main::-webkit-scrollbar,
                .academy-swimlane::-webkit-scrollbar {
                    height: 5px;
                    width: 5px;
                }
                .app-scroll-main::-webkit-scrollbar-track,
                .academy-swimlane::-webkit-scrollbar-track {
                    background: transparent;
                }
                .app-scroll-main::-webkit-scrollbar-thumb,
                .academy-swimlane::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.08); /* Quase invisível, mas DOM entende que existe */
                    border-radius: 10px;
                }
                .app-scroll-main::-webkit-scrollbar-thumb:hover,
                .academy-swimlane::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 218, 113, 0.4); /* Ouro suave Hover */
                }
                .app-scroll-main, .academy-swimlane {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
                }
            `}</style>

            {/* Sidebar (Desktop only) */}
            <DesktopSidebar />

            {/* Coluna principal */}
            <div
                className="flex-1 flex flex-col bg-prosperus-navy relative"
                style={{ minHeight: 0 }}
            >
                <OfflineBanner />
                <AppHeader />

                {/* Main: único container de scroll da aplicação */}
                <main
                    className="app-scroll-main"
                    style={{
                        flex:      1,
                        minHeight: 0,       // ← CRÍTICO para flex scroll funcionar
                        overflowY: 'auto',  // ← scroll ativo aqui (não no body)
                        overflowX: 'hidden',
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        ...(isMobile ? {
                            // paddingBottom compensa o BottomNav position:fixed
                            paddingBottom: 'calc(56px + max(env(safe-area-inset-bottom, 0px), 8px) + 16px)',
                        } : {
                            padding: '2rem',
                        }),
                    } as React.CSSProperties}
                >
                    {children}
                </main>

                {/* BottomNav position:fixed — não ocupa espaço no fluxo */}
                <BottomNav />

                {view !== ViewState.MESSAGES && (
                    <SupportWidget
                        visible={!(view === ViewState.AGENDA && mobileView === 'MONTH' && isMobile)}
                    />
                )}
            </div>

            <BirthdayGreetingModal />
            <InstallPrompt />

            {tour.isActive && (
                <AppTour
                    steps={tourSteps}
                    stepIndex={tour.stepIndex}
                    onNext={() => tour.nextStep(tourSteps.length)}
                    onPrev={tour.prevStep}
                    onSkip={tour.skipTour}
                    isActive={tour.isActive}
                />
            )}
        </div>
    );
};