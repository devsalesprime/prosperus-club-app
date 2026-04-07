import React from 'react';
import { Video } from '../../types';
import { Play, Clock, CheckCircle2 } from 'lucide-react';
import { FavoriteButton } from './../FavoriteButton';

interface VideoCardProps {
    video: Video;
    onClick: () => void;
    progress?: number;
    initialFavorited?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
    video,
    onClick,
    progress = 0,
    initialFavorited,
}) => {
    return (
        /*
         * w-[85vw] max-w-[280px] → mobile: carrossel com peek effect (próximo card espia na borda)
         * md:w-auto              → desktop: preenche a célula do grid
         * shrink-0 snap-center  → mobile: impede compressão e ancora no snap
         * md:snap-align-none    → desktop: desativa snap
         */
        <div
            onClick={onClick}
            className="w-[85vw] max-w-[280px] md:w-auto shrink-0 snap-center md:snap-align-none bg-prosperus-box border border-prosperus-stroke rounded-2xl overflow-hidden shadow-lg group cursor-pointer relative flex flex-col transition-shadow duration-200 hover:shadow-xl hover:border-prosperus-gold-dark/40"
        >
            {/* ── Thumbnail ─────────────────────────────────────── */}
            <div className="aspect-video w-full overflow-hidden relative bg-prosperus-navy/50">
                {video.thumbnail ? (
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Play size={28} className="text-prosperus-muted-text opacity-40" />
                    </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-11 h-11 bg-prosperus-gold-light rounded-full flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
                        <Play className="text-prosperus-navy fill-prosperus-navy ml-0.5" size={20} />
                    </div>
                </div>

                {/* Progresso Grade (barra na base da thumbnail) */}
                {progress > 0 && (
                    <div className="h-1.5 bg-black/40 w-full absolute bottom-0 z-10">
                        <div
                            className="h-full bg-gradient-to-r from-prosperus-gold-dark to-prosperus-gold-light transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Badges top-left */}
                {progress === 100 && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-emerald-500/90 text-white px-2 py-1 rounded-lg text-[11px] font-bold backdrop-blur-sm">
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        Concluído
                    </div>
                )}
                {progress > 0 && progress < 100 && (
                    <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-prosperus-gold-light px-2 py-1 rounded-lg text-[11px] font-bold">
                        {progress}%
                    </div>
                )}

                {/* Favorite */}
                <FavoriteButton
                    entityType="video"
                    entityId={video.id}
                    initialFavorited={initialFavorited}
                    overlay
                    size={15}
                    className="top-2 right-2 z-10"
                />

                {/* Duration */}
                {video.duration && (
                    <div className="absolute bottom-3 right-2 z-10 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] text-white flex items-center gap-1">
                        <Clock size={10} strokeWidth={2.5} />
                        {video.duration}
                    </div>
                )}
            </div>

            {/* ── Info ──────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 p-3 gap-1">
                <h4 className="text-prosperus-white font-semibold text-sm line-clamp-2 leading-snug group-hover:text-prosperus-gold-light transition-colors duration-150">
                    {video.title}
                </h4>
                <p className="text-prosperus-muted-text text-xs truncate">
                    {video.category}
                </p>
                {progress > 0 && progress < 100 && (
                    <p className="text-prosperus-gold-dark text-[11px] font-semibold mt-0.5">
                        {progress}% assistido
                    </p>
                )}
                {progress === 100 && (
                    <p className="text-emerald-400 text-[11px] font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Concluído
                    </p>
                )}
            </div>
        </div>
    );
};
