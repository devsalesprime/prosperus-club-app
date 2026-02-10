// ============================================
// CONTESTED DEALS TAB
// ============================================
// Priority queue for disputed deals requiring admin resolution

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Mail, User, DollarSign, Calendar, MessageSquare } from 'lucide-react';

interface ContestedDeal {
    id: string;
    seller_id: string;
    seller_name: string;
    seller_email: string;
    seller_image: string;
    buyer_id: string;
    buyer_name: string;
    buyer_email: string;
    buyer_image: string;
    amount: number;
    description: string;
    deal_date: string;
    created_at: string;
}

interface ContestedDealsTabProps {
    deals: ContestedDeal[];
    loading: boolean;
    onAudit: (dealId: string, decision: 'APPROVE' | 'REJECT', notes: string) => Promise<void>;
}

export const ContestedDealsTab: React.FC<ContestedDealsTabProps> = ({ deals, loading, onAudit }) => {
    const [selectedDeal, setSelectedDeal] = useState<ContestedDeal | null>(null);
    const [auditNotes, setAuditNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleAudit = async (decision: 'APPROVE' | 'REJECT') => {
        if (!selectedDeal) return;

        if (!auditNotes.trim()) {
            alert('Por favor, adicione uma justificativa para a decisão');
            return;
        }

        setSubmitting(true);
        try {
            await onAudit(selectedDeal.id, decision, auditNotes);
            setSelectedDeal(null);
            setAuditNotes('');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao auditar negócio';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
                        <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
                        <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (deals.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma Contestação Pendente</h3>
                <p className="text-slate-400">Todas as disputas foram resolvidas! 🎉</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Contested Deals List */}
            {deals.map(deal => (
                <div
                    key={deal.id}
                    className="bg-slate-900 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDeal(deal)}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                                Contestado
                            </span>
                        </div>
                        <span className="text-sm text-slate-400">
                            {formatDate(deal.created_at)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Seller */}
                        <div className="flex items-center gap-3">
                            <img
                                src={deal.seller_image || '/default-avatar.svg'}
                                alt={deal.seller_name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                            />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-0.5">Vendedor</p>
                                <p className="text-sm font-bold text-white truncate">{deal.seller_name}</p>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <DollarSign size={20} className="text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Valor</p>
                                <p className="text-lg font-bold text-yellow-500">{formatCurrency(deal.amount)}</p>
                            </div>
                        </div>

                        {/* Buyer */}
                        <div className="flex items-center gap-3">
                            <img
                                src={deal.buyer_image || '/default-avatar.svg'}
                                alt={deal.buyer_name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                            />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-0.5">Comprador (Contestou)</p>
                                <p className="text-sm font-bold text-white truncate">{deal.buyer_name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm text-slate-300 line-clamp-2">{deal.description}</p>
                    </div>
                </div>
            ))}

            {/* Audit Modal */}
            {selectedDeal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold text-white">Resolver Contestação</h2>
                                <button
                                    onClick={() => setSelectedDeal(null)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <XCircle size={24} className="text-slate-400" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-400">
                                Analise os detalhes e tome uma decisão fundamentada
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Deal Info */}
                            <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Valor do Negócio</span>
                                    <span className="text-2xl font-bold text-yellow-500">
                                        {formatCurrency(selectedDeal.amount)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Data do Negócio</span>
                                    <span className="text-sm font-medium text-white">
                                        {formatDate(selectedDeal.deal_date)}
                                    </span>
                                </div>
                            </div>

                            {/* Parties */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Seller */}
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                    <p className="text-xs text-green-400 font-bold uppercase mb-3">Vendedor</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={selectedDeal.seller_image || '/default-avatar.svg'}
                                            alt={selectedDeal.seller_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{selectedDeal.seller_name}</p>
                                            <p className="text-xs text-slate-400 truncate">{selectedDeal.seller_email}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${selectedDeal.seller_email}`}
                                        className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300"
                                    >
                                        <Mail size={14} />
                                        Contatar
                                    </a>
                                </div>

                                {/* Buyer */}
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <p className="text-xs text-red-400 font-bold uppercase mb-3">Comprador (Contestou)</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={selectedDeal.buyer_image || '/default-avatar.svg'}
                                            alt={selectedDeal.buyer_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{selectedDeal.buyer_name}</p>
                                            <p className="text-xs text-slate-400 truncate">{selectedDeal.buyer_email}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${selectedDeal.buyer_email}`}
                                        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
                                    >
                                        <Mail size={14} />
                                        Contatar
                                    </a>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">
                                    Descrição do Negócio
                                </label>
                                <div className="bg-slate-800/50 rounded-lg p-4">
                                    <p className="text-sm text-slate-300">{selectedDeal.description}</p>
                                </div>
                            </div>

                            {/* Audit Notes */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">
                                    Justificativa da Decisão *
                                </label>
                                <textarea
                                    value={auditNotes}
                                    onChange={(e) => setAuditNotes(e.target.value)}
                                    placeholder="Explique o motivo da sua decisão (será enviado ao vendedor)..."
                                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/50 resize-none"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-800 flex gap-3">
                            <button
                                onClick={() => handleAudit('APPROVE')}
                                disabled={submitting || !auditNotes.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors"
                            >
                                <CheckCircle size={20} />
                                Validar Venda
                            </button>
                            <button
                                onClick={() => handleAudit('REJECT')}
                                disabled={submitting || !auditNotes.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors"
                            >
                                <XCircle size={20} />
                                Invalidar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestedDealsTab;
