// FavoriteButton.tsx
// Reusable animated favorite heart button
// Usage: <FavoriteButton entityType="video" entityId={video.id} />

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { favoriteService, FavoriteEntityType } from '../services/favoriteService';

interface FavoriteButtonProps {
    entityType: FavoriteEntityType;
    entityId: string;
    /** Pre-loaded favorited state (from batch getFavoritedIds) */
    initialFavorited?: boolean;
    /** Size of the heart icon */
    size?: number;
    /** Additional CSS classes */
    className?: string;
    /** Show on a card overlay (absolute positioned) */
    overlay?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    entityType,
    entityId,
    initialFavorited,
    size = 20,
    className = '',
    overlay = false
}) => {
    const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // If initialFavorited is undefined, check on mount
    useEffect(() => {
        if (initialFavorited === undefined) {
            favoriteService.isFavorited(entityType, entityId).then(setIsFavorited);
        }
    }, [entityType, entityId, initialFavorited]);

    // Sync with prop changes (batch loading)
    useEffect(() => {
        if (initialFavorited !== undefined) {
            setIsFavorited(initialFavorited);
        }
    }, [initialFavorited]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isLoading) return;

        setIsLoading(true);
        setIsAnimating(true);

        try {
            const nowFavorited = await favoriteService.toggleFavorite(entityType, entityId);
            setIsFavorited(nowFavorited);
        } catch (error) {
            console.error('Favorite toggle failed:', error);
        } finally {
            setIsLoading(false);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const baseClasses = overlay
        ? 'absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200'
        : 'p-1.5 rounded-full transition-all duration-200';

    const stateClasses = isFavorited
        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/80 hover:text-red-400';

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`${baseClasses} ${stateClasses} ${className}`}
            title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
            <Heart
                size={size}
                fill={isFavorited ? 'currentColor' : 'none'}
                className={`transition-transform duration-200 ${isAnimating ? 'scale-125' : 'scale-100'}`}
            />
            <style>{`
                @keyframes heartBeat {
                    0% { transform: scale(1); }
                    25% { transform: scale(1.3); }
                    50% { transform: scale(1); }
                    75% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </button>
    );
};
