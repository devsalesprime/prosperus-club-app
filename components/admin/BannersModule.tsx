// ============================================
// BANNERS MODULE - Admin Component
// ============================================
// Gerenciador de banners com suporte a agendamento

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Image as ImageIcon,
    Calendar,
    Eye,
    EyeOff,
    ArrowUp,
    ArrowDown,
    ExternalLink,
    Clock,
    CheckCircle,
    AlertTriangle,
    X
} from 'lucide-react';
import { bannerService, Banner, BannerInput } from '../../services/bannerService';

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

// Modal Component
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
            className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                    <X size={20} />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

// Form Input Component
const FormInput = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
    error
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
}) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

export const BannersModule: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

        setIsLoading(true);
        try {
            if (editingBanner) {
                await bannerService.updateBanner(editingBanner.id, formData);
            } else {
                await bannerService.createBanner(formData);
            }
            setIsModalOpen(false);
            loadBanners();
        } catch (error) {
            console.error('Error saving banner:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Delete banner
    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este banner?')) return;

        try {
            await bannerService.deleteBanner(id);
            loadBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
        }
    };

    // Toggle active status
    const handleToggleActive = async (id: string) => {
        try {
            await bannerService.toggleBannerActive(id);
            loadBanners();
        } catch (error) {
            console.error('Error toggling banner:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Banners</h2>
                    <p className="text-sm text-slate-400">Gerencie os banners da página inicial</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-2 rounded-lg transition"
                >
                    <Plus size={18} />
                    Novo Banner
                </button>
            </div>

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
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">Carregando...</div>
                ) : banners.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum banner cadastrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleActive(banner.id)}
                                                        className={`p-2 rounded-lg transition ${banner.is_active
                                                                ? 'text-green-500 hover:bg-green-500/10'
                                                                : 'text-slate-500 hover:bg-slate-700'
                                                            }`}
                                                        title={banner.is_active ? 'Desativar' : 'Ativar'}
                                                    >
                                                        {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(banner)}
                                                        className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(banner.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Modal
                    title={editingBanner ? 'Editar Banner' : 'Novo Banner'}
                    onClose={() => setIsModalOpen(false)}
                >
                    <div className="space-y-4">
                        <FormInput
                            label="Título"
                            value={formData.title}
                            onChange={(v) => setFormData({ ...formData, title: v })}
                            placeholder="Ex: Black Friday - 50% OFF"
                            required
                            error={errors.title}
                        />

                        <FormInput
                            label="Subtítulo"
                            value={formData.subtitle || ''}
                            onChange={(v) => setFormData({ ...formData, subtitle: v })}
                            placeholder="Texto complementar (opcional)"
                        />

                        <FormInput
                            label="URL da Imagem"
                            value={formData.image_url}
                            onChange={(v) => setFormData({ ...formData, image_url: v })}
                            placeholder="https://..."
                            required
                            error={errors.image_url}
                        />

                        {/* Image Preview */}
                        {formData.image_url && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 mb-2">Preview:</p>
                                <img
                                    src={formData.image_url}
                                    alt="Preview"
                                    className="w-full h-40 object-cover rounded-lg border border-slate-600"
                                    onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="160"%3E%3Crect fill="%23334155" width="400" height="160"/%3E%3Ctext fill="%23cbd5e1" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImagem inválida%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            </div>
                        )}

                        <FormInput
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
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                            >
                                {isLoading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BannersModule;
