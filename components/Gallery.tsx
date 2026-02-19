import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, RefreshCw, ArrowLeft, Calendar, Image as ImageIcon, Heart } from 'lucide-react';
import { galleryService } from '../services/galleryService';
import { favoriteService } from '../services/favoriteService';
import { GalleryAlbum } from '../types';

/**
 * GALERIA — Smart Launcher Pattern
 * 
 * GalleryList  → Shows all available albums as cards (with favorite button)
 * GalleryViewer → Full-screen cover + CTA that opens gallery in native browser
 *                 (bypasses iframe restrictions on Pixellu lightbox)
 */

// ============================================
// Album Detail Viewer — Smart Launcher
// ============================================
export const GalleryViewer: React.FC<{ album: GalleryAlbum; onBack: () => void }> = ({ album, onBack }) => {

    const handleOpenGallery = () => {
        window.open(album.embedUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="h-full w-full relative flex flex-col justify-end -m-4 md:-m-8" style={{ width: 'calc(100% + 2rem)', height: 'calc(100% + 2rem)' }}>
            {/* Background Cover Image */}
            {album.coverImage ? (
                <img
                    src={album.coverImage}
                    alt={album.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
            )}

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30" />

            {/* Back Button — top-left, always visible */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/70 backdrop-blur-sm text-white hover:bg-slate-900 transition px-4 py-2.5 rounded-xl border border-slate-700/50 shadow-lg"
            >
                <ArrowLeft size={18} />
                <span className="font-medium text-sm">Voltar</span>
            </button>

            {/* Content — Bottom positioned, thumb-reachable on mobile */}
            <div className="relative z-10 p-6 pb-8 space-y-5">
                {/* Date Badge */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={14} />
                    <span>{new Date(album.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {album.title}
                </h2>

                {/* Description */}
                {album.description && (
                    <p className="text-slate-300 text-base leading-relaxed max-w-xl">
                        {album.description}
                    </p>
                )}

                {/* CTA Button — Full width, gold, prominent */}
                <button
                    onClick={handleOpenGallery}
                    className="w-full flex items-center justify-center gap-3 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-yellow-600/20 active:scale-[0.98]"
                >
                    <ImageIcon size={22} />
                    Abrir Galeria Completa
                </button>

                {/* Subtle hint */}
                <p className="text-center text-xs text-slate-500">
                    Abre no navegador para visualização completa das fotos
                </p>
            </div>
        </div>
    );
};

// ============================================
// Album List Component
// ============================================
export const GalleryList: React.FC<{ onSelectAlbum: (album: GalleryAlbum) => void }> = ({ onSelectAlbum }) => {
    const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
    const [togglingFav, setTogglingFav] = useState<string | null>(null);

    useEffect(() => {
        loadAlbums();
        loadFavoritedIds();
    }, []);

    const loadAlbums = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await galleryService.getAllAlbums();
            setAlbums(data);
        } catch (err) {
            console.error('Error loading albums:', err);
            setError('Não foi possível carregar as galerias. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadFavoritedIds = async () => {
        try {
            const ids = await favoriteService.getFavoritedIds('gallery');
            setFavoritedIds(ids);
        } catch (err) {
            console.error('Error loading gallery favorites:', err);
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, albumId: string) => {
        e.stopPropagation();
        setTogglingFav(albumId);
        try {
            const isFav = await favoriteService.toggleFavorite('gallery', albumId);
            setFavoritedIds(prev => {
                const next = new Set(prev);
                if (isFav) {
                    next.add(albumId);
                } else {
                    next.delete(albumId);
                }
                return next;
            });
        } catch (err) {
            console.error('Error toggling gallery favorite:', err);
        } finally {
            setTogglingFav(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
                    <p className="text-slate-400 text-sm">Carregando galerias...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Erro ao carregar</h3>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <button
                        onClick={loadAlbums}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
                    >
                        <RefreshCw size={18} />
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (albums.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4 text-center p-6">
                    <div className="p-4 bg-slate-800 rounded-full">
                        <ImageIcon className="w-12 h-12 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Nenhuma galeria disponível</h3>
                    <p className="text-slate-400 text-sm">
                        As galerias de fotos dos eventos aparecerão aqui em breve.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Galerias de Fotos</h2>
                <p className="text-slate-400">Reviva os melhores momentos dos nossos eventos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-yellow-600/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative"
                    >
                        {/* Favorite Button (top-right) */}
                        <button
                            onClick={(e) => handleToggleFavorite(e, album.id)}
                            disabled={togglingFav === album.id}
                            className={`absolute top-3 right-3 z-30 p-2 rounded-full transition-all shadow-lg backdrop-blur-sm ${favoritedIds.has(album.id)
                                ? 'bg-red-500/90 text-white hover:bg-red-600'
                                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-900/90 hover:text-red-400'
                                }`}
                            title={favoritedIds.has(album.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                            {togglingFav === album.id ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Heart
                                    size={16}
                                    fill={favoritedIds.has(album.id) ? 'currentColor' : 'none'}
                                />
                            )}
                        </button>

                        {/* Clickable Area */}
                        <button
                            onClick={() => onSelectAlbum(album)}
                            className="w-full text-left"
                        >
                            {/* Card Header with Cover Image or Icon */}
                            {album.coverImage ? (
                                <div className="relative h-48 overflow-hidden border-b border-slate-800">
                                    <img
                                        src={album.coverImage}
                                        alt={album.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                    <div className="hidden absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 items-center justify-center">
                                        <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                                            <ImageIcon className="w-12 h-12 text-yellow-600" />
                                        </div>
                                    </div>
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 p-8 flex items-center justify-center border-b border-slate-800 h-48">
                                    <div className="p-4 bg-slate-900 rounded-full border border-slate-800 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-12 h-12 text-yellow-600" />
                                    </div>
                                </div>
                            )}

                            {/* Card Content */}
                            <div className="p-6 space-y-3">
                                <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-2">
                                    {album.title}
                                </h3>

                                {album.description && (
                                    <p className="text-sm text-slate-400 line-clamp-3">
                                        {album.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
                                    <Calendar size={14} />
                                    <span>{new Date(album.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// Main Gallery Component (Router)
// ============================================
export const Gallery: React.FC = () => {
    const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

    if (selectedAlbum) {
        return (
            <GalleryViewer
                album={selectedAlbum}
                onBack={() => setSelectedAlbum(null)}
            />
        );
    }

    return <GalleryList onSelectAlbum={setSelectedAlbum} />;
};
