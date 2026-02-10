import React from 'react';
import { Video } from '../types';
import { Play, Clock } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

interface VideoCardProps {
    video: Video;
    onClick: () => void;
    progress?: number;
    initialFavorited?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, progress = 0, initialFavorited }) => {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer flex-shrink-0 w-64 transition-transform hover:scale-105 snap-start"
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden mb-2">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                />

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Play className="text-black fill-black ml-1" size={24} />
                    </div>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-700">
                        <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Progress Badge */}
                {progress > 0 && progress < 100 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                        {progress}%
                    </div>
                )}

                {/* Favorite Button */}
                <FavoriteButton
                    entityType="video"
                    entityId={video.id}
                    initialFavorited={initialFavorited}
                    overlay
                    size={16}
                    className="top-2 right-2"
                />

                {/* Completed Badge */}
                {progress === 100 && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        ✓ Concluído
                    </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Clock size={12} />
                    {video.duration}
                </div>
            </div>

            {/* Info */}
            <div>
                <h4 className="text-white font-bold text-sm line-clamp-2 mb-1">
                    {video.title}
                </h4>
                <p className="text-slate-400 text-xs">
                    {video.category}
                </p>
                {progress > 0 && progress < 100 && (
                    <p className="text-yellow-500 text-xs font-bold mt-1">
                        {progress}% assistido
                    </p>
                )}
                {progress === 100 && (
                    <p className="text-green-500 text-xs font-bold mt-1">
                        ✓ Concluído
                    </p>
                )}
            </div>
        </div>
    );
};
