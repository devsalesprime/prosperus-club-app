import React, { useState, useMemo } from 'react';
import { Video } from '../../types';
import { VideoCard } from './VideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { Play, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';
import { useAcademyData } from '../../hooks/queries/useAcademyData';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../utils/queryKeys';
import { analyticsService } from '../../services/analyticsService';

interface AcademyProps {
    userId: string;
    onBack?: () => void;
}

interface CategoryRow {
    categoryName: string;
    videos: Video[];
}

export const Academy: React.FC<AcademyProps> = ({ userId, onBack }) => {
    const queryClient = useQueryClient();
    const { data: academyData, isLoading: loading } = useAcademyData(userId);

    const categories = academyData?.categories ?? [];
    const allVideos = academyData?.allVideos ?? [];
    const progressMap = academyData?.progressMap ?? new Map();
    const continueWatching = academyData?.continueWatching ?? [];
    const featuredVideo = academyData?.featuredVideo ?? null;

    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [playlist, setPlaylist] = useState<Video[]>([]);

    // ============================================
    // GROUP VIDEOS BY CATEGORY
    // ============================================
    const categoryRows: CategoryRow[] = useMemo(() => {
        const rows: CategoryRow[] = [];

        const grouped = new Map<string, Video[]>();
        allVideos.forEach(video => {
            const key = video.categoryId || '__uncategorized__';
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push({
                ...video,
                progress: progressMap.get(video.id)?.progress || 0,
            });
        });

        // Categorias ordenadas
        categories.forEach(cat => {
            const vids = grouped.get(cat.id);
            if (vids && vids.length > 0) {
                rows.push({ categoryName: cat.name, videos: vids });
                grouped.delete(cat.id);
            }
        });

        // Legacy text-based categories (uncategorized)
        const uncategorized = grouped.get('__uncategorized__');
        if (uncategorized && uncategorized.length > 0) {
            const textGroups = new Map<string, Video[]>();
            uncategorized.forEach(v => {
                const cat = v.category || 'Geral';
                if (!textGroups.has(cat)) textGroups.set(cat, []);
                textGroups.get(cat)!.push(v);
            });
            textGroups.forEach((vids, name) => rows.push({ categoryName: name, videos: vids }));
        }

        return rows;
    }, [allVideos, categories, progressMap]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleVideoClick = (video: Video, rowVideos: Video[] = []) => {
        const videoWithProgress = {
            ...video,
            progress: progressMap.get(video.id)?.progress || 0,
        };
        setSelectedVideo(videoWithProgress);
        setPlaylist(rowVideos.map(v => ({
            ...v,
            progress: progressMap.get(v.id)?.progress || 0,
        })));
        analyticsService.trackVideoStart(userId, video.id, video.title);
    };

    const handleCloseVideo = () => {
        setSelectedVideo(null);
        setPlaylist([]);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academyData(userId) });
    };

    const handleNavigate = (video: Video) => {
        handleVideoClick(video, playlist);
    };

    // ============================================
    // LOADING STATE
    // ============================================
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-7 h-7 text-prosperus-gold-light animate-spin" />
                <p className="text-prosperus-muted-text text-sm">Carregando Academy...</p>
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="flex flex-col gap-0 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
            {/* CSS global para esconder scrollbar nos swimlanes — método mais confiável em todos os browsers */}
            <style>{`
                .academy-swimlane::-webkit-scrollbar { display: none; }
                .academy-swimlane { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* ── VOLTAR ──────────────────────────────────────────── */}
            {onBack && (
                <div className="px-4 pt-4 pb-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-prosperus-muted-text hover:text-prosperus-white transition-colors duration-150"
                    >
                        <ArrowLeft size={18} strokeWidth={1.5} />
                        <span className="text-sm">Voltar</span>
                    </button>
                </div>
            )}

            {/* ── BANNER HERO (Featured Video) ────────────────────── */}
            {featuredVideo && (
                <div
                    className="relative h-[30vh] min-h-[220px] max-h-[360px] bg-prosperus-navy overflow-hidden group cursor-pointer mx-4 mb-8 rounded-2xl shadow-2xl"
                    onClick={() => handleVideoClick(featuredVideo, [])}
                >
                    <img
                        src={featuredVideo.thumbnail}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover opacity-55 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-prosperus-gold-light text-prosperus-navy text-[11px] font-black rounded-full mb-3 uppercase tracking-wider">
                            <GraduationCap size={11} strokeWidth={3} />
                            Em Destaque
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 max-w-2xl leading-tight">
                            {featuredVideo.title}
                        </h2>
                        <p className="text-slate-300 mb-4 max-w-xl line-clamp-2 text-sm leading-relaxed hidden sm:block">
                            {featuredVideo.description}
                        </p>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-prosperus-gold-light hover:bg-white text-prosperus-navy font-bold rounded-xl transition-all duration-150 active:scale-95 shadow-lg text-sm">
                            <Play className="fill-prosperus-navy" size={15} />
                            Assistir Agora
                        </button>
                    </div>
                </div>
            )}

            {/* ── CONTINUE WATCHING ───────────────────────────────── */}
            {continueWatching.length > 0 && (
                <CategorySwimLane
                    title="🔄 Continuar Assistindo"
                    count={continueWatching.length}
                    videos={continueWatching}
                    onVideoClick={(v) => handleVideoClick(v, continueWatching)}
                />
            )}

            {/* ── CATEGORY SWIMLANES / GRIDS ──────────────────────── */}
            {categoryRows.map(row => (
                <CategorySwimLane
                    key={row.categoryName}
                    title={row.categoryName}
                    count={row.videos.length}
                    videos={row.videos}
                    onVideoClick={(v) => handleVideoClick(v, row.videos)}
                />
            ))}

            {/* ── EMPTY STATE ─────────────────────────────────────── */}
            {allVideos.length === 0 && categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-prosperus-muted-bg border border-prosperus-stroke flex items-center justify-center mb-6">
                        <GraduationCap size={36} className="text-prosperus-muted-text" strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-bold text-prosperus-white mb-2">Nenhum vídeo disponível</h3>
                    <p className="text-prosperus-muted-text text-sm">Os vídeos da Academy serão adicionados em breve!</p>
                </div>
            )}

            {/* ── PLAYER MODAL ────────────────────────────────────── */}
            {selectedVideo && (
                <VideoPlayerModal
                    video={selectedVideo}
                    userId={userId}
                    playlist={playlist}
                    onClose={handleCloseVideo}
                    onNavigate={handleNavigate}
                />
            )}
        </div>
    );
};

// ============================================
// CategorySwimLane — Componente Interno
// Mobile: carrossel horizontal magnético (swimlane)
// Desktop: grid fluido multi-coluna
// ============================================
interface CategorySwimLaneProps {
    title: string;
    count: number;
    videos: Video[];
    onVideoClick: (video: Video) => void;
}

const CategorySwimLane: React.FC<CategorySwimLaneProps> = ({
    title,
    count,
    videos,
    onVideoClick,
}) => (
    <div className="flex flex-col mb-8 w-full overflow-hidden">
        {/* Título da categoria + contador (empilhados verticalmente) */}
        <div className="flex flex-col px-4 md:px-4 mb-4 gap-1">
            <h2 className="text-xl font-bold text-prosperus-white leading-tight">
                {title}
            </h2>
            <span className="text-xs text-prosperus-muted-text font-medium">
                {count} aula{count !== 1 ? 's' : ''}
            </span>
        </div>

        {/*
         * Container híbrido — a mágica Netflix:
         *   MOBILE:  flex + overflow-x-auto + snap → swimlane horizontal
         *   DESKTOP: md:grid 2→3→4 colunas → grid
         *
         * [&::-webkit-scrollbar]:hidden → oculta scrollbar webkit
         * [-ms-overflow-style:'none']   → oculta scrollbar IE/Edge
         * [scrollbar-width:'none']      → oculta scrollbar Firefox
         */}
        <div className="flex overflow-x-auto overflow-y-hidden gap-4 pb-4 px-4 snap-x snap-mandatory academy-swimlane md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:px-4 md:overflow-visible md:snap-none md:pb-0">
            {videos.map(video => (
                <VideoCard
                    key={video.id}
                    video={video}
                    progress={video.progress}
                    onClick={() => onVideoClick(video)}
                />
            ))}
        </div>
    </div>
);
