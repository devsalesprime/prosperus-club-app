// ============================================
// ADMIN ROI MANAGER
// ============================================
// Main admin interface for ROI audit and management

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Trophy } from 'lucide-react';
import { adminBusinessService } from '../../services/adminBusinessService';
import AdminKpiCards from './AdminKpiCards';
import ContestedDealsTab from './ContestedDealsTab';
import AuditTab from './AuditTab';
import OfficialRankingsTab from './OfficialRankingsTab';

type TabType = 'contested' | 'audit' | 'rankings';

export const AdminRoiManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('contested');
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<any>(null);
    const [contestedDeals, setContestedDeals] = useState<any[]>([]);
    const [highValueDeals, setHighValueDeals] = useState<any[]>([]);
    const [suspiciousDeals, setSuspiciousDeals] = useState<any[]>([]);
    const [rankings, setRankings] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [kpisData, contested, highValue, suspicious, rankingsData] = await Promise.all([
                adminBusinessService.getAdminKPIs(),
                adminBusinessService.getContestedDeals(),
                adminBusinessService.getHighValueDeals(),
                adminBusinessService.getSuspiciousDeals(),
                adminBusinessService.getOfficialRankings()
            ]);

            setKpis(kpisData);
            setContestedDeals(contested);
            setHighValueDeals(highValue);
            setSuspiciousDeals(suspicious);
            setRankings(rankingsData);
        } catch (error) {
            console.error('Error loading admin ROI data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAudit = async (dealId: string, decision: 'APPROVE' | 'REJECT', notes: string) => {
        try {
            await adminBusinessService.auditDeal(dealId, decision, notes);
            await loadData(); // Reload all data
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(errorMessage);
        }
    };

    const handleBulkAudit = async (dealIds: string[], decision: 'APPROVE' | 'REJECT', notes: string) => {
        try {
            await adminBusinessService.bulkAuditDeals(dealIds, decision, notes);
            await loadData(); // Reload all data
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(errorMessage);
        }
    };

    const handleExportCSV = async () => {
        try {
            const csv = await adminBusinessService.exportRankingsCSV();
            const filename = `rankings_${new Date().toISOString().split('T')[0]}.csv`;
            adminBusinessService.downloadCSV(csv, filename);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Erro ao exportar CSV');
        }
    };

    const tabs = [
        {
            id: 'contested' as TabType,
            label: 'Contestações',
            icon: <AlertTriangle size={18} />,
            count: contestedDeals.length,
            color: 'text-orange-500'
        },
        {
            id: 'audit' as TabType,
            label: 'Auditoria Geral',
            icon: <CheckCircle size={18} />,
            count: highValueDeals.length,
            color: 'text-blue-500'
        },
        {
            id: 'rankings' as TabType,
            label: 'Rankings Oficiais',
            icon: <Trophy size={18} />,
            count: rankings.length,
            color: 'text-yellow-500'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                            <TrendingUp size={32} className="text-yellow-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">ROI & Auditoria</h1>
                            <p className="text-slate-400">Gestão de negócios e rankings oficiais</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                {kpis && <AdminKpiCards kpis={kpis} loading={loading} />}

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex gap-2 border-b border-slate-800">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors relative ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span className={activeTab === tab.id ? tab.color : ''}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                        ? 'bg-yellow-500 text-slate-900'
                                        : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'contested' && (
                        <ContestedDealsTab
                            deals={contestedDeals}
                            loading={loading}
                            onAudit={handleAudit}
                        />
                    )}

                    {activeTab === 'audit' && (
                        <AuditTab
                            deals={highValueDeals}
                            suspiciousDeals={suspiciousDeals}
                            loading={loading}
                            onAudit={handleAudit}
                            onBulkAudit={handleBulkAudit}
                        />
                    )}

                    {activeTab === 'rankings' && (
                        <OfficialRankingsTab
                            rankings={rankings}
                            loading={loading}
                            onExportCSV={handleExportCSV}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminRoiManager;
