// ============================================
// ACADEMY VIDEO MODAL — Create/Edit Video Form
// Extracted from AcademyModule.tsx (Operação Estilhaço)
// Presenter component: receives all state via props
// ============================================

import React from 'react';
import { Video as VideoIcon } from 'lucide-react';
import { Video, VideoCategory } from '../../../types';
import { VideoMaterialsUpload, PendingMaterial } from '../VideoMaterialsUpload';
import { AdminModal, AdminFormInput } from '../shared';

export interface AcademyVideoModalProps {
    isOpen: boolean;
    editingVideo: Partial<Video>;
    categories: VideoCategory[];
    isPartOfSeries: boolean;
    isLoading: boolean;
    pendingMaterials: PendingMaterial[];
    onClose: () => void;
    onSave: () => void;
    onVideoChange: (updates: Partial<Video>) => void;
    onSeriesToggle: (checked: boolean) => void;
    onPendingMaterialsChange: (materials: PendingMaterial[]) => void;
}

export const AcademyVideoModal: React.FC<AcademyVideoModalProps> = ({
    isOpen,
    editingVideo,
    categories,
    isPartOfSeries,
    isLoading,
    onClose,
    onSave,
    onVideoChange,
    onSeriesToggle,
    onPendingMaterialsChange,
}) => {
    if (!isOpen) return null;

    return (
        <AdminModal title={editingVideo.id ? "Editar Vídeo" : "Novo Vídeo"} onClose={onClose}>
            <div className="space-y-4">
                <AdminFormInput label="Título" value={editingVideo.title || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, title: v })} />
                <AdminFormInput label="Descrição" textarea value={editingVideo.description || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, description: v })} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</label>
                        <select
                            value={editingVideo.categoryId || ''}
                            onChange={(e) => onVideoChange({ ...editingVideo, categoryId: e.target.value || undefined })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-yellow-600 transition text-sm"
                        >
                            <option value="">Sem categoria</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <AdminFormInput label="Duração (MM:SS)" value={editingVideo.duration || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, duration: v })} placeholder="Ex: 15:30" />
                </div>

                <div className="space-y-2">
                    <AdminFormInput label="URL do Vídeo" value={editingVideo.videoUrl || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, videoUrl: v })} placeholder="Cole a URL completa do vídeo aqui" />
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

                <AdminFormInput label="URL da Thumbnail" value={editingVideo.thumbnail || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, thumbnail: v })} placeholder="URL da imagem de capa" />

                {/* Series Configuration */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPartOfSeries" checked={isPartOfSeries} onChange={(e) => onSeriesToggle(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-yellow-600 focus:ring-yellow-600" />
                        <label htmlFor="isPartOfSeries" className="text-sm font-semibold text-slate-300">Faz parte de uma série/curso?</label>
                    </div>
                    {isPartOfSeries && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <AdminFormInput label="ID da Série" value={editingVideo.seriesId || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, seriesId: v })} placeholder="Ex: curso-vendas-2024" />
                            <AdminFormInput label="Ordem na Série" type="number" value={editingVideo.seriesOrder?.toString() || ''} onChange={(v: string) => onVideoChange({ ...editingVideo, seriesOrder: parseInt(v) || 1 })} placeholder="Ex: 1, 2, 3..." />
                        </div>
                    )}
                    <p className="text-xs text-slate-500">Use o mesmo ID de série para agrupar vídeos em um curso.</p>
                </div>

                {/* Materiais Complementares */}
                <VideoMaterialsUpload
                    videoId={editingVideo.id}
                    videoTitle={editingVideo.title || ''}
                    onPendingChange={onPendingMaterialsChange}
                />

                <div className="flex justify-end pt-4 gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={isLoading}>Cancelar</button>
                    <button onClick={onSave} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Vídeo'}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};
