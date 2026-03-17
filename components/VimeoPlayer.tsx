import React, { useRef, useState, useEffect } from 'react';
import { Video } from '../types';
import { VideoProgressTracker } from '../utils/videoProgress';
import { videoService } from '../services/videoService';
import { analyticsService } from '../services/analyticsService';
import { X, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';
import { VideoMaterialsList } from './VideoMaterialsList';

interface VimeoPlayerProps {
    video: Video;
    userId: string;
    onClose: () => void;
    onVideoEnd?: () => void;
}

// Vimeo Player API types
interface VimeoPlayer {
    on: (event: string, callback: (data: { seconds: number; duration: number }) => void) => void;
    off: (event: string, callback: (data: { seconds: number; duration: number }) => void) => void;
    getDuration: () => Promise<number>;
    setCurrentTime: (seconds: number) => Promise<number>;
}

interface VimeoPlayerConstructor {
    new(element: HTMLIFrameElement): VimeoPlayer;
}

// Declare Vimeo Player types
declare global {
    interface Window {
        Vimeo: {
            Player: VimeoPlayerConstructor;
        };
    }
}

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({ video, userId, onClose, onVideoEnd }) => {
    const playerRef = useRef<VimeoPlayer | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const tracker = useRef(new VideoProgressTracker());
    const [displayProgress, setDisplayProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState(0);

    // Extract Vimeo video ID
    const getVimeoVideoId = (url: string): string | null => {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    };

    const videoId = getVimeoVideoId(video.videoUrl || '');

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

    // Load Vimeo Player API and initialize
    useEffect(() => {
        if (!videoId) return;

        // Load Vimeo Player script
        const loadVimeoAPI = () => {
            if (window.Vimeo) {
                initPlayer();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://player.vimeo.com/api/player.js';
            script.onload = initPlayer;
            document.body.appendChild(script);
        };

        const initPlayer = async () => {
            if (!iframeRef.current || !window.Vimeo) return;

            playerRef.current = new window.Vimeo.Player(iframeRef.current);

            // Load and resume from saved progress
            const progress = await videoService.getUserProgress(userId, video.id);
            if (progress && progress.progress > 0 && progress.progress < 100) {
                const duration = await playerRef.current.getDuration();
                const resumeTime = (progress.progress / 100) * duration;
                await playerRef.current.setCurrentTime(resumeTime);
            }

            // Set up event listeners
            playerRef.current.on('timeupdate', handleTimeUpdate);
            playerRef.current.on('ended', handleVideoEnd);

            setIsReady(true);
        };

        loadVimeoAPI();

        return () => {
            if (playerRef.current) {
                playerRef.current.off('timeupdate', handleTimeUpdate);
                playerRef.current.off('ended', handleVideoEnd);
            }
        };
    }, [videoId]);

    const handleTimeUpdate = async (data: { seconds: number; duration: number }) => {
        const progress = tracker.current.calculateProgress(data.seconds, data.duration);
        setDisplayProgress(progress);

        // Save to database only at 10% increments
        if (tracker.current.shouldSaveProgress(progress)) {
            const roundedProgress = tracker.current.roundToThreshold(progress);
            await videoService.updateProgress(video.id, roundedProgress);
            tracker.current.updateLastSaved(progress);
            logger.debug(`Progress saved: ${roundedProgress}%`);
        }
    };

    const handleVideoEnd = async () => {
        // Mark as 100% complete
        await videoService.updateProgress(video.id, 100);
        tracker.current.updateLastSaved(100);
        setDisplayProgress(100);
        setIsCompleted(true);
        analyticsService.trackVideoComplete(userId, video.id);

        if (onVideoEnd) {
            onVideoEnd();
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
                {/* Vimeo Player */}
                <div className="w-full max-w-7xl mx-auto px-4 pt-2">
                    <iframe
                        ref={iframeRef}
                        src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
                        className="w-full aspect-video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
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
                            onClick={async () => {
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
                                    setIsCompleted(false);
                                    setDisplayProgress(lastSavedProgress);
                                } finally {
                                    setIsMarkingComplete(false);
                                }
                            }}
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
