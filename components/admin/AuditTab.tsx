// ============================================
// AUDIT TAB
// ============================================
// General audit interface for high-value deals and bulk actions

import React, { useState } from 'react';
import { CheckCircle, XCircle, DollarSign, Calendar, AlertTriangle, Filter } from 'lucide-react';

interface AuditDeal {
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
    status: string;
}

interface AuditTabProps {
    deals: AuditDeal[];
    suspiciousDeals: Deal[];
    loading: boolean;
    onAudit: (dealId: string, decision: 'APPROVE' | 'REJECT', notes: string) => Promise<void>;
    onBulkAudit: (dealIds: string[], decision: 'APPROVE' | 'REJECT', notes: string) => Promise<void>;
}

export const AuditTab: React.FC<AuditTabProps> = ({
    deals,
    suspiciousDeals,
    loading,
    onAudit,
    onBulkAudit
}) => {
    const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkNotes, setBulkNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [minAmount, setMinAmount] = useState(10000);

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

    const toggleDeal = (dealId: string) => {
        const newSelected = new Set(selectedDeals);
        if (newSelected.has(dealId)) {
            newSelected.delete(dealId);
        } else {
            newSelected.add(dealId);
        }
        setSelectedDeals(newSelected);
    };

    const toggleAll = () => {
        if (selectedDeals.size === deals.length) {
            setSelectedDeals(new Set());
        } else {
            setSelectedDeals(new Set(deals.map(d => d.id)));
        }
    };

    const isSuspicious = (dealId: string) => {
        return suspiciousDeals.some(sd => sd.id === dealId);
    };

    const handleBulkAudit = async (decision: 'APPROVE' | 'REJECT') => {
        if (!bulkNotes.trim()) {
            alert('Por favor, adicione uma justificativa');
            return;
        }

        setSubmitting(true);
        try {
            await onBulkAudit(Array.from(selectedDeals), decision, bulkNotes);
            setSelectedDeals(new Set());
            setShowBulkModal(false);
            setBulkNotes('');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao auditar negócios';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDeals = deals.filter(d => d.amount >= minAmount);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
                        <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
                        <div className="h-4 bg-slate-800 rounded w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters and Bulk Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <label className="text-sm text-slate-400">Valor mínimo:</label>
                        <select
                            value={minAmount}
                            onChange={(e) => setMinAmount(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-600"
                        >
                            <option value={0}>Todos</option>
                            <option value={5000}>R$ 5.000+</option>
                            <option value={10000}>R$ 10.000+</option>
                            <option value={25000}>R$ 25.000+</option>
                            <option value={50000}>R$ 50.000+</option>
                        </select>
                    </div>
                    <div className="text-sm text-slate-400">
                        {filteredDeals.length} negócio(s)
                    </div>
                </div>

                {selectedDeals.size > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">
                            {selectedDeals.size} selecionado(s)
                        </span>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors text-sm"
                        >
                            Auditar Selecionados
                        </button>
                    </div>
                )}
            </div>

            {/* Deals List */}
            <div className="space-y-3">
                {filteredDeals.length > 0 && (
                    <div className="flex items-center gap-2 px-4">
                        <input
                            type="checkbox"
                            checked={selectedDeals.size === filteredDeals.length && filteredDeals.length > 0}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-yellow-600 focus:ring-yellow-600"
                        />
                        <span className="text-sm text-slate-400">Selecionar todos</span>
                    </div>
                )}

                {filteredDeals.map(deal => {
                    const suspicious = isSuspicious(deal.id);

                    return (
                        <div
                            key={deal.id}
                            className={`bg-slate-900 border rounded-xl p-6 transition-colors ${suspicious
                                ? 'border-red-500/50 bg-red-500/5'
                                : 'border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedDeals.has(deal.id)}
                                    onChange={() => toggleDeal(deal.id)}
                                    className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-yellow-600 focus:ring-yellow-600"
                                />

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {suspicious && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs font-bold text-red-400">
                                                    <AlertTriangle size={14} />
                                                    SUSPEITO
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-500">
                                                {formatDate(deal.deal_date)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-yellow-500">
                                                {formatCurrency(deal.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={deal.seller_image || '/default-avatar.svg'}
                                                alt={deal.seller_name}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500">Vendedor</p>
                                                <p className="text-sm font-bold text-white truncate">{deal.seller_name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <img
                                                src={deal.buyer_image || '/default-avatar.svg'}
                                                alt={deal.buyer_name}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500">Comprador</p>
                                                <p className="text-sm font-bold text-white truncate">{deal.buyer_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-slate-300 line-clamp-2">{deal.description}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onAudit(deal.id, 'APPROVE', 'Negócio de alto valor aprovado após revisão')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors text-sm"
                                        >
                                            <CheckCircle size={16} />
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => {
                                                const notes = prompt('Motivo da invalidação:');
                                                if (notes) onAudit(deal.id, 'REJECT', notes);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-sm"
                                        >
                                            <XCircle size={16} />
                                            Invalidar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredDeals.length === 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum Negócio Pendente</h3>
                        <p className="text-slate-400">Todos os negócios de alto valor foram auditados!</p>
                    </div>
                )}
            </div>

            {/* Bulk Audit Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">Auditoria em Lote</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {selectedDeals.size} negócio(s) selecionado(s)
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-bold text-slate-400 mb-2">
                                Justificativa *
                            </label>
                            <textarea
                                value={bulkNotes}
                                onChange={(e) => setBulkNotes(e.target.value)}
                                placeholder="Explique o motivo da decisão..."
                                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 resize-none"
                                disabled={submitting}
                            />
                        </div>

                        <div className="p-6 border-t border-slate-800 flex gap-3">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleBulkAudit('APPROVE')}
                                disabled={submitting || !bulkNotes.trim()}
                                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors"
                            >
                                Aprovar Todos
                            </button>
                            <button
                                onClick={() => handleBulkAudit('REJECT')}
                                disabled={submitting || !bulkNotes.trim()}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors"
                            >
                                Invalidar Todos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTab;
