// ============================================
// APP LAYOUT — Application Shell
// ============================================
// The visual chrome: sidebar, header, main content area, bottom nav.
// Receives ViewSwitcher as children.

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
        <div className="bg-prosperus-navy h-[100dvh] text-prosperus-white font-sans flex flex-col md:flex-row overflow-hidden relative">
            {/* Global Shell Styles — Safe Area CSS Variables */}
            <style>{`
                :root {
                    --header-h: calc(60px + env(safe-area-inset-top, 0px));
                    --nav-h: calc(48px + env(safe-area-inset-bottom, 0px));
                }
                html, body, #root { overflow: hidden; height: 100%; margin: 0; }
                .app-scroll-main { scrollbar-width: none; -ms-overflow-style: none; }
                .app-scroll-main::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Offline Status Banner */}
            <OfflineBanner />
            <InstallPrompt />

            {/* Sidebar (Desktop) */}
            <DesktopSidebar />

            {/* Main Content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-prosperus-navy relative">
                {/* Mobile Header */}
                <AppHeader />

                <main
                    className="md:relative md:top-auto md:bottom-auto md:left-auto md:right-auto md:flex-1 md:min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain md:p-8 app-scroll-main scroll-smooth"
                    style={{
                        position: isMobile ? 'fixed' : undefined,
                        top: isMobile ? 'var(--header-h, 60px)' : undefined,
                        bottom: isMobile ? 'var(--nav-h, 48px)' : undefined,
                        left: isMobile ? 0 : undefined,
                        right: isMobile ? 0 : undefined,
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
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
