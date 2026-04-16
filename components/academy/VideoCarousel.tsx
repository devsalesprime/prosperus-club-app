// ============================================
// VIDEO CAROUSEL — Netflix-style Swimlane (Anti-Blowout)
// Mobile: Touch-swipe horizontal (snap magnético)
// Desktop: Scroll nativo via setas com fumaça lateral
// ============================================
// Root: grid grid-cols-1 min-w-0 → VACINA contra Flexbox Blowout
// Cards: wrapper shrink-0 w-[320px] → força overflow real
// Setas: pointer-events layering (fumaça none, botão auto z-50)
// ============================================

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    const carouselRef = useRef<HTMLDivElement>(null);

    // ── Motor Matemático: avança 75% da viewport visível ──
    const scroll = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const { clientWidth } = carouselRef.current;
            const scrollAmount = direction === 'left'
                ? -(clientWidth * 0.75)
                : clientWidth * 0.75;
            carouselRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        /* 🚨 VACINA ANTI-BLOWOUT: grid-cols-1 força o limite na viewport */
        <div className="relative w-full min-w-0 grid grid-cols-1 mb-10 group/carousel">

            {/* 1. TÍTULO E ÍCONE */}
            <div className="flex items-center gap-3 mb-4 px-4 md:px-0 min-w-0">
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
                <div className="flex flex-col gap-0.5 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-prosperus-white capitalize tracking-wide drop-shadow-sm truncate">
                        {title
                            .split(' ')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ')}
                    </h2>
                    {count !== undefined && (
                        <span className="text-xs text-prosperus-muted-text font-medium truncate">
                            {count} aula{count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. WRAPPER RELATIVO DAS SETAS */}
            <div className="relative w-full min-w-0">

                {/* SETA ESQUERDA */}
                <div className="hidden md:flex absolute top-0 bottom-0 left-0 items-center justify-start w-24 bg-gradient-to-r from-[#031726] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="w-12 h-12 ml-2 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-[#CA9A43] hover:text-[#031726] hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer z-50 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        aria-label="Rolar para esquerda"
                    >
                        <ChevronLeft size={28} />
                    </button>
                </div>

                {/* 🚨 A PISTA DE ROLAGEM ESTRITA — carouselRef AQUI 🚨 */}
                <div
                    ref={carouselRef}
                    className="flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] [-webkit-overflow-scrolling:'touch'] w-full gap-4 md:gap-5 px-4 md:px-0 pb-6 snap-x snap-mandatory scroll-smooth relative z-0 academy-swimlane"
                    style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                >
                    {/* 🚨 CÁPSULA PROTETORA: shrink-0 + largura fixa → FORÇA overflow */}
                    {videos.map((video) => (
                        <div key={video.id} className="w-[85vw] sm:w-[280px] md:w-[320px] shrink-0 snap-start relative">
                            <VideoCard
                                video={video}
                                progress={video.progress}
                                onClick={() => onVideoClick(video)}
                            />
                        </div>
                    ))}
                </div>

                {/* SETA DIREITA */}
                <div className="hidden md:flex absolute top-0 bottom-0 right-0 items-center justify-end w-24 bg-gradient-to-l from-[#031726] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="w-12 h-12 mr-2 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-[#CA9A43] hover:text-[#031726] hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer z-50 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        aria-label="Rolar para direita"
                    >
                        <ChevronRight size={28} />
                    </button>
                </div>

            </div>
        </div>
    );
};
