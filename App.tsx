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

import React, { Suspense, useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { ViewState } from './types';
import { AppLayout } from './components/layout/AppLayout';
import { ViewSwitcher } from './components/layout/ViewSwitcher';
import { LoginModal } from './components/auth/LoginModal';
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal';
import { RoleSelector } from './components/auth/RoleSelector';
import { InstallPrompt } from './components/push/InstallPrompt';
import { PushPermissionPrompt } from './components/push/PushPermissionPrompt';
import { PushAutoSubscriber } from './components/push/PushAutoSubscriber';
import { UnreadCountProvider } from './contexts/UnreadCountContext';
import { SupportDocsProvider } from './components/support/SupportDocsSheet';
import { ProspToaster } from './utils/toast';
import { NotificationBannerInterstitial } from './components/banners/NotificationBannerInterstitial';
import { useNotificationBanner } from './hooks/useNotificationBanner';

// --- Lazy: Onboarding & Admin (heavy, rarely needed initially) ---
const OnboardingWizard = React.lazy(() => import('./components/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const AdminApp = React.lazy(() => import('./AdminApp.tsx').then(m => ({ default: m.AdminApp })));

// Skeleton do app enquanto carrega
const AppSkeleton = () => (
  <div style={{
    minHeight: '100dvh',
    background: '#031A2B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      width: 40, height: 40,
      border: '2px solid #052B48',
      borderTop: '2px solid #FFDA71',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
        isBlocked,
        blockedEmail,
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
        setView,
        handleLoginSuccess,
        handleRoleSelection,
        handleLogout,
        tour,
        refreshProfile
    } = useApp();

    // ─── Deep link interception (push notification → ?chat=ID) ────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const chatId = params.get('chat');
        if (chatId) {
            setView(ViewState.MESSAGES);
            window.history.replaceState({}, '', '/');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Push notification prompt (shows 5s after onboarding) ────
    const [showPushPrompt, setShowPushPrompt] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.role === 'MEMBER' && userProfile?.has_completed_onboarding && !showOnboarding && !authContextLoading) {
            const timer = setTimeout(() => setShowPushPrompt(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentUser, userProfile?.has_completed_onboarding, showOnboarding, authContextLoading]);

    // ─── Auto-start tour if replay was requested (MEMBER only) ────
    useEffect(() => {
        if (currentUser && currentUser.role === 'MEMBER' && !showOnboarding && !authContextLoading) {
            tour.checkPendingReplay();
        }
    }, [currentUser, showOnboarding, authContextLoading]);

    // ─── Banner Interstitial ──────────────────────────
    const { activeBanner, dismissBanner } = useNotificationBanner(
        currentUser?.id ?? null,
        currentUser?.role ?? null
    );

    const resolveDeepLink = (link: string) => {
        switch (link) {
            case '/app/dashboard': setView(ViewState.DASHBOARD); break;
            case '/app/socios': setView(ViewState.MEMBERS); break;
            case '/app/agenda': setView(ViewState.AGENDA); break;
            case '/app/tools/solucoes': setView(ViewState.SOLUTIONS); break;
            case '/app/roi-socios': setView(ViewState.DEALS); break;
            case '/app/roi-crescimento': 
                 setView(ViewState.DASHBOARD);
                 setTimeout(() => window.dispatchEvent(new CustomEvent('open-roi-modal')), 500);
                 break;
            case '/app/notificacoes': setView(ViewState.NOTIFICATIONS); break;
            case '/app/chat': setView(ViewState.MESSAGES); break;
            default: setView(ViewState.DASHBOARD); break;
        }
    };

    // ─── Guard 0: Blocked User ───────────────────────
    if (isBlocked) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl text-center">
                    <img
                        src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg"
                        alt="Prosperus Logo"
                        className="h-12 mx-auto mb-6"
                    />
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6">
                        <p className="text-lg text-red-400 font-semibold mb-2">
                            🚫 E-mail bloqueado na plataforma
                        </p>
                        {blockedEmail && (
                            <p className="text-sm text-slate-500 mb-3 font-mono">{blockedEmail}</p>
                        )}
                        <p className="text-sm text-slate-400">
                            Favor entrar em contato com o suporte:
                        </p>
                    </div>
                    <a
                        href="https://wa.me/5511918236211"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 mb-4 w-full justify-center"
                    >
                        💬 Falar com o Suporte
                    </a>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Sair da conta
                    </button>
                </div>
            </div>
        );
    }

    // ─── Guard 1: Auth Loading ───────────────────────
    if (authContextLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
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
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
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
            <UnreadCountProvider userId={currentUser.id}>
                <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><AppSkeleton /></div>}>
                    <AdminApp
                        currentUser={currentUser}
                        onLogout={() => { setIsAdmin(false); setSession(null); }}
                    />
                    {/* Admins also need to auto-subscribe and sync their push token */}
                    <PushAutoSubscriber userId={currentUser.id} />
                    {showPushPrompt && (
                        <PushPermissionPrompt
                            userId={currentUser.id}
                            onDismiss={() => setShowPushPrompt(false)}
                        />
                    )}
                </Suspense>
            </UnreadCountProvider>
        );
    }

    // ─── Guard 8: Onboarding Wizard (MEMBER only) ────
    if (showOnboarding && userProfile && !userProfile.has_completed_onboarding) {
        return (
            <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><AppSkeleton /></div>}>
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
        <UnreadCountProvider userId={session?.user?.id}>
            {activeBanner && (
              <NotificationBannerInterstitial
                banner={activeBanner}
                onSkip={(deepLink) => {
                  dismissBanner(deepLink, false); // false = clicou CTA = Exclusão Permanente
                  if (deepLink) resolveDeepLink(deepLink);
                }}
                onDismiss={() => dismissBanner(undefined, true)} // true = pulou = Cache de 24h
              />
            )}
            <AppLayout>
                <Suspense fallback={<AppSkeleton />}>
                    <ViewSwitcher />
                </Suspense>
                {/* Always mounted — silently saves push subscription */}
                {currentUser && <PushAutoSubscriber userId={currentUser.id} />}
                {/* Permission prompt — only when permission is 'default' */}
                {showPushPrompt && currentUser && (
                    <PushPermissionPrompt
                        userId={currentUser.id}
                        onDismiss={() => setShowPushPrompt(false)}
                    />
                )}
            </AppLayout>
        </UnreadCountProvider>
    );
};

// ─── Root Component ──────────────────────────────────
const App = () => (
    <SupportDocsProvider>
        <AppProvider>
            <AppShell />
            <ProspToaster />
        </AppProvider>
    </SupportDocsProvider>
);

export default App;