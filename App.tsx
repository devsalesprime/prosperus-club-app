// ============================================
// APP.TSX — Application Entry Point
// ============================================
// After decomposition: ~150 lines.
// Responsibilities: Provider composition + auth guard screens.
//
// Architecture:
//   App → AppProvider → AppShell
//     ├── Loading/Login/Recovery/Onboarding screens (guards)
//     └── AppLayout > ViewSwitcher (main app)

import React, { Suspense, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ViewSwitcher } from './components/layout/ViewSwitcher';
import { LoginModal } from './components/LoginModal';
import { UpdatePasswordModal } from './components/UpdatePasswordModal';
import { RoleSelector } from './components/RoleSelector';
import { InstallPrompt } from './components/InstallPrompt';

// --- Lazy: Onboarding & Admin (heavy, rarely needed initially) ---
const OnboardingWizard = React.lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const AdminApp = React.lazy(() => import('./AdminApp.tsx').then(m => ({ default: m.AdminApp })));

// Lazy loading fallback
const LazyFallback = () => (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-slate-400">Carregando...</span>
        </div>
    </div>
);

// Background decoration shared by auth screens
const AuthBackground = () => (
    <>
        <div className="absolute top-0 right-0 w-96 h-96 bg-prosperus-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-prosperus-gold-dark/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
    </>
);

// ─── Inner Shell (can use useApp) ────────────────────
const AppShell: React.FC = () => {
    const {
        authContextLoading,
        isPasswordRecovery,
        session,
        showRoleSelector,
        pendingUser,
        currentUser,
        isAdmin,
        showOnboarding,
        userProfile,
        setShowOnboarding,
        setIsAdmin,
        setSession,
        handleLoginSuccess,
        handleRoleSelection,
        tour,
        refreshProfile
    } = useApp();

    // ─── Auto-start tour if replay was requested (MEMBER only) ────
    useEffect(() => {
        if (currentUser && currentUser.role === 'MEMBER' && !showOnboarding && !authContextLoading) {
            tour.checkPendingReplay();
        }
    }, [currentUser, showOnboarding, authContextLoading]);

    // ─── Guard 1: Auth Loading ───────────────────────
    if (authContextLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                Carregando...
            </div>
        );
    }

    // ─── Guard 2: Password Recovery ──────────────────
    if (isPasswordRecovery) {
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center relative overflow-hidden">
                <AuthBackground />
                <UpdatePasswordModal />
                <InstallPrompt />
            </div>
        );
    }

    // ─── Guard 3: No Session → Login ─────────────────
    if (!session) {
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center relative overflow-hidden">
                <AuthBackground />
                <LoginModal
                    isOpen={true}
                    onClose={() => { }}
                    onLoginSuccess={handleLoginSuccess}
                />
                <InstallPrompt />
            </div>
        );
    }

    // ─── Guard 4: Role Selector (Admin/Team) ─────────
    if (showRoleSelector && pendingUser) {
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center relative overflow-hidden">
                <AuthBackground />
                <RoleSelector
                    isOpen={true}
                    onClose={() => { }}
                    onSelectRole={handleRoleSelection}
                    userName={pendingUser.name}
                />
            </div>
        );
    }

    // ─── Guard 5: Waiting for Profile ────────────────
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center text-prosperus-white">
                Carregando perfil...
            </div>
        );
    }

    // ─── Guard 6: Route Guard — MEMBER can't access Admin ──
    if (isAdmin && currentUser.role === 'MEMBER') {
        setIsAdmin(false);
    }

    // ─── Guard 7: Admin Panel (BEFORE onboarding — Admin/Team skip wizard + tour) ──
    if (isAdmin) {
        return (
            <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><LazyFallback /></div>}>
                <AdminApp
                    currentUser={currentUser}
                    onLogout={() => { setIsAdmin(false); setSession(null); }}
                />
            </Suspense>
        );
    }

    // ─── Guard 8: Onboarding Wizard (MEMBER only) ────
    if (showOnboarding && userProfile && !userProfile.has_completed_onboarding) {
        return (
            <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><LazyFallback /></div>}>
                <>
                    <div className="min-h-screen bg-slate-950" />
                    <OnboardingWizard
                        currentUser={userProfile}
                        onComplete={() => {
                            setShowOnboarding(false);
                            if (refreshProfile) refreshProfile();
                            setTimeout(() => tour.startTour(), 500);
                        }}
                        onProfileUpdate={() => {
                            if (refreshProfile) refreshProfile();
                        }}
                    />
                </>
            </Suspense>
        );
    }

    // ─── Main App ────────────────────────────────────
    return (
        <AppLayout>
            <ViewSwitcher />
        </AppLayout>
    );
};

// ─── Root Component ──────────────────────────────────
const App = () => (
    <AppProvider>
        <AppShell />
    </AppProvider>
);

export default App;