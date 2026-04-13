// ============================================
// ACADEMY CATEGORY GRID — Grid + Category Modal
// Extracted from AcademyModule.tsx (Operação Estilhaço)
// Presenter component
// ============================================

import React from 'react';
import toast from 'react-hot-toast';
import { Plus, FolderOpen, Pencil, Trash2, Image } from 'lucide-react';
import { VideoCategory } from '../../../types';
import { AdminModal, AdminFormInput, AdminActionButton, AdminEmptyState } from '../shared';

export interface AcademyCategoryGridProps {
    categories: VideoCategory[];
    isModalOpen: boolean;
    editingCategory: Partial<VideoCategory>;
    isLoading: boolean;
    pendingIconFile: File | null;
    getVideoCount: (categoryId: string) => number;
    onOpenModal: (category?: VideoCategory) => void;
    onCloseModal: () => void;
    onSave: () => void;
    onDelete: (id: string) => void;
    onCategoryChange: (updates: Partial<VideoCategory>) => void;
    onIconFileChange: (file: File | null) => void;
}

export const AcademyCategoryGrid: React.FC<AcademyCategoryGridProps> = ({
    categories,
    isModalOpen,
    editingCategory,
    isLoading,
    pendingIconFile,
    getVideoCount,
    onOpenModal,
    onCloseModal,
    onSave,
    onDelete,
    onCategoryChange,
    onIconFileChange,
}) => {
    return (
        <>
            {/* Categories Grid */}
            {categories.length === 0 ? (
                <AdminEmptyState
                    icon={<FolderOpen size={48} />}
                    message="Nenhuma categoria criada ainda."
                    description="Crie categorias para organizar seus vídeos."
                    action={
                        <button
                            onClick={() => onOpenModal()}
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
                                        onClick={() => onOpenModal(cat)}
                                        variant="primary"
                                        title="Editar categoria"
                                        size={14}
                                    />
                                    <AdminActionButton
                                        icon={Trash2}
                                        onClick={() => onDelete(cat.id)}
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
            {isModalOpen && (
                <AdminModal title={editingCategory.id ? "Editar Categoria" : "Nova Categoria"} onClose={onCloseModal}>
                    <div className="space-y-4">
                        <AdminFormInput label="Nome da Categoria" value={editingCategory.name || ''} onChange={(v: string) => onCategoryChange({ ...editingCategory, name: v })} placeholder="Ex: Marketing, Vendas, Masterclass" />
                        <AdminFormInput label="Descrição (Opcional)" textarea value={editingCategory.description || ''} onChange={(v: string) => onCategoryChange({ ...editingCategory, description: v })} placeholder="Uma breve descrição da categoria..." />
                        <AdminFormInput label="URL da Imagem de Capa (Opcional)" value={editingCategory.coverImage || ''} onChange={(v: string) => onCategoryChange({ ...editingCategory, coverImage: v })} placeholder="https://..." />

                        {editingCategory.coverImage && (
                            <div className="rounded-lg overflow-hidden border border-slate-700 h-32">
                                <img src={editingCategory.coverImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                        )}

                        {/* ── UPLOAD DE ÍCONE DA CATEGORIA ────────── */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Image size={12} />
                                Ícone da Categoria (PNG / SVG / WebP)
                            </label>

                            {/* Preview do ícone atual ou pendente */}
                            {(pendingIconFile || editingCategory.icon_url) && (
                                <div className="flex items-center gap-3">
                                    <div className="bg-prosperus-navy border border-prosperus-stroke rounded-md p-2 h-12 w-auto inline-flex items-center justify-center">
                                        <img
                                            src={pendingIconFile ? URL.createObjectURL(pendingIconFile) : editingCategory.icon_url!}
                                            alt="Preview do ícone"
                                            className="h-8 w-auto max-w-[48px] object-contain"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-slate-400">
                                            {pendingIconFile ? pendingIconFile.name : 'Ícone atual'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onIconFileChange(null);
                                                onCategoryChange({ ...editingCategory, icon_url: null });
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300 transition text-left"
                                        >
                                            × Remover ícone
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Input de seleção */}
                            <label
                                htmlFor="category-icon-upload"
                                className="flex items-center gap-3 cursor-pointer w-full bg-prosperus-navy border border-dashed border-prosperus-stroke hover:border-prosperus-gold-dark/60 rounded-lg px-4 py-3 transition-all group"
                            >
                                <Image size={20} className="text-slate-500 group-hover:text-prosperus-gold-dark transition-colors shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-300 font-medium">
                                        {pendingIconFile ? 'Alterar arquivo' : 'Selecionar ícone'}
                                    </span>
                                    <span className="text-xs text-slate-500">PNG, SVG ou WebP • Máx. 512 KB</span>
                                </div>
                                <input
                                    id="category-icon-upload"
                                    type="file"
                                    accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        if (file && file.size > 524288) {
                                            toast.error('Arquivo muito grande. Máximo permitido: 512 KB.');
                                            return;
                                        }
                                        onIconFileChange(file);
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <button type="button" onClick={onCloseModal} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={isLoading}>Cancelar</button>
                            <button onClick={onSave} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar Categoria'}
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}
        </>
    );
};
