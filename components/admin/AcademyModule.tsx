// ============================================
// ACADEMY MODULE - Admin Component (Refactored)
// ============================================
// Gerenciamento de vídeos/aulas + categorias com abas de navegação
// Refatorado: alert→toast, confirm→AdminConfirmDialog, shared components

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Video as VideoIcon, FolderOpen, Pencil, Trash2, Image } from 'lucide-react';
import { Video, VideoCategory } from '../../types';
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
            const data = await videoService.listVideos();
            setVideos(data);
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
    }, []);

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
                await videoService.createVideo(videoData);
                // 🔔 Notificar todos os sócios sobre novo vídeo (fire-and-forget)
                import('../../services/notificationTriggers').then(({ notifyNewVideo }) => {
                    notifyNewVideo(videoData.title, '').catch(() => { });
                });
            }
            setIsVideoModalOpen(false);
            setEditingVideo({});
            setIsPartOfSeries(false);
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
                    <AdminTable title="Vídeos" subtitle={`${videos.length} vídeo(s) cadastrado(s)`}>
                        <DataTable
                            columns={['Título', 'Categoria', 'Duração']}
                            data={videos.map(v => ({ ...v, category: getCategoryName(v) }))}
                            onEdit={(v: Video) => openVideoModal(v)}
                            onDelete={(id: string) => requestDeleteVideo(id)}
                        />
                    </AdminTable>

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
