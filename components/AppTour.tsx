// components/AppTour.tsx
// Spotlight + Tooltip overlay for guided app tour
// Uses SVG mask for the spotlight hole with golden border

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import type { TourStep } from '../hooks/useAppTour';

interface AppTourProps {
    steps: TourStep[];
    stepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    isActive: boolean;
}

interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function AppTour({
    steps, stepIndex, onNext, onPrev, onSkip, isActive
}: AppTourProps) {
    const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = steps[stepIndex];

    // Calculate spotlight position when step changes
    useEffect(() => {
        if (!isActive || !step) return;

        // Resolve target element: ref takes priority, then selector
        const getTarget = (): Element | null => {
            if (step.targetRef?.current) return step.targetRef.current;
            if (step.targetSelector) return document.querySelector(step.targetSelector);
            return null;
        };

        const updateSpotlight = () => {
            const el = getTarget();
            if (!el) {
                setSpotlight(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            const pad = step.highlightPadding ?? 8;

            setSpotlight({
                top: rect.top - pad,
                left: rect.left - pad,
                width: rect.width + pad * 2,
                height: rect.height + pad * 2,
            });
        };

        // Execute onEnter callback (e.g., navigate to a view)
        step.onEnter?.();

        // Wait for any navigation/animation to settle, then calculate
        const timer = setTimeout(updateSpotlight, 150);

        // Also recalculate on resize
        window.addEventListener('resize', updateSpotlight);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSpotlight);
        };
    }, [stepIndex, isActive]);

    if (!isActive || !step) return null;

    const isFirst = stepIndex === 0;
    const isLast = stepIndex === steps.length - 1;
    const progress = ((stepIndex + 1) / steps.length) * 100;

    // Determine tooltip position style
    const tooltipPositionClass = (() => {
        if (step.tooltipPosition === 'center' || !spotlight) {
            // Centered — no spotlight or fullscreen step
            return 'top-1/2 -translate-y-1/2';
        }
        if (step.tooltipPosition === 'top') {
            // Above nav — tooltip near the top
            return 'top-[calc(var(--header-h,60px)+20px)]';
        }
        // Bottom — above bottom nav
        return 'bottom-[calc(var(--nav-h,64px)+20px)]';
    })();

    return (
        <div className="fixed inset-0 z-[100]">

            {/* ── OVERLAY with spotlight hole ── */}
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
            >
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {spotlight && (
                            <rect
                                x={spotlight.left}
                                y={spotlight.top}
                                width={spotlight.width}
                                height={spotlight.height}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>

                {/* Dark overlay with the hole */}
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.78)"
                    mask="url(#tour-spotlight-mask)"
                />

                {/* Golden border around spotlight */}
                {spotlight && (
                    <rect
                        x={spotlight.left}
                        y={spotlight.top}
                        width={spotlight.width}
                        height={spotlight.height}
                        rx="12"
                        fill="none"
                        stroke="#ca8a04"
                        strokeWidth="2"
                        opacity="0.85"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.85;0.5;0.85"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </rect>
                )}
            </svg>

            {/* Click on overlay = skip tour */}
            <div className="absolute inset-0" onClick={onSkip} />

            {/* ── TOOLTIP ── */}
            <div
                ref={tooltipRef}
                className={`
                    absolute left-4 right-4 z-10 max-w-md mx-auto
                    bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-2xl p-5
                    shadow-2xl shadow-black/60
                    transition-all duration-300 ease-out
                    ${tooltipPositionClass}
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* Progress bar */}
                <div className="h-0.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
                    <div
                        className="h-full bg-yellow-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Icon + Title + Description */}
                <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{step.icon}</span>
                    <div>
                        <h3 className="text-base font-bold text-white leading-snug">
                            {step.title}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">

                    {/* Skip / Back button */}
                    <button
                        onClick={isFirst ? onSkip : onPrev}
                        className="flex items-center gap-1 text-xs text-slate-500
                            hover:text-slate-300 transition-colors px-2 py-1.5 rounded-lg
                            hover:bg-slate-800 active:scale-95"
                    >
                        {isFirst ? (
                            <>
                                <X size={12} />
                                Pular tour
                            </>
                        ) : (
                            <>
                                <ChevronLeft size={12} />
                                Voltar
                            </>
                        )}
                    </button>

                    {/* Progress dots */}
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-full transition-all duration-300 ${i === stepIndex
                                        ? 'w-4 h-1.5 bg-yellow-500'
                                        : i < stepIndex
                                            ? 'w-1.5 h-1.5 bg-yellow-600/50'
                                            : 'w-1.5 h-1.5 bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Next / Finish button */}
                    <button
                        onClick={onNext}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                            bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold
                            transition-all active:scale-95"
                    >
                        {isLast ? (
                            <>✓ Começar</>
                        ) : (
                            <>
                                Próximo
                                <ChevronRight size={12} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
