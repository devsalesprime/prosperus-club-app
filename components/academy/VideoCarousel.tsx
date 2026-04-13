// ============================================
// VIDEO CAROUSEL — Netflix-style Swimlane (Definitivo)
// Mobile: Touch-swipe horizontal (snap magnético)
// Desktop: Scroll nativo via setas com fumaça lateral
// ============================================
// Hierarquia DOM:
//   1. Container Pai (relative, min-w-0, group)
//   2. Título (FORA do wrapper relativo das setas)
//   3. Wrapper Relativo (relative) — ancora setas + pista
//      3a. Seta Esquerda (absolute, pointer-events-none → botão pointer-events-auto z-50)
//      3b. Pista (ref=carouselRef, overflow-x-auto, flex-row)
//      3c. Seta Direita (absolute, pointer-events-none → botão pointer-events-auto z-50)
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
        /* 1. CONTAINER PAI — relative + min-w-0 blinda contra flex-bug */
        <div className="relative w-full min-w-0 mb-10 group">

            {/* 1. TÍTULO DA CATEGORIA (Livre do Wrapper Relativo) */}
            <div className="flex items-center gap-3 mb-4 px-4 md:px-0">
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
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl md:text-2xl font-bold text-prosperus-white capitalize tracking-wide drop-shadow-sm">
                        {title
                            .split(' ')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ')}
                    </h2>
                    {count !== undefined && (
                        <span className="text-xs text-prosperus-muted-text font-medium">
                            {count} aula{count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. WRAPPER RELATIVO PARA AS SETAS — ancora setas + pista */}
            <div className="relative w-full">

                {/* ── SETA ESQUERDA ──
                     Fumaça: pointer-events-none (mouse ignora o gradiente)
                     Botão: pointer-events-auto z-50 (fura a fumaça e captura clicks)
                */}
                <div className="hidden md:flex absolute top-0 bottom-0 left-0 items-center justify-start w-24 bg-gradient-to-r from-[#031726] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="w-12 h-12 ml-2 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-[#CA9A43] hover:text-[#031726] hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer z-50 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        aria-label="Rolar para esquerda"
                    >
                        <ChevronLeft size={28} />
                    </button>
                </div>

                {/* 🚨 A PISTA DE ROLAGEM — carouselRef FICA AQUI! 🚨
                     Eixo ininterrupto: flex-row + overflow-x-auto
                     ZERO grid, ZERO flex-wrap
                     z-0 para ficar atrás das setas z-10/z-50
                */}
                <div
                    ref={carouselRef}
                    className="flex flex-row overflow-x-auto gap-4 md:gap-5 px-4 md:px-0 pb-6 snap-x snap-mandatory scroll-smooth relative z-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            progress={video.progress}
                            onClick={() => onVideoClick(video)}
                        />
                    ))}
                </div>

                {/* ── SETA DIREITA ── */}
                <div className="hidden md:flex absolute top-0 bottom-0 right-0 items-center justify-end w-24 bg-gradient-to-l from-[#031726] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
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
