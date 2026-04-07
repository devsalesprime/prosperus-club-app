// ============================================
// VideoPlayerModal.tsx — Cinema Mode Player
// ============================================
// Portal-based fullscreen player com layout 2 colunas:
//   Desktop: vídeo (flex-1) + sidebar playlist (w-[350px])
//   Mobile:  vídeo → título → descrição → playlist accordion
//
// Optimistic UI no "Marcar como Concluída":
//   → atualização visual imediata → requisição em background → rollback em falha

import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Video } from '../../types';
import { videoService } from '../../services/videoService';
import { analyticsService } from '../../services/analyticsService';
import {
    X, CheckCircle2, Circle, Loader2, FileDown,
    ChevronDown, ChevronUp, Play, Clock, ListVideo,
} from 'lucide-react';
import { VideoMaterialsList } from './VideoMaterialsList';

// ─── Video source detection ───────────────────────────
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
    return url;
}

// ─── Props ─────────────────────────────────────────────
interface VideoPlayerModalProps {
    video: Video;
    userId: string;
    onClose: () => void;
    /** Vídeos da mesma categoria para a sidebar de playlist */
    playlist?: Video[];
    /** Callback ao navegar para outro vídeo na playlist */
    onNavigate?: (video: Video) => void;
}

// ─── PlaylistItem ──────────────────────────────────────
const PlaylistItem: React.FC<{
    video: Video;
    isActive: boolean;
    onClick: () => void;
}> = ({ video, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 ${
            isActive
                ? 'bg-prosperus-muted-bg border-l-4 border-prosperus-gold-light'
                : 'border-l-4 border-transparent hover:bg-prosperus-box/80'
        }`}
    >
        {/* Thumbnail mini */}
        <div className="relative flex-shrink-0 w-16 aspect-video rounded-lg overflow-hidden bg-prosperus-muted-bg">
            {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Play size={12} className="text-prosperus-muted-text" />
                </div>
            )}
            {video.progress === 100 && (
                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
            )}
            {video.progress && video.progress > 0 && video.progress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                    <div
                        className="h-full bg-gradient-to-r from-prosperus-gold-dark to-prosperus-gold-light"
                        style={{ width: `${video.progress}%` }}
                    />
                </div>
            )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold line-clamp-2 leading-snug ${
                isActive ? 'text-prosperus-white' : 'text-prosperus-muted-text'
            }`}>
                {video.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
                <Clock size={10} className="text-prosperus-muted-text" strokeWidth={2} />
                <span className="text-[10px] text-prosperus-muted-text">{video.duration}</span>
                {isActive && (
                    <span className="text-[10px] font-bold text-prosperus-gold-light ml-1">● Assistindo</span>
                )}
            </div>
        </div>
    </button>
);

// ─── Component ─────────────────────────────────────────
export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
    video,
    userId,
    onClose,
    playlist = [],
    onNavigate,
}) => {
    const [displayProgress, setDisplayProgress]     = useState(0);
    const [isCompleted, setIsCompleted]             = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState(0);
    const [playlistOpen, setPlaylistOpen]           = useState(false); // mobile accordion

    const videoUrl = video.videoUrl || '';
    const source   = detectSource(videoUrl);
    const isEmbed  = source !== 'mp4';
    const embedUrl = isEmbed ? getEmbedUrl(videoUrl, source) : videoUrl;

    // ─── Load existing progress ──────────────────────
    useEffect(() => {
        setDisplayProgress(0);
        setIsCompleted(false);
        setLastSavedProgress(0);
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
                    const duration    = data.duration || data.totalTime || data.total;
                    if (currentTime !== undefined && duration && duration > 0) {
                        handleProgressUpdate(Math.round((currentTime / duration) * 100));
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

    // ─── Optimistic UI: Marcar como Concluída ────────
    const handleManualComplete = async () => {
        if (isCompleted || isMarkingComplete) return;

        // 🚀 OPTIMISTIC UI — atualização visual imediata
        setIsMarkingComplete(true);
        setIsCompleted(true);
        setDisplayProgress(100);

        try {
            const success = await videoService.markAsCompleted(video.id, userId);
            if (!success) {
                // Rollback em falha
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

    // ─── Keyboard & Body scroll ──────────────────────
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // ─── Playlist (sem o vídeo atual no topo para evitar duplicatas) ──
    const otherVideos = playlist.filter(v => v.id !== video.id);

    // ─── RENDER ──────────────────────────────────────
    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-start justify-center"
            style={{ isolation: 'isolate' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* ══ Modal Cinema Container ═══════════════════════════ */}
            <div
                className="relative w-full h-full lg:h-auto lg:max-h-[92vh] lg:max-w-6xl lg:rounded-2xl lg:m-auto lg:my-4 overflow-hidden shadow-2xl shadow-black/60 bg-prosperus-navy border-0 lg:border lg:border-prosperus-stroke flex flex-col"
                style={{ isolation: 'isolate' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header (sempre visível) ─────────────────────── */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 bg-prosperus-box border-b border-prosperus-stroke">
                    <div className="min-w-0 flex-1 pr-3">
                        <h2 className="text-prosperus-white font-bold text-sm md:text-base truncate">{video.title}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            {/* Progress bar fina no header */}
                            <div className="flex-1 max-w-[120px] h-1.5 bg-prosperus-muted-bg rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isCompleted
                                            ? 'bg-emerald-400'
                                            : 'bg-gradient-to-r from-prosperus-gold-dark to-prosperus-gold-light'
                                    }`}
                                    style={{ width: `${displayProgress}%` }}
                                />
                            </div>
                            <span className={`text-xs font-semibold ${isCompleted ? 'text-emerald-400' : 'text-prosperus-gold-light'}`}>
                                {displayProgress}%
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                        aria-label="Fechar"
                    >
                        <X className="text-prosperus-white" size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* ══ Body: 2 colunas no desktop, stacked no mobile ══ */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

                    {/* ─── COLUNA ESQUERDA / ÁREA PRINCIPAL ─────────── */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-y-auto lg:overflow-hidden">

                        {/* Player de vídeo — rei da tela */}
                        <div className="flex-shrink-0 bg-black w-full">
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
                                    onTimeUpdate={e => {
                                        const v = e.currentTarget;
                                        if (v.duration > 0) {
                                            handleProgressUpdate(Math.round((v.currentTime / v.duration) * 100));
                                        }
                                    }}
                                    onEnded={handleManualComplete}
                                />
                            )}
                        </div>

                        {/* Info da aula + ações */}
                        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                            {/* Título da aula */}
                            <div>
                                <h2 className="text-2xl font-bold text-prosperus-white mt-1 leading-snug">
                                    {video.title}
                                </h2>
                                {video.description && (
                                    <p className="text-sm text-prosperus-muted-text mt-3 leading-relaxed whitespace-pre-wrap">
                                        {video.description}
                                    </p>
                                )}
                            </div>

                            {/* ── Botão Marcar como Concluída (Optimistic UI) ── */}
                            <button
                                onClick={handleManualComplete}
                                disabled={isCompleted || isMarkingComplete}
                                className={`
                                    w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl
                                    font-bold text-sm tracking-wide transition-all duration-200
                                    min-h-[44px] active:scale-95
                                    ${isCompleted
                                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default'
                                        : isMarkingComplete
                                            ? 'bg-prosperus-muted-bg border border-prosperus-stroke text-prosperus-muted-text cursor-wait'
                                            : 'bg-gradient-to-r from-prosperus-gold-dark to-prosperus-gold-light text-prosperus-navy hover:opacity-90 shadow-lg shadow-prosperus-gold-dark/20'
                                    }
                                `}
                            >
                                {isMarkingComplete ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : isCompleted ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <Circle size={18} />
                                )}
                                {isCompleted ? 'Aula Concluída! ✓' : isMarkingComplete ? 'Salvando...' : 'Marcar como Concluída'}
                            </button>

                            {/* Materiais de Apoio */}
                            <VideoMaterialsList videoId={video.id} />

                            {/* ── Playlist Mobile (accordion abaixo do conteúdo) ── */}
                            {otherVideos.length > 0 && (
                                <div className="lg:hidden border border-prosperus-stroke rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setPlaylistOpen(p => !p)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-prosperus-box text-prosperus-white font-semibold text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ListVideo size={16} className="text-prosperus-gold-light" strokeWidth={1.5} />
                                            Mais aulas desta categoria
                                            <span className="text-xs bg-prosperus-muted-bg text-prosperus-muted-text px-2 py-0.5 rounded-full">
                                                {otherVideos.length}
                                            </span>
                                        </div>
                                        {playlistOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {playlistOpen && (
                                        <div className="divide-y divide-prosperus-stroke bg-prosperus-navy">
                                            {otherVideos.map(v => (
                                                <PlaylistItem
                                                    key={v.id}
                                                    video={v}
                                                    isActive={false}
                                                    onClick={() => onNavigate?.(v)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── COLUNA DIREITA: Sidebar Playlist (Desktop only) ── */}
                    {otherVideos.length > 0 && (
                        <div className="hidden lg:flex flex-col w-[340px] shrink-0 bg-prosperus-box border-l border-prosperus-stroke h-full overflow-hidden">
                            {/* Header sidebar */}
                            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3.5 border-b border-prosperus-stroke">
                                <ListVideo size={16} className="text-prosperus-gold-light" strokeWidth={1.5} />
                                <span className="text-sm font-semibold text-prosperus-white">Playlist da Categoria</span>
                                <span className="ml-auto text-xs bg-prosperus-muted-bg text-prosperus-muted-text px-2 py-0.5 rounded-full">
                                    {otherVideos.length + 1}
                                </span>
                            </div>

                            {/* Vídeo atual em destaque */}
                            <div className="flex-shrink-0 border-b border-prosperus-stroke">
                                <PlaylistItem
                                    video={video}
                                    isActive={true}
                                    onClick={() => {}}
                                />
                            </div>

                            {/* Lista dos outros vídeos (scrollável) */}
                            <div className="flex-1 overflow-y-auto divide-y divide-prosperus-stroke/50">
                                {otherVideos.map(v => (
                                    <PlaylistItem
                                        key={v.id}
                                        video={v}
                                        isActive={false}
                                        onClick={() => onNavigate?.(v)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
