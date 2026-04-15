// components/admin/NotificationBannersModule.tsx

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
    Search,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { notificationBannerService, NotificationBanner, BannerMetrics } from '../../services/notificationBannerService';
import { supabase } from '../../lib/supabase';
import {
    AdminPageHeader,
    AdminModal,
    AdminFormInput,
    AdminTable,
    AdminActionButton,
    AdminLoadingState,
    AdminEmptyState,
    AdminConfirmDialog,
} from './shared';
// Se AdminFileUpload não for diretamente acessível devido a adaptação, re-implementar upload logic visual.
// Aqui vamos simular o upload visual simplificado que tem suporte em shared.
import { AdminFileUpload } from './shared';
import { DEEP_LINKS } from '../../utils/deepLinks';

const getStatusInfo = (banner: NotificationBanner): { label: string; color: string; icon: React.ReactNode } => {
    const now = new Date();
    const startDate = banner.starts_at ? new Date(banner.starts_at) : null;
    const endDate = banner.ends_at ? new Date(banner.ends_at) : null;

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

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const toLocalDatetimeLocal = (dateInput?: string | Date | null): string => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

// --- Mini Dashboard / Metrics Cell ---
const BannerMetricsCell = ({ bannerId }: { bannerId: string }) => {
    const [metrics, setMetrics] = useState<BannerMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        notificationBannerService.getBannerMetrics(bannerId)
            .then(m => {
                setMetrics(m);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [bannerId]);

    if (loading) return <span className="text-xs text-slate-500 animate-pulse">Calculando CTR...</span>;
    if (!metrics) return <span className="text-xs text-slate-500">-</span>;

    const views = metrics.totalViews || 0;
    const cta = metrics.ctaClicks || 0;
    const skip = metrics.skipClicks || 0;
    const ctr = views > 0 ? ((cta / views) * 100).toFixed(1) : '0.0';

    return (
        <div className="flex flex-col gap-1 text-xs min-w-[120px]">
            <div className="flex justify-between items-center bg-slate-900/50 rounded p-1.5 border border-slate-700/50">
                <span className="text-slate-400">Views:</span>
                <span className="text-white font-medium">{views}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-900/20 text-emerald-400 rounded p-1.5 border border-emerald-900/30 font-bold" title="Cliques no botão principal CTA">
                <span>CTA:</span>
                <span>{cta}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 px-1.5">
                <span>Pulos:</span>
                <span>{skip}</span>
            </div>
            <div className="text-yellow-500 font-bold mt-1 text-center bg-yellow-900/20 rounded py-1 border border-yellow-900/30">
                CTR: {ctr}%
            </div>
        </div>
    );
};

export const NotificationBannersModule: React.FC = () => {
    const [banners, setBanners] = useState<NotificationBanner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<NotificationBanner | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter & Pagination state
    const [bnrSearch, setBnrSearch] = useState('');
    const [bnrStatus, setBnrStatus] = useState<'ALL' | 'Ativo' | 'Inativo' | 'Agendado' | 'Expirado'>('ALL');
    const [bnrPage, setBnrPage] = useState(1);
    const [bnrPageSize, setBnrPageSize] = useState(10);

    useEffect(() => { setBnrPage(1); }, [bnrSearch, bnrStatus, bnrPageSize]);

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean; id: string | null; title: string; isLoading: boolean;
    }>({ isOpen: false, id: null, title: '', isLoading: false });

    // Form state
    const [formData, setFormData] = useState<Omit<NotificationBanner, 'id' | 'created_at'>>({
        title: '',
        image_url: '',
        deep_link: '',
        link_label: '',
        is_active: true,
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: null,
        skip_delay: 5,
        target_roles: ['MEMBER'],
    });

    const loadBanners = async () => {
        setIsLoading(true);
        try {
            const data = await notificationBannerService.getAllBanners();
            setBanners(data);
        } catch (error) {
            console.error('Error loading notification banners:', error);
            toast.error('Erro ao carregar banners.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBanners();
    }, []);

    const openModal = (banner?: NotificationBanner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                image_url: banner.image_url,
                deep_link: banner.deep_link,
                link_label: banner.link_label || '',
                is_active: banner.is_active,
                starts_at: banner.starts_at ? toLocalDatetimeLocal(banner.starts_at) : toLocalDatetimeLocal(new Date()),
                ends_at: banner.ends_at ? toLocalDatetimeLocal(banner.ends_at) : null,
                skip_delay: banner.skip_delay ?? 5,
                target_roles: banner.target_roles || ['MEMBER'],
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                image_url: '',
                deep_link: '',
                link_label: '',
                is_active: true,
                starts_at: toLocalDatetimeLocal(new Date()),
                ends_at: null,
                skip_delay: 5,
                target_roles: ['MEMBER'],
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.image_url.trim()) newErrors.image_url = 'URL da imagem é obrigatória';
        if (!formData.deep_link.trim()) newErrors.deep_link = 'Função do app (Deep Link) é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const formattedData = {
                ...formData,
                starts_at: new Date(formData.starts_at).toISOString(),
                ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
            };

            if (editingBanner) {
                await notificationBannerService.updateBanner(editingBanner.id, formattedData);
            } else {
                await notificationBannerService.createBanner(formattedData);
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

    const requestDelete = (banner: NotificationBanner) => {
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
            await notificationBannerService.deleteBanner(confirmState.id);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            await loadBanners();
            toast.success('Banner excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting banner:', error);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir banner.');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await notificationBannerService.updateBanner(id, { is_active: !currentStatus });
            await loadBanners();
            toast.success(currentStatus ? 'Banner desativado.' : 'Banner ativado!');
        } catch (error) {
            console.error('Error toggling banner:', error);
            toast.error('Erro ao status do banner.');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Banners de Notificação" subtitle="Gerencie os banners Interstitial fullscreen" />
                <AdminLoadingState message="Carregando banners..." />
            </div>
        );
    }

    const filteredBanners = (() => {
        const term = bnrSearch.toLowerCase().trim();
        return banners.filter(b => {
            const matchesSearch = !term || b.title.toLowerCase().includes(term);
            const matchesStatus = bnrStatus === 'ALL' || getStatusInfo(b).label === bnrStatus;
            return matchesSearch && matchesStatus;
        });
    })();

    const bnrTotalPages = Math.max(1, Math.ceil(filteredBanners.length / bnrPageSize));
    const paginatedBanners = filteredBanners.slice((bnrPage - 1) * bnrPageSize, bnrPage * bnrPageSize);
    const isBnrFiltered = bnrSearch || bnrStatus !== 'ALL';

    const getLabelByDeepLink = (val: string) => DEEP_LINKS.flatMap(g => g.items).find(i => (i as any).value === val)?.label || val;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Banners de Notificação (Fullscreen)"
                subtitle={isBnrFiltered ? `${filteredBanners.length} de ${banners.length} banners` : `${banners.length} banner(s) cadastrado(s)`}
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

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={bnrSearch}
                        onChange={e => setBnrSearch(e.target.value)}
                        placeholder="Buscar por título..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 transition"
                    />
                    {bnrSearch && (
                        <button onClick={() => setBnrSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={bnrStatus}
                    onChange={e => setBnrStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[130px]"
                >
                    <option value="ALL">Todos status</option>
                    <option value="Ativo">✅ Ativo</option>
                    <option value="Inativo">⬜ Inativo</option>
                    <option value="Agendado">🕐 Agendado</option>
                    <option value="Expirado">🔴 Expirado</option>
                </select>
                {isBnrFiltered && (
                    <button
                        onClick={() => { setBnrSearch(''); setBnrStatus('ALL'); }}
                        className="text-xs text-yellow-500 hover:text-yellow-400 whitespace-nowrap self-center"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Banners Table */}
            {banners.length === 0 && !isBnrFiltered ? (
                <AdminEmptyState
                    icon={<ImageIcon size={48} />}
                    message="Nenhum banner cadastrado"
                    description="Crie seu primeiro banner de notificação fullscreen."
                    action={
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition text-sm font-medium"
                        >
                            <Plus size={16} className="inline mr-1" />
                            Criar Novo
                        </button>
                    }
                />
            ) : paginatedBanners.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                    <p className="text-slate-500 text-sm">Nenhum banner encontrado com esses filtros.</p>
                </div>
            ) : (
                <AdminTable>
                    <table className="w-full">
                        <thead className="bg-slate-950">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Preview</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Título</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase hidden md:table-cell">Período</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Conversão / CTR</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase hidden lg:table-cell">Função</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {paginatedBanners.map((banner) => {
                                const status = getStatusInfo(banner);
                                return (
                                    <tr key={banner.id} className="hover:bg-slate-800/50 transition">
                                        <td className="px-4 py-3">
                                            <img
                                                src={banner.image_url}
                                                alt={banner.title}
                                                // Portrait aspect 9:16 approx preview
                                                className="w-10 h-16 object-cover rounded-lg border border-slate-700"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="56"%3E%3Crect fill="%23334155" width="96" height="56"/%3E%3C/svg%3E';
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-white">{banner.title}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-sm ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="text-xs text-slate-400">
                                                {formatDate(banner.starts_at)} - {formatDate(banner.ends_at)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <BannerMetricsCell bannerId={banner.id} />
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <span className="text-sm text-slate-300 px-2 py-1 bg-slate-800 rounded">{getLabelByDeepLink(banner.deep_link)}</span>
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

            {filteredBanners.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Mostrar</span>
                        <select
                            value={bnrPageSize}
                            onChange={e => setBnrPageSize(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-yellow-600/50 transition"
                        >
                            {[10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-xs text-slate-500">por página</span>
                    </div>
                    {bnrTotalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setBnrPage(p => Math.max(1, p - 1))}
                                disabled={bnrPage === 1}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-slate-400 px-3">{bnrPage} / {bnrTotalPages}</span>
                            <button
                                onClick={() => setBnrPage(p => Math.min(bnrTotalPages, p + 1))}
                                disabled={bnrPage === bnrTotalPages}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <AdminModal
                    title={editingBanner ? 'Editar Banner de Notificação' : 'Novo Banner de Notificação'}
                    onClose={() => setIsModalOpen(false)}
                >
                    <div className="space-y-4">
                        <AdminFormInput
                            label="Título * (Uso interno)"
                            value={formData.title}
                            onChange={(v) => setFormData({ ...formData, title: v })}
                            placeholder="Ex: Lançamento Evento Inverno"
                            error={errors.title}
                        />

                        {/* Upload de Imagem Preview Especial 9:16 */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300">Upload da Imagem (1080x1920 portrait) *</label>
                            <div className="flex gap-4">
                                <div className="w-1/3 aspect-[9/16] bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative flex items-center justify-center shrink-0">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-slate-600 opacity-50" size={32} />
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur rounded px-2 py-0.5 text-[8px] text-[#FCF7F0] border border-white/20 whitespace-nowrap">
                                        5 Aguarde
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-end space-y-3 pb-2">
                                     <AdminFileUpload
                                          label="Imagem do Banner"
                                          value={formData.image_url}
                                          onUploaded={(url) => setFormData({ ...formData, image_url: url })}
                                          onClear={() => setFormData({ ...formData, image_url: '' })}
                                          hint="Recomendado: 1080x1920 portrait. JPG, PNG ou WebP."
                                          customUploader={async (file, onProgress) => {
                                              try {
                                                  // Usando bucket "avatars" como base já existente e público!
                                                  const ext = file.name.split('.').pop()
                                                  const path = `notification-banners/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
                                                  
                                                  // Progresso fake de início
                                                  onProgress(30);

                                                  const { data, error } = await supabase.storage
                                                      .from('avatars')
                                                      .upload(path, file, { upsert: true, contentType: file.type });
                                                  
                                                  if (error) {
                                                      throw error;
                                                  }

                                                  onProgress(100);
                                                  
                                                  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
                                                  return { success: true, url: publicData.publicUrl };
                                              } catch (err: any) {
                                                  return { success: false, error: err.message || 'Erro ao realizar upload da imagem.' };
                                              }
                                          }}
                                     />
                                     <AdminFormInput
                                        label="Ou cole a URL da imagem"
                                        value={formData.image_url}
                                        onChange={(v) => setFormData({ ...formData, image_url: v })}
                                        placeholder="https://..."
                                        error={errors.image_url}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Função do app (Deep Link) *</label>
                            <select
                                value={formData.deep_link}
                                onChange={e => setFormData({ ...formData, deep_link: e.target.value })}
                                className={`w-full bg-slate-800 border ${errors.deep_link ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition`}
                            >
                                <option value="">Selecionar função...</option>
                                {DEEP_LINKS.map(group => (
                                <optgroup key={group.group} label={group.group}>
                                    {group.items.map(item => (
                                    <option key={item.value} value={item.value}>
                                        {item.icon} {item.label}
                                    </option>
                                    ))}
                                </optgroup>
                                ))}
                            </select>
                            {errors.deep_link && <p className="text-red-500 text-xs mt-1">{errors.deep_link}</p>}
                        </div>

                        <AdminFormInput
                            label="Texto do botão CTA (opcional)"
                            value={formData.link_label || ''}
                            onChange={(v) => setFormData({ ...formData, link_label: v })}
                            placeholder="Ex: Ver Sócios, Acessar ROI..."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300">Data Início</label>
                                <input
                                    type="datetime-local"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300">Data Fim (opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={formData.ends_at || ''}
                                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value || null })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Tempo antes de pular configurado: {formData.skip_delay}s
                            </label>
                            <input
                                type="range" min={3} max={10} step={1}
                                value={formData.skip_delay}
                                onChange={e => setFormData({ ...formData, skip_delay: Number(e.target.value) })}
                                style={{ width: '100%', accentColor: '#FFDA71' }}
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="block text-sm font-medium text-slate-300">Exibir para:</label>
                            <div className="flex gap-4">
                                {['MEMBER', 'ADMIN', 'TEAM'].map(role => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.target_roles.includes(role)}
                                            onChange={(e) => {
                                                const roles = e.target.checked 
                                                    ? [...formData.target_roles, role]
                                                    : formData.target_roles.filter(r => r !== role);
                                                if (roles.length > 0) setFormData({ ...formData, target_roles: roles });
                                            }}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-yellow-600 focus:ring-yellow-600"
                                        />
                                        {role === 'MEMBER' ? 'Sócios' : role}
                                    </label>
                                ))}
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

            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title="Excluir Banner de Notificação"
                message={`Excluir este banner? Isso não pode ser desfeito.`}
                confirmText="Excluir"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};
