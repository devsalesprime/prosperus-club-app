import React, { useRef, useState, useEffect } from 'react';
import { Video } from '../types';
import { VideoProgressTracker } from '../utils/videoProgress';
import { videoService } from '../services/videoService';
import { X } from 'lucide-react';

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
            await videoService.updateProgress(userId, video.id, roundedProgress);
            tracker.current.updateLastSaved(progress);
            console.log(`Progress saved: ${roundedProgress}%`);
        }
    };

    const handleVideoEnd = async () => {
        // Mark as 100% complete
        await videoService.updateProgress(userId, video.id, 100);
        tracker.current.updateLastSaved(100);
        setDisplayProgress(100);

        if (onVideoEnd) {
            onVideoEnd();
        }
    };

    if (!videoId) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
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
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
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

            {/* Vimeo Player */}
            <div className="flex-1 flex items-center justify-center bg-black p-4">
                <iframe
                    ref={iframeRef}
                    src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
                    className="w-full max-w-7xl aspect-video"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
};
