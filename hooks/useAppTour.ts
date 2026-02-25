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
const TOUR_REPLAY_KEY = 'app-tour-replay';

export function useAppTour() {
    const [isActive, setIsActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const hasCompleted = useCallback(
        () => localStorage.getItem(TOUR_STORAGE_KEY) === 'true',
        []
    );

    const startTour = useCallback((force?: boolean) => {
        if (!force && localStorage.getItem(TOUR_STORAGE_KEY) === 'true') return;
        localStorage.removeItem(TOUR_STORAGE_KEY);
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

    // Set a flag so after reload, the tour auto-starts
    const requestReplay = useCallback(() => {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        localStorage.setItem(TOUR_REPLAY_KEY, 'true');
    }, []);

    // Check if a replay was requested (call on mount)
    const checkPendingReplay = useCallback(() => {
        if (localStorage.getItem(TOUR_REPLAY_KEY) === 'true') {
            localStorage.removeItem(TOUR_REPLAY_KEY);
            startTour(true);
            return true;
        }
        return false;
    }, [startTour]);

    return {
        isActive,
        stepIndex,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        resetTour,
        requestReplay,
        checkPendingReplay,
        hasCompleted,
    };
}
