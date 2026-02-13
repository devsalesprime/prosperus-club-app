// pages/ProgressListPage.tsx
// Member's progress files and reports - Mobile-first responsive layout

import React, { useEffect, useState } from 'react';
import { Download, Loader2, ArrowLeft, FileText, FileCode, FileSpreadsheet, File, Eye, X } from 'lucide-react';
import { ViewState } from '../types';
import { toolsService, MemberProgressFile } from '../services/toolsService';

interface ProgressListPageProps {
    setView: (view: ViewState) => void;
}

export const ProgressListPage: React.FC<ProgressListPageProps> = ({ setView }) => {
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<MemberProgressFile | null>(null);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const data = await toolsService.getMyProgressFiles();
            setFiles(data);
        } catch (error) {
            console.error('Failed to load progress files:', error);
        } finally {
            setLoading(false);
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

    const handleDownload = async (file: MemberProgressFile) => {
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
            // Fallback: open in new tab
            window.open(file.file_url, '_blank');
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

            {/* Files List */}
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
                                    {/* Icon */}
                                    <div className="shrink-0 mt-0.5">
                                        {getFileIcon(file.file_type)}
                                    </div>

                                    {/* Info */}
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

                            {/* Action Buttons - Full width on mobile */}
                            <div className="flex border-t border-slate-700/50">
                                {file.file_type.toLowerCase() === 'html' && (
                                    <button
                                        onClick={() => setPreviewFile(file)}
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

            {/* HTML Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileCode size={18} className="text-orange-400 shrink-0" />
                            <span className="font-bold text-white text-sm truncate">{previewFile.title}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => handleDownload(previewFile)}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                title="Baixar"
                            >
                                <Download size={18} />
                            </button>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                    {/* Modal Body - iframe */}
                    <div className="flex-1 overflow-hidden">
                        <iframe
                            src={previewFile.file_url}
                            className="w-full h-full bg-white"
                            title={previewFile.title}
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressListPage;
