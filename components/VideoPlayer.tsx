// ============================================
// UNIVERSAL VIDEO PLAYER
// ============================================
// Suporta MP4, YouTube, Vimeo e CursEduca com tracking de progresso

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Video } from '../types';
import { videoService } from '../services/videoService';
import { useCursEducaTracker } from '../hooks/useCursEducaTracker';
import {
    X,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    CheckCircle,
    Circle,
    Loader2
} from 'lucide-react';

interface VideoPlayerProps {
    video: Video;
    userId: string;
    onClose: () => void;
    onVideoEnd?: () => void;
}

// Detect video source type
type VideoSource = 'mp4' | 'youtube' | 'vimeo' | 'curseduca';

const detectVideoSource = (url: string): VideoSource => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('curseduca.com')) return 'curseduca';
    return 'mp4';
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    video,
    userId,
    onClose,
    onVideoEnd
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState(0);

    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Detect source
    const videoSource = video.videoUrl ? detectVideoSource(video.videoUrl) : 'mp4';
    const isCursEduca = videoSource === 'curseduca';
    const isEmbed = videoSource === 'youtube' || videoSource === 'vimeo' || isCursEduca;

    // CursEduca tracker hook (only active for CursEduca videos)
    const cursEducaTracker = useCursEducaTracker({
        videoId: video.id,
        userId,
        initialProgress: displayProgress,
        onComplete: () => {
            setIsCompleted(true);
            setDisplayProgress(100);
            onVideoEnd?.();
        }
    });

    // Load existing progress on mount
    useEffect(() => {
        const loadProgress = async () => {
            const progress = await videoService.getVideoProgress(video.id);
            if (progress) {
                setDisplayProgress(progress.percentage);
                setLastSavedProgress(progress.percentage);
                setIsCompleted(progress.isCompleted);

                // Resume video from last position (MP4 only)
                if (videoRef.current && progress.percentage > 0 && progress.percentage < 100) {
                    videoRef.current.addEventListener('loadedmetadata', () => {
                        if (videoRef.current) {
                            const resumeTime = (progress.percentage / 100) * videoRef.current.duration;
                            videoRef.current.currentTime = resumeTime;
                        }
                    }, { once: true });
                }
            }
        };
        loadProgress();
    }, [video.id]);

    // Update display progress from CursEduca tracker
    useEffect(() => {
        if (isCursEduca && cursEducaTracker.progress > displayProgress) {
            setDisplayProgress(cursEducaTracker.progress);
        }
        if (cursEducaTracker.isCompleted) {
            setIsCompleted(true);
        }
    }, [isCursEduca, cursEducaTracker.progress, cursEducaTracker.isCompleted, displayProgress]);

    // Handle time update for MP4
    const handleTimeUpdate = useCallback(() => {
        if (!videoRef.current) return;

        const current = videoRef.current.currentTime;
        const dur = videoRef.current.duration;

        setCurrentTime(current);
        setDuration(dur);

        const progress = dur > 0 ? (current / dur) * 100 : 0;
        setDisplayProgress(Math.round(progress));

        // Save at 10% increments only
        const roundedProgress = Math.floor(progress / 10) * 10;
        if (roundedProgress > lastSavedProgress) {
            videoService.updateProgress(video.id, roundedProgress);
            setLastSavedProgress(roundedProgress);
        }
    }, [video.id, lastSavedProgress]);

    // Handle video end (MP4 / YouTube / Vimeo)
    const handleVideoEnd = useCallback(() => {
        videoService.updateProgress(video.id, 100);
        setDisplayProgress(100);
        setIsCompleted(true);
        onVideoEnd?.();
    }, [video.id, onVideoEnd]);

    // Mark as completed manually
    const handleMarkComplete = async () => {
        if (isCompleted || isMarkingComplete) return;

        setIsMarkingComplete(true);

        // Optimistic UI - update immediately
        setIsCompleted(true);
        setDisplayProgress(100);

        try {
            const success = await videoService.markAsCompleted(video.id);
            if (!success) {
                // Rollback on failure
                setIsCompleted(false);
                setDisplayProgress(lastSavedProgress);
            }
        } catch (error) {
            console.error('Failed to mark as complete:', error);
            setIsCompleted(false);
            setDisplayProgress(lastSavedProgress);
        } finally {
            setIsMarkingComplete(false);
        }
    };

    // Play/Pause toggle
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Mute toggle
    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    // Fullscreen toggle
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement && containerRef.current) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else if (document.fullscreenElement) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    // Seek to position
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pos * duration;
    };

    // Auto-hide controls
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get embed URL
    const getEmbedUrl = (url: string): string => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtu.be')
                ? url.split('youtu.be/')[1]?.split('?')[0]
                : url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
        // CursEduca - use the URL as-is (already embed format)
        if (url.includes('curseduca.com')) {
            return url;
        }
        return url;
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onMouseMove={handleMouseMove}
        >
            {/* Header */}
            <div
                className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-bold text-lg truncate pr-4">{video.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition shrink-0"
                    >
                        <X className="text-white" size={24} />
                    </button>
                </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 flex items-center justify-center bg-black p-4">
                {isEmbed ? (
                    <iframe
                        src={getEmbedUrl(video.videoUrl!)}
                        className="w-full max-w-7xl aspect-video rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={video.videoUrl}
                        className="w-full max-w-7xl aspect-video rounded-lg"
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnd}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onClick={togglePlay}
                        controls
                    />
                )}
            </div>

            {/* Progress Bar (Universal - always shown) */}
            <div className={`absolute bottom-20 left-4 right-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-2">
                    <div className="flex items-center gap-3">
                        {/* Progress bar */}
                        <div
                            className="flex-1 h-2 bg-slate-700 rounded-full cursor-pointer hover:h-3 transition-all"
                            onClick={!isEmbed ? handleSeek : undefined}
                        >
                            <div
                                className="h-full bg-yellow-500 rounded-full relative transition-all"
                                style={{ width: `${displayProgress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg" />
                            </div>
                        </div>

                        {/* Progress text */}
                        <span className="text-sm font-bold text-yellow-500 min-w-[4rem] text-right">
                            {Math.round(displayProgress)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls Bottom Bar */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex items-center justify-between text-white max-w-7xl mx-auto">
                    {/* Left: Playback controls (MP4 only) */}
                    <div className="flex items-center gap-4">
                        {!isEmbed && (
                            <>
                                <button onClick={togglePlay} className="hover:text-yellow-500 transition">
                                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                </button>
                                <button onClick={toggleMute} className="hover:text-yellow-500 transition">
                                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                                <span className="text-sm">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </>
                        )}

                        {/* CursEduca debug info */}
                        {isCursEduca && cursEducaTracker.isListening && (
                            <span className="text-xs text-slate-400">
                                🎧 Listening...
                            </span>
                        )}
                    </div>

                    {/* Right: Complete button + Fullscreen */}
                    <div className="flex items-center gap-4">
                        {/* Mark as Complete Button */}
                        <button
                            onClick={handleMarkComplete}
                            disabled={isCompleted || isMarkingComplete}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
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

                        {/* Fullscreen */}
                        <button onClick={toggleFullscreen} className="hover:text-yellow-500 transition">
                            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
