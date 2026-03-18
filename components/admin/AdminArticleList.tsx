// ============================================
// ADMIN ARTICLE LIST - Admin Component (Refactored)
// ============================================
// Lista de artigos para o painel administrativo
// Features: Tabela com status, views, ações de publicar/despublicar/excluir
// Refatorado: alert→toast, confirm→AdminConfirmDialog, shared components
// v3.0.1: Toggle "Notificar sócios?" + admin exclusion

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../../contexts/AppContext';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    FileText,
    Calendar,
    BarChart3,
    RefreshCw,
    AlertCircle,
    Image as ImageIcon
} from 'lucide-react';
import { articleService, Article } from '../../services/articleService';
import {
    AdminPageHeader,
    AdminTable,
    AdminActionButton,
    AdminLoadingState,
    AdminEmptyState,
    AdminConfirmDialog,
} from './shared';

interface AdminArticleListProps {
    onEdit: (article: Article) => void;
    onNew: () => void;
}

export const AdminArticleList: React.FC<AdminArticleListProps> = ({ onEdit, onNew }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [shouldNotify, setShouldNotify] = useState(true);
    const { currentUser } = useApp();

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        title: string;
        message: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, title: '', message: '', isLoading: false });

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await articleService.getAllArticlesAdmin();
            setArticles(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar artigos';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (article: Article) => {
        try {
            setActionLoading(article.id);
            await articleService.publishArticle(article.id);

            // 🔔 Notificar sócios sobre novo artigo (fire-and-forget)
            if (shouldNotify) {
                import('../../services/notificationTriggers').then(({ notifyNewArticle }) => {
                    notifyNewArticle(article.id, article.title, currentUser?.id).catch(() => { });
                });
            }

            await loadArticles();
            toast.success(`"${article.title}" publicado com sucesso!`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            toast.error('Erro ao publicar: ' + errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnpublish = async (article: Article) => {
        try {
            setActionLoading(article.id);
            await articleService.unpublishArticle(article.id);
            await loadArticles();
            toast.success(`"${article.title}" despublicado.`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            toast.error('Erro ao despublicar: ' + errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const requestDelete = (article: Article) => {
        setConfirmState({
            isOpen: true,
            id: article.id,
            title: 'Excluir Artigo',
            message: `Excluir "${article.title}"? Esta ação não pode ser desfeita.`,
            isLoading: false,
        });
    };

    const executeDelete = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            setActionLoading(confirmState.id);
            await articleService.deleteArticle(confirmState.id);
            await loadArticles();
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.success('Artigo excluído com sucesso!');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir: ' + errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // ============================================
    // LOADING STATE
    // ============================================

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <AdminPageHeader
                    title="Artigos"
                    subtitle="Gestão de conteúdo do clube"
                />
                <AdminLoadingState message="Carregando artigos..." />
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <AdminPageHeader
                title="Artigos"
                subtitle={`${articles.length} artigo(s)`}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadArticles}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                            title="Atualizar lista"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={onNew}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 
                                     text-white font-bold rounded-lg hover:opacity-90 transition"
                        >
                            <Plus size={20} />
                            Novo Artigo
                        </button>
                    </div>
                }
            />

            {/* Notification Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
                    <input
                        type="checkbox"
                        checked={shouldNotify}
                        onChange={(e) => setShouldNotify(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-yellow-600 focus:ring-yellow-600 focus:ring-offset-0 cursor-pointer"
                    />
                    🔔 Notificar sócios ao publicar
                </label>
                <span className="text-[10px] text-slate-500">
                    {shouldNotify ? 'Push + in-app serão enviados' : 'Publicar silenciosamente'}
                </span>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Empty State */}
            {articles.length === 0 ? (
                <AdminEmptyState
                    icon={<FileText size={48} />}
                    message="Nenhum artigo ainda"
                    description="Comece criando seu primeiro artigo"
                    action={
                        <button
                            onClick={onNew}
                            className="px-6 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition"
                        >
                            Criar Artigo
                        </button>
                    }
                />
            ) : (
                /* Table wrapped with AdminTable */
                <AdminTable>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Capa</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Título</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Views</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Data</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {articles.map((article) => (
                                <tr key={article.id} className="hover:bg-slate-800/50 transition">
                                    {/* Cover */}
                                    <td className="px-4 py-3">
                                        {article.image_url ? (
                                            <img
                                                src={article.image_url}
                                                alt={article.title}
                                                className="w-16 h-10 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5 text-slate-600" />
                                            </div>
                                        )}
                                    </td>

                                    {/* Title */}
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-white truncate max-w-xs">
                                            {article.title}
                                        </p>
                                        {article.category_name && (
                                            <p className="text-xs text-slate-500">{article.category_name}</p>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        {article.status === 'PUBLISHED' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full">
                                                <Eye size={12} />
                                                Publicado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-full">
                                                <EyeOff size={12} />
                                                Rascunho
                                            </span>
                                        )}
                                    </td>

                                    {/* Views */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <BarChart3 size={14} />
                                            <span>{article.views || 0}</span>
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                                            <Calendar size={14} />
                                            <span>{formatDate(article.published_date || article.created_at)}</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {actionLoading === article.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                                            ) : (
                                                <>
                                                    <AdminActionButton
                                                        icon={Edit}
                                                        onClick={() => onEdit(article)}
                                                        variant="ghost"
                                                        title="Editar"
                                                    />

                                                    {article.status === 'PUBLISHED' ? (
                                                        <AdminActionButton
                                                            icon={EyeOff}
                                                            onClick={() => handleUnpublish(article)}
                                                            variant="ghost"
                                                            title="Despublicar"
                                                        />
                                                    ) : (
                                                        <AdminActionButton
                                                            icon={Eye}
                                                            onClick={() => handlePublish(article)}
                                                            variant="ghost"
                                                            title="Publicar"
                                                        />
                                                    )}

                                                    <AdminActionButton
                                                        icon={Trash2}
                                                        onClick={() => requestDelete(article)}
                                                        variant="danger"
                                                        title="Excluir"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </AdminTable>
            )}

            {/* ============================================ */}
            {/* CONFIRM DIALOG */}
            {/* ============================================ */}
            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title={confirmState.title}
                message={confirmState.message}
                confirmText="Excluir"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};

export default AdminArticleList;
