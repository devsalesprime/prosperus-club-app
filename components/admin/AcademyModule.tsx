// ============================================
// ACADEMY MODULE - Admin Component (Extracted)
// ============================================
// Gerenciamento de vídeos/aulas com detecção automática de plataforma

import React, { useState, useEffect } from 'react';
import { Plus, Video as VideoIcon } from 'lucide-react';
import { Video } from '../../types';
import { AdminPageHeader, AdminModal, AdminFormInput } from './shared';

// Reuse DataTable from AdminApp (inline) — will be extracted in Fase 3
// For now, we accept it as a prop
interface AcademyModuleProps {
    DataTable: React.FC<any>;
}

export const AcademyModule: React.FC<AcademyModuleProps> = ({ DataTable }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Partial<Video>>({});
    const [isPartOfSeries, setIsPartOfSeries] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadVideos = async () => {
        try {
            const { videoService } = await import('../../services/videoService');
            const data = await videoService.listVideos();
            setVideos(data);
        } catch (error) {
            console.error('Error loading videos:', error);
            alert('Erro ao carregar vídeos. Verifique a conexão com o banco de dados.');
        }
    };

    useEffect(() => { loadVideos(); }, []);

    const openModal = (video?: Video) => {
        if (video) {
            setEditingVideo(video);
            setIsPartOfSeries(!!video.seriesId);
        } else {
            setEditingVideo({});
            setIsPartOfSeries(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingVideo.title || !editingVideo.videoUrl) {
            alert('Título e URL do Vídeo são obrigatórios.');
            return;
        }
        try {
            setIsLoading(true);
            const { videoService } = await import('../../services/videoService');
            const videoData = {
                title: editingVideo.title,
                description: editingVideo.description || '',
                videoUrl: editingVideo.videoUrl,
                thumbnail: editingVideo.thumbnail || '',
                duration: editingVideo.duration || '0:00',
                category: editingVideo.category || 'Geral',
                seriesId: isPartOfSeries ? editingVideo.seriesId : undefined,
                seriesOrder: isPartOfSeries ? editingVideo.seriesOrder : undefined
            };
            if (editingVideo.id) {
                await videoService.updateVideo(editingVideo.id, videoData);
            } else {
                await videoService.createVideo(videoData);
            }
            setIsModalOpen(false);
            setEditingVideo({});
            setIsPartOfSeries(false);
            await loadVideos();
            alert('Vídeo salvo com sucesso!');
        } catch (error) {
            console.error('Error saving video:', error);
            alert('Erro ao salvar vídeo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;
        try {
            const { videoService } = await import('../../services/videoService');
            await videoService.deleteVideo(id);
            await loadVideos();
            alert('Vídeo excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Erro ao excluir vídeo. Tente novamente.');
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Academy (Vídeos)"
                subtitle="Gerencie as aulas e vídeos do clube"
                action={
                    <button onClick={() => openModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition">
                        <Plus size={18} /> Novo Vídeo
                    </button>
                }
            />

            <DataTable columns={['Título', 'Categoria', 'Duração']} data={videos} onEdit={(v: Video) => openModal(v)} onDelete={(id: string) => handleDelete(id)} />

            {isModalOpen && (
                <AdminModal title={editingVideo.id ? "Editar Vídeo" : "Novo Vídeo"} onClose={() => setIsModalOpen(false)}>
                    <div className="space-y-4">
                        <AdminFormInput label="Título" value={editingVideo.title || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, title: v })} />
                        <AdminFormInput label="Descrição" textarea value={editingVideo.description || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, description: v })} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AdminFormInput label="Categoria" value={editingVideo.category || ''} onChange={(v: string) => setEditingVideo({ ...editingVideo, category: v })} placeholder="Ex: Marketing, Vendas" />
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
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={isLoading}>Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar Vídeo'}
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}
        </div>
    );
};

export default AcademyModule;
