// ============================================
// TOAST UTILITY — Padronizado Prosperus Club
// ============================================
// Design system: navy #031A2B · gold #FFDA71 · cream #FCF7F0
// Posição: top-center com safe-area iOS

import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

const base: React.CSSProperties = {
    background: '#031726',
    color: '#FCF7F0',
    fontFamily: 'inherit',
    fontSize: '14px',
    borderRadius: '12px',
    padding: '12px 16px',
};

export const notify = {
    success: (msg: string) =>
        toast.success(msg, {
            style: { ...base, border: '1px solid #FFDA71' },
            iconTheme: { primary: '#FFDA71', secondary: '#031A2B' },
            duration: 3000,
        }),

    error: (msg: string) =>
        toast.error(msg, {
            style: { ...base, border: '1px solid #EF4444' },
            duration: 4500,
        }),

    info: (msg: string) =>
        toast(msg, {
            style: { ...base, border: '1px solid #052B48' },
            duration: 2500,
            icon: 'ℹ️',
        }),

    loading: (msg: string) =>
        toast.loading(msg, {
            style: { ...base, border: '1px solid #052B48' },
        }),

    dismiss: (id?: string) => toast.dismiss(id),
};

// Componente para montar uma vez no App.tsx
export function ProspToaster() {
    return React.createElement(Toaster, {
        position: 'top-center',
        toastOptions: { style: base },
        containerStyle: { top: 'calc(env(safe-area-inset-top, 0px) + 16px)' },
    });
}
