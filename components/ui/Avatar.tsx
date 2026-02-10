import React, { useState } from 'react';

/**
 * Avatar Component - Centralized avatar display with consistent fallback
 * 
 * Always falls back to /default-avatar.svg when:
 * - src is null, undefined, or empty string
 * - Image fails to load (onError)
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
    src?: string | null;
    alt: string;
    size?: AvatarSize;
    className?: string;
    onClick?: () => void;
}

const DEFAULT_AVATAR = '/default-avatar.svg';

const sizeClasses: Record<AvatarSize, string> = {
    'xs': 'w-6 h-6',
    'sm': 'w-8 h-8',
    'md': 'w-10 h-10',
    'lg': 'w-14 h-14',
    'xl': 'w-20 h-20',
    '2xl': 'w-32 h-32',
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    size = 'md',
    className = '',
    onClick
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Determine the image source
    const imageSrc = (!src || src.trim() === '' || hasError)
        ? DEFAULT_AVATAR
        : src;

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const baseClasses = `${sizeClasses[size]} rounded-full object-cover border border-slate-700 bg-slate-800`;
    const interactiveClasses = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={`${baseClasses} ${interactiveClasses} ${className}`}
            onError={handleError}
            onLoad={handleLoad}
            onClick={onClick}
            loading="lazy"
        />
    );
};

/**
 * AvatarWithFallback - For edit forms where we need controlled state
 */
interface AvatarEditableProps {
    src?: string | null;
    alt: string;
    size?: AvatarSize;
    className?: string;
}

export const AvatarEditable: React.FC<AvatarEditableProps> = ({
    src,
    alt,
    size = 'xl',
    className = ''
}) => {
    const [hasError, setHasError] = useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
        setHasError(false);
    }, [src]);

    const imageSrc = (!src || src.trim() === '' || hasError)
        ? DEFAULT_AVATAR
        : src;

    const baseClasses = `${sizeClasses[size]} rounded-full object-cover border-2 border-slate-700 bg-slate-800`;

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={`${baseClasses} ${className}`}
            onError={() => setHasError(true)}
        />
    );
};

export default Avatar;
