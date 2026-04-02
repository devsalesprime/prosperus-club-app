// components/admin/AdminMemberProgress.tsx
// Admin panel for uploading and managing member progress reports
// Supports: Single upload and Bulk upload by email (multiple files)

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
    Upload,
    Trash2,
    Loader2,
    FileText,
    Download,
    Search,
    RefreshCw,
    FileCode,
    FileSpreadsheet,
    File,
    Eye,
    X,
    Users,
    Layers,
    Link2,
    Check
} from 'lucide-react';
import { toolsService, MemberProgressFile } from '../../services/toolsService';
import { reportService, MemberReport } from '../../services/reportService';
import { supabase } from '../../lib/supabase';
import { AdminPageHeader, AdminConfirmDialog } from './shared';

interface Member {
    id: string;
    name: string;
    email: string;
}

interface BulkResult {
    filename: string;
    email: string;
    memberName: string;
    success: boolean;
    error?: string;
}

type UploadMode = 'single' | 'bulk';

export const AdminMemberProgress: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [reports, setReports] = useState<MemberReport[]>([]); // Automated reports
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload mode
    const [uploadMode, setUploadMode] = useState<UploadMode>('bulk');

    // Single upload form state
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [fileTitle, setFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bulk upload state
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);
    const [bulkTitle, setBulkTitle] = useState('Relatório de Progresso - Fev/2026');
    const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    const bulkInputRef = useRef<HTMLInputElement>(null);

    // Filter/search state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMemberId, setFilterMemberId] = useState('');

    // Pagination state
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(15);

    // Reset pagination when searching/filtering
    useEffect(() => {
        setHistoryPage(1);
    }, [searchQuery, filterMemberId]);

    // Preview state (blob-based for correct HTML rendering)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewMemberName, setPreviewMemberName] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Confirm delete state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    // Copied link feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copyingId, setCopyingId] = useState<string | null>(null);

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
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .order('name');
            setMembers(membersData || []);

            const [filesData, reportsData] = await Promise.all([
                toolsService.getAllProgressFiles(),
                reportService.getAllReports()
            ]);

            setFiles(filesData);
            setReports(reportsData);
        } catch (err) {
            console.error('Failed to load data:', err);
            toast.error('Falha ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // SINGLE UPLOAD
    // ========================================
    const handleSingleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !fileTitle || !selectedFile) {
            toast.error('Preencha todos os campos');
        }

        setUploading(true);
        try {
            await toolsService.uploadProgressFile({
                member_id: selectedMemberId,
                title: fileTitle,
                file: selectedFile
            });

            const memberName = members.find(m => m.id === selectedMemberId)?.name || 'Sócio';
            toast.success(`Arquivo enviado para ${memberName}!`);
            setSelectedMemberId('');
            setFileTitle('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadData();
        } catch (err) {
            console.error('Failed to upload file:', err);
            toast.error('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    // ========================================
    // BULK UPLOAD BY EMAIL
    // ========================================
    const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList) {
            const arr = Array.from(fileList).filter(f =>
                f.name.endsWith('.html') || f.name.endsWith('.htm') ||
                f.name.endsWith('.pdf') || f.name.endsWith('.xlsx') ||
                f.name.endsWith('.xls') || f.name.endsWith('.doc') ||
                f.name.endsWith('.docx') || f.name.endsWith('.csv')
            );
            setBulkFiles(arr);
            setBulkResults([]);
        }
    };

    const handleBulkUpload = async () => {
        if (bulkFiles.length === 0 || !bulkTitle.trim()) {
            toast.error('Selecione os arquivos e defina o título');
            return;
        }

        setUploading(true);

        setBulkResults([]);
        setBulkProgress({ current: 0, total: bulkFiles.length });

        const results: BulkResult[] = [];

        for (let i = 0; i < bulkFiles.length; i++) {
            const file = bulkFiles[i];
            const email = file.name.replace(/\.(html|htm|pdf|xlsx|xls|doc|docx|csv)$/i, '').toLowerCase().trim();

            setBulkProgress({ current: i + 1, total: bulkFiles.length });

            // Validate email format
            if (!email.includes('@') || !email.includes('.')) {
                results.push({
                    filename: file.name,
                    email,
                    memberName: '-',
                    success: false,
                    error: 'Nome do arquivo não é um e-mail válido'
                });
                continue;
            }

            // Find member by email
            const member = members.find(m => m.email.toLowerCase() === email);
            if (!member) {
                results.push({
                    filename: file.name,
                    email,
                    memberName: '-',
                    success: false,
                    error: 'Sócio não encontrado'
                });
                continue;
            }

            // Upload
            try {
                await toolsService.uploadProgressFile({
                    member_id: member.id,
                    title: bulkTitle,
                    file: file
                });

                results.push({
                    filename: file.name,
                    email,
                    memberName: member.name,
                    success: true
                });
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
                results.push({
                    filename: file.name,
                    email,
                    memberName: member.name,
                    success: false,
                    error: errMsg
                });
            }
        }

        setBulkResults(results);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
            toast.success(`${successCount} arquivo(s) enviado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falha(s)` : ''}!`);
        } else {
            toast.error(`Nenhum arquivo foi enviado. ${errorCount} falha(s).`);
        }

        setUploading(false);
        loadData();
    };

    const handleDelete = async (id: string) => {
        try {
            const isAutomated = reports.find(r => r.id === id);

            if (isAutomated) {
                // M2M Report
                const success = await reportService.deleteReport(id, isAutomated.storage_path);
                if (!success) throw new Error('Falha ao excluir relatório M2M');
            } else {
                // Legacy Manual File
                await toolsService.deleteProgressFile(id);
            }

            toast.success('Arquivo excluído');
            loadData();
        } catch (err) {
            console.error('Failed to delete file:', err);
            toast.error('Erro ao excluir arquivo');
        }
    };

    const getFileIcon = (fileType: string) => {
        const type = fileType.toLowerCase();
        if (type === 'html' || type === 'htm') return <FileCode size={20} className="text-orange-400" />;
        if (type === 'pdf') return <FileText size={20} className="text-red-400" />;
        if (['xlsx', 'xls', 'csv', 'excel'].includes(type)) return <FileSpreadsheet size={20} className="text-green-400" />;
        if (['doc', 'docx'].includes(type)) return <FileText size={20} className="text-blue-400" />;
        return <File size={20} className="text-slate-400" />;
    };

    const getFileTypeBadge = (fileType: string) => {
        const type = fileType.toUpperCase();
        const colorMap: Record<string, string> = {
            'HTML': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            'HTM': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            'PDF': 'bg-red-900/30 text-red-400 border-red-800/50',
            'XLSX': 'bg-green-900/30 text-green-400 border-green-800/50',
            'XLS': 'bg-green-900/30 text-green-400 border-green-800/50',
            'DOC': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
            'DOCX': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
        };
        const color = colorMap[type] || 'bg-slate-700 text-slate-300 border-slate-600';
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${color}`}>
                {type}
            </span>
        );
    };

    // Combine Automated M2M Reports into the legacy file structure for UI
    const mappedReports = reports.map(r => {
        const member = members.find(m => m.id === r.user_id);
        return {
            id: r.id,
            member_id: r.user_id,
            title: r.title + ' (Automático)',
            file_url: r.storage_path, // Placeholder for storage
            file_type: 'html',
            file_size: null,
            created_at: r.created_at,
            isAutomated: true, // Internal flag
            member: member ? { name: member.name, email: member.email } : undefined,
            created_by: 'system'
        } as unknown as MemberProgressFile & { isAutomated?: boolean };
    });

    const allFiles = [...files, ...mappedReports];

    // Filtered files
    const filteredFiles = allFiles.filter(file => {
        const matchesMember = !filterMemberId || file.member_id === filterMemberId;
        const matchesSearch = !searchQuery ||
            file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (file.member?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMember && matchesSearch;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Pagination Logic
    const historyTotalPages = Math.max(1, Math.ceil(filteredFiles.length / historyPageSize));
    const paginatedFiles = filteredFiles.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

    // Stats
    const allMemberIds = [...files.map(f => f.member_id), ...reports.map(r => r.user_id)];
    const uniqueMembers = new Set(allMemberIds).size;
    const totalFiles = files.length + reports.length;
    const htmlCount = files.filter(f => f.file_type.toLowerCase() === 'html').length + reports.length; // Automated reports are pure HTML

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-1 sm:p-4 md:p-6 max-w-5xl mx-auto w-full max-w-[100vw] overflow-x-hidden reports-container" style={{ boxSizing: 'border-box' }}>
            <style>{`
                .reports-container * {
                    max-width: 100%;
                    box-sizing: border-box;
                }
                .reports-container img {
                    height: auto;
                }
            `}</style>
            <AdminPageHeader
                title="Relatórios de Progresso"
                subtitle="Envie relatórios HTML, PDFs e planilhas para os sócios"
                action={
                    <button
                        onClick={loadData}
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        title="Atualizar"
                    >
                        <RefreshCw size={18} />
                    </button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Total de Arquivos</p>
                    <p className="text-2xl font-bold text-white">{totalFiles}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Sócios com Relatório</p>
                    <p className="text-2xl font-bold text-yellow-500">{uniqueMembers}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Relatórios HTML</p>
                    <p className="text-2xl font-bold text-orange-400">{htmlCount}</p>
                </div>
            </div>



            <div className="grid lg:grid-cols-5 gap-6">
                {/* Upload Form - Left Column (2/5) */}
                <div className="lg:col-span-2 w-full max-w-full min-w-0">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 md:p-6 sticky top-6 w-full box-border">
                        {/* Mode Tabs */}
                        <div className="flex gap-1 mb-5 bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setUploadMode('bulk')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition ${uploadMode === 'bulk'
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Layers size={14} />
                                Em Massa
                            </button>
                            <button
                                onClick={() => setUploadMode('single')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition ${uploadMode === 'single'
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Upload size={14} />
                                Individual
                            </button>
                        </div>

                        {uploadMode === 'bulk' ? (
                            /* ====== BULK UPLOAD ====== */
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layers size={18} className="text-yellow-500" />
                                    Upload em Massa
                                </h2>

                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 w-full overflow-hidden">
                                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed break-words">
                                        📋 <strong className="text-slate-300">Como funciona:</strong> Renomeie cada arquivo com o <strong className="text-yellow-500">e-mail do sócio</strong>.
                                        <br className="sm:hidden" /> Ex: <code className="text-orange-400 text-[10px] break-all bg-slate-900 px-1 py-0.5 rounded">joao@email.com.html</code>
                                    </p>
                                </div>

                                {/* Bulk Title */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">
                                        Título <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={bulkTitle}
                                        onChange={e => setBulkTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                 placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition text-sm"
                                        placeholder="Ex: Relatório de Progresso - Fev/2026"
                                    />
                                </div>

                                {/* Bulk Files */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">
                                        Arquivos <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex items-center gap-2 w-full box-border border border-slate-700 bg-slate-800 rounded-lg p-1.5 focus-within:border-yellow-600 transition">
                                        <label className="shrink-0 inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded cursor-pointer whitespace-nowrap text-xs sm:text-sm font-medium hover:bg-yellow-500 transition">
                                            Escolher arquivos
                                            <input
                                                ref={bulkInputRef}
                                                type="file"
                                                multiple
                                                onChange={handleBulkFilesSelect}
                                                className="hidden"
                                                accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                            />
                                        </label>
                                        <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400 px-1">
                                            {bulkFiles.length > 0
                                                ? `${bulkFiles.length} arquivo(s)`
                                                : 'Nenhum arquivo escolhido'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        Selecione vários arquivos nomeados com e-mail
                                    </p>
                                </div>

                                {/* Selected files preview */}
                                {bulkFiles.length > 0 && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {bulkFiles.length} arquivo(s) selecionado(s):
                                        </p>
                                        {bulkFiles.map((f, i) => {
                                            const email = f.name.replace(/\.(html|htm|pdf|xlsx|xls|doc|docx|csv)$/i, '').toLowerCase();
                                            const member = members.find(m => m.email.toLowerCase() === email);
                                            return (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-xs">
                                                    {member ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Sócio encontrado" />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Sócio não encontrado" />
                                                    )}
                                                    <span className="text-slate-300 truncate flex-1">{f.name}</span>
                                                    {member && (
                                                        <span className="text-green-400 truncate text-[10px]">{member.name}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Progress bar */}
                                {uploading && bulkProgress.total > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Enviando...</span>
                                            <span>{bulkProgress.current}/{bulkProgress.total}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleBulkUpload}
                                    disabled={uploading || bulkFiles.length === 0 || !bulkTitle}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-800 disabled:text-slate-500 
                                             text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition break-words whitespace-normal"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Enviando {bulkProgress.current}/{bulkProgress.total}...
                                        </>
                                    ) : (
                                        <>
                                            <Layers size={18} />
                                            Enviar {bulkFiles.length > 0 ? `${bulkFiles.length} Arquivo(s)` : 'em Massa'}
                                        </>
                                    )}
                                </button>

                                {/* Bulk Results */}
                                {bulkResults.length > 0 && (
                                    <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-3">
                                        <p className="text-xs font-bold text-slate-300 mb-2">Resultado do Upload:</p>
                                        {bulkResults.map((r, i) => (
                                            <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs ${r.success ? 'bg-green-900/10' : 'bg-red-900/10'
                                                }`}>
                                                <span>{r.success ? '✅' : '❌'}</span>
                                                <span className="text-slate-300 flex-1 truncate">{r.email}</span>
                                                <span className={`truncate ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    {r.success ? r.memberName : r.error}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ====== SINGLE UPLOAD ====== */
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Upload size={18} className="text-yellow-500" />
                                    Upload Individual
                                </h2>
                                <form onSubmit={handleSingleUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Sócio <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={selectedMemberId}
                                            onChange={e => setSelectedMemberId(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                     focus:outline-none focus:border-yellow-600 transition text-sm"
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Título <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fileTitle}
                                            onChange={e => setFileTitle(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                     placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition text-sm"
                                            placeholder="Ex: Relatório - Fev/2026"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Arquivo <span className="text-red-400">*</span>
                                        </label>
                                        <div className="flex items-center gap-2 w-full box-border border border-slate-700 bg-slate-800 rounded-lg p-1.5 focus-within:border-yellow-600 transition">
                                            <label className="shrink-0 inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded cursor-pointer whitespace-nowrap text-xs sm:text-sm font-medium hover:bg-yellow-500 transition">
                                                Escolher arquivo
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                                    required
                                                />
                                            </label>
                                            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400 px-1">
                                                {selectedFile
                                                    ? selectedFile.name
                                                    : 'Nenhum arquivo escolhido'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedFile && (
                                        <div className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            {getFileIcon(selectedFile.name.split('.').pop() || '')}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                                 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                                 flex items-center justify-center gap-2 break-words whitespace-normal"
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Enviar Arquivo
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Files List - Right Column (3/5) */}
                <div className="lg:col-span-3 w-full max-w-full min-w-0">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 md:p-6 w-full box-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-yellow-500" />
                                Histórico
                                <span className="text-sm font-normal text-slate-500">
                                    ({filteredFiles.length})
                                </span>
                            </h2>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full box-border bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm
                                             placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <select
                                value={filterMemberId}
                                onChange={e => setFilterMemberId(e.target.value)}
                                className="w-full md:w-auto box-border bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                         focus:outline-none focus:border-yellow-600 transition"
                            >
                                <option value="">Todos os sócios</option>
                                {members
                                    .filter(m => allFiles.some(f => f.member_id === m.id))
                                    .map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Files */}
                        {filteredFiles.length === 0 ? (
                            <div className="py-12 text-center">
                                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                                <p className="text-slate-500 text-sm">
                                    {files.length === 0 ? 'Nenhum arquivo enviado' : 'Nenhum resultado'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {paginatedFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="bg-[#031726] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm relative w-full overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3 w-full min-w-0">
                                            <div className="shrink-0">{getFileIcon(file.file_type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-white truncate block w-full">{file.title}</p>
                                                <div className="mt-1">
                                                    {getFileTypeBadge(file.file_type)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-slate-400 mt-1 pb-1">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                                                <Users size={12} className="shrink-0" />
                                                <span className="truncate">{file.member?.name || 'Desconhecido'}</span>
                                            </div>
                                            <span className="shrink-0 bg-slate-900 rounded px-2 py-0.5 whitespace-nowrap">
                                                {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>

                                        <div className="border-t border-slate-800/80 pt-3 flex justify-end gap-2 w-full">
                                            {(file.file_type.toLowerCase() === 'html' || file.file_type.toLowerCase() === 'htm') && (
                                                <button
                                                    onClick={async () => {
                                                        setLoadingPreview(true);
                                                        setPreviewTitle(file.title);
                                                        setPreviewMemberName(file.member?.name || '');
                                                        try {
                                                            let finalUrl = file.file_url;
                                                            if ((file as any).isAutomated) {
                                                                const signed = await reportService.getReportSignedUrl(file.file_url);
                                                                if (!signed) throw new Error('Falha ao gerar URL de acesso');
                                                                finalUrl = signed;
                                                            }

                                                            const response = await fetch(finalUrl);
                                                            const text = await response.text();
                                                            const blob = new Blob([text], { type: 'text/html' });
                                                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                            setPreviewUrl(URL.createObjectURL(blob));
                                                        } catch (err) {
                                                            console.error('Preview failed:', err);
                                                            if (!(file as any).isAutomated) {
                                                                window.open(file.file_url, '_blank');
                                                            } else {
                                                                toast.error('Erro ao carregar o relatório.');
                                                            }
                                                        } finally {
                                                            setLoadingPreview(false);
                                                        }
                                                    }}
                                                    className="bg-slate-800/80 hover:bg-slate-700 text-yellow-500 rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
                                                    title="Visualizar Relatório"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            {!(file as any).isAutomated && (
                                                <a
                                                    href={file.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-slate-800/80 hover:bg-slate-700 text-blue-400 rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
                                                    title="Baixar Relatório"
                                                >
                                                    <Download size={18} />
                                                </a>
                                            )}
                                            {/* LINK COMPARTILHÁVEL */}
                                            <button
                                                onClick={async () => {
                                                    setCopyingId(file.id);
                                                    try {
                                                        let storageUrl: string;
                                                        if ((file as any).isAutomated) {
                                                            // Relatório automático → Signed URL de 7 dias
                                                            const url = await reportService.getShareableUrl(file.file_url);
                                                            if (!url) throw new Error('Falha ao gerar link');
                                                            storageUrl = url;
                                                        } else {
                                                            // Upload manual → URL pública permanente
                                                            storageUrl = file.file_url;
                                                        }
                                                        // Monta URL do viewer público (renderiza corretamente via blob)
                                                        const titleEncoded = encodeURIComponent(file.title);
                                                        const urlEncoded = encodeURIComponent(storageUrl);
                                                        const shareUrl = `${window.location.origin}/relatorio.html?url=${urlEncoded}&title=${titleEncoded}`;
                                                        await navigator.clipboard.writeText(shareUrl);
                                                        setCopiedId(file.id);
                                                        setTimeout(() => setCopiedId(null), 2500);
                                                        toast.success('Link copiado! Válido por 7 dias.', { icon: '🔗' });
                                                    } catch {
                                                        toast.error('Falha ao gerar o link.');
                                                    } finally {
                                                        setCopyingId(null);
                                                    }
                                                }}
                                                disabled={copyingId === file.id}
                                                className={`bg-slate-800/80 hover:bg-slate-700 rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition ${
                                                    copiedId === file.id ? 'text-emerald-400' : 'text-purple-400'
                                                }`}
                                                title="Copiar link para compartilhar"
                                            >
                                                {copyingId === file.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : copiedId === file.id ? (
                                                    <Check size={18} />
                                                ) : (
                                                    <Link2 size={18} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(file.id)}
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

                        {/* Pagination Footer */}
                        {filteredFiles.length > 0 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-4">
                                <div className="text-sm text-slate-400">
                                    Mostrando <span className="text-white font-medium">{Math.min(filteredFiles.length, (historyPage - 1) * historyPageSize + 1)}</span> a <span className="text-white font-medium">{Math.min(filteredFiles.length, historyPage * historyPageSize)}</span> de <span className="text-white font-medium">{filteredFiles.length}</span> relatórios
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 mr-2">
                                        <span className="text-xs text-slate-500 hidden sm:inline">Exibir</span>
                                        <select
                                            value={historyPageSize}
                                            onChange={e => {
                                                setHistoryPageSize(Number(e.target.value));
                                                setHistoryPage(1);
                                            }}
                                            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:border-yellow-600 transition outline-none"
                                        >
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                        disabled={historyPage === 1}
                                        className="px-3 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                                            bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm font-medium text-slate-400 px-2 min-w-[3rem] text-center">
                                        {historyPage} / {historyTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                                        disabled={historyPage === historyTotalPages}
                                        className="px-3 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                                            bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <FileCode size={20} className="text-orange-400" />
                                <div>
                                    <h3 className="font-bold text-white">{previewTitle}</h3>
                                    <p className="text-xs text-slate-400">{previewMemberName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                    setPreviewTitle('');
                                    setPreviewMemberName('');
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden reports-container">
                            <style>{`
                                .reports-container * {
                                    max-width: 100%;
                                    box-sizing: border-box;
                                }
                                .reports-container img {
                                    height: auto;
                                }
                            `}</style>
                            <iframe
                                src={previewUrl}
                                className="w-full h-full min-h-[60vh] bg-white rounded-b-xl"
                                title={previewTitle}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Confirm Delete Dialog */}
            <AdminConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={async () => {
                    if (!confirmDeleteId) return;
                    await handleDelete(confirmDeleteId);
                    setConfirmDeleteId(null);
                }}
                title="Excluir Arquivo"
                message="Tem certeza que deseja excluir este arquivo? Essa ação não pode ser desfeita."
                confirmText="Excluir"
                isDestructive
            />
        </div>
    );
};

export default AdminMemberProgress;
