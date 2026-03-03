// ============================================
// USE LONG PRESS — Hook para gestos de pressão longa
// ============================================
// Retorna handlers para touchStart, touchEnd, touchMove
// Cancela automaticamente se o dedo se mover (evita conflito com swipe)

import { useRef, useCallback } from 'react';

export function useLongPress(callback: () => void, ms = 500) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const preventRef = useRef(false);

    const start = useCallback(() => {
        preventRef.current = false;
        timerRef.current = setTimeout(() => {
            if (!preventRef.current) {
                callback();
            }
        }, ms);
    }, [callback, ms]);

    const clear = useCallback(() => {
        preventRef.current = true;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return {
        onTouchStart: start,
        onTouchEnd: clear,
        onTouchMove: clear,
    };
}

export default useLongPress;
