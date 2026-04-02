// ============================================
// ADMIN BENEFITS APPROVAL - Moderation Panel
// ============================================
// Painel de curadoria para aprovação/rejeição de benefícios
// cadastrados pelos sócios, usando Shared Components e Optimistic UI.

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Check, X, Gift, RefreshCw } from 'lucide-react';
import { profileService, ProfileData } from '../../services/profileService';
import { AdminPageHeader } from './shared/AdminPageHeader';
import { AdminEmptyState } from './shared/AdminEmptyState';
import { AdminConfirmDialog } from './shared/AdminConfirmDialog';
import { AdminLoadingState } from './shared/AdminLoadingState';
import { Avatar } from '../ui/Avatar';

export const AdminBenefitsApproval: React.FC = () => {
    const [pendingBenefits, setPendingBenefits] = useState<ProfileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Reject confirmation dialog
    const [rejectTarget, setRejectTarget] = useState<ProfileData | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // ============================================
    // FETCH PENDING BENEFITS
    // ============================================

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const data = await profileService.getPendingBenefits();
            setPendingBenefits(data);
        } catch {
            toast.error('Erro ao carregar benefícios pendentes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    // ============================================
    // APPROVE (Optimistic UI)
    // ============================================

    const handleApprove = async (profile: ProfileData) => {
        setProcessingId(profile.id);

        // Optimistic: remove from list immediately
        setPendingBenefits(prev => prev.filter(p => p.id !== profile.id));

        const success = await profileService.updateBenefitStatus(profile.id, 'approved');

        if (success) {
            toast.success(`Benefício de ${profile.name} aprovado!`);
        } else {
            // Rollback: add back to list
            setPendingBenefits(prev => [...prev, profile]);
            toast.error('Erro ao aprovar. Tente novamente.');
        }

        setProcessingId(null);
    };

    // ============================================
    // REJECT (with Confirm Dialog + Optimistic UI)
    // ============================================

    const handleRejectConfirm = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            toast.error('Informe o motivo da recusa.');
            return;
        }

        setIsRejecting(true);

        const target = rejectTarget;

        // Optimistic: remove from list
        setPendingBenefits(prev => prev.filter(p => p.id !== target.id));

        const success = await profileService.updateBenefitStatus(target.id, 'rejected', rejectReason);

        if (success) {
            toast.success(`Benefício de ${target.name} recusado.`);
        } else {
            // Rollback
            setPendingBenefits(prev => [...prev, target]);
            toast.error('Erro ao recusar. Tente novamente.');
        }

        setIsRejecting(false);
        setRejectTarget(null);
        setRejectReason(''); // Clear reason on success
    };

    // ============================================
    // RENDER
    // ============================================

    if (loading) return <AdminLoadingState />;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Aprovação de Benefícios"
                subtitle="Modere as ofertas cadastradas pelos sócios antes de irem ao ar."
                action={
                    <button
                        onClick={fetchPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                    >
                        <RefreshCw size={14} />
                        Atualizar
                    </button>
                }
            />

            {pendingBenefits.length === 0 ? (
                <AdminEmptyState
                    icon={<ShieldCheck size={48} />}
                    message="Tudo limpo!"
                    description="Nenhum benefício aguardando aprovação."
                />
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-slate-800/50 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-3">Sócio / Empresa</div>
                        <div className="col-span-3">Título da Oferta</div>
                        <div className="col-span-4">Descrição</div>
                        <div className="col-span-2 text-right">Ações</div>
                    </div>

                    {/* Table Rows */}
                    {pendingBenefits.map(profile => (
                        <div
                            key={profile.id}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800 hover:bg-slate-800/30 transition items-center"
                        >
                            {/* Sócio / Empresa */}
                            <div className="col-span-3 flex items-center gap-3">
                                <Avatar
                                    src={profile.image_url}
                                    alt={profile.name}
                                    size="sm"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{profile.company || profile.job_title || '—'}</p>
                                </div>
                            </div>

                            {/* Título da Oferta */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-2">
                                    <Gift size={14} className="text-yellow-500 shrink-0" />
                                    <p className="text-sm text-slate-200 font-medium truncate">
                                        {profile.exclusive_benefit?.title || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="col-span-4">
                                <p className="text-sm text-slate-400 line-clamp-2">
                                    {profile.exclusive_benefit?.description || '—'}
                                </p>
                                {profile.exclusive_benefit?.code && (
                                    <span className="inline-block mt-1 text-[10px] font-mono bg-slate-800 border border-slate-700 text-yellow-500 px-2 py-0.5 rounded">
                                        Cupom: {profile.exclusive_benefit.code}
                                    </span>
                                )}
                            </div>

                            {/* Ações */}
                            <div className="col-span-2 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleApprove(profile)}
                                    disabled={processingId === profile.id}
                                    className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 border border-transparent hover:border-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Aprovar"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={() => setRejectTarget(profile)}
                                    disabled={processingId === profile.id}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Recusar"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Counter */}
                    <div className="px-6 py-3 bg-slate-800/30 text-xs text-slate-500">
                        {pendingBenefits.length} {pendingBenefits.length === 1 ? 'benefício pendente' : 'benefícios pendentes'}
                    </div>
                </div>
            )}

            {/* Custom Reject Confirmation Dialog with Reason Textarea */}
            {rejectTarget && (
                <div className="bg-black/60 backdrop-blur-sm z-50 fixed inset-0 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-[90%] max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-red-500 mb-2">Recusar Benefício</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Informe ao sócio o motivo da recusa para que ele possa adequar a oferta às regras do clube.
                        </p>
                        
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ex: A oferta precisa ter um link válido ou uma imagem mais clara..."
                            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-3 w-full min-h-[100px] text-sm focus:border-red-500/50 outline-none focus:ring-1 focus:ring-red-500/50 resize-y mb-6 transition-colors placeholder:text-slate-600/50"
                            autoFocus
                        />

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setRejectTarget(null);
                                    setRejectReason('');
                                }}
                                disabled={isRejecting}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={isRejecting || !rejectReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRejecting ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Recusando...
                                    </>
                                ) : (
                                    <>Confirmar Recusa</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBenefitsApproval;
