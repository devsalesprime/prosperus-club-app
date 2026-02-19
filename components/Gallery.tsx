import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, RefreshCw, ArrowLeft, Calendar, Image as ImageIcon, Heart } from 'lucide-react';
import { galleryService } from '../services/galleryService';
import { favoriteService } from '../services/favoriteService';
import { GalleryAlbum } from '../types';

/**
 * FASE 6 (ATUALIZADA): Multi-Álbum Gallery System
 * 
 * GalleryList - Shows all available albums as cards (with favorite button)
 * GalleryViewer - Shows a single album's embedded gallery
 */

// Album Detail Viewer Component
export const GalleryViewer: React.FC<{ album: GalleryAlbum; onBack: () => void }> = ({ album, onBack }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleIframeLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleRetry = () => {
        setIsLoading(true);
        setHasError(false);
        window.location.reload();
    };

    return (
        <div className="w-full min-h-[calc(100vh-140px)] md:min-h-0 md:h-full flex flex-col">
            {/* Header with Banner or Simple Header */}
            {album.coverImage ? (
                <div className="relative overflow-hidden border-b border-slate-800">
                    {/* Back Button — sticky, always visible above banner */}
                    <div className="sticky top-0 z-30 bg-gradient-to-b from-slate-900/90 to-transparent p-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white hover:bg-slate-900 transition px-4 py-2 rounded-lg border border-slate-700 shadow-lg"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium">Voltar</span>
                        </button>
                    </div>

                    {/* Cover Image */}
                    <div className="relative h-48 md:h-64 -mt-16">
                        <img
                            src={album.coverImage}
                            alt={album.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                        {/* Title and Date (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{album.title}</h2>
                            {album.description && (
                                <p className="text-slate-300 text-sm md:text-base mb-3 max-w-3xl">{album.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Calendar size={16} />
                                <span>{new Date(album.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 p-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Voltar</span>
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">{album.title}</h2>
                        {album.description && (
                            <p className="text-sm text-slate-400 mt-1">{album.description}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Iframe Container - Mobile: full height, Desktop: flex-1 with min-height */}
            <div className="flex-1 min-h-[calc(100vh-200px)] md:min-h-[500px] bg-slate-900 rounded-none md:rounded-b-xl overflow-hidden relative">
                {/* Loading State */}
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
                            <p className="text-slate-400 text-sm">Carregando Galeria...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
                            <div className="p-4 bg-red-500/10 rounded-full">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Não foi possível carregar a galeria</h3>
                            <p className="text-slate-400 text-sm">
                                Verifique sua conexão com a internet ou tente novamente mais tarde.
                            </p>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
                            >
                                <RefreshCw size={18} />
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                )}

                {/* Iframe - Mobile: altura expansível, Desktop: comportamento padrão */}
                {!hasError && (
                    <>
                        <iframe
                            src={album.embedUrl}
                            className="w-full h-full min-h-[calc(100vh-200px)] md:min-h-[500px] relative z-10 border-0"
                            frameBorder="0"
                            allowFullScreen
                            allow="fullscreen; autoplay"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation"
                            style={{ pointerEvents: 'auto', touchAction: 'auto' }}
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                            title={`Galeria: ${album.title}`}
                        />
                        {/* Fallback: abrir no navegador */}
                        <div className="absolute bottom-4 right-4 z-30">
                            <a
                                href={album.embedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition border border-slate-700 shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                Abrir no navegador
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Album List Component
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
        e.stopPropagation(); // Don't trigger album selection
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
                                            // Fallback to icon if image fails to load
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

// Main Gallery Component (Router)
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
