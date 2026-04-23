import React, { useState, useEffect, useCallback } from 'react';
import { adminBirthdayService, BirthdayBanner } from '../../services/adminBirthdayService';
import { AdminPageHeader } from './shared/AdminPageHeader';
import { AdminEmptyState } from './shared/AdminEmptyState';
import {
    Loader2, CalendarHeart, Clock, CheckCircle2, Trash2, RefreshCw, Calendar
} from 'lucide-react';
import { notify } from '../../utils/toast';
import { AdminConfirmDialog } from './shared/AdminConfirmDialog';

type TabType = 'scheduled' | 'sent';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length >= 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function daysLabel(days: number): string {
    if (days === 0) return '🎂 É HOJE!';
    if (days === 1) return 'Amanhã';
    if (days < 0) return `Há ${Math.abs(days)} dias`;
    return `${days} dias`;
}

// ── Badge ──────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: BirthdayBanner['status'] }> = ({ status }) => {
    if (status === 'scheduled') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Clock size={11} /> Agendado
            </span>
        );
    }
    if (status === 'sent') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 size={11} /> Enviado
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/25">
            Sem Banner
        </span>
    );
};

// ── Main Component ──────────────────────────────────────────────────────────

export const AdminBirthdaysModule: React.FC = () => {
    const [allBanners, setAllBanners] = useState<BirthdayBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('scheduled');
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminBirthdayService.getUpcomingBirthdays();
            setAllBanners(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao carregar aniversariantes.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Sincronização HubSpot ────────────────────────────────────────────
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await adminBirthdayService.syncFromHubSpot();
            if (result.success) {
                const { found = 0, synced = 0, skipped = 0 } = result.stats ?? {};
                notify.success(`Sincronizado! ${synced} banner(s) agendado(s). (${found} encontrados, ${skipped} ignorados)`);
                await loadData();
            } else {
                notify.error(result.error || 'Erro na sincronização com HubSpot.');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido.';
            notify.error(`Erro: ${msg}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Exclusão ─────────────────────────────────────────────────────────
    const handleDeleteCard = (cardId: string) => setCardToDelete(cardId);

    const confirmDeleteCard = async () => {
        if (!cardToDelete) return;
        setIsDeleting(cardToDelete);
        try {
            await adminBirthdayService.deleteCard(cardToDelete);
            notify.success('Banner cancelado com sucesso.');
            loadData();
        } catch {
            notify.error('Erro ao cancelar banner.');
        } finally {
            setIsDeleting(null);
            setCardToDelete(null);
        }
    };

    // ── Filtragem por Aba ─────────────────────────────────────────────────
    const displayedBanners = allBanners.filter((b) =>
        activeTab === 'scheduled'
            ? b.status === 'scheduled' || b.status === 'no_banner'
            : b.status === 'sent'
    );

    // ── Renderização Desktop (Tabela) ─────────────────────────────────────
    const renderTable = () => (
        <div className="hidden md:block bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/50">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Banner</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sócio</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aniversário</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                    {displayedBanners.map((b) => (
                        <tr
                            key={`${b.userId}-${b.scheduledDate}`}
                            className="hover:bg-slate-700/30 transition-colors duration-150"
                        >
                            {/* Thumbnail */}
                            <td className="py-3 px-4">
                                {b.imageUrl ? (
                                    <a href={b.imageUrl} target="_blank" rel="noreferrer">
                                        <img
                                            src={b.imageUrl}
                                            alt="Banner"
                                            className="aspect-video w-20 object-cover rounded-md border border-slate-700 hover:opacity-80 transition"
                                        />
                                    </a>
                                ) : (
                                    <div className="aspect-video w-20 rounded-md bg-slate-700/60 flex items-center justify-center border border-slate-600 border-dashed">
                                        <Calendar size={14} className="text-slate-500" />
                                    </div>
                                )}
                            </td>

                            {/* Sócio */}
                            <td className="py-3 px-4">
                                <p className="text-sm font-medium text-white">{b.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{b.email}</p>
                            </td>

                            {/* Data */}
                            <td className="py-3 px-4">
                                <p className="text-sm text-slate-200">{formatDate(b.scheduledDate)}</p>
                                <p className={`text-xs font-medium mt-0.5 ${b.daysRemaining === 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {daysLabel(b.daysRemaining)}
                                </p>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                                <StatusBadge status={b.status} />
                            </td>

                            {/* Ação */}
                            <td className="py-3 px-4 text-right">
                                {b.cardId && (
                                    <button
                                        onClick={() => handleDeleteCard(b.cardId!)}
                                        disabled={isDeleting === b.cardId}
                                        className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                                        title="Cancelar banner"
                                        aria-label="Cancelar banner"
                                    >
                                        {isDeleting === b.cardId
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Trash2 size={16} />
                                        }
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // ── Renderização Mobile (Cards) ───────────────────────────────────────
    const renderCards = () => (
        <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
            {displayedBanners.map((b) => (
                <div
                    key={`${b.userId}-${b.scheduledDate}-card`}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex gap-4"
                >
                    {/* Thumbnail */}
                    <div className="shrink-0">
                        {b.imageUrl ? (
                            <a href={b.imageUrl} target="_blank" rel="noreferrer">
                                <img
                                    src={b.imageUrl}
                                    alt="Banner"
                                    className="aspect-video w-20 object-cover rounded-md border border-slate-700"
                                />
                            </a>
                        ) : (
                            <div className="aspect-video w-20 rounded-md bg-slate-700/60 flex items-center justify-center border border-slate-600 border-dashed">
                                <Calendar size={14} className="text-slate-500" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{b.name}</p>
                        <p className="text-xs text-slate-400 truncate">{b.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <StatusBadge status={b.status} />
                            <span className="text-xs text-slate-300">{formatDate(b.scheduledDate)}</span>
                        </div>
                        <p className={`text-xs font-medium mt-1 ${b.daysRemaining === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {daysLabel(b.daysRemaining)}
                        </p>
                    </div>

                    {/* Delete */}
                    {b.cardId && (
                        <div className="shrink-0 flex items-center">
                            <button
                                onClick={() => handleDeleteCard(b.cardId!)}
                                disabled={isDeleting === b.cardId}
                                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                                aria-label="Cancelar banner"
                            >
                                {isDeleting === b.cardId
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Trash2 size={16} />
                                }
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    // ── Render principal ──────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header com Botão Dourado */}
            <AdminPageHeader
                title="Homenagens de Aniversário"
                action={
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-fit px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(202,154,67,0.2)] hover:scale-105 active:scale-95 transition-all text-[#031A2B] font-bold text-sm bg-[linear-gradient(93.9deg,#FFDA71_0%,#CA9A43_100%)] border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar HubSpot'}
                    </button>
                }
            />

            <p className="text-slate-400 text-sm -mt-2">
                Banners sincronizados automaticamente do campo <span className="font-mono text-amber-500/80 text-xs">banner_de_aniversario</span> da HubSpot. Apenas leitura — use o botão acima para atualizar.
            </p>

            {/* Abas */}
            <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/60 w-fit">
                {(['scheduled', 'sent'] as TabType[]).map((tab) => {
                    const count = allBanners.filter((b) =>
                        tab === 'scheduled'
                            ? b.status === 'scheduled' || b.status === 'no_banner'
                            : b.status === 'sent'
                    ).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                activeTab === tab
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab === 'scheduled' ? (
                                <><Clock size={14} /> Agendados</>
                            ) : (
                                <><CheckCircle2 size={14} /> Enviados</>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === tab ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Conteúdo */}
            {error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <p className="font-medium text-sm">Erro ao carregar dados:</p>
                    <p className="text-xs mt-1 opacity-80">{error}</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center p-16">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                </div>
            ) : displayedBanners.length === 0 ? (
                <AdminEmptyState
                    icon={<CalendarHeart size={48} className="text-amber-500/40" />}
                    message={
                        activeTab === 'scheduled'
                            ? 'Nenhum banner agendado'
                            : 'Nenhum banner enviado ainda'
                    }
                    description={
                        activeTab === 'scheduled'
                            ? 'Clique em "Sincronizar HubSpot" para importar os banners cadastrados no CRM.'
                            : 'Os banners migram para esta aba automaticamente quando o sócio visualiza a homenagem.'
                    }
                />
            ) : (
                <>
                    {renderTable()}
                    {renderCards()}
                </>
            )}

            {/* Confirm Dialog */}
            <AdminConfirmDialog
                isOpen={!!cardToDelete}
                onClose={() => setCardToDelete(null)}
                onConfirm={confirmDeleteCard}
                title="Cancelar Homenagem"
                message="Tem certeza que deseja cancelar este banner? Esta ação não pode ser desfeita."
                confirmText="Sim, cancelar"
                cancelText="Manter"
                isDestructive={true}
            />
        </div>
    );
};

export default AdminBirthdaysModule;
