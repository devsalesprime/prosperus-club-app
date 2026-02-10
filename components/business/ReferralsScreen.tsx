// components/business/ReferralsScreen.tsx
// Tela de Gestão de Indicações - Prosperus Club App v2.5

import React, { useState, useEffect } from 'react';
import { Plus, Send, Inbox, Loader2, FileX, Filter } from 'lucide-react';
import { Referral, ReferralStatus } from '../../types';
import { businessService } from '../../services/businessService';
import { ReferralCard } from './ReferralCard';
import { CreateReferralModal } from './CreateReferralModal';

type TabType = 'sent' | 'received';

const statusFilters: { value: ReferralStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'NEW', label: 'Novos' },
    { value: 'IN_PROGRESS', label: 'Em Andamento' },
    { value: 'CONVERTED', label: 'Convertidos' },
    { value: 'LOST', label: 'Perdidos' }
];

export const ReferralsScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('sent');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'ALL'>('ALL');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const loadReferrals = async () => {
        setLoading(true);
        try {
            const data = await businessService.getMyReferrals(activeTab);
            setReferrals(data);
        } catch (error) {
            console.error('Error loading referrals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReferrals();
    }, [activeTab]);

    const filteredReferrals = referrals.filter(r =>
        statusFilter === 'ALL' || r.status === statusFilter
    );

    const handleReferralCreated = () => {
        loadReferrals();
    };

    return (
        <div className="referrals-screen">
            <div className="screen-header">
                <h1>Indicações</h1>
                <button className="btn-new" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Nova Indicação
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    <Send size={18} />
                    Enviadas
                </button>
                <button
                    className={`tab ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                >
                    <Inbox size={18} />
                    Recebidas
                </button>
            </div>

            <div className="filter-row">
                <Filter size={16} />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ReferralStatus | 'ALL')}
                >
                    {statusFilters.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                </select>
            </div>

            <div className="referrals-list">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" size={32} />
                        <span>Carregando indicações...</span>
                    </div>
                ) : filteredReferrals.length === 0 ? (
                    <div className="empty-state">
                        <FileX size={48} />
                        <h3>Nenhuma indicação encontrada</h3>
                        <p>
                            {activeTab === 'sent'
                                ? 'Você ainda não enviou nenhuma indicação.'
                                : 'Você ainda não recebeu nenhuma indicação.'
                            }
                        </p>
                        {activeTab === 'sent' && (
                            <button className="btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={16} />
                                Enviar minha primeira indicação
                            </button>
                        )}
                    </div>
                ) : (
                    filteredReferrals.map(referral => (
                        <ReferralCard
                            key={referral.id}
                            referral={referral}
                            viewType={activeTab}
                            onStatusChange={loadReferrals}
                        />
                    ))
                )}
            </div>

            <CreateReferralModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleReferralCreated}
            />

            <style>{`
                .referrals-screen {
                    padding: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .screen-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .screen-header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #f1f5f9;
                }

                .btn-new {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #FFDA71;
                    color: #031A2B;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                }

                .tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                    background: #1e293b;
                    padding: 4px;
                    border-radius: 10px;
                }

                .tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    font-weight: 600;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab.active {
                    background: #334155;
                    color: #f1f5f9 !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .filter-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                    color: #94a3b8;
                }

                .filter-row select {
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #1e293b;
                    color: #f1f5f9;
                    cursor: pointer;
                }

                .referrals-list {
                    min-height: 300px;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: #94a3b8;
                    gap: 12px;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 60px 20px;
                    color: #64748b;
                }

                .empty-state h3 {
                    color: #e2e8f0;
                    margin: 16px 0 8px;
                }

                .empty-state p {
                    margin: 0 0 20px;
                }

                .empty-state .btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #FFDA71;
                    color: #031A2B;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ReferralsScreen;
