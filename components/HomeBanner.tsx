import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '../types';

interface HomeBannerProps {
    banners: Banner[];
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ banners }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Filter and Sort Banners
    const activeBanners = banners
        .filter(banner => {
            const now = new Date();
            const start = new Date(banner.startDate);
            const end = new Date(banner.endDate);
            return banner.isActive && banner.placement === 'HOME' && now >= start && now <= end;
        })
        .sort((a, b) => b.priority - a.priority);

    useEffect(() => {
        if (activeBanners.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [activeBanners.length, isPaused]);

    if (activeBanners.length === 0) return null;

    const currentBanner = activeBanners[currentIndex];

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));

    const handleBannerClick = () => {
        if (!currentBanner.linkUrl) return;

        if (currentBanner.linkType === 'EXTERNAL') {
            window.open(currentBanner.linkUrl, '_blank', 'noopener,noreferrer');
        } else {
            // Assuming internal links might need special handling, for now just window.location or similar
            // In a real SPA this would use a router push
            window.location.href = currentBanner.linkUrl;
        }
    };

    return (
        <div
            className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden group shadow-2xl mb-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform group-hover:scale-105"
                style={{ backgroundImage: `url(${currentBanner.imageUrl})` }}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Content */}
            <div
                className="absolute inset-0 p-6 flex flex-col justify-end cursor-pointer"
                onClick={handleBannerClick}
            >
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-md mb-1 leading-tight">
                        {currentBanner.title}
                    </h2>
                    {currentBanner.subtitle && (
                        <p className="text-slate-200 text-sm md:text-base drop-shadow-md line-clamp-2 max-w-xl">
                            {currentBanner.subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Manual Navigation */}
            {activeBanners.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {activeBanners.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-yellow-500 w-4' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
