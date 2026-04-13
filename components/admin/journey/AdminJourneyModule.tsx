import React, { useState, useEffect } from 'react';
import { adminJourneyService } from '../../../services/adminJourneyService';
import { AdminJourneyMilestone } from '../../../types';
import { AdminJourneyKpis } from './AdminJourneyKpis';
import { AdminJourneyTable } from './AdminJourneyTable';
import { AdminJourneyModal } from './AdminJourneyModal';
import { Plus, TrendingUp, Loader2 } from 'lucide-react';
import { notify } from '../../../utils/toast';
import { profileService } from '../../../services/profileService';

export const AdminJourneyModule: React.FC = () => {
    const [milestones, setMilestones] = useState<AdminJourneyMilestone[]>([]);
    const [profilesList, setProfilesList] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<AdminJourneyMilestone | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [data, profiles] = await Promise.all([
                adminJourneyService.getAllMilestones(),
                profileService.getAllProfiles()
            ]);
            setMilestones(data);
            setProfilesList(profiles.map(p => ({ id: p.id, name: p.name })));
        } catch (error) {
            console.error('Error loading admin journey module', error);
            notify.error('Erro ao carregar dados do PIB do Clube.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = () => {
        setSelectedMilestone(null);
        setShowModal(true);
    };

    const handleEdit = (m: AdminJourneyMilestone) => {
        setSelectedMilestone(m);
        setShowModal(true);
    };

    const handleDelete = async (m: AdminJourneyMilestone) => {
        if (!confirm(`Tem certeza que deseja excluir o marco de ${m.profiles?.name}?`)) return;
        
        try {
            const success = await adminJourneyService.adminDeleteMilestone(m.id);
            if (success) {
                notify.success('Marco excluído com sucesso.');
                loadData();
            } else {
                notify.error('Falha ao excluir marco.');
            }
        } catch (error) {
            console.error(error);
            notify.error('Erro interno ao excluir.');
        }
    };

    const handleSaved = () => {
        setShowModal(false);
        loadData();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#CA9A43] mb-4" />
                <p className="text-slate-400">Carregando Torre de Controle Wealth...</p>
            </div>
        );
    }

    const globalWealth = adminJourneyService.calculateGlobalWealth(milestones);
    const uniqueMembers = new Set(milestones.map(m => m.user_id)).size;

    return (
        <div className="animate-in fade-in duration-300 w-full px-1">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-[#CA9A43]" size={28} />
                        Wealth Management (PIB do Clube)
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Módulo Concierge e Auditoria de Crescimento</p>
                </div>
                
                <button 
                    onClick={handleCreate}
                    className="w-full md:w-auto bg-gradient-to-r from-[#FFDA71] to-[#CA9A43] text-[#031726] font-bold px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(202,154,67,0.3)]"
                >
                    <Plus size={18} /> Lançar Marco Global
                </button>
            </div>

            <AdminJourneyKpis 
                globalWealth={globalWealth} 
                totalMilestones={milestones.length}
                totalMembersWithMilestones={uniqueMembers} 
            />

            <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Governança (Log de Lançamentos)</h2>
            <AdminJourneyTable 
                milestones={milestones}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <AdminJourneyModal 
                    milestone={selectedMilestone}
                    profiles={profilesList}
                    onClose={() => setShowModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};
