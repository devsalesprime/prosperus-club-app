import React, { useRef, useState, useEffect } from 'react';
import { Video } from '../types';
import { VideoProgressTracker } from '../utils/videoProgress';
import { videoService } from '../services/videoService';
import { analyticsService } from '../services/analyticsService';
import { X, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';
import { VideoMaterialsList } from './VideoMaterialsList';

interface YouTubePlayerProps {
    video: Video;
    userId: string;
    onClose: () => void;
    onVideoEnd?: () => void;
}

// YouTube IFrame API types
interface YTPlayer {
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
}

interface YTPlayerEvent {
    target: YTPlayer;
    data: number;
}

interface YTPlayerConstructor {
    new(elementId: string, options: {
        videoId: string;
        playerVars: Record<string, number>;
        events: {
            onReady: (event: YTPlayerEvent) => void;
            onStateChange: (event: YTPlayerEvent) => void;
        };
    }): YTPlayer;
}

// Declare YouTube IFrame API types
declare global {
    interface Window {
        YT: {
            Player: YTPlayerConstructor;
        };
        onYouTubeIframeAPIReady: () => void;
    }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ video, userId, onClose, onVideoEnd }) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tracker = useRef(new VideoProgressTracker());
    const [displayProgress, setDisplayProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Extract YouTube video ID
    const getYouTubeVideoId = (url: string): string | null => {
        if (url.includes('youtu.be')) {
            return url.split('youtu.be/')[1]?.split('?')[0] || null;
        }
        if (url.includes('youtube.com')) {
            return url.split('v=')[1]?.split('&')[0] || null;
        }
        return null;
    };

    const videoId = getYouTubeVideoId(video.videoUrl || '');

    // Load existing progress
    useEffect(() => {
        const loadProgress = async () => {
            const progress = await videoService.getUserProgress(userId, video.id);
            if (progress) {
                tracker.current.initialize(progress.progress);
                setDisplayProgress(progress.progress);
                setLastSavedProgress(progress.progress);
                setIsCompleted(progress.progress >= 100);
            }
        };
        loadProgress();
    }, [video.id, userId]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!videoId) return;

        // Load YouTube API script if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Initialize player when API is ready
        const initPlayer = () => {
            if (window.YT && window.YT.Player) {
                playerRef.current = new window.YT.Player('youtube-player', {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                    },
                    events: {
                        onReady: onPlayerReady,
                        onStateChange: onPlayerStateChange,
                    },
                });
            }
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [videoId]);

    const onPlayerReady = async (event: YTPlayerEvent) => {
        setIsReady(true);

        // Load and resume from saved progress
        const progress = await videoService.getUserProgress(userId, video.id);
        if (progress && progress.progress > 0 && progress.progress < 100) {
            const duration = event.target.getDuration();
            const resumeTime = (progress.progress / 100) * duration;
            event.target.seekTo(resumeTime, true);
        }

        // Start tracking progress
        startProgressTracking();
    };

    const onPlayerStateChange = (event: YTPlayerEvent) => {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            handleVideoEnd();
        }
    };

    const startProgressTracking = () => {
        // Clear any existing interval
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        // Track progress every second
        progressIntervalRef.current = setInterval(() => {
            if (!playerRef.current || !playerRef.current.getCurrentTime) return;

            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();

            if (!duration || duration === 0) return;

            const progress = tracker.current.calculateProgress(currentTime, duration);
            setDisplayProgress(progress);

            // Save to database only at 10% increments
            if (tracker.current.shouldSaveProgress(progress)) {
                const roundedProgress = tracker.current.roundToThreshold(progress);
                videoService.updateProgress(video.id, roundedProgress);
                tracker.current.updateLastSaved(progress);
                logger.debug(`Progress saved: ${roundedProgress}%`);
            }
        }, 1000);
    };

    const handleVideoEnd = () => {
        // Mark as 100% complete
        videoService.updateProgress(video.id, 100);
        tracker.current.updateLastSaved(100);
        setDisplayProgress(100);

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        if (onVideoEnd) {
            onVideoEnd();
        }
    };

    // Manual completion
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

    if (!videoId) {
        return (
            <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-xl mb-4">URL de vídeo inválida</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

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
                {/* YouTube Player */}
                <div className="w-full max-w-7xl mx-auto px-4 pt-2">
                    <div
                        ref={containerRef}
                        id="youtube-player"
                        className="w-full aspect-video"
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
                    <div className="flex items-center justify-between text-white mb-4">
                        <span className="text-sm text-slate-400">
                            {displayProgress}% concluído
                        </span>
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
