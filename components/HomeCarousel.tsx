// ============================================
// HOME CAROUSEL - Hybrid Banner + Member Suggestions
// ============================================
// Carrossel da Home que exibe banners promocionais e cards de sugestão de sócios

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Users, ExternalLink, Eye } from 'lucide-react';
import { CarouselItem, MemberSuggestionData, Banner } from '../services/bannerService';
import { Avatar } from './ui/Avatar';

interface HomeCarouselProps {
    items: CarouselItem[];
    onViewProfile?: (memberId: string) => void;
    onBannerClick?: (banner: Banner) => void;
}

export const HomeCarousel: React.FC<HomeCarouselProps> = ({
    items,
    onViewProfile,
    onBannerClick
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate
    useEffect(() => {
        if (items.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 6000); // 6 seconds for better readability

        return () => clearInterval(interval);
    }, [items.length, isPaused]);

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));

    return (
        <div
            className="relative w-full aspect-[21/9] md:aspect-[3/1] min-h-[200px] rounded-2xl overflow-hidden group shadow-2xl mb-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Render based on item type */}
            {currentItem.type === 'PROMO' ? (
                <BannerSlide
                    banner={currentItem.data}
                    onClick={() => onBannerClick?.(currentItem.data)}
                />
            ) : (
                <MemberSuggestionSlide
                    member={currentItem.data}
                    reason={currentItem.reason}
                    onViewProfile={() => onViewProfile?.(currentItem.data.id)}
                />
            )}

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-all z-10 shadow-lg"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-all z-10 shadow-lg"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Slide Counter (minimal) */}
                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full z-10">
                        <span className="text-xs text-white/80 font-medium">
                            {currentIndex + 1} / {items.length}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

// ================================================
// PROMO BANNER SLIDE
// ================================================

interface BannerSlideProps {
    banner: Banner;
    onClick?: () => void;
}

const BannerSlide: React.FC<BannerSlideProps> = ({ banner, onClick }) => {
    const handleClick = () => {
        if (!banner.link_url) {
            onClick?.();
            return;
        }

        if (banner.link_type === 'EXTERNAL') {
            window.open(banner.link_url, '_blank', 'noopener,noreferrer');
        } else {
            onClick?.();
        }
    };

    return (
        <>
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform group-hover:scale-105"
                style={{ backgroundImage: `url(${banner.image_url})` }}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Content */}
            <div
                className="absolute inset-0 p-6 flex flex-col justify-end cursor-pointer"
                onClick={handleClick}
            >
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-md mb-1 leading-tight">
                        {banner.title}
                    </h2>
                    {banner.subtitle && (
                        <p className="text-slate-200 text-sm md:text-base drop-shadow-md line-clamp-2 max-w-xl">
                            {banner.subtitle}
                        </p>
                    )}
                </div>

                {/* External link indicator */}
                {banner.link_url && banner.link_type === 'EXTERNAL' && (
                    <ExternalLink size={16} className="absolute top-4 right-4 text-white/50" />
                )}
            </div>
        </>
    );
};

// ================================================
// MEMBER SUGGESTION SLIDE (Discovery Card)
// ================================================

interface MemberSuggestionSlideProps {
    member: MemberSuggestionData;
    reason: 'NEW' | 'MATCH';
    onViewProfile?: () => void;
}

const MemberSuggestionSlide: React.FC<MemberSuggestionSlideProps> = ({
    member,
    reason,
    onViewProfile
}) => {
    return (
        <>
            {/* Background Image */}
            <img
                src={`${import.meta.env.BASE_URL}fundo-prosperus-app.webp`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark Overlay for text legibility */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="absolute inset-0 p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
                {/* Left Section: Avatar + Info */}
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                    {/* Large Avatar */}
                    <div className="relative shrink-0">
                        <Avatar
                            src={member.imageUrl}
                            alt={member.name}
                            size="xl"
                            className="ring-4 ring-yellow-600/30 shadow-2xl"
                        />
                        {/* Reason Badge on Avatar */}
                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg ${reason === 'NEW'
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                            }`}>
                            {reason === 'NEW' ? (
                                <Sparkles size={14} className="text-white" />
                            ) : (
                                <Users size={14} className="text-white" />
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left min-w-0">
                        {/* Reason Label */}
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${reason === 'NEW'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {reason === 'NEW' ? (
                                <>
                                    <Sparkles size={10} />
                                    Novo Sócio
                                </>
                            ) : (
                                <>
                                    <Users size={10} />
                                    Interesse em Comum
                                </>
                            )}
                        </span>

                        {/* Name */}
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-1">
                            {member.name}
                        </h3>

                        {/* Company / Job */}
                        <p className="text-sm text-slate-300 line-clamp-1 mb-3">
                            {member.jobTitle && `${member.jobTitle} · `}
                            {member.company || 'Prosperus Club'}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                            {/* First show matching tags */}
                            {member.matchingTags.slice(0, 3).map((tag, i) => (
                                <span
                                    key={`match-${i}`}
                                    className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400 font-medium"
                                >
                                    {tag}
                                </span>
                            ))}
                            {/* Then other tags */}
                            {member.tags
                                .filter(t => !member.matchingTags.includes(t))
                                .slice(0, 2)
                                .map((tag, i) => (
                                    <span
                                        key={`tag-${i}`}
                                        className="px-2 py-0.5 bg-slate-700/50 border border-slate-600/30 rounded-full text-xs text-slate-400"
                                    >
                                        {tag}
                                    </span>
                                ))
                            }
                            {member.tags.length > 5 && (
                                <span className="px-2 py-0.5 text-xs text-slate-500">
                                    +{member.tags.length - 5}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: CTA */}
                <div className="shrink-0">
                    <button
                        onClick={onViewProfile}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-yellow-600/20 transition-all duration-300 hover:scale-105"
                    >
                        <Eye size={18} />
                        <span className="hidden sm:inline">Ver Perfil</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default HomeCarousel;
