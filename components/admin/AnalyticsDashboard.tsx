// ============================================
// AnalyticsDashboard.tsx — MAESTRO WRAPPER
// ============================================
// Painel executivo para a diretoria do Prosperus Club
// v3: Componente fino — apenas header, tabs e renderização condicional.
//     Cada aba carrega seus dados independentemente (lazy loading).

import React, { useState } from 'react';
import { Activity, DollarSign, Video, RefreshCw, TrendingUp } from 'lucide-react';
import { AdminPageHeader } from './shared';
import { AnalyticsExclusions } from './AnalyticsExclusions';
import { EngagementTab } from './analytics/EngagementTab';
import { BusinessTab } from './analytics/BusinessTab';
import { ContentTab } from './analytics/ContentTab';
import { AdminJourneyModule } from './journey/AdminJourneyModule';
import { Period, periodLabel } from './analytics/analyticsUtils';

export const AnalyticsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<Period>('30d');
    const [activeTab, setActiveTab] = useState<'engajamento' | 'business' | 'conteudo' | 'wealth'>('wealth'); // Defaulting to wealth just for visibility, or keep engagement. Let's keep 'engajamento' as default.
    const [refreshKey, setRefreshKey] = useState(0);

    const PeriodFilter = (
        <div className="flex items-center gap-3">
            <AnalyticsExclusions />
            <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="p-2 text-slate-400 hover:text-white transition"
                title="Atualizar dados"
            >
                <RefreshCw size={18} />
            </button>
            <div className="flex bg-slate-800 rounded-lg p-1">
                {(['7d', '30d', '90d'] as Period[]).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            period === p
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {periodLabel(p)}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Analytics Dashboard"
                subtitle="Métricas de engajamento e inteligência de negócios"
                action={PeriodFilter}
            />

            {/* TAB NAVIGATION */}
            <div className="flex gap-1 overflow-x-auto bg-slate-800/50 rounded-lg p-1 pb-1 scrollbar-hide">
                {([
                    { id: 'engajamento' as const, label: 'Engajamento', icon: <Activity size={16} /> },
                    { id: 'business' as const, label: 'Business', icon: <DollarSign size={16} /> },
                    { id: 'conteudo' as const, label: 'Conteúdo', icon: <Video size={16} /> },
                    { id: 'wealth' as const, label: 'Wealth', icon: <TrendingUp size={16} className="text-[#CA9A43]" /> },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition ${
                            activeTab === tab.id
                                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ACTIVE TAB — lazy loaded */}
            {activeTab === 'engajamento' && <EngagementTab key={`eng-${refreshKey}`} period={period} />}
            {activeTab === 'business' && <BusinessTab key={`biz-${refreshKey}`} period={period} />}
            {activeTab === 'conteudo' && <ContentTab key={`cnt-${refreshKey}`} period={period} />}
            {activeTab === 'wealth' && <div className="mt-8 pt-8 border-t border-slate-700"><AdminJourneyModule key={`wealth-${refreshKey}`} /></div>}
        </div>
    );
};

export default AnalyticsDashboard;
