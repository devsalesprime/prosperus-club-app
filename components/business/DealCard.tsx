// components/business/DealCard.tsx
// Card de negócio premium — Prosperus Club App v3.0.1
// Track 1: Visual upgrade com status borders, badges, e tipografia premium.

import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, Calendar, Loader2, Trash2, LucideIcon } from 'lucide-react';
import { Deal, DealStatus } from '../../types';
import { businessService } from '../../services/businessService';
import { SwipeableItem } from '../ui/SwipeableItem';
import { DeleteConfirmSheet } from '../ui/DeleteConfirmSheet';
import { notify } from '../../utils/toast';

interface DealCardProps {
    deal: Deal;
    viewType: 'sales' | 'purchases';
    onStatusChange: () => void;
    /** Called when swipe-to-delete is confirmed */
    onDelete?: (dealId: string) => void;
}

// ─── Status Config with border, badge, and icon colors ──────────

const statusConfig: Record<DealStatus, {
    label: string;
    icon: LucideIcon;
    border: string;
    badgeBg: string;
    badgeText: string;
}> = {
    PENDING:    { label: 'Pendente',    icon: Clock,       border: 'border-l-orange-500', badgeBg: 'bg-orange-500/10', badgeText: 'text-orange-400' },
    CONFIRMED:  { label: 'Confirmado',  icon: Check,       border: 'border-l-green-500',  badgeBg: 'bg-green-500/10',  badgeText: 'text-green-400' },
    CONTESTED:  { label: 'Contestado',  icon: AlertCircle, border: 'border-l-red-500',    badgeBg: 'bg-red-500/10',    badgeText: 'text-red-400' },
    AUDITADO:   { label: 'Auditado',    icon: Check,       border: 'border-l-yellow-500', badgeBg: 'bg-yellow-500/10', badgeText: 'text-yellow-400' },
    INVALIDADO: { label: 'Invalidado',  icon: X,           border: 'border-l-slate-500',  badgeBg: 'bg-slate-500/10',  badgeText: 'text-slate-400' },
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export const DealCard: React.FC<DealCardProps> = ({ deal, viewType, onStatusChange, onDelete }) => {
    const [loading, setLoading] = useState<'confirm' | 'contest' | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const partner = viewType === 'sales' ? deal.buyer : deal.seller;
    const config = statusConfig[deal.status];
    const StatusIcon = config.icon;
    const showActions = viewType === 'purchases' && deal.status === 'PENDING';
    const canDelete = !!onDelete && viewType === 'sales';

    const handleConfirm = async () => {
        setLoading('confirm');
        try {
            await businessService.confirmDeal(deal.id);
            notify.success('Negócio confirmado. ROI atualizado.');
            onStatusChange();
        } catch (error) {
            console.error('Error confirming deal:', error);
            notify.error('Não foi possível confirmar. Tente novamente.');
        } finally {
            setLoading(null);
        }
    };

    const handleContest = async () => {
        setLoading('contest');
        try {
            await businessService.contestDeal(deal.id);
            notify.info('Negócio contestado. O time será notificado.');
            onStatusChange();
        } catch (error) {
            console.error('Error contesting deal:', error);
            notify.error('Não foi possível processar. Tente novamente.');
        } finally {
            setLoading(null);
        }
    };

    const cardContent = (
        <div className={`bg-slate-800/90 shadow-lg rounded-r-xl p-4 w-full relative border-l-4 ${config.border} border border-slate-700/50 transition-all hover:shadow-xl`}>
            {/* Header: Avatar + Partner + Status Badge */}
            <div className="flex items-center gap-3 mb-3">
                <img
                    src={partner?.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`}
                    alt={partner?.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-slate-600 shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold tracking-wide truncate">{partner?.name || 'Sócio'}</p>
                    <p className="text-xs text-slate-400">{viewType === 'sales' ? 'Comprador' : 'Vendedor'}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${config.badgeBg} ${config.badgeText}`}>
                    <StatusIcon size={13} />
                    {config.label}
                </div>
            </div>

            {/* Amount */}
            <div className="mb-2">
                <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Volume</p>
                <p className="text-xl font-extrabold text-white">{formatCurrency(deal.amount)}</p>
            </div>

            {/* Description */}
            {deal.description && (
                <p className="text-sm text-slate-300 leading-relaxed mb-3 line-clamp-2">{deal.description}</p>
            )}

            {/* Date */}
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Calendar size={13} />
                {formatDate(deal.deal_date)}
            </div>

            {/* Actions — only for purchases in PENDING */}
            {showActions && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700/50">
                    <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                        onClick={handleConfirm}
                        disabled={loading !== null}
                    >
                        {loading === 'confirm' ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Confirmar
                    </button>
                    <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                        onClick={handleContest}
                        disabled={loading !== null}
                    >
                        {loading === 'contest' ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
                        Contestar
                    </button>
                </div>
            )}
        </div>
    );

    // If deletable: wrap with SwipeableItem (swipe preserved!)
    if (canDelete) {
        return (
            <>
                <SwipeableItem
                    rightActions={[{
                        label: 'Deletar',
                        icon: <Trash2 size={18} />,
                        color: 'bg-red-500',
                        width: 80,
                        onTrigger: () => setShowDeleteConfirm(true),
                    }]}
                >
                    {cardContent}
                </SwipeableItem>
                <DeleteConfirmSheet
                    isOpen={showDeleteConfirm}
                    title="Deletar negócio?"
                    message={`O registro de ${formatCurrency(deal.amount)} será removido permanentemente.`}
                    confirmLabel="Deletar"
                    onConfirm={() => {
                        setShowDeleteConfirm(false);
                        onDelete!(deal.id);
                    }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            </>
        );
    }

    return cardContent;
};

export default DealCard;
