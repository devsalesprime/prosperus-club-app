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
        <div className="bg-prosperus-navy h-full text-prosperus-white font-sans flex flex-col md:flex-row overflow-hidden relative">
            {/* Global Shell Styles */}
            <style>{`
                html, body, #root { overflow: hidden; height: 100%; margin: 0; }
                .app-scroll-main { scrollbar-width: none; -ms-overflow-style: none; }
                .app-scroll-main::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Offline Status Banner */}
            <OfflineBanner />
            <InstallPrompt />

            {/* Sidebar (Desktop) */}
            <DesktopSidebar />

            {/* Main Content — flex column: header | content | nav */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-prosperus-navy relative">
                {/* Mobile Header — shrink-0, no fixed */}
                <AppHeader />

                {/* Scrollable content area — flex-1 fills between header and nav */}
                <main
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain md:p-8 app-scroll-main scroll-smooth"
                    style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                >
                    {children}
                </main>

                {/* Mobile Bottom Nav — shrink-0, no fixed */}
                <BottomNav />
            </div>

            {/* Support Widget — hidden in Messages and mobile month calendar */}
            {view !== ViewState.MESSAGES && <SupportWidget visible={!(view === ViewState.AGENDA && mobileView === 'MONTH' && isMobile)} />}

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
