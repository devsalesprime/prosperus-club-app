import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, FileText, Loader2, Eye, Link2, Check, Trash2 } from 'lucide-react';
import { reportService, MemberReport } from '../../services/reportService';
import toast from 'react-hot-toast';

interface MyProgressViewProps {
    onBack: () => void;
}

import { JourneyDashboard } from './journey/JourneyDashboard';

export const MyProgressView: React.FC<MyProgressViewProps> = ({ onBack }) => {
    const [reports, setReports] = useState<MemberReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Preview state (blob-based — mesmo padrão do Admin)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

    // Copy link state
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Delete state
    const [confirmDeleteReport, setConfirmDeleteReport] = useState<MemberReport | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    // Libera blob URLs ao desmontar
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const loadReports = async () => {
        try {
            setIsLoading(true);
            const data = await reportService.getMyReports();
            setReports(data);
        } catch {
            toast.error('Erro ao carregar os relatórios.');
        } finally {
            setIsLoading(false);
        }
    };

    // Abre o relatório num iframe interno via blob URL
    const handlePreview = async (report: MemberReport) => {
        setLoadingPreviewId(report.id);
        setPreviewTitle(report.title);
        try {
            const signedUrl = await reportService.getReportSignedUrl(report.storage_path);
            if (!signedUrl) throw new Error('Falha ao gerar URL de acesso');

            const response = await fetch(signedUrl);
            const text = await response.text();
            const blob = new Blob([text], { type: 'text/html' });
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(blob));
        } catch {
            toast.error('Erro ao abrir o relatório.');
        } finally {
            setLoadingPreviewId(null);
        }
    };

    // Copia link compartilhável de 7 dias via viewer público
    const handleCopyLink = async (report: MemberReport) => {
        setCopyingId(report.id);
        try {
            const storageUrl = await reportService.getShareableUrl(report.storage_path);
            if (!storageUrl) throw new Error('Falha ao gerar link');

            const titleEncoded = encodeURIComponent(report.title);
            const urlEncoded = encodeURIComponent(storageUrl);
            const shareUrl = `${window.location.origin}/relatorio.html?url=${urlEncoded}&title=${titleEncoded}`;

            await navigator.clipboard.writeText(shareUrl);
            setCopiedId(report.id);
            setTimeout(() => setCopiedId(null), 2500);
            toast.success('Link copiado! Válido por 7 dias.', { icon: '🔗' });
        } catch {
            toast.error('Falha ao gerar o link.');
        } finally {
            setCopyingId(null);
        }
    };

    // Deleta o relatório
    const handleDelete = async () => {
        if (!confirmDeleteReport) return;
        setDeleting(true);
        try {
            const success = await reportService.deleteReport(
                confirmDeleteReport.id,
                confirmDeleteReport.storage_path
            );
            if (success) {
                setReports(prev => prev.filter(r => r.id !== confirmDeleteReport.id));
                toast.success('Relatório excluído.');
            } else {
                toast.error('Erro ao excluir o relatório.');
            }
        } catch {
            toast.error('Erro ao excluir o relatório.');
        } finally {
            setDeleting(false);
            setConfirmDeleteReport(null);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-prosperus-navy flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
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
                <div className="w-10" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <div>
                    <h2 className="text-sm font-semibold text-prosperus-grey uppercase tracking-wider mb-4">Métricas Pessoais</h2>
                    <JourneyDashboard />
                </div>

                <div className="border-t border-slate-800/80 pt-6">
                    <h2 className="text-sm font-semibold text-prosperus-grey uppercase tracking-wider mb-4">Relatórios Oficiais</h2>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-prosperus-grey">
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
                    <div className="space-y-3">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-[#031726] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 w-full"
                            >
                                {/* Título e data */}
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="p-2 bg-yellow-600/10 rounded-lg shrink-0">
                                        <TrendingUp className="text-prosperus-gold-dark" size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-prosperus-white font-bold text-sm leading-tight truncate">
                                            {report.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(report.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit', month: 'long', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Botões de ação — mesmo padrão visual do Admin */}
                                <div className="border-t border-slate-800/80 pt-3 flex justify-end gap-2">

                                    {/* Visualizar */}
                                    <button
                                        onClick={() => handlePreview(report)}
                                        disabled={loadingPreviewId === report.id}
                                        className="bg-slate-800/80 hover:bg-slate-700 text-yellow-500 rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
                                        title="Visualizar"
                                    >
                                        {loadingPreviewId === report.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Eye size={18} />
                                        }
                                    </button>

                                    {/* Copiar Link */}
                                    <button
                                        onClick={() => handleCopyLink(report)}
                                        disabled={copyingId === report.id}
                                        className={`bg-slate-800/80 hover:bg-slate-700 rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition ${
                                            copiedId === report.id ? 'text-emerald-400' : 'text-purple-400'
                                        }`}
                                        title="Copiar link para compartilhar"
                                    >
                                        {copyingId === report.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : copiedId === report.id
                                                ? <Check size={18} />
                                                : <Link2 size={18} />
                                        }
                                    </button>

                                    {/* Deletar */}
                                    <button
                                        onClick={() => setConfirmDeleteReport(report)}
                                        className="bg-slate-800/80 hover:bg-slate-700 text-red-500 rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>

            {/* Preview Modal — iframe com blob URL */}
            {previewUrl && (
                <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                        <p className="text-sm font-semibold text-white truncate max-w-[75%]">{previewTitle}</p>
                        <button
                            onClick={() => {
                                URL.revokeObjectURL(previewUrl);
                                setPreviewUrl(null);
                            }}
                            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg p-2 transition shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                    <iframe
                        src={previewUrl}
                        title={previewTitle}
                        className="flex-1 w-full border-none bg-white"
                    />
                </div>
            )}

            {/* Confirm Delete Dialog */}
            {confirmDeleteReport && (
                <div className="absolute inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-2">Excluir Relatório?</h3>
                        <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                            O relatório <span className="text-white font-medium">"{confirmDeleteReport.title}"</span> será excluído permanentemente e não poderá ser recuperado.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteReport(null)}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : null}
                                {deleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
