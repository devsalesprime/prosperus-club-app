import React, { useRef, useState, useEffect } from 'react';
import { Video } from '../types';
import { VideoProgressTracker } from '../utils/videoProgress';
import { videoService } from '../services/videoService';
import { X } from 'lucide-react';
import { logger } from '../utils/logger';

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
                videoService.updateProgress(userId, video.id, roundedProgress);
                tracker.current.updateLastSaved(progress);
                logger.debug(`Progress saved: ${roundedProgress}%`);
            }
        }, 1000);
    };

    const handleVideoEnd = () => {
        // Mark as 100% complete
        videoService.updateProgress(userId, video.id, 100);
        tracker.current.updateLastSaved(100);
        setDisplayProgress(100);

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

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
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">{video.title}</h2>
                        <p className="text-yellow-500 text-sm font-bold mt-1">
                            {displayProgress}% concluído
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <X className="text-white" size={24} />
                    </button>
                </div>
            </div>

            {/* YouTube Player */}
            <div className="flex-1 flex items-center justify-center bg-black p-4">
                <div
                    ref={containerRef}
                    id="youtube-player"
                    className="w-full max-w-7xl aspect-video"
                />
            </div>
        </div>
    );
};
