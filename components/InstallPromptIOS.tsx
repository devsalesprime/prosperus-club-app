// ============================================
// iOS Install Prompt — PWA Banner
// ============================================
// Shows a banner prompting iOS Safari users to install the app
// via "Add to Home Screen". Only displays if:
//   1. User is on iOS Safari (not Chrome/Firefox)
//   2. App is NOT already in standalone mode
//   3. User hasn't dismissed the banner before

import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

const IOS_PROMPT_KEY = 'prosperus_ios_prompt_dismissed';

export const InstallPromptIOS: React.FC = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        if (localStorage.getItem(IOS_PROMPT_KEY)) return;

        // Detect iOS Safari (not in standalone)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
        const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && isSafari && !isStandalone) {
            // Delay showing to not interrupt initial load
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setShow(false);
        localStorage.setItem(IOS_PROMPT_KEY, Date.now().toString());
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom duration-500">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl shadow-black/50 backdrop-blur-sm">
                {/* Close */}
                <button
                    onClick={dismiss}
                    className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="flex items-start gap-3 pr-6">
                    {/* App Icon */}
                    <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-[#FFDA71] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-xl font-black text-slate-900">P</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white mb-1">
                            Instale o Prosperus Club
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Toque em{' '}
                            <Share size={14} className="inline text-blue-400 -mt-0.5" />{' '}
                            <span className="text-slate-300 font-medium">Compartilhar</span> e depois em{' '}
                            <PlusSquare size={14} className="inline text-slate-300 -mt-0.5" />{' '}
                            <span className="text-slate-300 font-medium">Adicionar à Tela de Início</span>{' '}
                            para tela cheia.
                        </p>
                    </div>
                </div>

                {/* Arrow pointer toward Safari share button */}
                <div className="flex justify-center mt-3">
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-700"></div>
                </div>
            </div>
        </div>
    );
};

export default InstallPromptIOS;
