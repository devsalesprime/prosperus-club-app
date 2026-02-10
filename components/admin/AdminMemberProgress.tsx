// components/admin/AdminMemberProgress.tsx
// Admin panel for uploading member progress reports

import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Loader2, FileText, Download } from 'lucide-react';
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

    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [fileTitle, setFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load members
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .order('name');

            setMembers(membersData || []);

            // Load all progress files
            const filesData = await toolsService.getAllProgressFiles();
            setFiles(filesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !fileTitle || !selectedFile) {
            alert('⚠️ Preencha todos os campos');
            return;
        }

        setUploading(true);
        try {
            await toolsService.uploadProgressFile({
                member_id: selectedMemberId,
                title: fileTitle,
                file: selectedFile
            });

            alert('✅ Arquivo enviado com sucesso!');
            setSelectedMemberId('');
            setFileTitle('');
            setSelectedFile(null);
            loadData();
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert('❌ Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

        try {
            await toolsService.deleteProgressFile(id);
            alert('✅ Arquivo excluído');
            loadData();
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('❌ Erro ao excluir');
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('excel') || fileType.includes('xlsx')) return '📊';
        if (fileType.includes('doc')) return '📝';
        return '📁';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Enviar Relatórios para Sócios</h2>
                <p className="text-slate-600 text-sm mt-1">Faça upload de PDFs, planilhas e outros arquivos</p>
            </div>

            {/* Upload Form */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Novo Arquivo</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sócio</label>
                        <select
                            value={selectedMemberId}
                            onChange={e => setSelectedMemberId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Selecione um sócio...</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name} ({member.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título do Arquivo</label>
                        <input
                            type="text"
                            value={fileTitle}
                            onChange={e => setFileTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Relatório Mensal - Fev/26"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo</label>
                        <input
                            type="file"
                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            accept=".pdf,.xlsx,.xls,.doc,.docx"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Formatos aceitos: PDF, Excel, Word</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
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

            {/* Files List */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Histórico de Arquivos</h3>

                {files.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhum arquivo enviado ainda.</p>
                ) : (
                    <div className="space-y-3">
                        {files.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{file.title}</p>
                                        <p className="text-sm text-slate-600">
                                            {file.member?.name || 'Sócio desconhecido'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(file.created_at).toLocaleDateString('pt-BR')} • {file.file_type.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                                        title="Download"
                                    >
                                        <Download size={18} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
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
    );
};

export default AdminMemberProgress;
