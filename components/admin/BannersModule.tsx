// ============================================
// BANNERS MODULE - Admin Component (Refactored)
// ============================================
// Gerenciador de banners com suporte a agendamento
// Refatorado: confirm→AdminConfirmDialog, Modal→AdminModal, shared components, toast

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Plus,
    Edit2,
    Trash2,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Clock,
    CheckCircle,
    AlertTriangle,
} from 'lucide-react';
import { bannerService, Banner, BannerInput } from '../../services/bannerService';
import {
    AdminPageHeader,
    AdminModal,
    AdminFormInput,
    AdminTable,
    AdminActionButton,
    AdminLoadingState,
    AdminEmptyState,
    AdminConfirmDialog,
    AdminFileUpload,
} from './shared';

// Status colors and labels
const getStatusInfo = (banner: Banner): { label: string; color: string; icon: React.ReactNode } => {
    const now = new Date();
    const startDate = banner.start_date ? new Date(banner.start_date) : null;
    const endDate = banner.end_date ? new Date(banner.end_date) : null;

    if (!banner.is_active) {
        return { label: 'Inativo', color: 'text-slate-500', icon: <EyeOff size={14} /> };
    }
    if (endDate && endDate < now) {
        return { label: 'Expirado', color: 'text-red-500', icon: <AlertTriangle size={14} /> };
    }
    if (startDate && startDate > now) {
        return { label: 'Agendado', color: 'text-yellow-500', icon: <Clock size={14} /> };
    }
    return { label: 'Ativo', color: 'text-green-500', icon: <CheckCircle size={14} /> };
};

// Format date for display
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const BannersModule: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        title: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, title: '', isLoading: false });

    // Form state
    const [formData, setFormData] = useState<BannerInput>({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        link_type: 'INTERNAL',
        start_date: null,
        end_date: null,
        is_active: true,
        placement: 'HOME',
        priority: 0
    });

    // Load banners
    const loadBanners = async () => {
        setIsLoading(true);
        try {
            const result = await bannerService.getAllBanners(1, 100);
            setBanners(result.data);
        } catch (error) {
            console.error('Error loading banners:', error);
            toast.error('Erro ao carregar banners.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBanners();
    }, []);

    // Open modal for create/edit
    const openModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                subtitle: banner.subtitle || '',
                image_url: banner.image_url,
                link_url: banner.link_url || '',
                link_type: banner.link_type,
                start_date: banner.start_date?.slice(0, 16) || null,
                end_date: banner.end_date?.slice(0, 16) || null,
                is_active: banner.is_active,
                placement: banner.placement,
                priority: banner.priority
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                image_url: '',
                link_url: '',
                link_type: 'INTERNAL',
                start_date: null,
                end_date: null,
                is_active: true,
                placement: 'HOME',
                priority: banners.length + 1
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.image_url.trim()) newErrors.image_url = 'URL da imagem é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Save banner
    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (editingBanner) {
                await bannerService.updateBanner(editingBanner.id, formData);
            } else {
                await bannerService.createBanner(formData);
            }
            setIsModalOpen(false);
            await loadBanners();
            toast.success(editingBanner ? 'Banner atualizado com sucesso!' : 'Banner criado com sucesso!');
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('Erro ao salvar banner.');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete banner (via AdminConfirmDialog)
    const requestDelete = (banner: Banner) => {
        setConfirmState({
            isOpen: true,
            id: banner.id,
            title: banner.title,
            isLoading: false,
        });
    };

    const executeDelete = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            await bannerService.deleteBanner(confirmState.id);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            await loadBanners();
            toast.success('Banner excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting banner:', error);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir banner.');
        }
    };

    // Toggle active status
    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await bannerService.toggleBannerActive(id);
            await loadBanners();
            toast.success(currentStatus ? 'Banner desativado.' : 'Banner ativado!');
        } catch (error) {
            console.error('Error toggling banner:', error);
            toast.error('Erro ao alterar status do banner.');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Banners" subtitle="Gerencie os banners da página inicial" />
                <AdminLoadingState message="Carregando banners..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Banners"
                subtitle={`${banners.length} banner(s) cadastrado(s)`}
                action={
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-2 rounded-lg transition"
                    >
                        <Plus size={18} />
                        Novo Banner
                    </button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: banners.length, color: 'text-white' },
                    { label: 'Ativos', value: banners.filter(b => b.is_active && !getStatusInfo(b).label.includes('Expirado')).length, color: 'text-green-500' },
                    { label: 'Agendados', value: banners.filter(b => getStatusInfo(b).label === 'Agendado').length, color: 'text-yellow-500' },
                    { label: 'Expirados', value: banners.filter(b => getStatusInfo(b).label === 'Expirado').length, color: 'text-red-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <p className="text-sm text-slate-400">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Banners Table */}
            {banners.length === 0 ? (
                <AdminEmptyState
                    icon={<ImageIcon size={48} />}
                    message="Nenhum banner cadastrado"
                    description="Crie seu primeiro banner para a página inicial."
                    action={
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition text-sm font-medium"
                        >
                            <Plus size={16} className="inline mr-1" />
                            Criar Banner
                        </button>
                    }
                />
            ) : (
                <AdminTable>
                    <table className="w-full">
                        <thead className="bg-slate-950">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Preview</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Título</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase hidden md:table-cell">Período</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase hidden sm:table-cell">Prioridade</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {banners.map((banner) => {
                                const status = getStatusInfo(banner);
                                return (
                                    <tr key={banner.id} className="hover:bg-slate-800/50 transition">
                                        <td className="px-4 py-3">
                                            <img
                                                src={banner.image_url}
                                                alt={banner.title}
                                                className="w-24 h-14 object-cover rounded-lg border border-slate-700"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="56"%3E%3Crect fill="%23334155" width="96" height="56"/%3E%3C/svg%3E';
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-white">{banner.title}</p>
                                            {banner.subtitle && (
                                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{banner.subtitle}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-sm ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="text-xs text-slate-400">
                                                {formatDate(banner.start_date)} - {formatDate(banner.end_date)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-sm text-slate-300">{banner.priority}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <AdminActionButton
                                                    icon={banner.is_active ? Eye : EyeOff}
                                                    onClick={() => handleToggleActive(banner.id, banner.is_active)}
                                                    variant={banner.is_active ? 'primary' : 'ghost'}
                                                    title={banner.is_active ? 'Desativar' : 'Ativar'}
                                                />
                                                <AdminActionButton
                                                    icon={Edit2}
                                                    onClick={() => openModal(banner)}
                                                    variant="ghost"
                                                    title="Editar"
                                                />
                                                <AdminActionButton
                                                    icon={Trash2}
                                                    onClick={() => requestDelete(banner)}
                                                    variant="danger"
                                                    title="Excluir"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </AdminTable>
            )}

            {/* Modal - Using AdminModal */}
            {isModalOpen && (
                <AdminModal
                    title={editingBanner ? 'Editar Banner' : 'Novo Banner'}
                    onClose={() => setIsModalOpen(false)}
                >
                    <div className="space-y-4">
                        <AdminFormInput
                            label="Título *"
                            value={formData.title}
                            onChange={(v) => setFormData({ ...formData, title: v })}
                            placeholder="Ex: Black Friday - 50% OFF"
                            error={errors.title}
                        />

                        <AdminFormInput
                            label="Subtítulo"
                            value={formData.subtitle || ''}
                            onChange={(v) => setFormData({ ...formData, subtitle: v })}
                            placeholder="Texto complementar (opcional)"
                        />

                        {/* Upload de Imagem */}
                        <AdminFileUpload
                            label="Imagem do Banner"
                            value={formData.image_url}
                            onUploaded={(url) => setFormData({ ...formData, image_url: url })}
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            hint="JPG, PNG, WebP ou GIF. Máx 10MB."
                        />

                        {/* Fallback: colar URL manualmente */}
                        <AdminFormInput
                            label="Ou cole a URL da imagem"
                            value={formData.image_url}
                            onChange={(v) => setFormData({ ...formData, image_url: v })}
                            placeholder="https://... (alternativa ao upload)"
                            error={errors.image_url}
                        />

                        <AdminFormInput
                            label="Link de Destino"
                            value={formData.link_url || ''}
                            onChange={(v) => setFormData({ ...formData, link_url: v })}
                            placeholder="https://... (opcional)"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300">Data Início</label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_date || ''}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300">Data Fim</label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_date || ''}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300">Prioridade</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                                <p className="text-xs text-slate-500">Maior número = aparece primeiro</p>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300">Local</label>
                                <select
                                    value={formData.placement}
                                    onChange={(e) => setFormData({ ...formData, placement: e.target.value as any })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition"
                                >
                                    <option value="HOME">Home</option>
                                    <option value="EVENTS">Eventos</option>
                                    <option value="VIDEOS">Academy</option>
                                    <option value="ARTICLES">Notícias</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-yellow-600 focus:ring-yellow-600"
                            />
                            <label htmlFor="is_active" className="text-sm text-slate-300">
                                Banner ativo
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}

            {/* ============================================ */}
            {/* CONFIRM DIALOG */}
            {/* ============================================ */}
            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title="Excluir Banner"
                message={`Excluir o banner "${confirmState.title}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};

export default BannersModule;
