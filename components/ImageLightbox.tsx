// ImageLightbox.tsx
// Fullscreen image viewer for chat media — Premium glassmorphism design

import React, { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
    src: string;
    alt?: string;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt = 'Imagem', onClose }) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = alt || 'image';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
                    title="Download"
                >
                    <Download size={20} />
                </button>
                <button
                    onClick={onClose}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
                    title="Fechar"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Image */}
            <img
                src={src}
                alt={alt}
                className="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};
