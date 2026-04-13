import React from 'react';
import { Pencil, Trash2, Calendar, DollarSign } from 'lucide-react';
import { AdminJourneyMilestone } from '../../../types';

interface Props {
    milestones: AdminJourneyMilestone[];
    onEdit: (milestone: AdminJourneyMilestone) => void;
    onDelete: (milestone: AdminJourneyMilestone) => void;
}

export const AdminJourneyTable: React.FC<Props> = ({ milestones, onEdit, onDelete }) => {
    if (milestones.length === 0) {
        return (
            <div className="bg-prosperus-box border border-slate-800 rounded-2xl p-12 text-center text-slate-400 w-full">
                Nenhum marco financeiro registrado ainda.
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block w-full overflow-x-auto bg-prosperus-box border border-slate-800 rounded-2xl shadow-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-sm tracking-wider uppercase bg-slate-900/50">
                            <th className="p-4 font-semibold">Sócio</th>
                            <th className="p-4 font-semibold border-l border-slate-800/50">Conquista</th>
                            <th className="p-4 font-semibold border-l border-slate-800/50">Data</th>
                            <th className="p-4 font-semibold border-l border-slate-800/50 text-right">Faturamento</th>
                            <th className="p-4 font-semibold border-l border-slate-800/50 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {milestones.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                                            <img 
                                                src={m.profiles?.image_url || '/default-avatar.svg'} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold truncate">{m.profiles?.name || 'Sócio Desconhecido'}</p>
                                            <p className="text-slate-400 text-xs truncate max-w-[200px]">{m.profiles?.company || '-'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border-l border-slate-800/50">
                                    <p className="text-white text-sm">{m.milestone_title}</p>
                                </td>
                                <td className="p-4 border-l border-slate-800/50">
                                    <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                                        <Calendar size={14} className="text-slate-500" />
                                        {new Date(m.achieved_at).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </div>
                                </td>
                                <td className="p-4 border-l border-slate-800/50 text-right">
                                    <span className="font-bold text-[#CA9A43]">
                                        {Number(m.revenue_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </td>
                                <td className="p-4 border-l border-slate-800/50 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => onEdit(m)}
                                            className="w-10 h-10 rounded-lg hover:bg-slate-800/80 text-yellow-500 flex items-center justify-center transition"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(m)}
                                            className="w-10 h-10 rounded-lg hover:bg-slate-800/80 text-red-500 flex items-center justify-center transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-4 w-full">
                {milestones.map((m) => (
                    <div key={m.id} className="bg-prosperus-box border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm w-full">
                        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                <img src={m.profiles?.image_url || '/default-avatar.svg'} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold leading-tight truncate">{m.profiles?.name || 'Sócio Desconhecido'}</p>
                                <p className="text-slate-400 text-xs truncate">{m.profiles?.company || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-slate-300 text-sm font-medium mb-1">{m.milestone_title}</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-500 flex items-center gap-1 border border-slate-800 bg-slate-900/50 px-2 py-1 rounded">
                                    <Calendar size={12} /> {new Date(m.achieved_at).toLocaleDateString('pt-BR')}
                                </p>
                                <span className="font-bold text-[#CA9A43] text-sm">
                                    {Number(m.revenue_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/80">
                            <button 
                                onClick={() => onEdit(m)}
                                className="bg-slate-800/80 hover:bg-slate-700 text-yellow-500 rounded-lg h-10 flex items-center justify-center font-medium text-sm transition"
                            >
                                <Pencil size={16} className="mr-2" /> Editar
                            </button>
                            <button 
                                onClick={() => onDelete(m)}
                                className="bg-slate-800/80 hover:bg-slate-700 text-red-500 rounded-lg h-10 flex items-center justify-center font-medium text-sm transition"
                            >
                                <Trash2 size={16} className="mr-2" /> Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
