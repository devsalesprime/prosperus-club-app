// ============================================
// APP LAYOUT — Application Shell
// ============================================
// Uses NATURAL FLEXBOX flow — no position:fixed on children.
// body is already position:fixed on iOS (index.html @supports),
// so header/main/nav are flex items that fill body naturally.

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
            className="bg-prosperus-navy text-prosperus-white font-sans flex flex-col md:flex-row relative"
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

            {/* Offline Status Banner */}
            <OfflineBanner />
            <InstallPrompt />

            {/* Sidebar (Desktop) */}
            <DesktopSidebar />

            {/* Coluna principal: flex-col, ocupa altura toda */}
            <div
                className="flex-1 flex flex-col bg-prosperus-navy relative"
                style={{ minHeight: 0, overflow: 'hidden' }}
            >
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
                        // Desktop: padding
                        ...(isMobile ? {} : { padding: '2rem' }),
                    } as React.CSSProperties}
                >
                    {children}
                </main>

                {/* BottomNav: parte do fluxo normal no mobile */}
                {/* Não é fixed — empurra o main para cima naturalmente */}
                <BottomNav />
            </div>

            {/* Support Widget — hidden in Messages and mobile month calendar */}
            {view !== ViewState.MESSAGES && (
                <SupportWidget
                    visible={!(view === ViewState.AGENDA && mobileView === 'MONTH' && isMobile)}
                />
            )}

            {/* App Tour Overlay */}
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
