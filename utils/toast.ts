// ============================================
// TOAST UTILITY — Padronizado Prosperus Club
// ============================================
// Wrapper sobre react-hot-toast com design system
// Cores: navy #031A2B · gold #FFDA71 · cream #FCF7F0

import toast, { Toaster as HotToaster } from 'react-hot-toast';

const base = {
    background: '#0D2E44',
    color: '#FCF7F0',
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
            duration: 4000,
        }),

    info: (msg: string) =>
        toast(msg, {
            style: { ...base, border: '1px solid #123F5B' },
            duration: 2500,
            icon: 'ℹ️',
        }),

    loading: (msg: string) =>
        toast.loading(msg, {
            style: { ...base, border: '1px solid #123F5B' },
        }),
};

// Re-export toast.dismiss for loading -> success/error transitions
export const dismissToast = toast.dismiss;

// Re-export Toaster with Prosperus defaults
export { HotToaster };
