// ==============================================
// ADMIN SOLUTIONS v2.0 — Sharp Luxury Theme
// ==============================================
// CRUD completo: criar, editar, toggle status, deletar
// Dark theme, gold accents, custom upload, responsive

import React, { useEffect, useState } from 'react';
import {
    Plus,
    ExternalLink,
    Trash2,
    Pencil,
    Eye,
    EyeOff,
    Loader2,
    Upload,
    X,
    Save,
    Wrench,
    AlertTriangle,
} from 'lucide-react';
import { toolsService, ToolSolution, CreateSolutionInput } from '../../services/toolsService';

// ── Form state type ──
interface SolutionFormState {
    title: string;
    description: string;
    external_url: string;
    sort_order: number;
    bannerFile: File | null;
}

const EMPTY_FORM: SolutionFormState = {
    title: '',
    description: '',
    external_url: '',
    sort_order: 0,
    bannerFile: null,
};

// ═════════════════════════════════════════════
// SUBCOMPONENT: SolutionAdminCard
// ═════════════════════════════════════════════
function SolutionAdminCard({
    solution,
    onEdit,
    onDelete,
    onToggleStatus,
}: {
    solution: ToolSolution;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex gap-3">
                {/* Banner thumbnail */}
                {solution.banner_url && (
                    <img
                        src={solution.banner_url}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-slate-800"
                    />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white leading-snug truncate">
                            {solution.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Status badge */}
                            {solution.is_active ? (
                                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    Ativo
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                                    Inativo
                                </span>
                            )}
                            {/* Order badge */}
                            <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                                #{solution.sort_order}
                            </span>
                        </div>
                    </div>

                    {solution.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {solution.description}
                        </p>
                    )}

                    {/* URL truncated */}
                    <div className="flex items-center gap-1 mt-2">
                        <ExternalLink size={11} className="text-slate-600 flex-shrink-0" />
                        <span className="text-xs text-slate-600 truncate">
                            {solution.external_url.replace(/^https?:\/\//, '')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions — always visible */}
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                    onClick={onToggleStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                    title={solution.is_active ? 'Desativar' : 'Ativar'}
                >
                    {solution.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                    {solution.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                    <Pencil size={12} />
                    Editar
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-colors border border-red-500/20"
                >
                    <Trash2 size={12} />
                    Excluir
                </button>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════
// SUBCOMPONENT: SolutionFormModal
// ═════════════════════════════════════════════
function SolutionFormModal({
    solution,
    onClose,
    onSave,
    loading,
}: {
    solution: ToolSolution | null;
    onClose: () => void;
    onSave: (form: SolutionFormState) => void;
    loading: boolean;
}) {
    const isEdit = !!solution;
    const [form, setForm] = useState<SolutionFormState>({
        title: solution?.title ?? '',
        description: solution?.description ?? '',
        external_url: solution?.external_url ?? '',
        sort_order: solution?.sort_order ?? 0,
        bannerFile: null,
    });

    const canSubmit = form.title.trim() !== '' && form.external_url.trim() !== '' && !loading;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl"
                style={{ animation: 'adminSlideUp 300ms ease-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">
                        {isEdit ? 'Editar Solução' : 'Nova Solução'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <div className="px-5 py-4 space-y-4 max-h-[70dvh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Título *
                        </label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Ex: Ferramenta de Precificação"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 outline-none transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Descrição
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Descreva brevemente a ferramenta..."
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                            URL Externa *
                        </label>
                        <div className="relative">
                            <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input
                                value={form.external_url}
                                onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Order */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Ordem de exibição
                        </label>
                        <input
                            type="number"
                            value={form.sort_order}
                            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                            min={0}
                            className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 outline-none transition-all"
                        />
                    </div>

                    {/* Banner upload — custom label, hidden native input */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Banner (opcional)
                        </label>
                        {/* Show current banner if editing */}
                        {isEdit && solution?.banner_url && !form.bannerFile && (
                            <div className="mb-2 rounded-lg overflow-hidden h-20">
                                <img src={solution.banner_url} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer border border-dashed border-slate-700 hover:border-yellow-600/40 bg-slate-950 hover:bg-slate-900 transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-yellow-600/10 transition-colors">
                                <Upload size={14} className="text-slate-500 group-hover:text-yellow-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                                    {form.bannerFile ? form.bannerFile.name : 'Clique para escolher imagem'}
                                </p>
                                <p className="text-xs text-slate-600">JPG, PNG até 5MB</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setForm((f) => ({ ...f, bannerFile: e.target.files?.[0] ?? null }))}
                            />
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={!canSubmit}
                        className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
                    >
                        {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : isEdit ? (
                            <Save size={14} />
                        ) : (
                            <Plus size={14} />
                        )}
                        {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Solução'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes adminSlideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

// ═════════════════════════════════════════════
// SUBCOMPONENT: DeleteConfirmModal
// ═════════════════════════════════════════════
function DeleteConfirmModal({
    title,
    onConfirm,
    onCancel,
    loading,
}: {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5" style={{ animation: 'adminSlideUp 200ms ease-out' }}>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle size={18} className="text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Excluir solução?</h3>
                <p className="text-sm text-slate-400 mb-5">
                    <span className="text-white font-medium">"{title}"</span> será removida permanentemente.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-sm font-semibold text-red-400 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {loading ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════
// SUBCOMPONENT: AdminEmptyState
// ═════════════════════════════════════════════
function AdminEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Wrench size={22} className="text-slate-600" />
            </div>
            <div>
                <p className="text-slate-300 font-semibold">Nenhuma solução cadastrada</p>
                <p className="text-sm text-slate-500 mt-1">Crie a primeira solução para os sócios.</p>
            </div>
            <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition-colors active:scale-[0.97]"
            >
                <Plus size={14} />
                Nova Solução
            </button>
        </div>
    );
}

// ═════════════════════════════════════════════
// MAIN COMPONENT: AdminSolutions v2.0
// ═════════════════════════════════════════════
export const AdminSolutions: React.FC = () => {
    const [solutions, setSolutions] = useState<ToolSolution[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<ToolSolution | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ToolSolution | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        loadSolutions();
    }, []);

    // Toast auto-dismiss
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const loadSolutions = async () => {
        try {
            const data = await toolsService.getAllSolutions();
            setSolutions(data);
        } catch (error) {
            console.error('Failed to load solutions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (form: SolutionFormState) => {
        setSaving(true);
        try {
            let banner_url: string | undefined;

            // Upload banner if new file provided
            if (form.bannerFile) {
                banner_url = await toolsService.uploadSolutionAsset(form.bannerFile, 'banner');
            }

            const input: CreateSolutionInput = {
                title: form.title,
                description: form.description || undefined,
                external_url: form.external_url,
                sort_order: form.sort_order,
                ...(banner_url ? { banner_url } : {}),
            };

            if (editTarget) {
                await toolsService.updateSolution(editTarget.id, input);
                setToast('✅ Solução atualizada!');
            } else {
                await toolsService.createSolution(input);
                setToast('✅ Solução criada!');
            }

            setShowModal(false);
            setEditTarget(null);
            loadSolutions();
        } catch (error) {
            console.error('Failed to save solution:', error);
            setToast('❌ Erro ao salvar solução');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await toolsService.deleteSolution(deleteTarget.id);
            setToast('✅ Solução excluída');
            setDeleteTarget(null);
            loadSolutions();
        } catch (error) {
            console.error('Failed to delete solution:', error);
            setToast('❌ Erro ao excluir');
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toolsService.toggleSolutionStatus(id, !currentStatus);
            loadSolutions();
            setToast(currentStatus ? 'Solução desativada' : 'Solução ativada');
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Soluções Externas</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Ferramentas e links externos para os sócios</p>
                </div>
                <button
                    onClick={() => {
                        setEditTarget(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition-colors active:scale-[0.97]"
                >
                    <Plus size={15} />
                    Nova Solução
                </button>
            </div>

            {/* Solutions list */}
            <div className="space-y-3">
                {solutions.length === 0 ? (
                    <AdminEmptyState onAdd={() => setShowModal(true)} />
                ) : (
                    solutions
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((solution) => (
                            <SolutionAdminCard
                                key={solution.id}
                                solution={solution}
                                onEdit={() => {
                                    setEditTarget(solution);
                                    setShowModal(true);
                                }}
                                onDelete={() => setDeleteTarget(solution)}
                                onToggleStatus={() => handleToggleStatus(solution.id, solution.is_active)}
                            />
                        ))
                )}
            </div>

            {/* Create/Edit modal */}
            {showModal && (
                <SolutionFormModal
                    solution={editTarget}
                    onClose={() => {
                        setShowModal(false);
                        setEditTarget(null);
                    }}
                    onSave={handleSave}
                    loading={saving}
                />
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    title={deleteTarget.title}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}

            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white shadow-2xl"
                    style={{ animation: 'adminSlideUp 200ms ease-out' }}
                >
                    {toast}
                </div>
            )}

            <style>{`
                @keyframes adminSlideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminSolutions;
