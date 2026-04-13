import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { JourneyMilestone } from '../../../types';
import { calculateGrowthMultiplier } from '../../../utils/journeyCalculations';

interface Props {
    milestones: JourneyMilestone[];
}

export const JourneyChart: React.FC<Props> = ({ milestones }) => {
    if (milestones.length === 0) return null;

    const firstAmount = milestones[0].revenue_amount;
    const lastAmount = milestones[milestones.length - 1].revenue_amount;
    
    const multiplier = calculateGrowthMultiplier(firstAmount, lastAmount);

    // Format for Recharts
    const data = milestones.map(m => ({
        name: m.milestone_title,
        amount: Number(m.revenue_amount),
        date: new Date(m.achieved_at).toLocaleDateString('pt-BR')
    }));

    return (
        <div className="bg-[#052B48] rounded-2xl border border-[#CA9A43]/20 overflow-hidden relative">
            <div className="p-6 pb-2">
                <div className="inline-flex items-center gap-2 bg-[#031726] px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <span>🚀 Crescimento de {multiplier} na Jornada</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Evolução de Novos Patamares</h3>
            </div>
            
            <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#CA9A43" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#CA9A43" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['dataMin - (dataMin * 0.1)', 'dataMax + (dataMax * 0.1)']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#031726', border: '1px solid rgba(202, 154, 67, 0.5)', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#CA9A43', fontWeight: 'bold' }}
                            formatter={(value: number) => [
                                value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                'Valor do Marco'
                            ]}
                            labelStyle={{ color: '#8BA3B4', marginBottom: '8px' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#CA9A43" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
