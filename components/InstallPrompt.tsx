// InstallPrompt.tsx
// Smart PWA install prompt that works on Android (native prompt) and iOS (guided instructions)
// Shows a banner at the bottom of the screen encouraging users to install the app

import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;

        if (isStandalone) return; // Already installed, don't show

        // Check if user dismissed before (respect for 7 days)
        const dismissedAt = localStorage.getItem('pwa-install-dismissed');
        if (dismissedAt) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return;
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // iOS: Show custom guide after 3 seconds
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        // Android/Desktop: Listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('📱 PWA Install:', outcome);

            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
        } catch (error) {
            console.error('❌ PWA Install error:', error);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSGuide(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    const slideUpStyle = `
        @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;

    // iOS Guide Modal
    if (isIOS && showIOSGuide) {
        return (
            <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end justify-center p-4"
                onClick={handleDismiss}>
                <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl mb-4"
                    onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Instalar Prosperus Club</h3>
                        <button onClick={handleDismiss}
                            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                            <div>
                                <p className="text-white font-medium">Toque em Compartilhar</p>
                                <p className="text-slate-400 text-sm flex items-center gap-1">
                                    Toque no ícone <Share size={14} className="inline text-blue-400" /> na barra do Safari
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                            <div>
                                <p className="text-white font-medium">Adicionar à Tela de Início</p>
                                <p className="text-slate-400 text-sm flex items-center gap-1">
                                    Role e toque em <Plus size={14} className="inline text-white bg-slate-600 rounded" /> "Tela de Início"
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm">3</div>
                            <div>
                                <p className="text-white font-medium">Confirme Adicionar</p>
                                <p className="text-slate-400 text-sm">Toque em "Adicionar" no canto superior direito</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleDismiss}
                        className="w-full mt-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
                        Entendi
                    </button>
                </div>
            </div>
        );
    }

    // Install Banner (Android + iOS)
    return (
        <>
            <style>{slideUpStyle}</style>
            <div className="fixed bottom-20 left-4 right-4 z-[9998]"
                style={{ animation: 'slideUp 0.4s ease-out forwards' }}>
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 border border-yellow-600/30 shadow-2xl shadow-yellow-900/20">
                    <div className="flex items-center gap-3">
                        <img
                            src="/app/icons/icon-192x192.png"
                            alt="Prosperus Club"
                            className="w-12 h-12 rounded-xl shadow-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm">Instalar Prosperus Club</p>
                            <p className="text-slate-400 text-xs">Acesse direto da sua tela inicial</p>
                        </div>

                        {isIOS ? (
                            <button
                                onClick={() => setShowIOSGuide(true)}
                                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 rounded-xl font-bold text-sm hover:from-yellow-500 hover:to-yellow-400 transition-all"
                            >
                                Como instalar
                            </button>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 rounded-xl font-bold text-sm hover:from-yellow-500 hover:to-yellow-400 transition-all flex items-center gap-1.5"
                            >
                                <Download size={16} />
                                Instalar
                            </button>
                        )}

                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
