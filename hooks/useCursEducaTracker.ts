// ============================================
// useCursEducaTracker Hook
// ============================================
// Hook para capturar eventos de progresso do player CursEduca via postMessage
// Implementa debounce para evitar chamadas excessivas ao banco de dados

import { useState, useEffect, useCallback, useRef } from 'react';
import { videoService } from '../services/videoService';
import { logger } from '../utils/logger';

// CursEduca event types we might receive
interface CursEducaEvent {
    type: string;
    data?: {
        currentTime?: number;
        duration?: number;
        percentage?: number;
        progress?: number;
        second?: number;
        seconds?: number;
        percent?: number;
    };
    // Some platforms send data directly on the event object
    percentage?: number;
    progress?: number;
    currentTime?: number;
    duration?: number;
}

// Allowed origins for security (add CursEduca domain)
const ALLOWED_ORIGINS = [
    'https://player.curseduca.com',
    'https://curseduca.com',
    'https://embed.curseduca.com'
];

// Hook configuration
const DEBOUNCE_MS = 10000; // 10 seconds debounce before saving
const AUTO_COMPLETE_THRESHOLD = 90; // Mark complete at 90%+

interface UseCursEducaTrackerProps {
    videoId: string;
    userId: string;
    initialProgress?: number;
    onComplete?: () => void;
}

interface UseCursEducaTrackerReturn {
    progress: number;
    isCompleted: boolean;
    isListening: boolean;
    lastEvent: string | null;
}

export function useCursEducaTracker({
    videoId,
    userId,
    initialProgress = 0,
    onComplete
}: UseCursEducaTrackerProps): UseCursEducaTrackerReturn {
    // State
    const [progress, setProgress] = useState(initialProgress);
    const [isCompleted, setIsCompleted] = useState(initialProgress >= 100);
    const [isListening, setIsListening] = useState(false);
    const [lastEvent, setLastEvent] = useState<string | null>(null);

    // Refs for debounce and preventing stale closures
    const lastSavedProgressRef = useRef(initialProgress);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasCalledCompleteRef = useRef(false);

    // Save progress to database (debounced)
    const saveProgress = useCallback(async (newProgress: number) => {
        // Only save if progress has changed significantly (10% increments)
        const roundedProgress = Math.floor(newProgress / 10) * 10;
        const lastRounded = Math.floor(lastSavedProgressRef.current / 10) * 10;

        if (roundedProgress > lastRounded) {
            logger.debug(`📊 CursEduca: Saving progress ${roundedProgress}% for video ${videoId}`);
            try {
                await videoService.updateProgress(videoId, roundedProgress);
                lastSavedProgressRef.current = roundedProgress;
            } catch (error) {
                console.error('❌ CursEduca: Failed to save progress:', error);
            }
        }
    }, [userId, videoId]);

    // Handle complete video
    const handleComplete = useCallback(async () => {
        if (hasCalledCompleteRef.current) return;
        hasCalledCompleteRef.current = true;

        logger.debug(`🎉 CursEduca: Video ${videoId} completed!`);
        setIsCompleted(true);
        setProgress(100);

        try {
            await videoService.updateProgress(videoId, 100);
            lastSavedProgressRef.current = 100;
            onComplete?.();
        } catch (error) {
            console.error('❌ CursEduca: Failed to mark as complete:', error);
        }
    }, [userId, videoId, onComplete]);

    // Extract progress from various event formats
    const extractProgress = useCallback((data: any): number | null => {
        // Try different property names CursEduca might use
        if (typeof data?.percentage === 'number') {
            return data.percentage;
        }
        if (typeof data?.progress === 'number') {
            return data.progress;
        }
        if (typeof data?.percent === 'number') {
            return data.percent;
        }
        // Calculate from currentTime/duration
        if (typeof data?.currentTime === 'number' && typeof data?.duration === 'number' && data.duration > 0) {
            return (data.currentTime / data.duration) * 100;
        }
        if (typeof data?.second === 'number' && typeof data?.duration === 'number' && data.duration > 0) {
            return (data.second / data.duration) * 100;
        }
        if (typeof data?.seconds === 'number' && typeof data?.duration === 'number' && data.duration > 0) {
            return (data.seconds / data.duration) * 100;
        }
        return null;
    }, []);

    // Main message handler
    const handleMessage = useCallback((event: MessageEvent) => {
        // DEBUG: Log all messages to discover CursEduca event format
        logger.debug('📨 CursEduca PostMessage received:', {
            origin: event.origin,
            data: event.data,
            type: typeof event.data
        });

        // Security: Check origin (allow all for debugging first)
        // TODO: Uncomment after discovering correct origin
        // if (!ALLOWED_ORIGINS.some(origin => event.origin.includes(origin))) {
        //     return;
        // }

        // Parse data if it's a string
        let eventData: any = event.data;
        if (typeof event.data === 'string') {
            try {
                eventData = JSON.parse(event.data);
            } catch {
                // Not JSON, might be a simple string event
                logger.debug('📨 CursEduca: Non-JSON message:', event.data);
                return;
            }
        }

        // Update last event for debugging
        setLastEvent(JSON.stringify(eventData).substring(0, 100));

        // Check for video end events
        const eventType = eventData?.type || eventData?.event || eventData?.action;
        if (['ended', 'end', 'complete', 'completed', 'finish', 'finished'].includes(String(eventType).toLowerCase())) {
            handleComplete();
            return;
        }

        // Check for progress/timeupdate events
        if (['timeupdate', 'progress', 'playing', 'time', 'update'].includes(String(eventType).toLowerCase()) || !eventType) {
            const newProgress = extractProgress(eventData) ?? extractProgress(eventData?.data);

            if (newProgress !== null && newProgress >= 0 && newProgress <= 100) {
                logger.debug(`⏱️ CursEduca: Progress ${newProgress.toFixed(1)}%`);
                setProgress(newProgress);

                // Auto-complete at threshold
                if (newProgress >= AUTO_COMPLETE_THRESHOLD && !hasCalledCompleteRef.current) {
                    handleComplete();
                    return;
                }

                // Debounced save
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    saveProgress(newProgress);
                }, DEBOUNCE_MS);
            }
        }
    }, [extractProgress, handleComplete, saveProgress]);

    // Set up message listener
    useEffect(() => {
        if (!videoId || !userId) {
            console.warn('⚠️ CursEduca: Missing videoId or userId');
            return;
        }

        logger.debug(`🎧 CursEduca: Starting listener for video ${videoId}`);
        setIsListening(true);

        window.addEventListener('message', handleMessage);

        // Cleanup
        return () => {
            logger.debug(`🔌 CursEduca: Removing listener for video ${videoId}`);
            setIsListening(false);
            window.removeEventListener('message', handleMessage);

            // Clear debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Save final progress on unmount (if changed)
            const currentProgress = Math.floor(progress / 10) * 10;
            const lastSaved = Math.floor(lastSavedProgressRef.current / 10) * 10;
            if (currentProgress > lastSaved) {
                saveProgress(progress);
            }
        };
    }, [videoId, userId, handleMessage, progress, saveProgress]);

    return {
        progress,
        isCompleted,
        isListening,
        lastEvent
    };
}

export default useCursEducaTracker;
