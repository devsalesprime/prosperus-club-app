// components/admin/AdminMemberProgress.tsx
// Admin panel for uploading and managing member progress reports
// Supports: HTML, PDF, Excel, Word files

import React, { useEffect, useState, useRef } from 'react';
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
    BarChart3,
    AlertCircle
} from 'lucide-react';
import { toolsService, MemberProgressFile } from '../../services/toolsService';
import { supabase } from '../../lib/supabase';

interface Member {
    id: string;
    name: string;
    email: string;
}

export const AdminMemberProgress: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [fileTitle, setFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter/search state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMemberId, setFilterMemberId] = useState('');

    // Preview state
    const [previewFile, setPreviewFile] = useState<MemberProgressFile | null>(null);

    // Feedback state
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-dismiss feedback
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load members
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .order('name');
            setMembers(membersData || []);

            // Load all progress files
            const filesData = await toolsService.getAllProgressFiles();
            setFiles(filesData);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Falha ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !fileTitle || !selectedFile) {
            setError('Preencha todos os campos');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            await toolsService.uploadProgressFile({
                member_id: selectedMemberId,
                title: fileTitle,
                file: selectedFile
            });

            const memberName = members.find(m => m.id === selectedMemberId)?.name || 'Sócio';
            setSuccess(`Arquivo enviado para ${memberName}!`);
            setSelectedMemberId('');
            setFileTitle('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadData();
        } catch (err) {
            console.error('Failed to upload file:', err);
            setError('Erro ao enviar arquivo. Verifique se o bucket "member-reports" existe.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

        try {
            await toolsService.deleteProgressFile(id);
            setSuccess('Arquivo excluído com sucesso');
            loadData();
        } catch (err) {
            console.error('Failed to delete file:', err);
            setError('Erro ao excluir arquivo');
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

    // Filtered files
    const filteredFiles = files.filter(file => {
        const matchesMember = !filterMemberId || file.member_id === filterMemberId;
        const matchesSearch = !searchQuery ||
            file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (file.member?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMember && matchesSearch;
    });

    // Stats
    const uniqueMembers = new Set(files.map(f => f.member_id)).size;
    const htmlCount = files.filter(f => f.file_type.toLowerCase() === 'html').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-xl">
                    <BarChart3 className="text-white" size={24} />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Relatórios de Progresso</h1>
                    <p className="text-slate-400 text-sm">Envie relatórios HTML, PDFs e planilhas para os sócios</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    title="Atualizar"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Total de Arquivos</p>
                    <p className="text-2xl font-bold text-white">{files.length}</p>
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

            {/* Feedback Messages */}
            {success && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-green-900/20 border border-green-900/50 rounded-lg text-green-400 text-sm animate-in fade-in">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm animate-in fade-in">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Upload Form - Left Column (2/5) */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Upload size={18} className="text-yellow-500" />
                            Novo Arquivo
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            {/* Member Select */}
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

                            {/* Title */}
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
                                    placeholder="Ex: Relatório de Progresso - Fev/2026"
                                    required
                                />
                            </div>

                            {/* File Input */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">
                                    Arquivo <span className="text-red-400">*</span>
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                             file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0
                                             file:text-sm file:font-medium file:bg-yellow-600 file:text-white
                                             file:cursor-pointer hover:file:bg-yellow-500"
                                    accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1.5">
                                    Formatos: HTML, PDF, Excel, Word, CSV
                                </p>
                            </div>

                            {/* Selected file info */}
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

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                         rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                         flex items-center justify-center gap-2"
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
                </div>

                {/* Files List - Right Column (3/5) */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-yellow-500" />
                                Histórico de Arquivos
                                <span className="text-sm font-normal text-slate-500">
                                    ({filteredFiles.length})
                                </span>
                            </h2>
                        </div>

                        {/* Search & Filter */}
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por título ou sócio..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm
                                             placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <select
                                value={filterMemberId}
                                onChange={e => setFilterMemberId(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                         focus:outline-none focus:border-yellow-600 transition"
                            >
                                <option value="">Todos os sócios</option>
                                {members
                                    .filter(m => files.some(f => f.member_id === m.id))
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
                                    {files.length === 0 ? 'Nenhum arquivo enviado ainda' : 'Nenhum resultado encontrado'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="group flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
                                    >
                                        {/* Icon */}
                                        <div className="shrink-0">
                                            {getFileIcon(file.file_type)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-medium text-sm text-white truncate">{file.title}</p>
                                                {getFileTypeBadge(file.file_type)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={12} className="text-slate-500 shrink-0" />
                                                <span className="text-xs text-slate-400 truncate">
                                                    {file.member?.name || 'Sócio desconhecido'}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                                {file.file_size && (
                                                    <>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-xs text-slate-500">
                                                            {(file.file_size / 1024).toFixed(0)} KB
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                            {file.file_type.toLowerCase() === 'html' && (
                                                <button
                                                    onClick={() => setPreviewFile(file)}
                                                    className="p-2 hover:bg-yellow-900/30 text-yellow-500 rounded-lg transition"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-blue-900/30 text-blue-400 rounded-lg transition"
                                                title="Abrir/Download"
                                            >
                                                <Download size={16} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* HTML Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <FileCode size={20} className="text-orange-400" />
                                <div>
                                    <h3 className="font-bold text-white">{previewFile.title}</h3>
                                    <p className="text-xs text-slate-400">{previewFile.member?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewFile.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                    title="Abrir em nova aba"
                                >
                                    <Download size={18} />
                                </a>
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
                                className="w-full h-full min-h-[60vh] bg-white rounded-b-xl"
                                title={previewFile.title}
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMemberProgress;
