import React from 'react';
import { DollarSign, TrendingUp, Target } from 'lucide-react';

interface Props {
    globalWealth: number;
    totalMilestones: number;
    totalMembersWithMilestones: number;
}

export const AdminJourneyKpis: React.FC<Props> = ({ globalWealth, totalMilestones, totalMembersWithMilestones }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#052B48] to-[#031726] border border-[#CA9A43]/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#CA9A43]/10 rounded-full blur-xl group-hover:bg-[#CA9A43]/20 transition-all duration-500" />
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <p className="text-[#8BA3B4] text-sm font-semibold uppercase tracking-wider mb-1">PIB do Clube</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            {globalWealth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </h3>
                        <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
                            <TrendingUp size={12} /> Faturamento Global Consolidado
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#CA9A43]/10 border border-[#CA9A43]/30 flex items-center justify-center shrink-0">
                        <DollarSign size={24} className="text-[#CA9A43]" />
                    </div>
                </div>
            </div>

            <div className="bg-prosperus-box border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[#8BA3B4] text-sm font-semibold uppercase tracking-wider mb-1">Sócios Engajados</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">{totalMembersWithMilestones}</h3>
                        <p className="text-xs text-[#CA9A43] mt-2 font-medium">Membros reportando caixa</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        <Target size={24} className="text-emerald-400" />
                    </div>
                </div>
            </div>

            <div className="bg-prosperus-box border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[#8BA3B4] text-sm font-semibold uppercase tracking-wider mb-1">Marcos Registrados</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">{totalMilestones}</h3>
                        <p className="text-xs text-[#8BA3B4] mt-2 font-medium">Histórico total do clube</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        <TrendingUp size={24} className="text-purple-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};
