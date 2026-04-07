// ============================================
// ACADEMY MODULE - Admin Component (Refactored)
// ============================================
// Gerenciamento de vídeos/aulas + categorias com abas de navegação
// Refatorado: alert→toast, confirm→AdminConfirmDialog, shared components

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Video as VideoIcon, FolderOpen, Pencil, Trash2, Image, Search, Filter, Clock, Calendar, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Pin, PinOff } from 'lucide-react';
import { Video, VideoCategory } from '../../types';
import { VideoMaterialsUpload, PendingMaterial } from './VideoMaterialsUpload';
import {
    AdminPageHeader,
    AdminModal,
    AdminFormInput,
    AdminConfirmDialog,
    AdminTable,
    AdminActionButton,
    AdminLoadingState,
    AdminEmptyState,
} from './shared';

interface AcademyModuleProps {
    DataTable: React.FC<any>;
}

type AdminTab = 'videos' | 'categories';

export const AcademyModule: React.FC<AcademyModuleProps> = ({ DataTable }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('videos');
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<VideoCategory[]>([]);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Partial<Video>>({});
    const [editingCategory, setEditingCategory] = useState<Partial<VideoCategory>>({});
    const [isPartOfSeries, setIsPartOfSeries] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);

    // ── Filter & Pagination state ─────────────────────
    const [searchTitle, setSearchTitle] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterDuration, setFilterDuration] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalVideos, setTotalVideos] = useState(0);

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        action: 'deleteVideo' | 'deleteCategory' | null;
        title: string;
        message: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, action: null, title: '', message: '', isLoading: false });

    // ============================================
    // DATA LOADING
    // ============================================

    const loadVideos = async () => {
        try {
            const { videoService } = await import('../../services/videoService');
            const result = await videoService.listVideosPaginated(currentPage, pageSize);
            setVideos(result.data);
            setTotalVideos(result.total);
        } catch (error: any) {
            if (error?.message?.includes('AbortError') || error?.code === 'ABORT_ERR') return;
            console.error('Error loading videos:', error);
            toast.error('Erro ao carregar vídeos. Verifique a conexão com o banco de dados.');
        }
    };

    const loadCategories = async () => {
        try {
            const { videoService } = await import('../../services/videoService');
            const data = await videoService.getCategories();
            setCategories(data);
        } catch (error: any) {
            if (error?.message?.includes('AbortError') || error?.code === 'ABORT_ERR') return;
            console.error('Error loading categories:', error);
        }
    };

    useEffect(() => {
        Promise.all([loadVideos(), loadCategories()]).finally(() => setInitialLoading(false));
    }, [currentPage, pageSize]);

    // ============================================
    // VIDEO CRUD
    // ============================================

    const openVideoModal = (video?: Video) => {
        if (video) {
            setEditingVideo(video);
            setIsPartOfSeries(!!video.seriesId);
        } else {
            setEditingVideo({});
            setIsPartOfSeries(false);
        }
        setIsVideoModalOpen(true);
    };

    const handleSaveVideo = async () => {
        if (!editingVideo.title || !editingVideo.videoUrl) {
            toast.error('Título e URL do Vídeo são obrigatórios.');
            return;
        }
        try {
            setIsLoading(true);
            const { videoService } = await import('../../services/videoService');

            // Find category name from selected categoryId
            const selectedCategory = categories.find(c => c.id === editingVideo.categoryId);

            const videoData = {
                title: editingVideo.title,
                description: editingVideo.description || '',
                videoUrl: editingVideo.videoUrl,
                thumbnail: editingVideo.thumbnail || '',
                duration: editingVideo.duration || '0:00',
                category: selectedCategory?.name || editingVideo.category || 'Geral',
                categoryId: editingVideo.categoryId,
                seriesId: isPartOfSeries ? editingVideo.seriesId : undefined,
                seriesOrder: isPartOfSeries ? editingVideo.seriesOrder : undefined
            };
            if (editingVideo.id) {
                await videoService.updateVideo(editingVideo.id, videoData);
            } else {
                const newVideo = await videoService.createVideo(videoData);

                // Upload pending materials if any
                if (pendingMaterials.length > 0) {
                    for (let i = 0; i < pendingMaterials.length; i++) {
                        const pm = pendingMaterials[i];
                        if (pm.type === 'link' && pm.url) {
                            await videoService.addVideoMaterialLink(newVideo.id, pm.url, pm.title, i);
                        } else if (pm.file) {
                            await videoService.uploadVideoMaterial(newVideo.id, pm.file, pm.title, i);
                        }
                    }
                }

                // 🔔 Notificar todos os sócios sobre novo vídeo (fire-and-forget)
                import('../../services/notificationTriggers').then(({ notifyNewVideo }) => {
                    notifyNewVideo(videoData.title, '').catch(() => { });
                });
            }
            setIsVideoModalOpen(false);
            setEditingVideo({});
            setIsPartOfSeries(false);
            setPendingMaterials([]);
            await loadVideos();
            toast.success('Vídeo salvo com sucesso!');
        } catch (error) {
            console.error('Error saving video:', error);
            toast.error('Erro ao salvar vídeo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const requestDeleteVideo = (id: string) => {
        setConfirmState({
            isOpen: true,
            id,
            action: 'deleteVideo',
            title: 'Excluir Vídeo',
            message: 'Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.',
            isLoading: false,
        });
    };

    const executeDeleteVideo = async (id: string) => {
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            const { videoService } = await import('../../services/videoService');
            await videoService.deleteVideo(id);
            await loadVideos();
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.success('Vídeo excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting video:', error);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir vídeo. Tente novamente.');
        }
    };

    // ============================================
    // CURADORIA DE CONTEÚDOM (Optimistic UI)
    // ============================================

    /**
     * Fixar / Desfixar vídeo no topo.
     * Optimistic UI: atualiza o estado local imediatamente.
     */
    const handleTogglePin = async (video: Video) => {
        const newPinState = !video.is_pinned;

        // 🚀 OPTIMISTIC: atualiza visualmente já
        setVideos(prev =>
            prev.map(v => v.id === video.id ? { ...v, is_pinned: newPinState } : v)
        );

        try {
            const { videoService } = await import('../../services/videoService');
            await videoService.toggleVideoPin(video.id, video.is_pinned ?? false);
            toast.success(newPinState ? '📌 Vídeo fixado no topo!' : 'Vídeo desafixado.');
        } catch (error) {
            // Rollback
            setVideos(prev =>
                prev.map(v => v.id === video.id ? { ...v, is_pinned: video.is_pinned } : v)
            );
            toast.error('Erro ao alterar pin. Tente novamente.');
        }
    };

    /**
     * Subir ou Descer vídeo na ordenação.
     * Optimistic UI: faz o swap no array local imediatamente.
     */
    const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= paginatedVideos.length) return;

        const videoA = paginatedVideos[index];
        const videoB = paginatedVideos[targetIndex];
        const orderA = videoA.order_index ?? index;
        const orderB = videoB.order_index ?? targetIndex;

        // 🚀 OPTIMISTIC: troca no array local
        setVideos(prev => {
            const next = [...prev];
            const idxA = next.findIndex(v => v.id === videoA.id);
            const idxB = next.findIndex(v => v.id === videoB.id);
            if (idxA === -1 || idxB === -1) return prev;
            next[idxA] = { ...videoA, order_index: orderB };
            next[idxB] = { ...videoB, order_index: orderA };
            // reordenar
            return [...next].sort((a, b) => {
                if ((b.is_pinned ? 1 : 0) !== (a.is_pinned ? 1 : 0)) return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
                return (a.order_index ?? 0) - (b.order_index ?? 0);
            });
        });

        try {
            const { videoService } = await import('../../services/videoService');
            await videoService.updateVideoOrder(videoA.id, orderB, videoB.id, orderA);
            toast.success(direction === 'up' ? '↑ Vídeo movido para cima' : '↓ Vídeo movido para baixo');
        } catch (error) {
            // Rollback: recarrega do banco
            await loadVideos();
            toast.error('Erro ao reordenar. A ordem foi restaurada.');
        }
    };

    // ============================================
    // CATEGORY CRUD
    // ============================================

    const openCategoryModal = (category?: VideoCategory) => {
        setEditingCategory(category ? { ...category } : {});
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!editingCategory.name) {
            toast.error('Nome da categoria é obrigatório.');
            return;
        }
        try {
            setIsLoading(true);
            const { videoService } = await import('../../services/videoService');
            if (editingCategory.id) {
                await videoService.updateCategory(editingCategory.id, editingCategory);
            } else {
                await videoService.createCategory(editingCategory);
            }
            setIsCategoryModalOpen(false);
            setEditingCategory({});
            await loadCategories();
            toast.success('Categoria salva com sucesso!');
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Erro ao salvar categoria. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const requestDeleteCategory = (id: string) => {
        setConfirmState({
            isOpen: true,
            id,
            action: 'deleteCategory',
            title: 'Excluir Categoria',
            message: 'Excluir esta categoria? Os vídeos vinculados perderão a categoria.',
            isLoading: false,
        });
    };

    const executeDeleteCategory = async (id: string) => {
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            const { videoService } = await import('../../services/videoService');
            await videoService.deleteCategory(id);
            await loadCategories();
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.success('Categoria excluída com sucesso!');
        } catch (error) {
            console.error('Error deleting category:', error);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir categoria. Tente novamente.');
        }
    };

    // Confirm Dialog handler
    const handleConfirm = () => {
        if (!confirmState.id) return;
        if (confirmState.action === 'deleteVideo') {
            executeDeleteVideo(confirmState.id);
        } else if (confirmState.action === 'deleteCategory') {
            executeDeleteCategory(confirmState.id);
        }
    };

    // Helper: count videos per category
    const getVideoCount = (categoryId: string) =>
        videos.filter(v => v.categoryId === categoryId).length;

    // Helper: get category name for video display
    const getCategoryName = (video: Video) => {
        if (video.categoryId) {
            return categories.find(c => c.id === video.categoryId)?.name || video.category || 'Sem categoria';
        }
        return video.category || 'Sem categoria';
    };

    // ── Parse duration string "MM:SS" to total seconds ──
    const parseDuration = (dur: string): number => {
        const parts = dur.split(':').map(Number);
        if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
        if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        return 0;
    };

    // ── Filtered & sorted videos ──────────────────────
    const filteredVideos = useMemo(() => {
        let result = [...videos];

        // Title search
        if (searchTitle.trim()) {
            const q = searchTitle.toLowerCase().trim();
            result = result.filter(v => v.title.toLowerCase().includes(q));
        }

        // Category filter
        if (filterCategory) {
            result = result.filter(v => v.categoryId === filterCategory);
        }

        // Duration filter
        if (filterDuration) {
            result = result.filter(v => {
                const secs = parseDuration(v.duration || '0:00');
                switch (filterDuration) {
                    case 'short':  return secs <= 300;       // ≤ 5min
                    case 'medium': return secs > 300 && secs <= 900;  // 5-15min
                    case 'long':   return secs > 900 && secs <= 1800; // 15-30min
                    case 'extra':  return secs > 1800;       // > 30min
                    default: return true;
                }
            });
        }

        // Sort by date (uses array index as proxy — videos come sorted from API)
        if (sortOrder === 'oldest') {
            result.reverse();
        }

        return result;
    }, [videos, searchTitle, filterCategory, filterDuration, sortOrder]);

    // ── Pagination (server-side count + client-side filter) ──
    const totalPages = Math.max(1, Math.ceil(
        filteredVideos.length > 0 ? totalVideos / pageSize : 1
    ));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    // When using server-side pagination, the filteredVideos already represent one page
    const paginatedVideos = filteredVideos;

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTitle, filterCategory, filterDuration, sortOrder, pageSize]);

    const hasActiveFilters = searchTitle || filterCategory || filterDuration;
    const clearFilters = () => {
        setSearchTitle('');
        setFilterCategory('');
        setFilterDuration('');
        setSortOrder('newest');
    };

    // ============================================
    // RENDER
    // ============================================

    if (initialLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Academy" subtitle="Gerencie categorias e vídeos do clube" />
                <AdminLoadingState message="Carregando Academy..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Academy"
                subtitle="Gerencie categorias e vídeos do clube"
                action={
                    <button
                        onClick={() => activeTab === 'videos' ? openVideoModal() : openCategoryModal()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition"
                    >
                        <Plus size={18} />
                        {activeTab === 'videos' ? 'Novo Vídeo' : 'Nova Categoria'}
                    </button>
                }
            />

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700 w-fit">
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'videos'
                            ? 'bg-yellow-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                >
                    <VideoIcon size={16} />
                    Gerenciar Vídeos
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'categories'
                            ? 'bg-yellow-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                >
                    <FolderOpen size={16} />
                    Gerenciar Categorias
                </button>
            </div>

            {/* ============================================ */}
            {/* VIDEOS TAB */}
            {/* ============================================ */}
            {activeTab === 'videos' && (
                <>
                    {/* ── Filter Bar ──────────────────────────── */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 space-y-3">
                        {/* Row 1: Search + Category + Duration */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Title search */}
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por título..."
                                    value={searchTitle}
                                    onChange={e => setSearchTitle(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-yellow-600 outline-none transition"
                                />
                            </div>

                            {/* Category */}
                            <div className="relative">
                                <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-600 outline-none transition appearance-none cursor-pointer min-w-[160px]"
                                >
                                    <option value="">Todas categorias</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div className="relative">
                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={filterDuration}
                                    onChange={e => setFilterDuration(e.target.value)}
                                    className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-600 outline-none transition appearance-none cursor-pointer min-w-[150px]"
                                >
                                    <option value="">Qualquer duração</option>
                                    <option value="short">Até 5 min</option>
                                    <option value="medium">5 – 15 min</option>
                                    <option value="long">15 – 30 min</option>
                                    <option value="extra">Mais de 30 min</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                    className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-600 outline-none transition appearance-none cursor-pointer min-w-[140px]"
                                >
                                    <option value="newest">Mais recentes</option>
                                    <option value="oldest">Mais antigos</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Results count + clear + page size */}
                        <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Filter size={12} />
                                <span>
                                    {filteredVideos.length} de {totalVideos} vídeo{totalVideos !== 1 ? 's' : ''}
                                    {hasActiveFilters ? ' (filtrado)' : ''}
                                </span>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-yellow-500 hover:text-yellow-400 underline transition text-xs"
                                    >
                                        Limpar filtros
                                    </button>
                                )}
                            </div>

                            {/* Page size selector */}
                            <div className="flex items-center gap-2">
                                <span>Exibir</span>
                                <select
                                    value={pageSize}
                                    onChange={e => setPageSize(Number(e.target.value))}
                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-yellow-600 outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>por página</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Video Table (Desktop) — Custom com Pin + Order ─ */}
                    <div className="hidden md:block overflow-x-auto">
                        <AdminTable title="Vídeos" subtitle={`Página ${safeCurrentPage} de ${totalPages} • Pin > Ordem > Data`}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-prosperus-stroke text-xs text-slate-400 uppercase tracking-wider">
                                        <th className="text-left px-4 py-3">Vídeo</th>
                                        <th className="text-left px-4 py-3">Categoria</th>
                                        <th className="text-left px-4 py-3">Duração</th>
                                        <th className="text-center px-4 py-3">Pin</th>
                                        <th className="text-center px-4 py-3">Ordem</th>
                                        <th className="text-center px-4 py-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-prosperus-stroke/50">
                                    {paginatedVideos.map((v, idx) => (
                                        <tr key={v.id} className={`group hover:bg-prosperus-muted-bg/40 transition-colors ${v.is_pinned ? 'bg-prosperus-gold-dark/5' : ''}`}>
                                            {/* Thumbnail + Título */}
                                            <td className="px-4 py-3 max-w-[260px]">
                                                <div className="flex items-center gap-3">
                                                    {v.is_pinned && (
                                                        <Pin size={12} className="text-prosperus-gold-light fill-current flex-shrink-0" />
                                                    )}
                                                    {v.thumbnail ? (
                                                        <img src={v.thumbnail} alt={v.title} className="w-12 aspect-video object-cover rounded-lg flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-12 aspect-video rounded-lg bg-prosperus-muted-bg flex items-center justify-center flex-shrink-0">
                                                            <VideoIcon size={12} className="text-slate-600" />
                                                        </div>
                                                    )}
                                                    <span className="text-white font-medium truncate min-w-0">{v.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 truncate max-w-[140px]">{getCategoryName(v)}</td>
                                            <td className="px-4 py-3 text-slate-400">{v.duration}</td>
                                            {/* Pin Button */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleTogglePin(v)}
                                                    title={v.is_pinned ? 'Desafixar' : 'Fixar no topo'}
                                                    className={`w-9 h-9 mx-auto flex items-center justify-center rounded-lg border transition-all active:scale-95 ${
                                                        v.is_pinned
                                                            ? 'bg-prosperus-gold-dark/20 border-prosperus-gold-dark text-prosperus-gold-light'
                                                            : 'bg-prosperus-navy border-prosperus-stroke text-slate-500 hover:text-white hover:border-slate-500'
                                                    }`}
                                                >
                                                    {v.is_pinned
                                                        ? <Pin size={15} className="fill-current" />
                                                        : <PinOff size={15} />
                                                    }
                                                </button>
                                            </td>
                                            {/* Up / Down Buttons */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleMoveVideo(idx, 'up')}
                                                        disabled={idx === 0}
                                                        title="Subir"
                                                        className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronUp size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveVideo(idx, 'down')}
                                                        disabled={idx === paginatedVideos.length - 1}
                                                        title="Descer"
                                                        className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronDown size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            {/* Edit / Delete */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openVideoModal(v)}
                                                        title="Editar"
                                                        className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg hover:bg-prosperus-muted-bg active:scale-95 transition-all"
                                                    >
                                                        <Pencil size={14} className="text-yellow-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => requestDeleteVideo(v.id)}
                                                        title="Excluir"
                                                        className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-red-500/20 rounded-lg hover:bg-red-500/10 active:scale-95 transition-all"
                                                    >
                                                        <Trash2 size={14} className="text-red-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </AdminTable>
                    </div>

                    {/* ── Video Cards (Mobile — Table-to-Card pattern) ── */}
                    <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                        {paginatedVideos.length === 0 ? (
                            <AdminEmptyState
                                icon={<VideoIcon size={48} />}
                                message="Nenhum vídeo encontrado."
                                description="Ajuste os filtros ou crie um novo vídeo."
                            />
                        ) : (
                            paginatedVideos.map(v => (
                                <div
                                    key={v.id}
                                    className="bg-prosperus-box border border-prosperus-stroke rounded-xl p-4 flex flex-col gap-3"
                                >
                                    {/* Thumbnail + info */}
                                    <div className="flex items-start gap-3">
                                        {v.thumbnail ? (
                                            <img
                                                src={v.thumbnail}
                                                alt={v.title}
                                                className="w-16 aspect-video object-cover rounded-lg flex-shrink-0 bg-prosperus-muted-bg"
                                            />
                                        ) : (
                                            <div className="w-16 aspect-video rounded-lg flex-shrink-0 bg-prosperus-muted-bg flex items-center justify-center">
                                                <VideoIcon size={16} className="text-slate-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white text-sm truncate min-w-0">{v.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">{getCategoryName(v)}</p>
                                            {v.duration && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Clock size={11} className="text-slate-500" />
                                                    <span className="text-xs text-slate-500">{v.duration}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Indicador de pin no card */}
                                    {v.is_pinned && (
                                        <div className="flex items-center gap-1.5 text-prosperus-gold-light text-xs font-semibold">
                                            <Pin size={11} className="fill-current" />
                                            Fixado no topo
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="h-px bg-prosperus-stroke" />

                                    {/* Actions row: Pin + Up + Down + Edit + Delete */}
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Ordenação */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleMoveVideo(paginatedVideos.indexOf(v), 'up')}
                                                disabled={paginatedVideos.indexOf(v) === 0}
                                                title="Subir"
                                                className="w-10 h-10 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg text-slate-400 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                <ChevronUp size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveVideo(paginatedVideos.indexOf(v), 'down')}
                                                disabled={paginatedVideos.indexOf(v) === paginatedVideos.length - 1}
                                                title="Descer"
                                                className="w-10 h-10 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg text-slate-400 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                <ChevronDown size={18} />
                                            </button>
                                            {/* Pin */}
                                            <button
                                                onClick={() => handleTogglePin(v)}
                                                title={v.is_pinned ? 'Desafixar' : 'Fixar no topo'}
                                                className={`w-10 h-10 flex items-center justify-center rounded-lg border active:scale-95 transition-all ${
                                                    v.is_pinned
                                                        ? 'bg-prosperus-gold-dark/20 border-prosperus-gold-dark text-prosperus-gold-light'
                                                        : 'bg-prosperus-navy border-prosperus-stroke text-slate-500'
                                                }`}
                                            >
                                                {v.is_pinned
                                                    ? <Pin size={18} className="fill-current" />
                                                    : <PinOff size={18} className="text-prosperus-muted-text" />
                                                }
                                            </button>
                                        </div>

                                        {/* Edit + Delete */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openVideoModal(v)}
                                                title="Editar"
                                                className="w-10 h-10 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg hover:bg-prosperus-muted-bg active:scale-95 transition-all"
                                            >
                                                <Pencil size={15} className="text-yellow-500" />
                                            </button>
                                            <button
                                                onClick={() => requestDeleteVideo(v.id)}
                                                title="Excluir"
                                                className="w-10 h-10 flex items-center justify-center bg-prosperus-navy border border-red-500/20 rounded-lg hover:bg-red-500/10 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={15} className="text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* ── Pagination Controls ─────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={safeCurrentPage <= 1}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                                Anterior
                            </button>

                            {/* Page numbers */}
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                                    .map((p, idx, arr) => (
                                        <React.Fragment key={p}>
                                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                <span className="px-2 py-2 text-slate-500 text-sm">…</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(p)}
                                                className={`min-w-[36px] py-2 rounded-lg text-sm font-medium transition ${
                                                    p === safeCurrentPage
                                                        ? 'bg-yellow-600 text-white shadow-lg'
                                                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={safeCurrentPage >= totalPages}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Próximo
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* Video Modal */}
                    {isVideoModalOpen && (
                        <AdminModal title={editingVideo.id ? "Editar Vídeo" : "Novo Vídeo"} onClose={() => setIsVideoModalOpen(false)}>
                            <div className="space-y-4">
                                <AdminFormInput label="Título" value={editingVideo.title || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, title: v })} />
                                <AdminFormInput label="Descrição" textarea value={editingVideo.description || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, description: v })} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Category Dropdown */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</label>
                                        <select
                                            value={editingVideo.categoryId || ''}
                                            onChange={(e) => setEditingVideo({ ...editingVideo, categoryId: e.target.value || undefined })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-yellow-600 transition text-sm"
                                        >
                                            <option value="">Sem categoria</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <AdminFormInput label="Duração (MM:SS)" value={editingVideo.duration || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, duration: v })} placeholder="Ex: 15:30" />
                                </div>

                                <div className="space-y-2">
                                    <AdminFormInput label="URL do Vídeo" value={editingVideo.videoUrl || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, videoUrl: v })} placeholder="Cole a URL completa do vídeo aqui" />
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                        <p className="text-xs font-semibold text-yellow-500 mb-2 flex items-center gap-1">
                                            <VideoIcon size={12} /> Formatos Suportados:
                                        </p>
                                        <ul className="text-xs text-slate-400 space-y-1 ml-4">
                                            <li>• <strong className="text-slate-300">YouTube:</strong> https://www.youtube.com/watch?v=...</li>
                                            <li>• <strong className="text-slate-300">Vimeo:</strong> https://vimeo.com/...</li>
                                            <li>• <strong className="text-slate-300">CursEduca:</strong> https://player.curseduca.com/embed/[ID]/?api_key=...</li>
                                            <li>• <strong className="text-slate-300">Vídeo Direto:</strong> https://exemplo.com/video.mp4</li>
                                        </ul>
                                        {editingVideo.videoUrl && (
                                            <div className="mt-3 pt-3 border-t border-slate-700">
                                                <p className="text-xs font-semibold text-emerald-400 mb-1">✓ Tipo detectado:</p>
                                                <p className="text-xs text-slate-300">
                                                    {editingVideo.videoUrl.includes('youtube.com') || editingVideo.videoUrl.includes('youtu.be') ? '🎬 YouTube' :
                                                        editingVideo.videoUrl.includes('vimeo.com') ? '🎬 Vimeo' :
                                                            editingVideo.videoUrl.includes('curseduca.com') ? '🎬 CursEduca (Embed)' :
                                                                editingVideo.videoUrl.match(/\.(mp4|webm|ogg)$/i) ? '🎬 Vídeo Direto' :
                                                                    '⚠️ Formato não reconhecido'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <AdminFormInput label="URL da Thumbnail" value={editingVideo.thumbnail || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, thumbnail: v })} placeholder="URL da imagem de capa" />

                                {/* Series Configuration */}
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="isPartOfSeries" checked={isPartOfSeries} onChange={(e) => setIsPartOfSeries(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-yellow-600 focus:ring-yellow-600" />
                                        <label htmlFor="isPartOfSeries" className="text-sm font-semibold text-slate-300">Faz parte de uma série/curso?</label>
                                    </div>
                                    {isPartOfSeries && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <AdminFormInput label="ID da Série" value={editingVideo.seriesId || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, seriesId: v })} placeholder="Ex: curso-vendas-2024" />
                                            <AdminFormInput label="Ordem na Série" type="number" value={editingVideo.seriesOrder?.toString() || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, seriesOrder: parseInt(v) || 1 })} placeholder="Ex: 1, 2, 3..." />
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500">Use o mesmo ID de série para agrupar vídeos em um curso.</p>
                                </div>

                                {/* Materiais Complementares */}
                                <VideoMaterialsUpload
                                    videoId={editingVideo.id}
                                    videoTitle={editingVideo.title || ''}
                                    onPendingChange={setPendingMaterials}
                                />

                                <div className="flex justify-end pt-4 gap-3">
                                    <button type="button" onClick={() => setIsVideoModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={isLoading}>Cancelar</button>
                                    <button onClick={handleSaveVideo} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                        {isLoading ? 'Salvando...' : 'Salvar Vídeo'}
                                    </button>
                                </div>
                            </div>
                        </AdminModal>
                    )}
                </>
            )}

            {/* ============================================ */}
            {/* CATEGORIES TAB */}
            {/* ============================================ */}
            {activeTab === 'categories' && (
                <>
                    {/* Categories Grid */}
                    {categories.length === 0 ? (
                        <AdminEmptyState
                            icon={<FolderOpen size={48} />}
                            message="Nenhuma categoria criada ainda."
                            description="Crie categorias para organizar seus vídeos."
                            action={
                                <button
                                    onClick={() => openCategoryModal()}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition text-sm font-medium"
                                >
                                    <Plus size={16} className="inline mr-1" />
                                    Criar Categoria
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-yellow-500/50 transition-all group">
                                    {/* Cover Image */}
                                    <div className="h-32 bg-slate-900 relative overflow-hidden">
                                        {cat.coverImage ? (
                                            <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Image size={32} className="text-slate-700" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                                        {/* Actions */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <AdminActionButton
                                                icon={Pencil}
                                                onClick={() => openCategoryModal(cat)}
                                                variant="primary"
                                                title="Editar categoria"
                                                size={14}
                                            />
                                            <AdminActionButton
                                                icon={Trash2}
                                                onClick={() => requestDeleteCategory(cat.id)}
                                                variant="danger"
                                                title="Excluir categoria"
                                                size={14}
                                            />
                                        </div>
                                    </div>
                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                                        {cat.description && (
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
                                        )}
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                                                {getVideoCount(cat.id)} vídeo{getVideoCount(cat.id) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Category Modal */}
                    {isCategoryModalOpen && (
                        <AdminModal title={editingCategory.id ? "Editar Categoria" : "Nova Categoria"} onClose={() => setIsCategoryModalOpen(false)}>
                            <div className="space-y-4">
                                <AdminFormInput label="Nome da Categoria" value={editingCategory.name || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, name: v })} placeholder="Ex: Marketing, Vendas, Masterclass" />
                                <AdminFormInput label="Descrição (Opcional)" textarea value={editingCategory.description || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, description: v })} placeholder="Uma breve descrição da categoria..." />
                                <AdminFormInput label="URL da Imagem de Capa (Opcional)" value={editingCategory.coverImage || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, coverImage: v })} placeholder="https://..." />

                                {editingCategory.coverImage && (
                                    <div className="rounded-lg overflow-hidden border border-slate-700 h-32">
                                        <img src={editingCategory.coverImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 gap-3">
                                    <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={isLoading}>Cancelar</button>
                                    <button onClick={handleSaveCategory} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                        {isLoading ? 'Salvando...' : 'Salvar Categoria'}
                                    </button>
                                </div>
                            </div>
                        </AdminModal>
                    )}
                </>
            )}

            {/* ============================================ */}
            {/* CONFIRM DIALOG (shared across tabs) */}
            {/* ============================================ */}
            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText="Excluir"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};

export default AcademyModule;
