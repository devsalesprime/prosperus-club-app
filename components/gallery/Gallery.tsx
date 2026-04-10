import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, RefreshCw, Calendar, Image as ImageIcon, Heart, ExternalLink } from 'lucide-react';
import { galleryService } from '../../services/galleryService';
import { favoriteService } from '../../services/favoriteService';
import { analyticsService } from '../../services/analyticsService';
import { useApp } from '../../contexts/AppContext';
import { GalleryAlbum } from '../../types';

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
    const { currentUser } = useApp();
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
        analyticsService.trackGalleryView(currentUser?.id || null, album.id, album.title);
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
        <div className="bg-gradient-to-b from-prosperus-dark-start to-prosperus-dark-end min-h-screen px-4 pt-8 pb-24">
            {/* Header Centralizado */}
            <div className="flex flex-col items-center text-center mb-8">
                <h2 className="text-3xl font-bold text-prosperus-white tracking-tight mb-2">Galeria de Fotos</h2>
                <p className="text-sm text-prosperus-grey">Reviva os melhores momentos dos nossos encontros</p>
            </div>

            {/* Cards Stack */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="group flex flex-col h-full bg-prosperus-box rounded-2xl overflow-hidden hover:border-prosperus-gold/50 transition-all duration-300 cursor-pointer border border-prosperus-stroke"
                        onClick={() => handleOpenGallery(album)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleOpenGallery(album); }}
                    >
                        {/* Imagem Hero com Overlay */}
                        <div className="relative h-52 overflow-hidden">
                            {album.coverImage ? (
                                <>
                                    <img
                                        src={album.coverImage}
                                        alt={album.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        decoding="async"
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
                                </>
                            ) : (
                                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 flex items-center justify-center h-full">
                                    <div className="p-4 bg-slate-900 rounded-full border border-slate-800 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-12 h-12 text-yellow-600" />
                                    </div>
                                </div>
                            )}

                            {/* Gradiente sutil na base da imagem */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                            {/* Favorite Button */}
                            <button
                                onClick={(e) => handleToggleFavorite(e, album.id)}
                                disabled={togglingFav === album.id}
                                className={`absolute top-3 left-3 z-30 p-2 rounded-full transition-all shadow-lg backdrop-blur-sm ${favoritedIds.has(album.id)
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

                            {/* Botão "Acessar Galeria" overlay */}
                            <div className="absolute bottom-3 right-3 z-20 text-prosperus-navy px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg transition-opacity group-hover:opacity-90" style={{ background: 'linear-gradient(93.9deg, #FFDA71 0%, #CA9A43 100%)' }}>
                                <ExternalLink size={16} />
                                Acessar Galeria
                            </div>
                        </div>

                        {/* Título do Álbum */}
                        <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-lg font-bold text-prosperus-white group-hover:text-prosperus-gold transition-colors line-clamp-2">
                                {album.title}
                            </h3>

                            <div className="my-3 mt-auto">
                                <div className="w-full h-[1px] bg-prosperus-stroke" />
                            </div>

                            {album.description && (
                                <p className="text-sm text-prosperus-grey line-clamp-2">
                                    {album.description}
                                </p>
                            )}
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
