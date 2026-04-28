// ============================================
// ACADEMY VIDEO GRID — Desktop table + Mobile cards + Pagination
// Extracted from AcademyModule.tsx (Operação Estilhaço)
// Presenter component: receives all data and callbacks via props
// ============================================

import React from 'react';
import {
    Video as VideoIcon,
    Pencil,
    Trash2,
    Clock,
    Pin,
    PinOff,
    GripVertical,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Video, VideoCategory } from '../../../types';
import { AdminTable, AdminEmptyState } from '../shared';

export interface AcademyVideoGridProps {
    videos: Video[];
    categories: VideoCategory[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (video: Video) => void;
    onDelete: (id: string) => void;
    onTogglePin: (video: Video) => void;
    onSortVideos: (reorderedVideos: Video[]) => void;
    getCategoryName: (video: Video) => string;
}

export const AcademyVideoGrid: React.FC<AcademyVideoGridProps> = ({
    videos,
    currentPage,
    totalPages,
    onPageChange,
    onEdit,
    onDelete,
    onTogglePin,
    onSortVideos,
    getCategoryName,
}) => {
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const pinnedVideos = videos.filter(v => v.is_pinned);
    const unpinnedVideos = videos.filter(v => !v.is_pinned);

    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);
    const [isDraggingIndex, setIsDraggingIndex] = React.useState<number | null>(null);

    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const newUnpinned = [...unpinnedVideos];
        const draggedItemContent = newUnpinned[dragItem.current];
        
        newUnpinned.splice(dragItem.current, 1);
        newUnpinned.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        setIsDraggingIndex(null);
        
        onSortVideos([...pinnedVideos, ...newUnpinned]);
    };

    return (
        <>
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
                            {/* PINNED VIDEOS (Imóveis) */}
                            {pinnedVideos.map((v) => (
                                <tr key={v.id} className="group hover:bg-prosperus-muted-bg/40 transition-colors bg-prosperus-gold-dark/5">
                                    <td className="px-4 py-3 max-w-[260px]">
                                        <div className="flex items-center gap-3">
                                            <Pin size={12} className="text-prosperus-gold-light fill-current flex-shrink-0" />
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
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => onTogglePin(v)}
                                            title="Desafixar"
                                            className="w-9 h-9 mx-auto flex items-center justify-center rounded-lg border transition-all active:scale-95 bg-prosperus-gold-dark/20 border-prosperus-gold-dark text-prosperus-gold-light"
                                        >
                                            <Pin size={15} className="fill-current" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <Pin size={18} className="text-slate-600" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onEdit(v)} title="Editar" className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg hover:bg-prosperus-muted-bg active:scale-95 transition-all">
                                                <Pencil size={14} className="text-yellow-500" />
                                            </button>
                                            <button onClick={() => onDelete(v.id)} title="Excluir" className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-red-500/20 rounded-lg hover:bg-red-500/10 active:scale-95 transition-all">
                                                <Trash2 size={14} className="text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* UNPINNED VIDEOS (Draggable) */}
                            {unpinnedVideos.map((v, idx) => (
                                <tr 
                                    key={v.id} 
                                    className={`group hover:bg-prosperus-muted-bg/40 transition-colors ${isDraggingIndex === idx ? 'opacity-50 bg-white/5 border-dashed border-[#CA9A43]' : ''}`}
                                    draggable={true}
                                    onDragStart={() => {
                                        dragItem.current = idx;
                                        setIsDraggingIndex(idx);
                                    }}
                                    onDragEnter={() => (dragOverItem.current = idx)}
                                    onDragEnd={handleSort}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <td className="px-4 py-3 max-w-[260px]">
                                        <div className="flex items-center gap-3">
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
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => onTogglePin(v)}
                                            title="Fixar no topo"
                                            className="w-9 h-9 mx-auto flex items-center justify-center rounded-lg border transition-all active:scale-95 bg-prosperus-navy border-prosperus-stroke text-slate-500 hover:text-white hover:border-slate-500"
                                        >
                                            <PinOff size={15} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <GripVertical size={18} className="text-[#95A4B4] cursor-grab active:cursor-grabbing hover:text-[#CA9A43] transition-colors" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onEdit(v)} title="Editar" className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg hover:bg-prosperus-muted-bg active:scale-95 transition-all">
                                                <Pencil size={14} className="text-yellow-500" />
                                            </button>
                                            <button onClick={() => onDelete(v.id)} title="Excluir" className="w-9 h-9 flex items-center justify-center bg-prosperus-navy border border-red-500/20 rounded-lg hover:bg-red-500/10 active:scale-95 transition-all">
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
                {videos.length === 0 ? (
                    <AdminEmptyState
                        icon={<VideoIcon size={48} />}
                        message="Nenhum vídeo encontrado."
                        description="Ajuste os filtros ou crie um novo vídeo."
                    />
                ) : (
                    videos.map(v => (
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

                            {/* Actions row: Pin + Edit + Delete */}
                            <div className="flex items-center justify-between gap-2">
                                {/* Ordenação Drag & Drop Mobile e Pin */}
                                <div className="flex items-center gap-1.5">
                                    {!v.is_pinned && (
                                        <div className="w-10 h-10 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg text-slate-400 active:scale-95 transition-all">
                                            <GripVertical size={18} />
                                        </div>
                                    )}
                                    {/* Pin */}
                                    <button
                                        onClick={() => onTogglePin(v)}
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
                                        onClick={() => onEdit(v)}
                                        title="Editar"
                                        className="w-10 h-10 flex items-center justify-center bg-prosperus-navy border border-prosperus-stroke rounded-lg hover:bg-prosperus-muted-bg active:scale-95 transition-all"
                                    >
                                        <Pencil size={15} className="text-yellow-500" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(v.id)}
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
                        onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
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
                                        onClick={() => onPageChange(p)}
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
                        onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Próximo
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </>
    );
};
