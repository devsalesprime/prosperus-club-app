// InstallPrompt.tsx v2.1
// Unified PWA install prompt — context-aware by platform and browser
// Replaces both InstallPrompt.tsx and InstallPromptIOS.tsx
//
// FIXES APPLIED:
// A — Legacy localStorage key cleanup in isDismissed()
// B — JS-based banner positioning (no dependency on --nav-h CSS variable)
// C — z-index 60 (above header/nav z-50, below modals z-100)
// D — Reads global window.__pwaInstallPrompt (captured before React mounts)
// E — setVisible independent of deferredPrompt for iOS

import { useState, useEffect, useCallback } from 'react';
import { Download, X, ChevronRight } from 'lucide-react';
import { detectPlatform, isStandaloneMode } from '../utils/platformDetect';
import { INSTALL_INSTRUCTIONS } from '../utils/installInstructions';

// Single dismiss key
const DISMISS_KEY = 'pwa-install-dismissed';
const OLD_IOS_KEY = 'prosperus_ios_prompt_dismissed';
const DISMISS_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
    // FIX A: Clean up legacy iOS key (migration — don't block, give fresh chance)
    if (localStorage.getItem(OLD_IOS_KEY)) {
        localStorage.removeItem(OLD_IOS_KEY);
    }

    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;

    // Handle old format where value was 'true' instead of timestamp
    const num = Number(ts);
    if (isNaN(num)) {
        localStorage.removeItem(DISMISS_KEY);
        return false;
    }

    return Date.now() - num < DISMISS_COOLDOWN;
}

function saveDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    localStorage.removeItem(OLD_IOS_KEY);
}

// FIX B: Calculate banner bottom position via JS (--nav-h may not exist)
function getBannerBottom(): number {
    // Try to find the bottom nav element
    const navEl = document.querySelector('nav.fixed.bottom-0') ||
        document.querySelector('[class*="fixed"][class*="bottom-0"]nav') ||
        document.querySelector('.safe-area-bottom');
    if (navEl) {
        return navEl.getBoundingClientRect().height + 12;
    }
    // Fallback: 80px (typical mobile nav) + 12px margin
    return 92;
}

export const InstallPrompt: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [bannerBottom, setBannerBottom] = useState(92); // FIX B: default fallback

    const platform = detectPlatform();
    const instructions = INSTALL_INSTRUCTIONS[platform];

    useEffect(() => {
        const standalone = isStandaloneMode();
        const dismissed = isDismissed();

        // Diagnostic logging
        console.log('📱 InstallPrompt init:', {
            platform,
            type: instructions.type,
            standalone,
            dismissed,
            dismissKey: localStorage.getItem(DISMISS_KEY),
            globalPrompt: !!(window as any).__pwaInstallPrompt,
            ua: navigator.userAgent.substring(0, 80)
        });

        if (standalone) {
            console.log('📱 Skipping — standalone mode (PWA installed)');
            return;
        }
        if (instructions.type === 'none') {
            console.log('📱 Skipping — no banner for', platform);
            return;
        }
        if (dismissed) {
            console.log('📱 Skipping — dismissed recently');
            return;
        }

        // FIX D: Check if beforeinstallprompt was already captured globally
        if ((window as any).__pwaInstallPrompt) {
            setDeferredPrompt((window as any).__pwaInstallPrompt);
            console.log('📱 Loaded deferredPrompt from global capture');
        }

        // Also listen for future events (component may mount before event)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).__pwaInstallPrompt = e;
            console.log('📱 beforeinstallprompt captured in listener');
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // FIX B: Calculate position after DOM settles
        const posTimer = setTimeout(() => {
            setBannerBottom(getBannerBottom());
        }, 500);

        // FIX E: Show banner after delay — independent of deferredPrompt
        // iOS never fires beforeinstallprompt, so we can't wait for it
        const delay = platform.startsWith('ios') ? 3000 : 2000;
        console.log(`📱 Will show banner in ${delay}ms`);
        const showTimer = setTimeout(() => {
            console.log('📱 setVisible(true)');
            setVisible(true);
        }, delay);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            clearTimeout(posTimer);
            clearTimeout(showTimer);
        };
    }, []);

    const handleDismiss = useCallback(() => {
        setVisible(false);
        setGuideOpen(false);
        saveDismiss();
    }, []);

    const handleCTA = useCallback(async () => {
        if (instructions.type === 'native' && deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setVisible(false);
            else handleDismiss();
            setDeferredPrompt(null);
            (window as any).__pwaInstallPrompt = null;
        } else if (instructions.type === 'guide') {
            setGuideOpen(true);
        } else if (instructions.type === 'info') {
            handleDismiss();
        }
    }, [instructions, deferredPrompt, handleDismiss]);

    if (!visible) return null;

    return (
        <>
            {/* ── BANNER ── */}
            {/* FIX B: inline style for bottom position (CSS var --nav-h doesn't exist) */}
            {/* FIX C: z-[60] above header/nav z-50, below modals z-[100] */}
            <div
                style={{ bottom: `${bannerBottom}px` }}
                className="
                    fixed left-4 right-4 z-[60]
                    bg-slate-900 border border-slate-700/80 rounded-2xl
                    shadow-xl shadow-black/40
                    flex items-center gap-3 px-4 py-3
                    animate-in slide-in-from-bottom-4 duration-300
                "
            >
                {/* App icon */}
                <div className="w-10 h-10 rounded-xl bg-yellow-600/15 border border-yellow-600/25
                    flex items-center justify-center flex-shrink-0">
                    <img
                        src={`${import.meta.env.BASE_URL}icons/icon-72x72.png`}
                        alt="Prosperus Club"
                        className="w-7 h-7 object-contain"
                        onError={e => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            if (el.parentElement) {
                                el.parentElement.innerHTML = '<span class="text-lg font-black text-yellow-500">P</span>';
                            }
                        }}
                    />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight truncate">
                        {instructions.title}
                    </p>
                    {instructions.subtitle && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {instructions.subtitle}
                        </p>
                    )}
                    {instructions.infoText && (
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                            {instructions.infoText}
                        </p>
                    )}
                </div>

                {/* CTA */}
                <button
                    onClick={handleCTA}
                    className="
                        flex-shrink-0 flex items-center gap-1.5
                        px-3 py-2 rounded-xl
                        bg-yellow-600 hover:bg-yellow-500
                        text-white text-xs font-semibold
                        transition-all active:scale-95
                    "
                >
                    {instructions.type === 'native' && <Download size={13} />}
                    {instructions.type === 'guide' && <ChevronRight size={13} />}
                    {instructions.ctaLabel}
                </button>

                {/* Close */}
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center
                        rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800
                        transition-colors"
                    aria-label="Fechar"
                >
                    <X size={14} />
                </button>
            </div>

            {/* ── GUIDE MODAL (iOS) ── */}
            {guideOpen && instructions.steps && (
                <div
                    className="fixed inset-0 z-[70] flex items-end justify-center
                        bg-black/70 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) { setGuideOpen(false); handleDismiss(); } }}
                >
                    <div className="
                        w-full max-w-md
                        bg-slate-900 border border-slate-800 rounded-t-3xl
                        px-5 pt-5 pb-8
                        animate-in slide-in-from-bottom-4 duration-300
                    ">
                        {/* Handle bar */}
                        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-white">
                                Como instalar o app
                            </h3>
                            <button
                                onClick={() => { setGuideOpen(false); handleDismiss(); }}
                                className="w-7 h-7 flex items-center justify-center rounded-full
                                    text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                                aria-label="Fechar"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Steps */}
                        <div className="space-y-4">
                            {instructions.steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="
                                        w-7 h-7 rounded-full flex-shrink-0
                                        bg-yellow-600/15 border border-yellow-600/30
                                        flex items-center justify-center
                                        text-xs font-bold text-yellow-500
                                    ">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed pt-0.5">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Arrow indicator for iOS Safari */}
                        {platform === 'ios_safari' && (
                            <div className="mt-6 flex flex-col items-center gap-1">
                                <p className="text-xs text-slate-600">
                                    O botão está na barra inferior do Safari
                                </p>
                                <div className="text-slate-700 text-lg">↓</div>
                            </div>
                        )}

                        {/* Close button */}
                        <button
                            onClick={() => { setGuideOpen(false); handleDismiss(); }}
                            className="
                                mt-6 w-full py-3 rounded-xl
                                bg-slate-800 border border-slate-700
                                text-sm text-slate-400 hover:text-white
                                transition-colors
                            "
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
