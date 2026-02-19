// ============================================
// CATEGORY CARD - Sharp Luxury Design
// ============================================
// Card de categoria para o grid da Academy (área do sócio)

import React from 'react';
import { VideoCategory } from '../types';
import { Play } from 'lucide-react';

interface CategoryCardProps {
    category: VideoCategory;
    videoCount: number;
    onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, videoCount, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="h-48 rounded-xl overflow-hidden relative cursor-pointer group bg-slate-800 border border-transparent hover:border-yellow-500/50 transition-all duration-300"
        >
            {/* Cover Image */}
            {category.coverImage ? (
                <img
                    src={category.coverImage}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent group-hover:from-slate-900 transition-all duration-300" />

            {/* Play Icon on Hover */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Play className="fill-black text-black" size={18} />
                </div>
            </div>

            {/* Text Content - Bottom Positioned */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors duration-300 mb-1">
                    {category.name}
                </h3>
                {category.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {category.description}
                    </p>
                )}
                <span className="text-xs text-slate-500 font-medium">
                    {videoCount} vídeo{videoCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
};
