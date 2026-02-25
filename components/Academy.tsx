import React, { useState, useMemo } from 'react';
import { Video, VideoProgress, VideoCategory } from '../types';
import { VideoCard } from './VideoCard';
import { VideoPlayer } from './VideoPlayer';
import { YouTubePlayer } from './YouTubePlayer';
import { VimeoPlayer } from './VimeoPlayer';
import { CursEducaPlayer } from './CursEducaPlayer';
import { Play, Loader2 } from 'lucide-react';
import { useAcademyData } from '../hooks/queries/useAcademyData';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/queryKeys';

interface AcademyProps {
    userId: string;
}

interface CategoryRow {
    categoryName: string;
    videos: Video[];
}

export const Academy: React.FC<AcademyProps> = ({ userId }) => {
    const queryClient = useQueryClient();
    const { data: academyData, isLoading: loading } = useAcademyData(userId);

    const categories = academyData?.categories ?? [];
    const allVideos = academyData?.allVideos ?? [];
    const progressMap = academyData?.progressMap ?? new Map();
    const continueWatching = academyData?.continueWatching ?? [];
    const featuredVideo = academyData?.featuredVideo ?? null;

    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    // ============================================
    // GROUP VIDEOS BY CATEGORY (Netflix rows)
    // ============================================

    const categoryRows: CategoryRow[] = useMemo(() => {
        const rows: CategoryRow[] = [];

        // Build a map: categoryId → categoryName
        const catMap = new Map<string, string>();
        categories.forEach(c => catMap.set(c.id, c.name));

        // Group videos by categoryId
        const grouped = new Map<string, Video[]>();
        allVideos.forEach(video => {
            const key = video.categoryId || '__uncategorized__';
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push({
                ...video,
                progress: progressMap.get(video.id)?.progress || 0
            });
        });

        // Convert to ordered rows (follow category order, uncategorized last)
        categories.forEach(cat => {
            const vids = grouped.get(cat.id);
            if (vids && vids.length > 0) {
                rows.push({ categoryName: cat.name, videos: vids });
                grouped.delete(cat.id);
            }
        });

        // Uncategorized videos (legacy text-based categories)
        const uncategorized = grouped.get('__uncategorized__');
        if (uncategorized && uncategorized.length > 0) {
            // Sub-group by old text category field
            const textGroups = new Map<string, Video[]>();
            uncategorized.forEach(v => {
                const cat = v.category || 'Geral';
                if (!textGroups.has(cat)) textGroups.set(cat, []);
                textGroups.get(cat)!.push(v);
            });
            textGroups.forEach((vids, name) => {
                rows.push({ categoryName: name, videos: vids });
            });
        }

        return rows;
    }, [allVideos, categories, progressMap]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleVideoClick = (video: Video) => {
        const videoWithProgress = {
            ...video,
            progress: progressMap.get(video.id)?.progress || 0
        };
        setSelectedVideo(videoWithProgress);
    };

    const handleCloseVideo = () => {
        setSelectedVideo(null);
        // Invalidate cache so progress updates are reflected
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academyData(userId) });
    };

    // ============================================
    // LOADING STATE
    // ============================================

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="space-y-8 pb-10">

            {/* ===== FEATURED BANNER ===== */}
            {featuredVideo && (
                <div
                    className="relative h-[40vh] min-h-[280px] bg-slate-900 rounded-xl overflow-hidden group cursor-pointer mx-4"
                    onClick={() => handleVideoClick(featuredVideo)}
                >
                    <img
                        src={featuredVideo.thumbnail}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <span className="inline-block px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full mb-3">
                            EM DESTAQUE
                        </span>
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 max-w-2xl">
                            {featuredVideo.title}
                        </h2>
                        <p className="text-slate-300 mb-4 max-w-xl line-clamp-2 text-sm md:text-base">
                            {featuredVideo.description}
                        </p>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition">
                            <Play className="fill-black" size={18} />
                            Assistir Agora
                        </button>
                    </div>
                </div>
            )}

            {/* ===== CONTINUE WATCHING ROW ===== */}
            {continueWatching.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-4 px-4 flex items-center gap-2">
                        🔄 Continuar Assistindo
                    </h3>
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-2 scrollbar-hide w-full">
                        {continueWatching.map(video => (
                            <div key={video.id} className="flex-shrink-0 snap-start w-[280px]">
                                <VideoCard
                                    video={video}
                                    progress={video.progress}
                                    onClick={() => handleVideoClick(video)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== CATEGORY CAROUSELS (Netflix-style) ===== */}
            {categoryRows.map(row => (
                <div key={row.categoryName}>
                    <div className="flex items-center justify-between mb-4 px-4">
                        <h3 className="text-xl font-bold text-white">
                            {row.categoryName}
                        </h3>
                        <span className="text-sm text-slate-500">
                            {row.videos.length} vídeo{row.videos.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-2 scrollbar-hide w-full">
                        {row.videos.map(video => (
                            <div key={video.id} className="flex-shrink-0 snap-start w-[280px]">
                                <VideoCard
                                    video={video}
                                    progress={video.progress}
                                    onClick={() => handleVideoClick(video)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* ===== EMPTY STATE ===== */}
            {allVideos.length === 0 && categories.length === 0 && (
                <div className="text-center py-20 px-4">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Nenhum vídeo disponível
                    </h3>
                    <p className="text-slate-400">
                        Os vídeos da Academy serão adicionados em breve!
                    </p>
                </div>
            )}

            {/* ===== VIDEO PLAYER MODAL ===== */}
            {selectedVideo && (() => {
                const videoUrl = selectedVideo.videoUrl || '';
                const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
                const isVimeo = videoUrl.includes('vimeo.com');

                if (isYouTube) {
                    return <YouTubePlayer video={selectedVideo} userId={userId} onClose={handleCloseVideo} />;
                } else if (isVimeo) {
                    return <VimeoPlayer video={selectedVideo} userId={userId} onClose={handleCloseVideo} />;
                } else if (videoUrl.includes('curseduca.com')) {
                    return <CursEducaPlayer video={selectedVideo} userId={userId} onClose={handleCloseVideo} />;
                } else {
                    return <VideoPlayer video={selectedVideo} userId={userId} onClose={handleCloseVideo} />;
                }
            })()}

            {/* ===== SCROLLBAR HIDE UTILITY ===== */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
