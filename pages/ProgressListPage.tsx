// pages/ProgressListPage.tsx
// Member's progress files and reports - Mobile-first responsive layout

import React, { useEffect, useState } from 'react';
import { Download, Loader2, ArrowLeft, FileText, FileCode, FileSpreadsheet, File, Eye, X, TrendingUp, ExternalLink, Trash2 } from 'lucide-react';
import { ViewState } from '../types';
import { toolsService, MemberProgressFile } from '../services/toolsService';
import { reportService, MemberReport } from '../services/reportService';
import { analyticsService } from '../services/analyticsService';
import { useApp } from '../contexts/AppContext';
import { MemberFilesPage } from './MemberFilesPage';
import { DeleteConfirmSheet } from '../components/ui/DeleteConfirmSheet';
import toast from 'react-hot-toast';

interface ProgressListPageProps {
    setView: (view: ViewState) => void;
}

export const ProgressListPage: React.FC<ProgressListPageProps> = ({ setView }) => {
    const { currentUser } = useApp();
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [reports, setReports] = useState<MemberReport[]>([]); // Automated reports
    const [loading, setLoading] = useState(true);
    
    // Legacy Preview States
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    
    // New Signed URL Loading state
    const [openingId, setOpeningId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteReport, setConfirmDeleteReport] = useState<MemberReport | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [filesData, reportsData] = await Promise.all([
                toolsService.getMyProgressFiles(),
                reportService.getMyReports()
            ]);
            setFiles(filesData);
            setReports(reportsData);
        } catch (error) {
            console.error('Failed to load progress data:', error);
            toast.error('Erro ao carregar alguns dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async () => {
        if (!confirmDeleteReport) return;
        
        try {
            setDeletingId(confirmDeleteReport.id);
            const success = await reportService.deleteReport(confirmDeleteReport.id, confirmDeleteReport.storage_path);
            if (success) {
                toast.success('Relatório excluído com sucesso.');
                loadData();
            } else {
                toast.error('Erro ao excluir relatório.');
            }
        } catch (error) {
            toast.error('Erro desconhecido ao excluir.');
        } finally {
            setDeletingId(null);
            setConfirmDeleteReport(null);
        }
    };

    const getFileIcon = (fileType: string) => {
        const type = fileType.toLowerCase();
        if (type === 'html' || type === 'htm') return <FileCode size={24} className="text-orange-400" />;
        if (type === 'pdf') return <FileText size={24} className="text-red-400" />;
        if (['xlsx', 'xls', 'csv', 'excel'].includes(type)) return <FileSpreadsheet size={24} className="text-green-400" />;
        if (['doc', 'docx'].includes(type)) return <FileText size={24} className="text-blue-400" />;
        return <File size={24} className="text-slate-400" />;
    };

    const getFileTypeBadge = (fileType: string) => {
        const type = fileType.toUpperCase();
        const colorMap: Record<string, string> = {
            'HTML': 'bg-orange-900/30 text-orange-400',
            'HTM': 'bg-orange-900/30 text-orange-400',
            'PDF': 'bg-red-900/30 text-red-400',
            'XLSX': 'bg-green-900/30 text-green-400',
            'XLS': 'bg-green-900/30 text-green-400',
            'DOC': 'bg-blue-900/30 text-blue-400',
            'DOCX': 'bg-blue-900/30 text-blue-400',
        };
        return colorMap[type] || 'bg-slate-700 text-slate-300';
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
    };

    // Fetch HTML content and create a blob URL with correct MIME type
    const handlePreview = async (file: MemberProgressFile) => {
        analyticsService.trackReportView(currentUser?.id || null, file.title, { action: 'preview', file_type: file.file_type });
        setLoadingPreview(true);
        setPreviewTitle(file.title);
        try {
            const response = await fetch(file.file_url);
            const text = await response.text();
            const blob = new Blob([text], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(blobUrl);
        } catch (error) {
            console.error('Failed to load preview:', error);
            // Fallback: open directly
            window.open(file.file_url, '_blank');
        } finally {
            setLoadingPreview(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewTitle('');
    };

    const handleDownload = async (file: MemberProgressFile) => {
        analyticsService.trackReportView(currentUser?.id || null, file.title, { action: 'download', file_type: file.file_type });
        try {
            const response = await fetch(file.file_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.title}.${file.file_type.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(file.file_url, '_blank');
        }
    };

    const handleOpenReport = async (report: MemberReport) => {
        try {
            setLoadingPreview(true);
            setPreviewTitle(report.title);
            setOpeningId(report.id);
            
            const signedUrl = await reportService.getReportSignedUrl(report.storage_path);
            
            if (!signedUrl) {
                toast.error('Não foi possível assinar a URL do relatório.');
                setLoadingPreview(false);
                return;
            }
            
            // 🚨 SOLUÇÃO DE SEGURANÇA (PWA MOBILE NATIVE):
            // Em mobile (iOS Safari / WebViews Android / PWA), window.open(blobUrl) de forma assíncrona 
            // é ativamente bloqueado pelo sistema operacional/navegador para evitar pop-ups.
            // Para superar isso e continuar ignorando a trava XSS do Supabase, nós jogamos o blob 
            // em um iFrame isolado dentro do nosso próprio modal (como no legado).
            const response = await fetch(signedUrl);
            const htmlText = await response.text();
            const blob = new Blob([htmlText], { type: 'text/html; charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(blobUrl);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar o relatório.');
        } finally {
            setOpeningId(null);
            setLoadingPreview(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    return (
        <div className="px-4 py-6 pb-28">
            {/* Header */}
            <button
                onClick={() => setView(ViewState.PROSPERUS_TOOLS)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
            >
                <ArrowLeft size={18} />
                <span className="text-sm">Voltar</span>
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Meu Progresso</h1>
                <p className="text-sm text-slate-400">Relatórios e métricas da sua jornada no clube</p>
            </div>

            {/* Automated Progress Reports (M2M) */}
            {reports.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4">Métricas Consolidadas</h2>
                    <div className="grid gap-3">
                        {reports.map((report) => (
                            <div 
                                key={report.id}
                                className="bg-slate-800/80 border border-yellow-600/30 rounded-xl p-5 hover:border-yellow-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex items-start md:items-center gap-3">
                                    <div className="p-2.5 bg-yellow-600/20 rounded-lg shrink-0">
                                        <TrendingUp className="text-yellow-500" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold leading-tight mb-1">{report.title}</h3>
                                        <p className="text-xs text-slate-400">
                                            Gerado em: {new Date(report.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => handleOpenReport(report)}
                                        disabled={openingId === report.id || deletingId === report.id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                                    >
                                        {openingId === report.id ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Acessando...
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink size={16} />
                                                Acessar
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setConfirmDeleteReport(report)}
                                        disabled={deletingId === report.id}
                                        className="px-4 py-2.5 bg-red-900/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                                        title="Excluir relatório permanente"
                                    >
                                        {deletingId === report.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legacy Files List */}
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Histórico de Arquivos</h2>
            {files.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                    <FileText className="mx-auto mb-3 text-slate-600" size={48} />
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum relatório disponível</h3>
                    <p className="text-sm text-slate-400">
                        Os relatórios personalizados enviados pela administração aparecerão aqui.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map(file => (
                        <div
                            key={file.id}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-yellow-600/30 transition-all duration-300"
                        >
                            {/* Card Content */}
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 mt-0.5">
                                        {getFileIcon(file.file_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-base mb-1 truncate">{file.title}</h3>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                                            <span>{new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getFileTypeBadge(file.file_type)}`}>
                                                {file.file_type.toUpperCase()}
                                            </span>
                                            {file.file_size && (
                                                <span>{formatFileSize(file.file_size)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex border-t border-slate-700/50">
                                {(file.file_type.toLowerCase() === 'html' || file.file_type.toLowerCase() === 'htm') && (
                                    <button
                                        onClick={() => handlePreview(file)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-yellow-500 hover:bg-yellow-900/20 transition border-r border-slate-700/50"
                                    >
                                        <Eye size={16} />
                                        Visualizar
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDownload(file)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-green-400 hover:bg-green-900/20 transition"
                                >
                                    <Download size={16} />
                                    Baixar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Loading overlay for preview */}
            {/* ─── Club Files Section ─── */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
                <MemberFilesPage />
            </div>

            {/* Loading overlay for preview */}
            {loadingPreview && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="animate-spin text-yellow-500 mx-auto mb-3" size={32} />
                        <p className="text-white text-sm">Carregando relatório...</p>
                    </div>
                </div>
            )}

            {/* HTML Preview Modal - uses blob URL with correct MIME type */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileCode size={18} className="text-orange-400 shrink-0" />
                            <span className="font-bold text-white text-sm truncate">{previewTitle}</span>
                        </div>
                        <button
                            onClick={closePreview}
                            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    {/* Modal Body - iframe with blob URL */}
                    <div className="flex-1 overflow-hidden">
                        <iframe
                            src={previewUrl}
                            className="w-full h-full bg-white"
                            title={previewTitle}
                        />
                    </div>
                </div>
            )}

            <DeleteConfirmSheet
                isOpen={!!confirmDeleteReport}
                title="Excluir Relatório"
                message={`Você está prestes a excluir permanentemente o relatório "${confirmDeleteReport?.title}". Esta ação não pode ser desfeita e ele será removido do seu progresso.`}
                confirmLabel="Sim, excluir relatório"
                onConfirm={handleDeleteReport}
                onCancel={() => setConfirmDeleteReport(null)}
            />
        </div>
    );
};

export default ProgressListPage;
