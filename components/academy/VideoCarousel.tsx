import React from 'react';
import { Video } from '../../types';
import { VideoCard } from './VideoCard';

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
    return (
        <div className="relative mb-8 w-full min-w-0">
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
                {/* 
                  MOBILE: Carrossel touch horizontal (flex wrap blockado, overflow-x)
                  DESKTOP: Grid Responsivo 
                */}
                <div 
                    className="
                        flex flex-row overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory academy-swimlane
                        md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:px-8 md:overflow-visible
                    "
                >
                    {videos.map((video) => (
                        <div 
                            key={video.id} 
                            className="shrink-0 snap-start md:shrink grid"
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
