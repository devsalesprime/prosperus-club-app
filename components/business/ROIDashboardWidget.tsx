// components/business/ROIDashboardWidget.tsx
// Widget de ROI Pessoal no Dashboard - Prosperus Club App v2.5

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Plus, Clock, DollarSign, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { businessService, BusinessStats } from '../../services/businessService';
import { RegisterDealModal } from './RegisterDealModal';

interface ROIDashboardWidgetProps {
    onRegisterDeal: () => void;
    onNavigateToDeals: () => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const ROIDashboardWidget: React.FC<ROIDashboardWidgetProps> = ({
    onRegisterDeal,
    onNavigateToDeals
}) => {
    const [stats, setStats] = useState<BusinessStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(true); // Accordion state - default open
    const [showRegisterModal, setShowRegisterModal] = useState(false); // Modal state

    const loadStats = async () => {
        try {
            const data = await businessService.getMyStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load ROI stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="roi-dashboard-widget animate-pulse">
                <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-6 bg-white/20 rounded"></div>
                    <div className="h-6 bg-white/20 rounded"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const currentYear = new Date().getFullYear();

    return (
        <div className={`roi-dashboard-widget ${isOpen ? '' : 'collapsed'}`}>
            {/* Clickable Header */}
            <div
                className="roi-header"
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                aria-expanded={isOpen}
                aria-label="Toggle ROI details"
            >
                <TrendingUp className="roi-icon" size={20} />
                <h3>Meu ROI no Clube ({currentYear})</h3>
                {isOpen ? (
                    <ChevronUp className="chevron-icon" size={20} />
                ) : (
                    <ChevronDown className="chevron-icon" size={20} />
                )}
            </div>

            {/* Collapsible Content */}
            <div
                className="roi-content"
                style={{
                    maxHeight: isOpen ? '1000px' : '0',
                    opacity: isOpen ? 1 : 0,
                    padding: isOpen ? '0 20px 20px 20px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease'
                }}
            >
                <div className="roi-metrics">
                    <div className="metric sales">
                        <span className="emoji">🟢</span>
                        <span className="label">Vendi:</span>
                        <span className="value">
                            {stats.totalSales > 0 ? (
                                <TrendingUp size={20} className="trend-up" />
                            ) : (
                                <TrendingDown size={20} className="trend-down" />
                            )}
                        </span>
                    </div>
                    <div className="metric purchases">
                        <span className="emoji">🔵</span>
                        <span className="label">Comprei:</span>
                        <span className="value">
                            {stats.totalPurchases > 0 ? (
                                <TrendingUp size={20} className="trend-up" />
                            ) : (
                                <TrendingDown size={20} className="trend-down" />
                            )}
                        </span>
                    </div>
                    <div className="metric referrals">
                        <span className="emoji">🤝</span>
                        <span className="label">Indicações:</span>
                        <span className="value">
                            {stats.referralsSent} ({stats.conversions} Convertida{stats.conversions !== 1 ? 's' : ''})
                        </span>
                    </div>
                </div>

                {stats.pendingConfirmations > 0 && (
                    <div className="pending-badge">
                        <Clock size={14} />
                        {stats.pendingConfirmations} negócio{stats.pendingConfirmations !== 1 ? 's' : ''} aguardando confirmação
                    </div>
                )}

                <div className="roi-actions">
                    <button
                        className="btn-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowRegisterModal(true);
                        }}
                    >
                        <Plus size={16} />
                        Registrar Negócio
                    </button>
                    <button
                        className="btn-link"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDeals();
                        }}
                    >
                        Ver Detalhes
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Register Deal Modal */}
            <RegisterDealModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSuccess={() => {
                    setShowRegisterModal(false);
                    loadStats(); // Refresh ROI data
                }}
            />

            <style>{`
                .roi-dashboard-widget {
                    background: linear-gradient(135deg, #031A2B 0%, #0A2E47 100%);
                    border-radius: 12px;
                    color: white;
                    transition: all 0.3s ease;
                }

                .roi-dashboard-widget.collapsed {
                    padding: 0;
                }

                .roi-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 16px 20px;
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.2s;
                    border-radius: 12px;
                }

                .roi-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .roi-header h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: #FFDA71;
                    margin: 0;
                    flex: 1;
                }

                .roi-icon {
                    color: #FFDA71;
                    flex-shrink: 0;
                }

                .chevron-icon {
                    color: #FFDA71;
                    flex-shrink: 0;
                    transition: transform 0.3s ease;
                }

                .roi-content {
                    /* Padding applied conditionally via inline style */
                }

                .roi-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .roi-metrics .metric {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                }

                .roi-metrics .metric.referrals {
                    grid-column: span 2;
                }

                .roi-metrics .label {
                    opacity: 0.8;
                }

                .roi-metrics .value {
                    font-weight: 600;
                }

                .trend-up {
                    color: #10b981;
                }

                .trend-down {
                    color: #ef4444;
                    opacity: 0.5;
                }

                .pending-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 193, 7, 0.2);
                    color: #FFC107;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    margin-bottom: 16px;
                }

                .roi-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .roi-actions .btn-primary {
                    background: #FFDA71;
                    color: #031A2B;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .roi-actions .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(255, 218, 113, 0.3);
                }

                .roi-actions .btn-link {
                    background: transparent;
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    opacity: 0.8;
                    font-size: 14px;
                    padding: 10px;
                }

                .roi-actions .btn-link:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default ROIDashboardWidget;
