import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { reportService, MemberReport } from '../../services/reportService';
import toast from 'react-hot-toast';

interface MyProgressViewProps {
    onBack: () => void;
}

export const MyProgressView: React.FC<MyProgressViewProps> = ({ onBack }) => {
    const [reports, setReports] = useState<MemberReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openingId, setOpeningId] = useState<string | null>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setIsLoading(true);
            const data = await reportService.getMyReports();
            setReports(data);
        } catch (error) {
            toast.error('Erro ao carregar os relatórios.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenReport = async (report: MemberReport) => {
        try {
            setOpeningId(report.id);
            const signedUrl = await reportService.getReportSignedUrl(report.storage_path);
            
            if (!signedUrl) {
                toast.error('Não foi possível gerar a assinatura de acesso do relatório.');
                return;
            }

            // 🚨 ISOLAMENTO DE CSS: Protege a renderização abrindo em nova aba
            // O target="_blank" faz o navegador renderizar o HTML raw da Signed URL
            // Isso evita que estilos inline ou classes globais quebrem a UI do app.
            window.open(signedUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            toast.error('Erro ao abrir o relatório.');
        } finally {
            setOpeningId(null);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-prosperus-navy flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header Oficial */}
            <div className="flex items-center justify-between p-4 bg-prosperus-box border-b border-prosperus-stroke sticky top-0 z-10 shrink-0">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-prosperus-white hover:bg-slate-800 rounded-lg transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-prosperus-gold-dark" size={20} />
                    <h1 className="text-lg font-bold text-prosperus-white">Meu Progresso</h1>
                </div>
                <div className="w-10"></div> {/* Spacer balance */}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-sm text-prosperus-grey mb-6">
                    Acompanhe sua evolução e performance gerada pelos nossos consultores. Os relatórios são gerados externamente e preservados de forma segura aqui.
                </p>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-prosperus-grey">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>Buscando relatórios seguros...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-prosperus-box border border-prosperus-stroke rounded-xl p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} className="text-prosperus-muted-text" />
                        </div>
                        <h3 className="text-lg font-bold text-prosperus-white mb-2">Sem Relatórios</h3>
                        <p className="text-prosperus-grey text-sm">
                            Nenhum relatório de progresso foi emitido para o seu perfil ainda. 
                            Eles aparecerão aqui automaticamente quando processados.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reports.map((report) => (
                            <div 
                                key={report.id}
                                className="bg-prosperus-box border border-prosperus-stroke rounded-xl p-5 hover:border-yellow-600/30 transition-all flex flex-col"
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2.5 bg-yellow-600/10 rounded-lg shrink-0">
                                        <TrendingUp className="text-prosperus-gold-dark" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-prosperus-white font-bold leading-tight mb-1">{report.title}</h3>
                                        <p className="text-xs text-prosperus-grey">
                                            Emitido em: {new Date(report.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit', month: 'long', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleOpenReport(report)}
                                    disabled={openingId === report.id}
                                    className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-prosperus-white text-sm font-medium rounded-lg transition border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {openingId === report.id ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Gerando Acesso...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink size={16} />
                                            Visualizar Relatório
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
