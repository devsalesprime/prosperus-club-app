import React, { useState, useEffect } from 'react';
import { Video, VideoProgress } from '../types';
import { videoService } from '../services/videoService';
import { VideoCard } from './VideoCard';
import { VideoPlayer } from './VideoPlayer';
import { YouTubePlayer } from './YouTubePlayer';
import { VimeoPlayer } from './VimeoPlayer';
import { CursEducaPlayer } from './CursEducaPlayer';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface AcademyProps {
    userId: string;
}

export const Academy: React.FC<AcademyProps> = ({ userId }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [continueWatching, setContinueWatching] = useState<Video[]>([]);
    const [progressMap, setProgressMap] = useState<Map<string, VideoProgress>>(new Map());
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);

    // Load videos and progress
    useEffect(() => {
        loadAcademyData();
    }, [userId]);

    const loadAcademyData = async () => {
        try {
            setLoading(true);

            // Load all videos
            const allVideos = await videoService.listVideos();
            setVideos(allVideos);

            // Extract unique categories
            const uniqueCategories = Array.from(new Set(allVideos.map(v => v.category)));
            setCategories(uniqueCategories);

            // Set featured video (first video or most recent)
            if (allVideos.length > 0) {
                setFeaturedVideo(allVideos[0]);
            }

            // Load user progress
            const progress = await videoService.getAllUserProgress(userId);
            setProgressMap(progress);

            // Load continue watching
            const continueVideos = await videoService.getContinueWatching(userId);
            setContinueWatching(continueVideos);

        } catch (error) {
            console.error('Error loading academy data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get videos by category with progress
    const getVideosByCategory = (category: string): Video[] => {
        return videos
            .filter(v => v.category === category)
            .map(v => ({
                ...v,
                progress: progressMap.get(v.id)?.progress || 0
            }));
    };

    // Handle video selection
    const handleVideoClick = (video: Video) => {
        const videoWithProgress = {
            ...video,
            progress: progressMap.get(video.id)?.progress || 0
        };
        setSelectedVideo(videoWithProgress);
    };

    // Handle video close
    const handleCloseVideo = () => {
        setSelectedVideo(null);
        // Reload data to update progress
        loadAcademyData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-white text-xl">Carregando Academy...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Featured Banner */}
            {featuredVideo && (
                <div className="relative h-[40vh] min-h-[300px] bg-slate-900 rounded-xl overflow-hidden group cursor-pointer"
                    onClick={() => handleVideoClick(featuredVideo)}>
                    <img
                        src={featuredVideo.thumbnail}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <span className="inline-block px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full mb-3">
                            EM DESTAQUE
                        </span>
                        <h2 className="text-4xl font-bold text-white mb-3 max-w-2xl">
                            {featuredVideo.title}
                        </h2>
                        <p className="text-slate-300 mb-6 max-w-xl line-clamp-2">
                            {featuredVideo.description}
                        </p>
                        <button className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition">
                            <Play className="fill-black" size={20} />
                            Assistir Agora
                        </button>
                    </div>
                </div>
            )}

            {/* Continue Watching */}
            {continueWatching.length > 0 && (
                <div>
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

            {/* Category Carousels */}
            {categories.map(category => {
                const categoryVideos = getVideosByCategory(category);
                if (categoryVideos.length === 0) return null;

                return (
                    <div key={category}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">
                                {getCategoryIcon(category)} {category}
                            </h3>
                            <span className="text-sm text-slate-400">
                                {categoryVideos.length} vídeos
                            </span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                            {categoryVideos.map(video => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    progress={video.progress}
                                    onClick={() => handleVideoClick(video)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Empty State */}
            {videos.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Nenhum vídeo disponível
                    </h3>
                    <p className="text-slate-400">
                        Os vídeos da Academy serão adicionados em breve!
                    </p>
                </div>
            )}

            {/* Video Player Modal */}
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
      `}</style>
        </div>
    );
};

// Helper function to get category icon
function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        'Marketing': '📊',
        'Vendas': '💼',
        'Liderança': '👔',
        'Produtividade': '⚡',
        'Networking': '🤝',
        'Finanças': '💰',
        'Tecnologia': '💻',
        'Desenvolvimento Pessoal': '🌱'
    };
    return icons[category] || '📚';
}
