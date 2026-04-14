// components/business/MyDealsScreen.tsx
// Tela de Meus Negócios (ROI) - Prosperus Club App v2.5

import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, ShoppingBag, Loader2, FileX } from 'lucide-react';
import { Deal } from '../../types';
import { businessService } from '../../services/businessService';
import { DealCard } from './DealCard';
import { RegisterDealModal } from './RegisterDealModal';

type TabType = 'sales' | 'purchases';

export const MyDealsScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('sales');
    const [deals, setDeals] = useState<Deal[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const loadDeals = async () => {
        setLoading(true);
        try {
            const data = await businessService.getMyDeals(activeTab);
            setDeals(data);

            // Count pending for badge
            if (activeTab === 'purchases') {
                const pending = data.filter(d => d.status === 'PENDING');
                setPendingCount(pending.length);
            } else {
                const purchaseData = await businessService.getMyDeals('purchases');
                setPendingCount(purchaseData.filter(d => d.status === 'PENDING').length);
            }
        } catch (error) {
            console.error('Error loading deals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeals();
    }, [activeTab]);

    const handleDealRegistered = () => {
        loadDeals();
    };

    return (
        <div className="deals-screen">
            <div className="screen-header">
                <h1>Meus Negócios</h1>
                <button className="btn-register" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Registrar
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    <DollarSign size={18} />
                    Vendas
                </button>
                <button
                    className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    <ShoppingBag size={18} />
                    Compras
                    {pendingCount > 0 && (
                        <span className="pending-badge">{pendingCount}</span>
                    )}
                </button>
            </div>

            <div className="deals-list">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" size={32} />
                        <span>Carregando negócios...</span>
                    </div>
                ) : deals.length === 0 ? (
                    <div className="empty-state">
                        <FileX size={48} />
                        <h3>Nenhum negócio encontrado</h3>
                        <p>
                            {activeTab === 'sales'
                                ? 'Você ainda não registrou nenhuma venda.'
                                : 'Nenhuma compra registrada com você.'
                            }
                        </p>
                        {activeTab === 'sales' && (
                            <button className="btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={16} />
                                Registrar minha primeira venda
                            </button>
                        )}
                    </div>
                ) : (
                    deals.map(deal => (
                        <DealCard
                            key={deal.id}
                            deal={deal}
                            viewType={activeTab}
                            onStatusChange={loadDeals}
                        />
                    ))
                )}
            </div>

            <RegisterDealModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleDealRegistered}
            />

            <style>{`
                .deals-screen {
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

                .btn-register {
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
                    margin-bottom: 20px;
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
                    position: relative;
                }

                .tab.active {
                    background: #334155;
                    color: #f1f5f9 !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .pending-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }

                .deals-list {
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

export default MyDealsScreen;
