// AdminArticleList.tsx
// Lista de artigos para o painel administrativo
// Features: Tabela com status, views, ações de publicar/despublicar/excluir

import React, { useState, useEffect } from 'react';
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

interface AdminArticleListProps {
    onEdit: (article: Article) => void;
    onNew: () => void;
}

export const AdminArticleList: React.FC<AdminArticleListProps> = ({ onEdit, onNew }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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
            await loadArticles();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao publicar: ' + errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnpublish = async (article: Article) => {
        try {
            setActionLoading(article.id);
            await articleService.unpublishArticle(article.id);
            await loadArticles();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao despublicar: ' + errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (article: Article) => {
        if (!confirm(`Excluir "${article.title}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            setActionLoading(article.id);
            await articleService.deleteArticle(article.id);
            await loadArticles();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao excluir: ' + errorMessage);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-xl">
                        <FileText className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Artigos</h1>
                        <p className="text-slate-400">{articles.length} artigo(s)</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadArticles}
                        className="btn-sm p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
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
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 mb-4">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Empty State */}
            {articles.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                    <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum artigo ainda</h3>
                    <p className="text-slate-400 mb-4">Comece criando seu primeiro artigo</p>
                    <button
                        onClick={onNew}
                        className="px-6 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition"
                    >
                        Criar Artigo
                    </button>
                </div>
            ) : (
                /* Table */
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
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
                                                        <button
                                                            onClick={() => onEdit(article)}
                                                            className="btn-sm p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>

                                                        {article.status === 'PUBLISHED' ? (
                                                            <button
                                                                onClick={() => handleUnpublish(article)}
                                                                className="btn-sm p-2 hover:bg-slate-700 rounded-lg text-orange-400 hover:text-orange-300 transition"
                                                                title="Despublicar"
                                                            >
                                                                <EyeOff size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePublish(article)}
                                                                className="btn-sm p-2 hover:bg-slate-700 rounded-lg text-green-400 hover:text-green-300 transition"
                                                                title="Publicar"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleDelete(article)}
                                                            className="btn-sm p-2 hover:bg-slate-700 rounded-lg text-red-400 hover:text-red-300 transition"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminArticleList;
