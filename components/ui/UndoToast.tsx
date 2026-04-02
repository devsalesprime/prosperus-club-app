// ============================================
// UNDO TOAST — Toast com desfazer (3s timeout)
// ============================================
// Para ações reversíveis: dispensar notificação, arquivar conversa

import React, { useState, useEffect } from 'react';

interface UndoToastProps {
    message: string;
    onUndo: () => void;
    onExpire?: () => void;
    duration?: number; // ms (default 3000)
}

export const UndoToast: React.FC<UndoToastProps> = ({
    message,
    onUndo,
    onExpire,
    duration = 3000,
}) => {
    const [visible, setVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const step = 100 / (duration / 50);
        const interval = setInterval(() => {
            setProgress(p => {
                const next = p - step;
                if (next <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return next;
            });
        }, 50);

        const timeout = setTimeout(() => {
            setVisible(false);
            onExpire?.();
        }, duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [duration, onExpire]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50
            bg-slate-800 border border-slate-700 rounded-2xl
            overflow-hidden shadow-2xl
            animate-in slide-in-from-bottom-4 duration-200"
        >
            {/* Progress bar */}
            <div
                className="h-0.5 bg-yellow-500"
                style={{
                    width: `${progress}%`,
                    transition: 'width 50ms linear',
                }}
            />

            <div className="flex items-center justify-between p-4">
                <span className="text-sm text-slate-300">{message}</span>
                <button
                    onClick={() => {
                        onUndo();
                        setVisible(false);
                    }}
                    className="text-sm font-semibold text-yellow-500 ml-4
                        hover:text-yellow-400 transition-colors whitespace-nowrap"
                >
                    Desfazer
                </button>
            </div>
        </div>
    );
};

export default UndoToast;
