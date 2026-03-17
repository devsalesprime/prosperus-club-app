import React, { useRef, useState, useEffect } from 'react';
import { Video } from '../types';
import { videoService } from '../services/videoService';
import { analyticsService } from '../services/analyticsService';
import { X, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';
import { VideoMaterialsList } from './VideoMaterialsList';

interface CursEducaPlayerProps {
    video: Video;
    userId: string;
    onClose: () => void;
    onVideoEnd?: () => void;
}

// Valid CursEduca origins (production only)
const CURSEDUCA_ORIGINS = [
    'player.curseduca.com',
    'curseduca.com',
    'app.curseduca.com'
];

// Known non-CursEduca message sources to ignore
const IGNORED_SOURCES = [
    'react-devtools-bridge',
    'react-devtools-content-script',
    'react-devtools-backend'
];

export const CursEducaPlayer: React.FC<CursEducaPlayerProps> = ({ video, userId, onClose, onVideoEnd }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [displayProgress, setDisplayProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState(0);

    // Load existing progress
    useEffect(() => {
        const loadProgress = async () => {
            const progress = await videoService.getVideoProgress(video.id);
            if (progress) {
                setDisplayProgress(progress.percentage);
                setLastSavedProgress(progress.percentage);
                setIsCompleted(progress.isCompleted);
            }
        };
        loadProgress();
    }, [video.id]);

    // Handle postMessage events from CursEduca player
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // STRICT origin check - only accept messages from CursEduca domains
            const isFromCursEduca = CURSEDUCA_ORIGINS.some(domain =>
                event.origin.includes(domain)
            );

            if (!isFromCursEduca) {
                // Silently ignore non-CursEduca messages
                return;
            }

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // Ignore DevTools and other internal messages
                if (data.source && IGNORED_SOURCES.includes(data.source)) {
                    return;
                }

                logger.debug('🎬 CursEduca event:', data);

                // Handle various event formats from video players
                if (data.event === 'timeupdate' || data.type === 'timeupdate' || data.action === 'progress') {
                    const currentTime = data.seconds || data.currentTime || data.time || data.position;
                    const duration = data.duration || data.totalTime || data.total;

                    if (currentTime !== undefined && duration && duration > 0) {
                        const progress = Math.round((currentTime / duration) * 100);
                        logger.debug(`⏱️ CursEduca progress: ${progress}%`);
                        updateProgress(progress);
                    }
                } else if (
                    data.event === 'onFinish' ||
                    data.event === 'ended' ||
                    data.event === 'complete' ||
                    data.type === 'ended' ||
                    data.type === 'complete' ||
                    data.action === 'ended'
                ) {
                    logger.debug('🎉 CursEduca video ended');
                    handleVideoEnd();
                } else if (data.event === 'ready' || data.type === 'ready') {
                    logger.debug('✅ CursEduca player ready');
                }
            } catch (e) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [video.id, lastSavedProgress]);

    const updateProgress = (progress: number) => {
        setDisplayProgress(progress);

        // Auto-complete at 90%+
        if (progress >= 90 && !isCompleted) {
            handleVideoEnd();
            return;
        }

        // Save to database only at 10% increments
        const roundedProgress = Math.floor(progress / 10) * 10;
        if (roundedProgress > lastSavedProgress) {
            videoService.updateProgress(video.id, roundedProgress);
            setLastSavedProgress(roundedProgress);
            logger.debug(`💾 Progress saved: ${roundedProgress}%`);
        }
    };

    const handleVideoEnd = async () => {
        if (isCompleted) return;

        setDisplayProgress(100);
        setIsCompleted(true);

        await videoService.markAsCompleted(video.id, userId);
        // Analytics: track video completion
        analyticsService.trackVideoComplete(userId, video.id);
        onVideoEnd?.();
    };

    // Manual completion button
    const handleManualComplete = async () => {
        if (isCompleted || isMarkingComplete) return;

        setIsMarkingComplete(true);
        setIsCompleted(true);
        setDisplayProgress(100);

        try {
            const success = await videoService.markAsCompleted(video.id, userId);
            if (!success) {
                setIsCompleted(false);
                setDisplayProgress(lastSavedProgress);
            } else {
                // Analytics: track manual video completion
                analyticsService.trackVideoComplete(userId, video.id);
            }
        } catch (error) {
            console.error('Failed to mark complete:', error);
            setIsCompleted(false);
            setDisplayProgress(lastSavedProgress);
        } finally {
            setIsMarkingComplete(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[70] flex flex-col">
            {/* Header — normal flow, always visible */}
            <div className="flex-shrink-0 bg-black/90 px-4 py-3 z-10">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                        <h2 className="text-white font-bold text-lg truncate">{video.title}</h2>
                        <p className="text-yellow-500 text-sm font-bold mt-0.5">
                            {displayProgress}% concluído
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition flex-shrink-0"
                    >
                        <X className="text-white" size={24} />
                    </button>
                </div>
            </div>

            {/* Scrollable content — video + controls + materials */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {/* CursEduca Player */}
                <div className="w-full max-w-7xl mx-auto px-4 pt-2">
                    <iframe
                        ref={iframeRef}
                        src={video.videoUrl}
                        className="w-full aspect-video rounded-lg"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={video.title}
                    />
                </div>

                {/* Controls section */}
                <div className="w-full max-w-7xl mx-auto px-4 py-4">
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-700 rounded-full mb-4">
                        <div
                            className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                            style={{ width: `${displayProgress}%` }}
                        />
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between text-white gap-3 flex-wrap">
                        <span className="text-xs text-slate-400">
                            ⚠️ Se o progresso não atualizar automaticamente, use o botão
                        </span>

                        {/* Mark as Complete Button */}
                        <button
                            onClick={handleManualComplete}
                            disabled={isCompleted || isMarkingComplete}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex-shrink-0
                                ${isCompleted
                                    ? 'bg-green-600 text-white cursor-default'
                                    : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-yellow-500'
                                }
                                ${isMarkingComplete ? 'opacity-70' : ''}
                            `}
                        >
                            {isMarkingComplete ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isCompleted ? (
                                <CheckCircle size={18} />
                            ) : (
                                <Circle size={18} />
                            )}
                            {isCompleted ? 'Concluído' : 'Marcar como visto'}
                        </button>
                    </div>

                    {/* Materials */}
                    <VideoMaterialsList videoId={video.id} />
                </div>
            </div>
        </div>
    );
};
