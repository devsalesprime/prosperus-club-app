// ============================================
// VideoPlayerModal.tsx — Portal-based Video Player Modal
// ============================================
// Uses React Portal to render OUTSIDE AppLayout,
// bypassing the overflow:hidden constraint that
// breaks position:fixed for child components.
//
// Layout: backdrop → centered modal → header + video + actions panel

import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Video } from '../types';
import { videoService } from '../services/videoService';
import { analyticsService } from '../services/analyticsService';
import { X, CheckCircle, Circle, Loader2, Paperclip } from 'lucide-react';
import { VideoMaterialsList } from './VideoMaterialsList';

// ─── Detect video source ──────────────────────────────
function detectSource(url: string): 'youtube' | 'vimeo' | 'curseduca' | 'mp4' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('curseduca.com')) return 'curseduca';
    return 'mp4';
}

function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
}

function getEmbedUrl(url: string, source: string): string {
    if (source === 'youtube') {
        const id = extractYouTubeId(url);
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
    }
    if (source === 'vimeo') {
        const id = extractVimeoId(url);
        return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : url;
    }
    return url; // curseduca or direct URL
}

// ─── Props ─────────────────────────────────────────────
interface VideoPlayerModalProps {
    video: Video;
    userId: string;
    onClose: () => void;
}

// ─── Component ─────────────────────────────────────────
export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, userId, onClose }) => {
    const [displayProgress, setDisplayProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState(0);

    const videoUrl = video.videoUrl || '';
    const source = detectSource(videoUrl);
    const isEmbed = source !== 'mp4';
    const embedUrl = isEmbed ? getEmbedUrl(videoUrl, source) : videoUrl;

    // ─── Load existing progress ──────────────────────
    useEffect(() => {
        videoService.getVideoProgress(video.id).then(progress => {
            if (progress) {
                setDisplayProgress(progress.percentage);
                setLastSavedProgress(progress.percentage);
                setIsCompleted(progress.isCompleted);
            }
        });
    }, [video.id]);

    // ─── CursEduca postMessage listener ──────────────
    useEffect(() => {
        if (source !== 'curseduca') return;

        const CURSEDUCA_ORIGINS = ['player.curseduca.com', 'curseduca.com', 'app.curseduca.com'];

        const handleMessage = (event: MessageEvent) => {
            const isFromCursEduca = CURSEDUCA_ORIGINS.some(d => event.origin.includes(d));
            if (!isFromCursEduca) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                if (data.event === 'timeupdate' || data.type === 'timeupdate' || data.action === 'progress') {
                    const currentTime = data.seconds || data.currentTime || data.time || data.position;
                    const duration = data.duration || data.totalTime || data.total;
                    if (currentTime !== undefined && duration && duration > 0) {
                        const progress = Math.round((currentTime / duration) * 100);
                        handleProgressUpdate(progress);
                    }
                } else if (
                    ['onFinish', 'ended', 'complete'].includes(data.event || '') ||
                    ['ended', 'complete'].includes(data.type || '') ||
                    data.action === 'ended'
                ) {
                    handleManualComplete();
                }
            } catch { /* ignore non-JSON */ }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [video.id, lastSavedProgress, source]);

    // ─── Progress handling ───────────────────────────
    const handleProgressUpdate = useCallback((progress: number) => {
        setDisplayProgress(progress);

        if (progress >= 90 && !isCompleted) {
            handleManualComplete();
            return;
        }

        const rounded = Math.floor(progress / 10) * 10;
        if (rounded > lastSavedProgress) {
            videoService.updateProgress(video.id, rounded);
            setLastSavedProgress(rounded);
        }
    }, [video.id, lastSavedProgress, isCompleted]);

    // ─── Manual completion ───────────────────────────
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
        } catch {
            setIsCompleted(false);
            setDisplayProgress(lastSavedProgress);
        } finally {
            setIsMarkingComplete(false);
        }
    };

    // ─── Close on Escape ─────────────────────────────
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // ─── Lock body scroll ────────────────────────────
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // ─── Render via Portal ───────────────────────────
    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ isolation: 'isolate' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
                style={{
                    maxHeight: '90vh',
                    background: '#0A1828',
                }}
            >
                {/* ── Header ─────────────────────────── */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-[#0A1828]">
                    <div className="min-w-0 flex-1 pr-3">
                        <h2 className="text-white font-bold text-base truncate">{video.title}</h2>
                        <p className="text-yellow-500 text-xs font-semibold mt-0.5">
                            {displayProgress}% concluído
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition flex-shrink-0"
                        aria-label="Fechar"
                    >
                        <X className="text-white" size={20} />
                    </button>
                </div>

                {/* ── Video Player ────────────────────── */}
                <div className="flex-shrink-0 bg-black">
                    {isEmbed ? (
                        <iframe
                            src={embedUrl}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                            title={video.title}
                        />
                    ) : (
                        <video
                            src={videoUrl}
                            className="w-full aspect-video"
                            controls
                            autoPlay
                            title={video.title}
                            onTimeUpdate={(e) => {
                                const v = e.currentTarget;
                                if (v.duration > 0) {
                                    handleProgressUpdate(Math.round((v.currentTime / v.duration) * 100));
                                }
                            }}
                            onEnded={handleManualComplete}
                        />
                    )}
                </div>

                {/* ── Actions Panel (scrollable) ─────── */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    style={{ maxHeight: '35vh' }}
                >
                    <div className="px-4 py-4">
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-slate-700 rounded-full mb-4">
                            <div
                                className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                                style={{ width: `${displayProgress}%` }}
                            />
                        </div>

                        {/* Section label */}
                        <div className="flex items-center gap-2 mb-3">
                            <Paperclip size={12} className="text-yellow-500/70" />
                            <span className="text-[10px] font-bold tracking-widest text-yellow-500/70 uppercase">
                                Materiais e Ações
                            </span>
                        </div>

                        {/* Mark as Complete button — golden CTA */}
                        <button
                            onClick={handleManualComplete}
                            disabled={isCompleted || isMarkingComplete}
                            className={`
                                w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl
                                font-bold text-sm tracking-wide transition-all duration-200 mb-4
                                ${isCompleted
                                    ? 'bg-green-600 text-white cursor-default'
                                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 shadow-lg shadow-yellow-500/20'
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
                            {isCompleted ? 'CONCLUÍDO' : 'MARCAR COMO VISTO'}
                        </button>

                        {/* Materials list */}
                        <VideoMaterialsList videoId={video.id} />
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
