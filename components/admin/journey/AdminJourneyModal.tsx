import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { AdminJourneyMilestone } from '../../../types';
import { adminJourneyService } from '../../../services/adminJourneyService';
import { notify } from '../../../utils/toast';

interface ProfileOption {
    id: string;
    name: string;
}

interface Props {
    milestone: AdminJourneyMilestone | null;
    profiles: ProfileOption[];
    onClose: () => void;
    onSaved: () => void;
}

export const AdminJourneyModal: React.FC<Props> = ({ milestone, profiles, onClose, onSaved }) => {
    const isEdit = !!milestone;

    const [userId, setUserId] = useState(milestone?.user_id || (profiles.length > 0 ? profiles[0].id : ''));
    const [amountStr, setAmountStr] = useState('');
    const [title, setTitle] = useState(milestone?.milestone_title || '');
    const [date, setDate] = useState(
        milestone?.achieved_at 
            ? new Date(milestone.achieved_at).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0]
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (milestone) {
            const num = Number(milestone.revenue_amount);
            setAmountStr(num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        }
    }, [milestone]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val) {
            setAmountStr('');
            return;
        }
        const num = parseInt(val, 10) / 100;
        setAmountStr(num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    };

    const handleSave = async () => {
        if (!userId) return notify.error('Selecione um membro.');
        
        const numericAmount = parseFloat(amountStr.replace(/[^\d,-]/g, '').replace(',', '.'));
        if (!numericAmount || !title || !date) return notify.error('Preencha os campos obrigatórios.');

        setIsSaving(true);
        try {
            await adminJourneyService.adminSaveMilestone({
                id: milestone?.id, // undefined means it will be created
                user_id: userId,
                revenue_amount: numericAmount,
                milestone_title: title,
                achieved_at: date
            });
            notify.success(`Marco ${isEdit ? 'atualizado' : 'lançado'} com sucesso!`);
            onSaved();
        } catch (error) {
            console.error(error);
            notify.error('Erro ao salvar o marco financeiro.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#031726]/95 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#052B48] border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 mx-auto">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-4 mb-5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {isEdit ? 'Editar Marco ("White-Glove")' : 'Lançar Marco ("White-Glove")'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-[#8BA3B4] mb-1.5">Titular da Conquista (Sócio)</label>
                        <select 
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={isEdit} // Do not allow changing owner once created to avoid bugs
                            className="w-full bg-[#031726] border border-slate-700 focus:border-[#CA9A43] rounded-xl px-4 py-3 text-white outline-none transition-colors disabled:opacity-50 appearance-none"
                        >
                            {profiles.length === 0 && <option value="">Carregando sócios...</option>}
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#8BA3B4] mb-1.5">Faturamento (R$)</label>
                        <input 
                            type="text" 
                            value={amountStr}
                            onChange={handleAmountChange}
                            placeholder="R$ 0,00"
                            className="w-full bg-[#031726] border border-[#CA9A43]/30 focus:border-[#CA9A43] rounded-xl px-4 py-3 text-xl font-bold text-[#CA9A43] outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#8BA3B4] mb-1.5">Título da Conquista</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Novo Contrato B2B"
                            maxLength={50}
                            className="w-full bg-[#031726] border border-slate-700 focus:border-[#CA9A43] rounded-xl px-4 py-3 text-white outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#8BA3B4] mb-1.5">Data do Marco (Lançamento Retroativo)</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#031726] border border-slate-700 focus:border-[#CA9A43] rounded-xl px-4 py-3 text-white outline-none transition-colors"
                            />
                            <Calendar size={18} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !userId || !title || !amountStr}
                        className="flex-1 rounded-xl py-3.5 font-bold text-[#031726] bg-gradient-to-r from-[#FFDA71] to-[#CA9A43] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Salvando...' : (isEdit ? 'Salvar Edição' : 'Lançar Marco')}
                    </button>
                </div>
            </div>
        </div>
    );
};
