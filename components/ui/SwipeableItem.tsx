// ============================================
// SWIPEABLE ITEM — Componente base de gestos
// ============================================
// Touch API nativa. Sem dependências externas.
// Suporta ações esquerda + direita, rubber band,
// scroll detection, auto-trigger destrutivo.

import React, {
    useRef, useState, useCallback, type ReactNode
} from 'react';

export interface SwipeAction {
    label: string;
    icon: ReactNode;
    color: string;       // Tailwind class: 'bg-red-500'
    textColor?: string;  // Tailwind class: 'text-white'
    onTrigger: () => void;
    width?: number;      // px (default 80)
    destructive?: boolean; // auto-executa ao ultrapassar threshold
}

interface SwipeableItemProps {
    children: ReactNode;
    leftActions?: SwipeAction[];   // reveladas ao swipe direita →
    rightActions?: SwipeAction[];  // reveladas ao swipe esquerda ←
    threshold?: number;            // px mínimos (default 10)
    autoTriggerAt?: number;        // % da largura (default 0.5)
    disabled?: boolean;
    className?: string;
    /** ID for managing open state externally */
    itemId?: string;
    /** Currently open item ID — close this if different */
    openItemId?: string | null;
    /** Callback when this item opens */
    onOpen?: (id: string) => void;
}

export function SwipeableItem({
    children,
    leftActions = [],
    rightActions = [],
    threshold = 10,
    autoTriggerAt = 0.5,
    disabled = false,
    className = '',
    itemId,
    openItemId,
    onOpen,
}: SwipeableItemProps) {
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const isDraggingRef = useRef(false);
    const directionRef = useRef<'left' | 'right' | null>(null);
    const isScrollRef = useRef(false);

    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapping, setIsSnapping] = useState(false);
    const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);

    const rightTotalWidth = rightActions.reduce((a, b) => a + (b.width ?? 80), 0);
    const leftTotalWidth = leftActions.reduce((a, b) => a + (b.width ?? 80), 0);

    // Close if another item opens
    const isOpen = translateX !== 0;
    const shouldClose = itemId && openItemId && openItemId !== itemId && isOpen;

    React.useEffect(() => {
        if (shouldClose) {
            snapTo(0);
        }
    }, [shouldClose]); // eslint-disable-line react-hooks/exhaustive-deps

    const snapTo = useCallback((x: number) => {
        setIsSnapping(true);
        setTranslateX(x);
        setTimeout(() => setIsSnapping(false), 300);
    }, []);

    const reset = useCallback(() => {
        snapTo(0);
        setActiveAction(null);
        directionRef.current = null;
    }, [snapTo]);

    // ─── Touch handlers ───────────────────────────────────────────

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled) return;
        const touch = e.touches[0];
        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        isDraggingRef.current = false;
        isScrollRef.current = false;
        directionRef.current = null;
    }, [disabled]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (disabled || isScrollRef.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startXRef.current;
        const dy = touch.clientY - startYRef.current;

        // Vertical scroll detection — abort if moving down/up more
        if (!isDraggingRef.current && Math.abs(dy) > Math.abs(dx) + 5) {
            isScrollRef.current = true;
            return;
        }

        if (Math.abs(dx) < threshold) return;

        isDraggingRef.current = true;
        setIsDragging(true);

        // Determine direction on first move
        if (!directionRef.current) {
            if (dx < 0 && rightActions.length > 0) directionRef.current = 'left';
            else if (dx > 0 && leftActions.length > 0) directionRef.current = 'right';
            else return;
        }

        // Rubber band limits
        const maxLeft = rightTotalWidth + 20;
        const maxRight = leftTotalWidth + 20;

        let newX = dx;
        if (directionRef.current === 'left') {
            newX = Math.max(-maxLeft, Math.min(0, dx));
        } else {
            newX = Math.min(maxRight, Math.max(0, dx));
        }

        setTranslateX(newX);

        // Highlight action that will auto-trigger
        if (directionRef.current === 'left' && rightActions.length > 0) {
            const willTrigger = Math.abs(newX) >= rightTotalWidth * autoTriggerAt;
            setActiveAction(willTrigger ? rightActions[rightActions.length - 1] : null);
        } else if (directionRef.current === 'right' && leftActions.length > 0) {
            const willTrigger = newX >= leftTotalWidth * autoTriggerAt;
            setActiveAction(willTrigger ? leftActions[0] : null);
        }
    }, [disabled, threshold, rightActions, leftActions, rightTotalWidth, leftTotalWidth, autoTriggerAt]);

    const onTouchEnd = useCallback(() => {
        if (disabled || !isDraggingRef.current) return;

        setIsDragging(false);
        const x = translateX;

        if (directionRef.current === 'left') {
            const triggerThreshold = rightTotalWidth * autoTriggerAt;

            // Auto-trigger destructive action on full swipe
            if (Math.abs(x) >= rightTotalWidth && rightActions[rightActions.length - 1]?.destructive) {
                setIsSnapping(true);
                setTranslateX(-window.innerWidth);
                setTimeout(() => {
                    rightActions[rightActions.length - 1].onTrigger();
                    reset();
                }, 250);
                return;
            }

            // Reveal actions if past threshold
            if (Math.abs(x) >= triggerThreshold) {
                snapTo(-rightTotalWidth);
                if (itemId && onOpen) onOpen(itemId);
            } else {
                reset();
            }

        } else if (directionRef.current === 'right') {
            const triggerThreshold = leftTotalWidth * autoTriggerAt;

            // Auto-trigger destructive left action
            if (x >= leftTotalWidth && leftActions[0]?.destructive) {
                setIsSnapping(true);
                setTranslateX(window.innerWidth);
                setTimeout(() => {
                    leftActions[0].onTrigger();
                    reset();
                }, 250);
                return;
            }

            if (x >= triggerThreshold) {
                snapTo(leftTotalWidth);
                if (itemId && onOpen) onOpen(itemId);
            } else {
                reset();
            }
        }
    }, [disabled, translateX, rightActions, leftActions, rightTotalWidth,
        leftTotalWidth, autoTriggerAt, snapTo, reset, itemId, onOpen]);

    const transitionStyle = (isDragging && !isSnapping)
        ? 'none'
        : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* ── Left actions (swipe right to reveal) ── */}
            {leftActions.length > 0 && (
                <div
                    className="absolute inset-y-0 left-0 flex"
                    style={{ width: leftTotalWidth }}
                >
                    {leftActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => { action.onTrigger(); reset(); }}
                            className={`flex flex-col items-center justify-center gap-1
                h-full font-medium text-xs
                ${action.color}
                ${action.textColor ?? 'text-white'}
                ${activeAction === action ? 'scale-105' : ''}
                transition-transform duration-150`}
                            style={{ width: action.width ?? 80 }}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Right actions (swipe left to reveal) ── */}
            {rightActions.length > 0 && (
                <div
                    className="absolute inset-y-0 right-0 flex"
                    style={{ width: rightTotalWidth }}
                >
                    {rightActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => { action.onTrigger(); reset(); }}
                            className={`flex flex-col items-center justify-center gap-1
                h-full font-medium text-xs
                ${action.color}
                ${action.textColor ?? 'text-white'}
                ${activeAction === action ? 'scale-105' : ''}
                transition-transform duration-150`}
                            style={{ width: action.width ?? 80 }}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Main content ── */}
            <div
                className="relative z-10 bg-inherit"
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: transitionStyle,
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => { if (Math.abs(translateX) > 5) reset(); }}
            >
                {children}
            </div>
        </div>
    );
}

export default SwipeableItem;
