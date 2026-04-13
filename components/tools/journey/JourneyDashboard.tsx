import React, { useState, useEffect } from 'react';
import { JourneyMilestone } from '../../../types';
import { journeyService } from '../../../services/journeyService';
import { useApp } from '../../../contexts/AppContext';
import { JourneyChart } from './JourneyChart';
import { JourneyUpdateModal } from './JourneyUpdateModal';
import { TrendingUp, Plus } from 'lucide-react';

export const JourneyDashboard: React.FC = () => {
    const { currentUser } = useApp();
    const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadMilestones = async () => {
        if (!currentUser) return;
        try {
            const data = await journeyService.getMilestones(currentUser.id);
            setMilestones(data);
        } catch (error) {
            console.error('Error loading milestones', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMilestones();
    }, [currentUser]);

    const handleSaved = () => {
        setShowModal(false);
        loadMilestones(); // Reload optimistically
    };

    const isNudgeNeeded = () => {
        if (milestones.length === 0) return true;
        const lastMilestone = milestones[milestones.length - 1];
        const lastDate = new Date(lastMilestone.achieved_at);
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 60;
    };

    if (loading) return null;

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-[#CA9A43]" size={20} />
                    Prosperus Journey
                </h2>
                {!isNudgeNeeded() && milestones.length > 0 && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="text-xs bg-[#CA9A43]/10 text-[#CA9A43] hover:bg-[#CA9A43]/20 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1"
                    >
                        <Plus size={14} /> Atualizar
                    </button>
                )}
            </div>

            {isNudgeNeeded() && (
                <div className="bg-[#052B48] border border-[#CA9A43]/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-500 shadow-lg">
                    <div>
                        <h4 className="text-white font-bold mb-1">Acompanhe seu Crescimento</h4>
                        <p className="text-sm text-[#8BA3B4]">
                            Sua jornada não para. Você atingiu novos patamares recentemente?
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto whitespace-nowrap bg-gradient-to-r from-[#FFDA71] to-[#CA9A43] text-[#031726] font-bold px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-transform"
                    >
                        Registrar Marco
                    </button>
                </div>
            )}

            {milestones.length > 0 ? (
                <JourneyChart milestones={milestones} />
            ) : (
                <div className="bg-[#052B48] rounded-2xl border border-white/5 p-8 text-center shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-[#031726] flex items-center justify-center mx-auto mb-4 border border-[#CA9A43]/20 shadow-md">
                        <TrendingUp size={24} className="text-[#8BA3B4]" />
                    </div>
                    <p className="text-[#8BA3B4] mb-4">Registre este mês de faturamento da sua empresa para criar a base do seu gráfico evolutivo.</p>
                </div>
            )}

            {showModal && <JourneyUpdateModal onClose={() => setShowModal(false)} onSaved={handleSaved} />}
        </div>
    );
};
