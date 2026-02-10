// pages/ProgressListPage.tsx
// Member's progress files and reports

import React, { useEffect, useState } from 'react';
import { Download, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { ViewState } from '../types';
import { toolsService, MemberProgressFile } from '../services/toolsService';

interface ProgressListPageProps {
    setView: (view: ViewState) => void;
}

export const ProgressListPage: React.FC<ProgressListPageProps> = ({ setView }) => {
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('excel') || fileType.includes('xlsx')) return '📊';
        if (fileType.includes('doc')) return '📝';
        return '📁';
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => setView(ViewState.PROSPERUS_TOOLS)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Meu Progresso</h1>
                    <p className="text-slate-400">Relatórios e métricas da sua jornada no clube</p>
                </div>

                {/* Files List */}
                {files.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
                        <FileText className="mx-auto mb-4 text-slate-600" size={64} />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum relatório disponível ainda</h3>
                        <p className="text-slate-400">
                            Os relatórios personalizados enviados pela administração aparecerão aqui.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {files.map(file => (
                            <div
                                key={file.id}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 hover:bg-slate-800 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="text-4xl">{getFileIcon(file.file_type)}</div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">{file.title}</h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <span>{new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                                                <span>•</span>
                                                <span>{file.file_type.toUpperCase()}</span>
                                                {file.file_size && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{formatFileSize(file.file_size)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                                    >
                                        <Download size={18} />
                                        Baixar
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressListPage;
