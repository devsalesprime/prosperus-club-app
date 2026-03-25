import React, { useState, useEffect } from 'react';
import { adminBirthdayService, UpcomingBirthday } from '../../services/adminBirthdayService';
import { AdminPageHeader } from './shared/AdminPageHeader';
import { AdminTable } from './shared/AdminTable';
import { AdminEmptyState } from './shared/AdminEmptyState';
import { AdminFileUpload } from './shared/AdminFileUpload';
import { Loader2, CalendarHeart, Clock, CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react';
import { notify } from '../../utils/toast';

export const AdminBirthdaysModule: React.FC = () => {
    const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedUser, setSelectedUser] = useState<UpcomingBirthday | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminBirthdayService.getUpcomingBirthdays();
            setBirthdays(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar os aniversariantes.');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleClick = (b: UpcomingBirthday) => {
        setSelectedUser(b);
        setIsModalOpen(true);
    };

    const handleCancelSchedule = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!confirm('Tem certeza que deseja cancelar esta homenagem?')) return;
        
        setIsDeleting(cardId);
        try {
            await adminBirthdayService.deleteCard(cardId);
            notify.success('Homenagem excluída com sucesso.');
            loadData();
        } catch (err: any) {
            notify.error('Erro ao excluir card.');
        } finally {
            setIsDeleting(null);
        }
    };

    const customUploader = async (file: File, onProgress: (p: number) => void) => {
        if (!selectedUser) return { success: false, error: 'Usuário não selecionado' };
        
        // Simulação básica de progresso
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress <= 90) onProgress(progress);
        }, 100);

        const result = await adminBirthdayService.uploadAndScheduleCard(
            selectedUser.userId,
            file,
            selectedUser.triggerDate
        );
        
        clearInterval(interval);
        onProgress(100);

        if (result.success) {
            notify.success(`Homenagem agendada p/ ${selectedUser.triggerDate}`);
            setTimeout(() => {
                handleCancelSchedule();
                loadData();
            }, 1000); // tempo p/ ver a animação de sucesso
        }

        return result;
    };

    // Columns format
    const formatDate = (dateString: string) => {
        const parts = dateString.split('-');
        if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
        return dateString;
    };

    const getStatusBadge = (status: UpcomingBirthday['status']) => {
        switch(status) {
            case 'SEM_ARTE':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle size={12} /> Sem Arte</span>;
            case 'AGENDADO':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock size={12} /> Agendado</span>;
            case 'VISUALIZADO':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 size={12} /> Homenageado</span>;
        }
    };

    const renderTable = () => {
        if (birthdays.length === 0) {
            return (
                <AdminEmptyState
                    icon={<CalendarHeart size={48} className="text-amber-500/50" />}
                    message="Nenhum aniversariante encontrado"
                    description="Para que os aniversariantes apareçam aqui, os sócios precisam ter a 'data_de_nascimento__socio_principal' preenchida no HubSpot / Perfil."
                />
            );
        }

        return (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mt-6">
                <AdminTable>
                    <thead>
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Sócio</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Data</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {birthdays.map((b) => (
                            <tr key={`${b.userId}-${b.triggerDate}`} className="hover:bg-slate-700/50 transition duration-150">
                                <td className="py-4 px-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">{b.name}</span>
                                        <span className="text-xs text-slate-400">{b.email}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-300">{formatDate(b.birthDate)}</span>
                                        <span className="text-xs text-yellow-500 font-medium">
                                            {b.daysRemaining === 0 ? 'É HOJE!' : `Faltam ${b.daysRemaining} dias`}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                    {getStatusBadge(b.status)}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                                    {b.status === 'SEM_ARTE' ? (
                                        <button
                                            onClick={() => handleScheduleClick(b)}
                                            className="text-amber-500 hover:text-amber-400 transition"
                                        >
                                            Agendar Homenagem
                                        </button>
                                    ) : (
                                        <div className="flex justify-end items-center gap-3">
                                            {b.imageUrl && (
                                                <a href={b.imageUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
                                                    Ver Arte
                                                </a>
                                            )}
                                            {b.cardId && (
                                                <button
                                                    onClick={() => handleDeleteCard(b.cardId!)}
                                                    disabled={isDeleting === b.cardId}
                                                    className="text-slate-500 hover:text-red-400 transition"
                                                >
                                                    {isDeleting === b.cardId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Homenagens de Aniversário"
                action={
                    <button
                        onClick={loadData}
                        className="px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                        disabled={loading}
                    >
                        {loading ? 'Atualizando...' : 'Recarregar'}
                    </button>
                }
            />

            <p className="text-slate-400 text-sm mb-6 -mt-2">
                Agende os Greeting Cards (Fullscreen) para aparecerem no aplicativo no dia do aniversário.
            </p>

            {error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                    <p className="font-medium">Erro ao carregar dados:</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            ) : loading && birthdays.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                </div>
            ) : (
                renderTable()
            )}

            {/* Modal de Agendamento */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700">
                            <div>
                                <h3 className="text-lg font-bold text-white">Agendar Homenagem</h3>
                                <p className="text-sm text-amber-500 mt-0.5 font-medium">
                                    Para: {selectedUser.name} ({formatDate(selectedUser.birthDate)})
                                </p>
                            </div>
                            <button
                                onClick={handleCancelSchedule}
                                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-1">
                                    <AlertCircle size={16} /> Regra Ouro (Display)
                                </h4>
                                <p className="text-xs text-amber-500/80 leading-relaxed">
                                    A imagem deve estar no formato Vertical / Stories <strong className="text-amber-500">1080x1920 (9:16)</strong> para não distorcer o layout premium do aplicativo.
                                </p>
                            </div>

                            <AdminFileUpload
                                accept="image/jpeg,image/png,image/webp"
                                label="Greeting Card (1080x1920)"
                                hint="Clique ou arraste a imagem. Formatos: JPG, PNG, WebP."
                                onUploaded={() => {}}
                                customUploader={customUploader}
                            />
                            
                            <p className="text-xs text-slate-500 mt-5 text-center">
                                A homenagem aparecerá em tela-cheia no app assim que o sócio acessar no dia <strong>{formatDate(selectedUser.triggerDate)}</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBirthdaysModule;
