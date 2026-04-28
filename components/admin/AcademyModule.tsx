// ============================================
// ACADEMY MODULE — Orchestrator / Container (Refactored)
// ============================================
// State management + data loading + business logic ONLY.
// All visual presentation delegated to:
//   - AcademyHeader (filters)
//   - AcademyVideoGrid (table + cards + pagination)
//   - AcademyVideoModal (create/edit form)
//   - AcademyCategoryGrid (category grid + modal)
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Video as VideoIcon, FolderOpen } from 'lucide-react';
import { Video, VideoCategory } from '../../types';
import { PendingMaterial } from './VideoMaterialsUpload';
import {
    AdminPageHeader,
    AdminConfirmDialog,
    AdminLoadingState,
} from './shared';
import { AcademyHeader, AcademyVideoGrid, AcademyVideoModal, AcademyCategoryGrid } from './academy';

interface AcademyModuleProps {
    DataTable: React.FC<Record<string, unknown>>;
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
    const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);

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
        } catch (error: unknown) {
            if ((error as any)?.message?.includes('AbortError') || (error as any)?.code === 'ABORT_ERR') return;
            console.error('Error loading videos:', error);
            toast.error('Erro ao carregar vídeos. Verifique a conexão com o banco de dados.');
        }
    };

    const loadCategories = async () => {
        try {
            const { videoService } = await import('../../services/videoService');
            const data = await videoService.getCategories();
            setCategories(data);
        } catch (error: unknown) {
            if ((error as any)?.message?.includes('AbortError') || (error as any)?.code === 'ABORT_ERR') return;
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
        } catch (error: unknown) {
            console.error('Error saving video:', error);
            toast.error('Erro ao salvar vídeo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const requestDeleteVideo = (id: string) => {
        setConfirmState({
            isOpen: true, id, action: 'deleteVideo',
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
        } catch (error: unknown) {
            console.error('Error deleting video:', error);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir vídeo. Tente novamente.');
        }
    };

    // ============================================
    // CURADORIA DE CONTEÚDO (Optimistic UI)
    // ============================================

    const handleTogglePin = async (video: Video) => {
        const newPinState = !video.is_pinned;
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_pinned: newPinState } : v));

        try {
            const { videoService } = await import('../../services/videoService');
            await videoService.toggleVideoPin(video.id, video.is_pinned ?? false);
            toast.success(newPinState ? '📌 Vídeo fixado no topo!' : 'Vídeo desafixado.');
        } catch (error) {
            setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_pinned: video.is_pinned } : v));
            toast.error('Erro ao alterar pin. Tente novamente.');
        }
    };

    const handleSortVideos = async (reorderedVideos: Video[]) => {
        // Pega todos os order_indexes da página atual e ordena
        const currentOrders = videos.map(v => v.order_index ?? 0).sort((a, b) => a - b);
        
        // Optimistic Update: atribui os order_indexes de volta na nova ordem
        const updatedVideos = reorderedVideos.map((v, i) => ({ ...v, order_index: currentOrders[i] }));
        setVideos(updatedVideos);

        try {
            const { videoService } = await import('../../services/videoService');
            const updates = updatedVideos.map(v => ({ id: v.id, order_index: v.order_index }));
            await videoService.updateVideoOrderBatch(updates);
            toast.success('Ordem atualizada com sucesso!');
        } catch (error) {
            await loadVideos();
            toast.error('Erro ao reordenar. A ordem foi restaurada.');
        }
    };

    // ============================================
    // CATEGORY CRUD
    // ============================================

    const openCategoryModal = (category?: VideoCategory) => {
        setEditingCategory(category ? { ...category } : {});
        setPendingIconFile(null);
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

            let iconUrl = editingCategory.icon_url;
            if (pendingIconFile) {
                toast.loading('Enviando ícone...', { id: 'icon-upload' });
                iconUrl = await videoService.uploadCategoryIcon(pendingIconFile);
                toast.dismiss('icon-upload');
                setPendingIconFile(null);
            }

            const categoryData = { ...editingCategory, icon_url: iconUrl };

            if (editingCategory.id) {
                await videoService.updateCategory(editingCategory.id, categoryData);
            } else {
                await videoService.createCategory(categoryData);
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
            isOpen: true, id, action: 'deleteCategory',
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

    const handleConfirm = () => {
        if (!confirmState.id) return;
        if (confirmState.action === 'deleteVideo') executeDeleteVideo(confirmState.id);
        else if (confirmState.action === 'deleteCategory') executeDeleteCategory(confirmState.id);
    };

    // ── Helpers ──
    const getVideoCount = (categoryId: string) => videos.filter(v => v.categoryId === categoryId).length;

    const getCategoryName = (video: Video) => {
        if (video.categoryId) return categories.find(c => c.id === video.categoryId)?.name || video.category || 'Sem categoria';
        return video.category || 'Sem categoria';
    };

    const parseDuration = (dur: string): number => {
        const parts = dur.split(':').map(Number);
        if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
        if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        return 0;
    };

    // ── Filtered & sorted videos ──
    const filteredVideos = useMemo(() => {
        let result = [...videos];
        if (searchTitle.trim()) {
            const q = searchTitle.toLowerCase().trim();
            result = result.filter(v => v.title.toLowerCase().includes(q));
        }
        if (filterCategory) result = result.filter(v => v.categoryId === filterCategory);
        if (filterDuration) {
            result = result.filter(v => {
                const secs = parseDuration(v.duration || '0:00');
                switch (filterDuration) {
                    case 'short': return secs <= 300;
                    case 'medium': return secs > 300 && secs <= 900;
                    case 'long': return secs > 900 && secs <= 1800;
                    case 'extra': return secs > 1800;
                    default: return true;
                }
            });
        }
        if (sortOrder === 'oldest') result.reverse();
        return result;
    }, [videos, searchTitle, filterCategory, filterDuration, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredVideos.length > 0 ? totalVideos / pageSize : 1));
    const paginatedVideos = filteredVideos;
    const hasActiveFilters = !!(searchTitle || filterCategory || filterDuration);

    useEffect(() => { setCurrentPage(1); }, [searchTitle, filterCategory, filterDuration, sortOrder, pageSize]);

    const clearFilters = () => {
        setSearchTitle('');
        setFilterCategory('');
        setFilterDuration('');
        setSortOrder('newest');
    };

    // ============================================
    // RENDER (Orchestrator — delegates to children)
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

            {/* VIDEOS TAB */}
            {activeTab === 'videos' && (
                <>
                    <AcademyHeader
                        searchTitle={searchTitle}
                        onSearchChange={setSearchTitle}
                        filterCategory={filterCategory}
                        onFilterCategoryChange={setFilterCategory}
                        filterDuration={filterDuration}
                        onFilterDurationChange={setFilterDuration}
                        sortOrder={sortOrder}
                        onSortOrderChange={setSortOrder}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        categories={categories}
                        filteredCount={filteredVideos.length}
                        totalCount={totalVideos}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                    />

                    <AcademyVideoGrid
                        videos={paginatedVideos}
                        categories={categories}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        onEdit={openVideoModal}
                        onDelete={requestDeleteVideo}
                        onTogglePin={handleTogglePin}
                        onSortVideos={handleSortVideos}
                        getCategoryName={getCategoryName}
                    />

                    <AcademyVideoModal
                        isOpen={isVideoModalOpen}
                        editingVideo={editingVideo}
                        categories={categories}
                        isPartOfSeries={isPartOfSeries}
                        isLoading={isLoading}
                        pendingMaterials={pendingMaterials}
                        onClose={() => setIsVideoModalOpen(false)}
                        onSave={handleSaveVideo}
                        onVideoChange={setEditingVideo}
                        onSeriesToggle={setIsPartOfSeries}
                        onPendingMaterialsChange={setPendingMaterials}
                    />
                </>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <AcademyCategoryGrid
                    categories={categories}
                    isModalOpen={isCategoryModalOpen}
                    editingCategory={editingCategory}
                    isLoading={isLoading}
                    pendingIconFile={pendingIconFile}
                    getVideoCount={getVideoCount}
                    onOpenModal={openCategoryModal}
                    onCloseModal={() => setIsCategoryModalOpen(false)}
                    onSave={handleSaveCategory}
                    onDelete={requestDeleteCategory}
                    onCategoryChange={setEditingCategory}
                    onIconFileChange={setPendingIconFile}
                />
            )}

            {/* CONFIRM DIALOG (shared across tabs) */}
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
