import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { journeyService } from '../../../services/journeyService';
import { useApp } from '../../../contexts/AppContext';
import { notify } from '../../../utils/toast';

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export const JourneyUpdateModal: React.FC<Props> = ({ onClose, onSaved }) => {
    const { currentUser } = useApp();
    const [amountStr, setAmountStr] = useState('');
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
        if (!currentUser) return;
        const numericAmount = parseFloat(amountStr.replace(/[^\d,-]/g, '').replace(',', '.'));
        if (!numericAmount || !title) return;

        setIsSaving(true);
        try {
            await journeyService.saveMilestone({
                user_id: currentUser.id,
                revenue_amount: numericAmount,
                milestone_title: title,
                achieved_at: new Date().toISOString().split('T')[0]
            });
            
            // Dopamine hit
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#CA9A43', '#FFDA71', '#FFFFFF']
            });

            onSaved(); // Fechar otimisticamente
        } catch (error) {
            console.error(error);
            notify.error('Não foi possível salvar o marco. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#031726]/95 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#052B48] border border-[#CA9A43]/20 rounded-3xl w-full max-w-lg p-8 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#8BA3B4] hover:text-white transition-colors">
                    <X size={24} />
                </button>
                
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight text-center">Celebrar Novo Marco 🏆</h2>
                
                <div className="flex items-center justify-center gap-2 mb-8 bg-[#031726]/50 px-4 py-2 rounded-full border border-white/5">
                    <Lock size={14} className="text-[#CA9A43]" />
                    <span className="text-xs font-medium text-[#8BA3B4]">Seus dados financeiros absolutos são criptografados e estritamente privados.</span>
                </div>

                <div className="w-full flex justify-center mb-6">
                    <input 
                        type="text" 
                        value={amountStr}
                        onChange={handleAmountChange}
                        placeholder="R$ 0,00"
                        className="text-4xl md:text-5xl font-bold text-[#CA9A43] text-center bg-transparent border-b border-[#CA9A43]/30 focus:border-[#CA9A43] outline-none w-full max-w-[300px] mb-2 pb-2 transition-colors placeholder:text-[#CA9A43]/20"
                    />
                </div>

                <div className="w-full mb-8">
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Qual a conquista? (Ex: Dobrei a meta)"
                        maxLength={50}
                        className="w-full bg-[#031726] border border-[#CA9A43]/20 focus:border-[#CA9A43]/50 rounded-xl px-4 py-4 text-center text-white placeholder:text-[#8BA3B4] outline-none transition-colors"
                    />
                </div>

                <button 
                    onClick={handleSave}
                    disabled={isSaving || !title || !amountStr}
                    className="w-full rounded-full py-4 text-lg font-bold text-[#031726] bg-gradient-to-r from-[#FFDA71] to-[#CA9A43] opacity-90 hover:opacity-100 disabled:opacity-50 disabled:grayscale transition-all transform active:scale-[0.98] shadow-[0_0_20px_rgba(202,154,67,0.3)]"
                >
                    {isSaving ? 'Registrando...' : 'Salvar Conquista'}
                </button>
            </div>
        </div>
    );
};
