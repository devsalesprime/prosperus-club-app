// ============================================
// HOME CAROUSEL - Hybrid Banner + Member Suggestions
// ============================================
// Carrossel da Home que exibe banners promocionais e cards de sugestão de sócios
// ✨ v3: Redesign Premium com Progress Bar e Layout Estruturado

import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, Users } from 'lucide-react';
import { CarouselItem, MemberSuggestionData, Banner } from '../../services/bannerService';
import { Avatar } from '../ui/Avatar';
import { useSwipeCarousel } from '../../hooks/useSwipeCarousel';

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
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const { index, setIndex, dragOffset, isDragging, bind, transition } = useSwipeCarousel({
        total: items.length,
        enabled: items.length > 1,
    });

    // Auto-rotate with animated Progress
    useEffect(() => {
        if (items.length <= 1 || isPaused || isDragging) return;

        const intervalTime = 50;
        const step = (intervalTime / 5000) * 100; // 5 segundos

        const interval = setInterval(() => {
            setProgress(p => {
                if (p + step >= 100) {
                    setIndex((index + 1) % items.length);
                    return 0;
                }
                return p + step;
            });
        }, intervalTime);

        return () => clearInterval(interval);
    }, [items.length, isPaused, isDragging, index, setIndex]);

    // Reset progress on slide change manually
    useEffect(() => {
        setProgress(0);
    }, [index]);

    if (items.length === 0) return null;

    const currentItem = items[index];

    return (
        <div
            {...bind()}
            className="relative w-full aspect-[21/9] md:aspect-[3/1] min-h-[200px] rounded-2xl overflow-hidden group shadow-2xl mb-6 select-none bg-prosperus-card"
            style={{ touchAction: 'pan-y' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Slides container com drag offset */}
            <div
                className="absolute inset-0"
                style={{
                    transform: `translate3d(${dragOffset}px, 0, 0)`,
                    transition,
                    willChange: isDragging ? 'transform' : 'auto',
                }}
            >
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
            </div>

            {/* Bullets Animados (Stories Logic) */}
            {items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10 w-full px-4">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setIndex(i); setProgress(0); }}
                            className={`rounded-full transition-all duration-300 relative overflow-hidden bg-white/20 ${i === index ? 'w-10 h-2' : 'w-2 h-2 hover:bg-white/40'}`}
                            aria-label={`Ir para slide ${i + 1}`}
                        >
                            {i === index && (
                                <div
                                    className="bg-prosperus-white absolute top-0 left-0 h-full transition-all ease-linear"
                                    style={{ width: `${progress}%`, transitionDuration: '50ms' }}
                                />
                            )}
                        </button>
                    ))}
                </div>
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
        <div className="absolute inset-0" onClick={handleClick} style={{ cursor: 'pointer' }}>
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform group-hover:scale-105"
                style={{ backgroundImage: `url(${banner.image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-prosperus-navy via-prosperus-navy/40 to-transparent" />

            {/* 🚨 ANCORAGEM: Exatos 180px do rodapé da imagem */}
            <div className="absolute bottom-[180px] left-4 md:left-12 z-30 flex">
              {/* A CASCA EXTERNA (Glass Halo) */}
              <div 
                className="inline-flex p-[5px] md:p-[6px] rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
                onClick={(e) => { e.stopPropagation(); handleClick(); }}
              >
                {/* O MIOLO DOURADO (Gold Pill) */}
                <button
                  className="px-8 py-2.5 md:px-10 md:py-3.5 rounded-full bg-gradient-to-r from-[#C89B3C] via-[#E2B75A] to-[#FDF0A6] text-[#031726] font-semibold text-lg md:text-xl tracking-wide shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center whitespace-nowrap border border-[#FCE79A]/50 outline-none"
                >
                  {banner.link_type === 'EXTERNAL' ? 'Acessar Link' : 'Saber mais'}
                </button>
              </div>
            </div>

            <div className="absolute inset-0 p-6 flex flex-col justify-end pb-12 pointer-events-none">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto w-full pr-12">
                    <h2 className="text-xl md:text-3xl font-bold text-prosperus-white drop-shadow-md mb-1 leading-tight">
                        {banner.title}
                    </h2>
                    {banner.subtitle && (
                        <p className="text-prosperus-white/80 text-sm md:text-base drop-shadow-md line-clamp-2 max-w-xl">
                            {banner.subtitle}
                        </p>
                    )}
                </div>
                {banner.link_url && banner.link_type === 'EXTERNAL' && (
                    <ExternalLink size={16} className="absolute top-4 right-4 text-white/50 pointer-events-auto" />
                )}
            </div>
        </div>
    );
};

// ================================================
// MEMBER SUGGESTION SLIDE (Premium Card Refactor)
// ================================================

const CustomUserStarIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-user-star ${className}`}>
        <path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>
    </svg>
);

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
        <div
            className="absolute inset-0 flex flex-col justify-center cursor-pointer border border-prosperus-border overflow-hidden"
            onClick={onViewProfile}
        >
            {/* Imagem de Fundo Padrão */}
            <img
                src={`${import.meta.env.BASE_URL}fundo-prosperus-app.webp`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay para contraste */}
            <div className="absolute inset-0 bg-prosperus-navy/80" />

            {/* Conteúdo sobre o fundo */}
            <div className="relative z-10 p-6 flex flex-col w-full h-full justify-center">
                {/* Topo (Flex Row) */}
                <div className="flex items-start gap-5">
                    {/* Esquerda: Avatar com Badge Flutuante */}
                    <div className="relative shrink-0">
                        <Avatar
                            src={member.imageUrl}
                            alt={member.name}
                            className="w-20 h-20 ring-2 ring-prosperus-gold ring-offset-2 ring-offset-prosperus-card object-cover"
                        />
                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg ${reason === 'NEW'
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                            }`}>
                            <CustomUserStarIcon size={14} className="text-white" />
                        </div>
                    </div>
                    
                    {/* Direita: Badge "Novo Sócio" e Nome */}
                    <div className="flex flex-col flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-1.5 mb-1 bg-[#042f2e] w-fit px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {reason === 'NEW' && <CustomUserStarIcon size={12} className="text-emerald-400" />}
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest break-words truncate">
                                {reason === 'NEW' ? 'Novo Sócio' : 'Match Recomendado'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-prosperus-white leading-tight truncate">
                            {member.name}
                        </h3>
                    </div>
                </div>

                {/* Meio: Cargo e Empresa - Forçando destaque visual e quebra de linha */}
                <div className="mt-3">
                    <p className="text-xs text-prosperus-white/80 leading-tight">
                        <span className="font-semibold">{member.jobTitle || 'Membro'}</span> 
                        <span className="mx-2 opacity-40">|</span> 
                        <span>{member.company || 'Prosperus Club'}</span>
                    </p>
                </div>

                {/* Base: Tags (Max 3) */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {member.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium truncate max-w-[100px]"
                        >
                            {tag}
                        </span>
                    ))}
                    {member.tags.length > 3 && (
                        <span className="text-xs text-prosperus-grey font-bold">
                            +{member.tags.length - 3}
                        </span>
                    )}
                </div>
                
                {/* Invisível placeholder height equivalent to bullets to prevent content hiding */}
                <div className="h-6 w-full shrink-0"></div>
            </div>
        </div>
    );
};
