import React from 'react';
import { Video } from '../../types';
import { VideoCard } from './VideoCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSnapCarousel } from 'react-snap-carousel';

interface VideoCarouselProps {
    title: string;
    videos: Video[];
    iconUrl?: string | null;
    count?: number;
    onVideoClick: (video: Video) => void;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
    title,
    videos,
    iconUrl,
    count,
    onVideoClick,
}) => {
    const { scrollRef, prev, next } = useSnapCarousel();

    const handleLeft = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        prev();
    };

    const handleRight = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        next();
    };

    return (
        <div className="relative group/carousel mb-8 w-full min-w-0">
            {/* Título da Categoria */}
            <div className="flex flex-col px-4 md:px-8 mb-4 gap-1">
                <div className="flex items-center gap-3">
                    {iconUrl && (
                        <img
                            src={iconUrl}
                            alt=""
                            className="h-6 sm:h-8 w-auto max-w-[40px] sm:max-w-[48px] object-contain shrink-0 drop-shadow-md"
                            style={{ filter: 'brightness(0) saturate(100%) invert(67%) sepia(45%) saturate(700%) hue-rotate(3deg) brightness(92%)' }}
                            loading="lazy"
                            decoding="async"
                        />
                    )}
                    <h2 className="text-xl md:text-2xl font-bold text-prosperus-white capitalize tracking-wide drop-shadow-sm">
                        {title
                            .split(' ')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ')}
                    </h2>
                </div>
                {count !== undefined && (
                    <span className="text-xs text-prosperus-muted-text font-medium md:ml-[3.25rem]">
                        {count} aula{count !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="relative w-full">
                {/* Fumaça Esquerda + Seta */}
                <div className="hidden md:flex absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-[#031726] to-transparent items-center justify-start z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <button 
                        type="button"
                        onClick={handleLeft} 
                        className="pointer-events-auto ml-2 w-12 h-12 bg-black/60 hover:bg-prosperus-navy backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white shadow-xl transition-all hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                {/* Fumaça Direita + Seta */}
                <div className="hidden md:flex absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[#031726] to-transparent items-center justify-end z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <button 
                        type="button"
                        onClick={handleRight} 
                        className="pointer-events-auto mr-2 w-12 h-12 bg-black/60 hover:bg-prosperus-navy backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white shadow-xl transition-all hover:scale-110 active:scale-95"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* A Trilha de Vídeos (O Track) - Adaptada para o react-snap-carousel */}
                <div 
                    ref={scrollRef} 
                    className="flex flex-row overflow-x-auto overflow-y-visible gap-4 px-4 md:px-8 pb-4 snap-x snap-mandatory academy-swimlane md:gap-4 w-full"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {videos.map((video, index) => (
                        <div 
                            key={video.id} 
                            style={{ 
                                scrollSnapAlign: 'start',
                                flexShrink: 0
                            }}
                        >
                            <VideoCard
                                video={video}
                                progress={video.progress}
                                onClick={() => onVideoClick(video)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
