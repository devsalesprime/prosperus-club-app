// hooks/useAppTour.ts
// State management for the App Tour — tracks progress, completion, and persistence

import { useState, useCallback } from 'react';

export interface TourStep {
    id: string;
    targetSelector?: string;        // CSS selector for the target element (alternative to ref)
    targetRef?: React.RefObject<Element>; // Direct ref (preferred when available)
    title: string;
    description: string;
    icon: string;                    // emoji
    tooltipPosition: 'top' | 'bottom' | 'center';
    highlightPadding?: number;       // padding around spotlight
    onEnter?: () => void;            // callback when entering this step (e.g., navigate to view)
}

const TOUR_STORAGE_KEY = 'app-tour-completed';

export function useAppTour() {
    const [isActive, setIsActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const hasCompleted = useCallback(
        () => localStorage.getItem(TOUR_STORAGE_KEY) === 'true',
        []
    );

    const startTour = useCallback(() => {
        if (localStorage.getItem(TOUR_STORAGE_KEY) === 'true') return;
        setStepIndex(0);
        setIsActive(true);
    }, []);

    const nextStep = useCallback((totalSteps: number) => {
        if (stepIndex < totalSteps - 1) {
            setStepIndex(i => i + 1);
        } else {
            // Last step → complete
            setIsActive(false);
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        }
    }, [stepIndex]);

    const prevStep = useCallback(() => {
        setStepIndex(i => Math.max(0, i - 1));
    }, []);

    const skipTour = useCallback(() => {
        setIsActive(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }, []);

    const resetTour = useCallback(() => {
        localStorage.removeItem(TOUR_STORAGE_KEY);
    }, []);

    return {
        isActive,
        stepIndex,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        resetTour,
        hasCompleted,
    };
}
