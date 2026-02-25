// InstallPrompt.tsx
// Unified PWA install prompt — context-aware by platform and browser
// Replaces both InstallPrompt.tsx and InstallPromptIOS.tsx

import { useState, useEffect, useCallback } from 'react';
import { Download, X, ChevronRight } from 'lucide-react';
import { detectPlatform, isStandaloneMode } from '../utils/platformDetect';
import { INSTALL_INSTRUCTIONS } from '../utils/installInstructions';

// Single dismiss key — replaces 'pwa-install-dismissed' + 'prosperus_ios_prompt_dismissed'
const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_COOLDOWN;
}

function saveDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    // Clean up old iOS-specific key if it exists
    localStorage.removeItem('prosperus_ios_prompt_dismissed');
}

export const InstallPrompt: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    const platform = detectPlatform();
    const instructions = INSTALL_INSTRUCTIONS[platform];

    useEffect(() => {
        // Don't show if already installed as PWA
        if (isStandaloneMode()) return;
        // Don't show if no instructions for this platform
        if (instructions.type === 'none') return;
        // Don't show if dismissed recently
        if (isDismissed()) return;

        // Capture native install event (Android/Desktop Chrome/Edge)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // UX delay before showing banner
        const delay = platform.startsWith('ios') ? 3000 : 2000;
        const timer = setTimeout(() => setVisible(true), delay);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            clearTimeout(timer);
        };
    }, []);

    const handleDismiss = useCallback(() => {
        setVisible(false);
        setGuideOpen(false);
        saveDismiss();
    }, []);

    const handleCTA = useCallback(async () => {
        if (instructions.type === 'native' && deferredPrompt) {
            // Android / Desktop Chrome — native dialog
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setVisible(false);
            else handleDismiss();
            setDeferredPrompt(null);
        } else if (instructions.type === 'guide') {
            // iOS — open step-by-step modal
            setGuideOpen(true);
        } else if (instructions.type === 'info') {
            // Desktop Safari — just close
            handleDismiss();
        }
    }, [instructions, deferredPrompt, handleDismiss]);

    if (!visible) return null;

    return (
        <>
            {/* ── BANNER ── */}
            <div
                className="
                    fixed bottom-[calc(var(--nav-h,64px)+12px)] left-4 right-4 z-50
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
                        src="/icons/icon-72x72.png"
                        alt="Prosperus Club"
                        className="w-7 h-7 object-contain"
                        onError={e => {
                            // Fallback to text if icon not found
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            el.parentElement!.innerHTML = '<span class="text-lg font-black text-yellow-500">P</span>';
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
                    className="fixed inset-0 z-[60] flex items-end justify-center
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
