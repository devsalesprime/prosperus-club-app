// FavoritesPage.tsx
// Full-page view for viewing and managing all user favorites
// Organized by category tabs: Videos, Galeria, Eventos, Sócios

import React, { useState, useEffect, useCallback } from 'react';
import {
    Heart,
    Video,
    Calendar,
    Users,
    Loader2,
    Trash2,
    ExternalLink,
    Image as ImageIcon
} from 'lucide-react';
import { favoriteService, UserFavorite, FavoriteEntityType } from '../services/favoriteService';
import { ViewState } from '../types';

type FavoriteTab = 'all' | 'video' | 'gallery' | 'event' | 'member';

interface FavoritesPageProps {
    setView: (view: ViewState) => void;
    currentUserId: string;
}

const TABS: { key: FavoriteTab; label: string; icon: React.ReactNode; entityType?: string }[] = [
    { key: 'all', label: 'Todos', icon: <Heart size={16} /> },
    { key: 'video', label: 'Vídeos', icon: <Video size={16} />, entityType: 'video' },
    { key: 'gallery', label: 'Galeria', icon: <ImageIcon size={16} />, entityType: 'gallery' },
    { key: 'event', label: 'Eventos', icon: <Calendar size={16} />, entityType: 'event' },
    { key: 'member', label: 'Sócios', icon: <Users size={16} />, entityType: 'member' }
];

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ setView, currentUserId }) => {
    const [activeTab, setActiveTab] = useState<FavoriteTab>('all');
    const [favorites, setFavorites] = useState<UserFavorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);

    const loadFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const entityType = activeTab === 'all' ? undefined : activeTab as FavoriteEntityType;
            const data = await favoriteService.getFavorites(entityType);
            setFavorites(data);
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    const handleRemove = async (entityType: string, entityId: string) => {
        const key = `${entityType}-${entityId}`;
        setRemoving(key);
        try {
            await favoriteService.removeFavoriteByEntity(entityType as FavoriteEntityType, entityId);
            setFavorites(prev => prev.filter(f => !(f.entity_type === entityType && f.entity_id === entityId)));
        } catch (error) {
            console.error('Error removing favorite:', error);
        } finally {
            setRemoving(null);
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={18} className="text-red-400" />;
            case 'gallery': return <ImageIcon size={18} className="text-yellow-400" />;
            case 'event': return <Calendar size={18} className="text-emerald-400" />;
            case 'member': return <Users size={18} className="text-purple-400" />;
            default: return <Heart size={18} className="text-yellow-500" />;
        }
    };

    const getEntityLabel = (type: string) => {
        switch (type) {
            case 'video': return 'Vídeo';
            case 'gallery': return 'Galeria';
            case 'event': return 'Evento';
            case 'member': return 'Sócio';
            default: return 'Item';
        }
    };

    const handleNavigate = (item: UserFavorite) => {
        switch (item.entity_type) {
            case 'video':
                setView(ViewState.ACADEMY);
                break;
            case 'gallery':
                setView(ViewState.GALLERY);
                break;
            case 'event':
                setView(ViewState.AGENDA);
                break;
            case 'member':
                setView(ViewState.MEMBERS);
                break;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                        <Heart className="text-red-500" size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Meus Favoritos</h1>
                        <p className="text-slate-400 text-sm">
                            {favorites.length} {favorites.length === 1 ? 'item salvo' : 'itens salvos'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-xl p-1.5 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-yellow-500 mb-3" size={32} />
                    <p className="text-slate-400 text-sm">Carregando favoritos...</p>
                </div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-20">
                    <Heart className="text-slate-700 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-2">
                        {activeTab === 'all' ? 'Nenhum favorito ainda' : `Nenhum ${getEntityLabel(activeTab).toLowerCase()} favorito`}
                    </h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Toque no ❤️ em vídeos, galerias, eventos ou sócios para salvá-los aqui.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {favorites.map(item => (
                        <div
                            key={`${item.entity_type}-${item.entity_id}`}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors group"
                        >
                            {/* Entity Icon */}
                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                                {getEntityIcon(item.entity_type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.entity_type === 'video' ? 'bg-red-500/20 text-red-400' :
                                        item.entity_type === 'gallery' ? 'bg-yellow-500/20 text-yellow-400' :
                                            item.entity_type === 'event' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-purple-500/20 text-purple-400'
                                        }`}>
                                        {getEntityLabel(item.entity_type)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Salvo em {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                </p>
                                <p className="text-[10px] text-slate-600 font-mono truncate">
                                    ID: {item.entity_id.substring(0, 8)}...
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleNavigate(item)}
                                    className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition"
                                    title="Ir para o conteúdo"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                <button
                                    onClick={() => handleRemove(item.entity_type, item.entity_id)}
                                    disabled={removing === `${item.entity_type}-${item.entity_id}`}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                    title="Remover dos favoritos"
                                >
                                    {removing === `${item.entity_type}-${item.entity_id}` ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
