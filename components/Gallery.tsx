import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, RefreshCw, Calendar, Image as ImageIcon, Heart, ExternalLink } from 'lucide-react';
import { galleryService } from '../services/galleryService';
import { favoriteService } from '../services/favoriteService';
import { GalleryAlbum } from '../types';

/**
 * GALERIA — One-Click Access Pattern
 * 
 * Cards abrem a galeria Pixellu diretamente no navegador nativo
 * (sem tela intermediária — reduz cliques e melhora UX)
 */

// ============================================
// Album List Component (Grid with Direct Access)
// ============================================
const GalleryList: React.FC = () => {
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
        e.preventDefault();
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

    /** One-Click: abre a galeria direto no navegador nativo */
    const handleOpenGallery = (album: GalleryAlbum) => {
        window.open(album.embedUrl, '_blank', 'noopener,noreferrer');
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
        <div className="space-y-6 px-4 pt-4 pb-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Galerias de Fotos</h2>
                <p className="text-slate-400">Reviva os melhores momentos dos nossos eventos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-yellow-600/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative cursor-pointer"
                        onClick={() => handleOpenGallery(album)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleOpenGallery(album); }}
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

                        {/* Card Header with Cover Image or Icon */}
                        <div className="relative">
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

                            {/* ✨ "Acessar Galeria" Overlay Badge — always visible */}
                            <div className="absolute bottom-3 right-3 z-20 bg-yellow-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm shadow-lg group-hover:bg-yellow-500 transition-colors">
                                <ExternalLink size={16} />
                                Acessar Galeria
                            </div>
                        </div>

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
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// Main Gallery Component (Direct Render)
// ============================================
export const Gallery: React.FC = () => {
    return <GalleryList />;
};

export default Gallery;
