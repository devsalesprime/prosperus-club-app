// ============================================
// VIDEO CAROUSEL — Netflix-style Swimlane
// Mobile: Touch-swipe horizontal (snap magnético)
// Desktop: Scroll nativo via setas com fumaça lateral
// ============================================
// Motor: scrollBy nativo + pointer-events layering
// Blindagem: min-w-0 (pai) + shrink-0 (cards)
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ── Motor Matemático: avança 75% da viewport visível ──
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = direction === 'left'
                ? -(clientWidth * 0.75)
                : clientWidth * 0.75;
            scrollContainerRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        /* ── Container Pai: relative + min-w-0 blinda contra flex-bug ── */
        <div className="relative w-full min-w-0 mb-8 group">
            {/* ── Título da Categoria ── */}
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

            {/* ── Pista de Rolagem (Track) ──
                 Eixo ininterrupto: flex-row + flex-nowrap + overflow-x-auto
                 ZERO grid, ZERO flex-wrap — o eixo deve ser horizontal contínuo
            */}
            <div
                ref={scrollContainerRef}
                className="flex flex-row flex-nowrap overflow-x-auto gap-4 px-4 md:px-8 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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

            {/* ════════════════════════════════════════════════════════
                 SETAS DESKTOP — Fumaça + Pointer-Events Layering
                 A fumaça (gradiente) é pointer-events-none.
                 O botão fura a fumaça com pointer-events-auto.
                 Aparecem no hover do container pai (group-hover).
                 ════════════════════════════════════════════════════════ */}

            {/* ── Seta Esquerda ── */}
            <div className="hidden md:flex absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-[#031726] to-transparent z-10 pointer-events-none items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={() => scroll('left')}
                    className="pointer-events-auto ml-2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#CA9A43] border border-white/20 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
                    aria-label="Rolar para esquerda"
                >
                    <ChevronLeft size={28} />
                </button>
            </div>

            {/* ── Seta Direita ── */}
            <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-[#031726] to-transparent z-10 pointer-events-none items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={() => scroll('right')}
                    className="pointer-events-auto mr-2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#CA9A43] border border-white/20 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
                    aria-label="Rolar para direita"
                >
                    <ChevronRight size={28} />
                </button>
            </div>
        </div>
    );
};
