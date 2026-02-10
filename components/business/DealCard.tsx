// components/business/DealCard.tsx
// Card de negócio individual - Prosperus Club App v2.5

import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, Calendar, Loader2, LucideIcon } from 'lucide-react';
import { Deal, DealStatus } from '../../types';
import { businessService } from '../../services/businessService';

interface DealCardProps {
    deal: Deal;
    viewType: 'sales' | 'purchases';
    onStatusChange: () => void;
}

const statusConfig: Record<DealStatus, { label: string; color: string; bg: string; icon: LucideIcon }> = {
    PENDING: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7', icon: Clock },
    CONFIRMED: { label: 'Confirmado', color: '#10b981', bg: '#d1fae5', icon: Check },
    CONTESTED: { label: 'Contestado', color: '#ef4444', bg: '#fee2e2', icon: AlertCircle },
    AUDITADO: { label: 'Auditado', color: '#3b82f6', bg: '#dbeafe', icon: Check },
    INVALIDADO: { label: 'Invalidado', color: '#6b7280', bg: '#f3f4f6', icon: X }
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export const DealCard: React.FC<DealCardProps> = ({ deal, viewType, onStatusChange }) => {
    const [loading, setLoading] = useState<'confirm' | 'contest' | null>(null);

    const partner = viewType === 'sales' ? deal.buyer : deal.seller;
    const config = statusConfig[deal.status];
    const StatusIcon = config.icon;
    const showActions = viewType === 'purchases' && deal.status === 'PENDING';

    const handleConfirm = async () => {
        setLoading('confirm');
        try {
            await businessService.confirmDeal(deal.id);
            onStatusChange();
        } catch (error) {
            console.error('Error confirming deal:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleContest = async () => {
        setLoading('contest');
        try {
            await businessService.contestDeal(deal.id);
            onStatusChange();
        } catch (error) {
            console.error('Error contesting deal:', error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="deal-card">
            <div className="deal-header">
                <img
                    src={partner?.image_url || '/default-avatar.svg'}
                    alt={partner?.name}
                    className="partner-avatar"
                />
                <div className="partner-info">
                    <span className="partner-name">{partner?.name || 'Sócio'}</span>
                    <span className="deal-role">
                        {viewType === 'sales' ? 'Comprador' : 'Vendedor'}
                    </span>
                </div>
                <div className="status-badge" style={{ background: config.bg, color: config.color }}>
                    <StatusIcon size={14} />
                    {config.label}
                </div>
            </div>

            <div className="deal-amount">
                {formatCurrency(deal.amount)}
            </div>

            <p className="deal-description">
                {deal.description}
            </p>

            <div className="deal-date">
                <Calendar size={14} />
                {formatDate(deal.deal_date)}
            </div>

            {showActions && (
                <div className="deal-actions">
                    <button
                        className="btn-confirm"
                        onClick={handleConfirm}
                        disabled={loading !== null}
                    >
                        {loading === 'confirm' ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <Check size={16} />
                        )}
                        Confirmar
                    </button>
                    <button
                        className="btn-contest"
                        onClick={handleContest}
                        disabled={loading !== null}
                    >
                        {loading === 'contest' ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <X size={16} />
                        )}
                        Contestar
                    </button>
                </div>
            )}

            <style>{`
                .deal-card {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    margin-bottom: 12px;
                }

                .deal-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .partner-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .partner-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .partner-name {
                    font-weight: 600;
                    color: #031A2B;
                }

                .deal-role {
                    font-size: 12px;
                    color: #666;
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .deal-amount {
                    font-size: 24px;
                    font-weight: 700;
                    color: #031A2B;
                    margin-bottom: 8px;
                }

                .deal-description {
                    color: #666;
                    font-size: 14px;
                    margin: 0 0 12px 0;
                    line-height: 1.5;
                }

                .deal-date {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #999;
                    font-size: 13px;
                }

                .deal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #eee;
                }

                .btn-confirm, .btn-contest {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    border: none;
                    transition: transform 0.2s;
                }

                .btn-confirm {
                    background: #10b981;
                    color: white;
                }

                .btn-contest {
                    background: #fee2e2;
                    color: #ef4444;
                }

                .btn-confirm:hover, .btn-contest:hover {
                    transform: translateY(-1px);
                }

                .btn-confirm:disabled, .btn-contest:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default DealCard;
