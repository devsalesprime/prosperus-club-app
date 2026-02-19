import React, { useState, useEffect } from 'react';
import { Video, VideoProgress, VideoCategory } from '../types';
import { videoService } from '../services/videoService';
import { VideoCard } from './VideoCard';
import { CategoryCard } from './CategoryCard';
import { VideoPlayer } from './VideoPlayer';
import { YouTubePlayer } from './YouTubePlayer';
import { VimeoPlayer } from './VimeoPlayer';
import { CursEducaPlayer } from './CursEducaPlayer';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';

interface AcademyProps {
    userId: string;
}

export const Academy: React.FC<AcademyProps> = ({ userId }) => {
    const [categories, setCategories] = useState<VideoCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
    const [allVideos, setAllVideos] = useState<Video[]>([]);
    const [categoryVideos, setCategoryVideos] = useState<Video[]>([]);
    const [continueWatching, setContinueWatching] = useState<Video[]>([]);
    const [progressMap, setProgressMap] = useState<Map<string, VideoProgress>>(new Map());
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingVideos, setLoadingVideos] = useState(false);

    // ============================================
    // DATA LOADING
    // ============================================

    useEffect(() => {
        loadAcademyData();
    }, [userId]);

    const loadAcademyData = async () => {
        try {
            setLoading(true);

            // Load categories, videos, and progress in parallel
            const [cats, videos, progress, continueVideos] = await Promise.all([
                videoService.getCategories(),
                videoService.listVideos(),
                videoService.getAllUserProgress(userId),
                videoService.getContinueWatching(userId)
            ]);

            setCategories(cats);
            setAllVideos(videos);
            setProgressMap(progress);
            setContinueWatching(continueVideos);

            // Set featured video (first video)
            if (videos.length > 0) {
                setFeaturedVideo(videos[0]);
            }
        } catch (error) {
            console.error('Error loading academy data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load videos for a specific category
    const loadCategoryVideos = async (category: VideoCategory) => {
        try {
            setLoadingVideos(true);
            const videos = await videoService.getVideosByCategoryId(category.id);
            // Inject progress
            const videosWithProgress = videos.map(v => ({
                ...v,
                progress: progressMap.get(v.id)?.progress || 0
            }));
            setCategoryVideos(videosWithProgress);
        } catch (error) {
            console.error('Error loading category videos:', error);
        } finally {
            setLoadingVideos(false);
        }
    };

    // ============================================
    // HANDLERS
    // ============================================

    const handleCategoryClick = (category: VideoCategory) => {
        setSelectedCategory(category);
        loadCategoryVideos(category);
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setCategoryVideos([]);
    };

    const handleVideoClick = (video: Video) => {
        const videoWithProgress = {
            ...video,
            progress: progressMap.get(video.id)?.progress || 0
        };
        setSelectedVideo(videoWithProgress);
    };

    const handleCloseVideo = () => {
        setSelectedVideo(null);
        // Reload data to update progress
        loadAcademyData();
        if (selectedCategory) {
            loadCategoryVideos(selectedCategory);
        }
    };

    // Helper: count videos per category
    const getVideoCount = (categoryId: string) =>
        allVideos.filter(v => v.categoryId === categoryId).length;

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

            {/* ============================================ */}
            {/* VIEW 1: CATEGORY GRID (selectedCategory === null) */}
            {/* ============================================ */}
            {!selectedCategory && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Featured Banner */}
                    {featuredVideo && (
                        <div className="relative h-[40vh] min-h-[280px] bg-slate-900 rounded-xl overflow-hidden group cursor-pointer mb-8"
                            onClick={() => handleVideoClick(featuredVideo)}>
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

                    {/* Continue Watching */}
                    {continueWatching.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    🔄 Continuar Assistindo
                                </h3>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                                {continueWatching.map(video => (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        progress={video.progress}
                                        onClick={() => handleVideoClick(video)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categories Grid */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-5">
                            📚 Categorias
                        </h3>
                        {categories.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categories.map(category => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        videoCount={getVideoCount(category.id)}
                                        onClick={() => handleCategoryClick(category)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">📚</div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Nenhuma categoria disponível
                                </h3>
                                <p className="text-slate-400">
                                    As categorias da Academy serão adicionadas em breve!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* VIEW 2: VIDEOS LIST (selectedCategory !== null) */}
            {/* ============================================ */}
            {selectedCategory && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBackToCategories}
                            className="flex items-center gap-2 text-slate-400 hover:text-yellow-500 transition-colors group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Voltar</span>
                        </button>
                        <div className="h-6 w-px bg-slate-700" />
                        <h2 className="text-2xl font-bold text-white">
                            {selectedCategory.name}
                        </h2>
                    </div>

                    {selectedCategory.description && (
                        <p className="text-slate-400 mb-6 max-w-2xl">
                            {selectedCategory.description}
                        </p>
                    )}

                    {/* Videos Grid */}
                    {loadingVideos ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                    ) : categoryVideos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {categoryVideos.map(video => (
                                <div key={video.id} className="w-full">
                                    <VideoCard
                                        video={video}
                                        progress={video.progress}
                                        onClick={() => handleVideoClick(video)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <div className="text-5xl mb-4">🎬</div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Nenhum vídeo nesta categoria
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Novos conteúdos serão adicionados em breve!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* VIDEO PLAYER MODAL */}
            {/* ============================================ */}
            {selectedVideo && (() => {
                const videoUrl = selectedVideo.videoUrl || '';
                const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
                const isVimeo = videoUrl.includes('vimeo.com');

                if (isYouTube) {
                    return (
                        <YouTubePlayer
                            video={selectedVideo}
                            userId={userId}
                            onClose={handleCloseVideo}
                        />
                    );
                } else if (isVimeo) {
                    return (
                        <VimeoPlayer
                            video={selectedVideo}
                            userId={userId}
                            onClose={handleCloseVideo}
                        />
                    );
                } else if (videoUrl.includes('curseduca.com')) {
                    return (
                        <CursEducaPlayer
                            video={selectedVideo}
                            userId={userId}
                            onClose={handleCloseVideo}
                        />
                    );
                } else {
                    return (
                        <VideoPlayer
                            video={selectedVideo}
                            userId={userId}
                            onClose={handleCloseVideo}
                        />
                    );
                }
            })()}

            {/* Hide scrollbar */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                /* Tailwind animate-in utilities */
                @keyframes animateIn {
                    from {
                        opacity: 0;
                        transform: translateY(1rem);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-in {
                    animation: animateIn 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
