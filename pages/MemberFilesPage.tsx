// pages/MemberFilesPage.tsx
// Member-facing file browser with category filters and download tracking

import React, { useState, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, FolderOpen, Loader2 } from 'lucide-react';
import { getFiles, trackFileDownload, MemberFile } from '../services/filesService';
import { useApp } from '../contexts/AppContext';

const CATEGORIES = [
    { id: 'todos', label: 'Todos' },
    { id: 'apresentacao', label: 'Apresentações' },
    { id: 'evento', label: 'Eventos' },
    { id: 'material', label: 'Materiais' },
    { id: 'geral', label: 'Geral' },
];

function getIcon(type: string) {
    if (type === 'pdf') return <FileText size={22} className="text-red-400" />;
    if (type === 'pptx' || type === 'ppt') return <FileText size={22} className="text-orange-400" />;
    if (type === 'doc' || type === 'docx') return <FileText size={22} className="text-blue-400" />;
    if (type === 'xlsx') return <FileText size={22} className="text-green-400" />;
    if (type === 'image') return <ImageIcon size={22} className="text-cyan-400" />;
    return <FolderOpen size={22} className="text-slate-400" />;
}

function formatBytes(b: number) {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

export const MemberFilesPage: React.FC = () => {
    const { currentUser } = useApp();
    const [files, setFiles] = useState<MemberFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('todos');
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getFiles(category);
            setFiles(data);
            setLoading(false);
        };
        load();
    }, [category]);

    const handleDownload = async (file: MemberFile) => {
        if (downloading) return;
        setDownloading(file.id);

        // Track download (fire-and-forget)
        if (currentUser?.id) {
            trackFileDownload(file.id, currentUser.id).catch(console.error);
        }

        // Open in new tab (works iOS + Android)
        window.open(file.file_url, '_blank', 'noopener,noreferrer');

        setTimeout(() => setDownloading(null), 1200);
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-5">
                <h2 className="text-xl font-bold text-white mb-1">📁 Arquivos do Clube</h2>
                <p className="text-sm text-slate-400">Apresentações, materiais e documentos</p>
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                            category === cat.id
                                ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-semibold'
                                : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* File list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-yellow-500" size={28} />
                </div>
            ) : files.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                    <FolderOpen size={40} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-white text-sm font-medium mb-1">Nenhum arquivo disponível</p>
                    <p className="text-slate-400 text-xs">Os materiais são enviados pela administração.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map(file => (
                        <div
                            key={file.id}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-yellow-600/30 transition-all duration-300"
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="shrink-0 mt-0.5">
                                        {getIcon(file.file_type)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-sm mb-1 truncate">
                                            {file.title}
                                        </h3>
                                        {file.description && (
                                            <p className="text-slate-400 text-xs mb-1 truncate">
                                                {file.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300">
                                                {file.file_type.toUpperCase()}
                                            </span>
                                            <span>{formatBytes(file.file_size)}</span>
                                            <span>{formatDate(file.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download action */}
                            <div className="border-t border-slate-700/50">
                                <button
                                    onClick={() => handleDownload(file)}
                                    disabled={downloading === file.id}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-green-400 hover:bg-green-900/20 transition disabled:opacity-50"
                                >
                                    {downloading === file.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                    {downloading === file.id ? 'Abrindo...' : 'Baixar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemberFilesPage;
