/**
 * Platform & browser detection for PWA install prompt
 * Correctly identifies iOS browsers (CriOS, FxiOS) vs Safari
 */

export type Platform =
    | 'android'
    | 'ios_safari'
    | 'ios_chrome'
    | 'ios_firefox'
    | 'ios_other'
    | 'desktop_chrome'
    | 'desktop_edge'
    | 'desktop_safari'
    | 'desktop_firefox'
    | 'desktop_other';

export function detectPlatform(): Platform {
    const ua = navigator.userAgent;

    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
        // On iOS all browsers use WebKit — differentiate by UA tokens
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
        const isChrome = /CriOS/.test(ua);
        const isFirefox = /FxiOS/.test(ua);

        if (isSafari) return 'ios_safari';
        if (isChrome) return 'ios_chrome';
        if (isFirefox) return 'ios_firefox';
        return 'ios_other';
    }

    if (isAndroid) return 'android';

    // Desktop
    const isEdge = /Edg\//.test(ua);
    const isChrome = /Chrome/.test(ua) && !isEdge;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);

    if (isEdge) return 'desktop_edge';
    if (isChrome) return 'desktop_chrome';
    if (isSafari) return 'desktop_safari';
    if (isFirefox) return 'desktop_firefox';
    return 'desktop_other';
}

export function isStandaloneMode(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );
}
