// components/admin/AdminSolutions.tsx
// Admin panel for managing Prosperus Tools Solutions

import React, { useEffect, useState } from 'react';
import { Plus, ExternalLink, Trash2, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { toolsService, ToolSolution } from '../../services/toolsService';

export const AdminSolutions: React.FC = () => {
    const [solutions, setSolutions] = useState<ToolSolution[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        external_url: '',
        sort_order: 0
    });
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadSolutions();
    }, []);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let banner_url = '';

            // Upload banner if provided
            if (bannerFile) {
                banner_url = await toolsService.uploadSolutionAsset(bannerFile, 'banner');
            }

            await toolsService.createSolution({
                ...formData,
                banner_url
            });

            alert('✅ Solução criada com sucesso!');
            setShowCreateModal(false);
            setFormData({ title: '', description: '', external_url: '', sort_order: 0 });
            setBannerFile(null);
            loadSolutions();
        } catch (error) {
            console.error('Failed to create solution:', error);
            alert('❌ Erro ao criar solução');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toolsService.toggleSolutionStatus(id, !currentStatus);
            loadSolutions();
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta solução?')) return;

        try {
            await toolsService.deleteSolution(id);
            alert('✅ Solução excluída');
            loadSolutions();
        } catch (error) {
            console.error('Failed to delete solution:', error);
            alert('❌ Erro ao excluir');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gerenciar Soluções</h2>
                    <p className="text-slate-600 text-sm mt-1">Ferramentas e links externos para os sócios</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                    <Plus size={18} />
                    Nova Solução
                </button>
            </div>

            {/* Solutions List */}
            <div className="space-y-3">
                {solutions.map(solution => (
                    <div key={solution.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-slate-900">{solution.title}</h3>
                                    {solution.is_active ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Ativo</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inativo</span>
                                    )}
                                </div>
                                {solution.description && (
                                    <p className="text-slate-600 text-sm mb-2">{solution.description}</p>
                                )}
                                <a
                                    href={solution.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                    <ExternalLink size={14} />
                                    {solution.external_url}
                                </a>
                                <p className="text-xs text-slate-500 mt-2">Ordem: {solution.sort_order}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleStatus(solution.id, solution.is_active)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                                    title={solution.is_active ? 'Desativar' : 'Ativar'}
                                >
                                    {solution.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(solution.id)}
                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {solutions.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <p>Nenhuma solução cadastrada ainda.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Nova Solução</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL Externa</label>
                                <input
                                    type="url"
                                    value={formData.external_url}
                                    onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
                                <input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Banner (opcional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setBannerFile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Criando...
                                        </>
                                    ) : (
                                        'Criar Solução'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSolutions;
