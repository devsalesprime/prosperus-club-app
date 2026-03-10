// ============================================
// APP LAYOUT — Application Shell (FIXED)
// ============================================
// Fixes:
//   1. OfflineBanner + InstallPrompt movidos para DENTRO da coluna principal
//      (antes estavam fora, como flex-children do container raiz)
//   2. SupportWidget movido para DENTRO da coluna principal
//      (antes estava fora do inner column, podendo cobrir o BottomNav)
//   3. overflow:hidden removido do inner column
//      (não é necessário e pode clipar o BottomNav em alguns devices)

import React from 'react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { DesktopSidebar } from './DesktopSidebar';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { SupportWidget } from '../SupportWidget';
import { OfflineBanner } from '../OfflineBanner';
import { InstallPrompt } from '../InstallPrompt';
import { AppTour } from '../AppTour';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isMobile, currentUser, tour, tourSteps, view, mobileView } = useApp();

    return (
        <div
            className="bg-prosperus-navy text-prosperus-white font-sans flex flex-col md:flex-row"
            style={{ height: '100dvh', overflow: 'hidden' }}
        >
            <style>{`
                html, body, #root {
                    overflow: hidden;
                    height: 100%;
                    margin: 0;
                }
                .app-scroll-main {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .app-scroll-main::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Sidebar (Desktop only — não afeta mobile) */}
            <DesktopSidebar />

            {/* ─── Coluna principal: flex-col, ocupa altura toda ─────────── */}
            {/* MUDANÇA: overflow:hidden REMOVIDO — não clicar o BottomNav    */}
            {/* MUDANÇA: relative REMOVIDO — SupportWidget agora está aqui dentro */}
            <div
                className="flex-1 flex flex-col bg-prosperus-navy relative"
                style={{ minHeight: 0 }}
            >
                {/* MUDANÇA: OfflineBanner movido para DENTRO da coluna       */}
                {/* Antes: era filho direto do flex-row externo               */}
                {/* Agora: empilha ANTES do header, no topo da coluna         */}
                <OfflineBanner />

                {/* Header fixo no topo */}
                <AppHeader />

                {/* Main: flex-1 → ocupa TUDO entre header e nav */}
                <main
                    className="app-scroll-main"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        ...(isMobile ? {} : { padding: '2rem' }),
                    } as React.CSSProperties}
                >
                    {children}
                </main>

                {/* BottomNav: 56px fixos para os botões — sem safe area dentro */}
                <BottomNav />
                {/* Safe area iOS: irmão do nav, não dentro dele         */}
                {/* Garante que os 56px do nav são 100% usados por botões */}
                <div className="md:hidden" style={{
                    flexShrink: 0,
                    height: 'env(safe-area-inset-bottom, 0px)',
                    background: '#031A2B',
                }} />

                {/* MUDANÇA: SupportWidget movido para DENTRO da coluna      */}
                {/* Antes: estava fora do inner column, podendo cobrir o nav */}
                {/* Agora: é position:absolute dentro da coluna, não do root */}
                {view !== ViewState.MESSAGES && (
                    <SupportWidget
                        visible={!(view === ViewState.AGENDA && mobileView === 'MONTH' && isMobile)}
                    />
                )}
            </div>

            {/* MUDANÇA: InstallPrompt movido para FORA do flex-col principal */}
            {/* É um overlay do viewport — precisa ficar fora do flow        */}
            {/* Mas com z-index abaixo do BottomNav (z-40)                   */}
            <InstallPrompt />

            {/* App Tour Overlay — sempre acima de tudo */}
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