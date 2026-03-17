// components/admin/AdminFilesModule.tsx
// Admin module for uploading and managing member files
// Multi-upload with + pattern, list with visibility toggle and delete

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
    Plus, Trash2, Eye, EyeOff, FileText, Image as ImageIcon,
    Download, X, Upload, Loader2, FolderOpen
} from 'lucide-react';
import {
    uploadMemberFile,
    getFiles,
    deleteFile,
    toggleFileVisibility,
    MemberFile,
} from '../../services/filesService';
import { AdminPageHeader, AdminConfirmDialog } from './shared';

const CATEGORIES = [
    { id: 'geral', label: 'Geral' },
    { id: 'apresentacao', label: 'Apresentações' },
    { id: 'evento', label: 'Eventos' },
    { id: 'material', label: 'Materiais' },
];

const ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.xlsx,.jpg,.jpeg,.png,.webp';

// ─── Upload item state ──────────────────────────────────────────────────────
interface UploadItem {
    id: string;
    file: File | null;
    title: string;
    description: string;
    category: string;
    status: 'idle' | 'uploading' | 'done' | 'error';
    errorMsg: string;
    preview: string | null;
}

function makeItem(): UploadItem {
    return {
        id: crypto.randomUUID(),
        file: null,
        title: '',
        description: '',
        category: 'geral',
        status: 'idle',
        errorMsg: '',
        preview: null,
    };
}

function getFileIcon(type: string, size = 20) {
    if (type === 'pdf') return <FileText size={size} className="text-red-400" />;
    if (type === 'pptx' || type === 'ppt') return <FileText size={size} className="text-orange-400" />;
    if (type === 'doc' || type === 'docx') return <FileText size={size} className="text-blue-400" />;
    if (type === 'xlsx') return <FileText size={size} className="text-green-400" />;
    if (type === 'image') return <ImageIcon size={size} className="text-cyan-400" />;
    return <FileText size={size} className="text-slate-400" />;
}

function formatBytes(b: number) {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Single upload row ──────────────────────────────────────────────────────
const UploadRow: React.FC<{
    item: UploadItem;
    onUpdate: (id: string, patch: Partial<UploadItem>) => void;
    onRemove: (id: string) => void;
}> = ({ item, onUpdate, onRemove }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        const isImg = f.type.startsWith('image/');
        const preview = isImg ? URL.createObjectURL(f) : null;
        const suggestedTitle = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

        onUpdate(item.id, {
            file: f,
            title: item.title || suggestedTitle,
            preview,
            status: 'idle',
        });
        e.target.value = '';
    };

    const isLoading = item.status === 'uploading';

    return (
        <div className={`bg-slate-900 border rounded-xl p-5 mb-3 relative transition ${
            item.status === 'error' ? 'border-red-500/50' :
            item.status === 'done' ? 'border-emerald-500/50' :
            'border-slate-800'
        }`}>
            {/* Remove button */}
            {item.status !== 'done' && (
                <button
                    onClick={() => onRemove(item.id)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition"
                >
                    <X size={16} />
                </button>
            )}

            {/* File picker */}
            {!item.file ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-slate-600 transition mb-4"
                >
                    <Upload size={24} className="mx-auto mb-2 text-slate-500" />
                    <p className="text-slate-400 text-sm">Clique para selecionar</p>
                    <p className="text-slate-600 text-xs mt-1">PDF · PPT · DOC · XLSX · Imagens</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT}
                        onChange={handleFile}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-950 rounded-lg">
                    {item.preview ? (
                        <img
                            src={item.preview}
                            alt="preview"
                            className="w-10 h-10 object-cover rounded-md"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            {getFileIcon(item.file.name.split('.').pop() ?? '', 18)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.file.name}</p>
                        <p className="text-slate-500 text-xs">{formatBytes(item.file.size)}</p>
                    </div>
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="text-xs text-slate-400 border border-slate-700 rounded-md px-2 py-1 hover:text-white transition"
                    >
                        Trocar
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT}
                        onChange={handleFile}
                        className="hidden"
                    />
                </div>
            )}

            {/* Title */}
            <input
                type="text"
                placeholder="Título do arquivo *"
                value={item.title}
                onChange={e => onUpdate(item.id, { title: e.target.value })}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-yellow-600/50 mb-2 disabled:opacity-50"
            />

            {/* Description */}
            <input
                type="text"
                placeholder="Descrição (opcional)"
                value={item.description}
                onChange={e => onUpdate(item.id, { description: e.target.value })}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-yellow-600/50 mb-3 disabled:opacity-50"
            />

            {/* Category chips */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => onUpdate(item.id, { category: cat.id })}
                        disabled={isLoading}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            item.category === cat.id
                                ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-semibold'
                                : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Status */}
            {item.status === 'uploading' && (
                <div className="flex items-center gap-2 mt-3">
                    <Loader2 size={14} className="animate-spin text-yellow-500" />
                    <p className="text-yellow-500 text-xs">Enviando...</p>
                </div>
            )}
            {item.status === 'done' && (
                <p className="text-emerald-400 text-xs mt-3">✓ Enviado com sucesso</p>
            )}
            {item.status === 'error' && (
                <p className="text-red-400 text-xs mt-3">{item.errorMsg || 'Erro ao enviar. Tente novamente.'}</p>
            )}
        </div>
    );
};

// ─── Main component ─────────────────────────────────────────────────────────
export const AdminFilesModule: React.FC = () => {
    const [tab, setTab] = useState<'upload' | 'lista'>('upload');
    const [items, setItems] = useState<UploadItem[]>([makeItem()]);
    const [files, setFiles] = useState<MemberFile[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; path: string; title: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Load list when switching to lista tab
    useEffect(() => {
        if (tab === 'lista') loadList();
    }, [tab]);

    const loadList = async () => {
        setLoadingList(true);
        const data = await getFiles('todos', true);
        setFiles(data);
        setLoadingList(false);
    };

    // ─── Item handlers ──────────────────────────────────────────────────────
    const updateItem = (id: string, patch: Partial<UploadItem>) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    };

    const removeItem = (id: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id);
            if (item?.preview) URL.revokeObjectURL(item.preview);
            const next = prev.filter(i => i.id !== id);
            return next.length === 0 ? [makeItem()] : next;
        });
    };

    const addItem = () => {
        setItems(prev => [...prev, makeItem()]);
    };

    // ─── Sequential upload ──────────────────────────────────────────────────
    const handleUploadAll = async () => {
        const ready = items.filter(i => i.file && i.title.trim() && i.status !== 'done');
        if (ready.length === 0) return;

        setUploading(true);

        for (const item of ready) {
            updateItem(item.id, { status: 'uploading' });

            const { error } = await uploadMemberFile(
                item.file!,
                item.title.trim(),
                item.category,
                item.description.trim() || undefined
            );

            if (error) {
                updateItem(item.id, { status: 'error', errorMsg: error });
            } else {
                if (item.preview) URL.revokeObjectURL(item.preview);
                updateItem(item.id, { status: 'done', preview: null });
            }
        }

        setUploading(false);
        const successCount = items.filter(i => i.status === 'done').length;
        if (successCount > 0) toast.success(`${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso!`);
    };

    const readyCount = items.filter(i => i.file && i.title.trim() && i.status !== 'done').length;
    const doneCount = items.filter(i => i.status === 'done').length;

    // ─── Render ─────────────────────────────────────────────────────────────
    return (
        <>
        <div className="space-y-6">
            <AdminPageHeader
                title="Arquivos do Clube"
                subtitle="Publique PDFs, apresentações e materiais para os sócios"
            />

            {/* Tab switcher */}
            <div className="flex gap-2">
                {(['upload', 'lista'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition ${
                            tab === t
                                ? 'bg-yellow-500 text-slate-900 border-yellow-500'
                                : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                        }`}
                    >
                        {t === 'upload' ? 'Enviar arquivos' : 'Arquivos publicados'}
                    </button>
                ))}
            </div>

            {/* ─── TAB: UPLOAD ─── */}
            {tab === 'upload' && (
                <div className="max-w-2xl">
                    {items.map(item => (
                        <UploadRow
                            key={item.id}
                            item={item}
                            onUpdate={updateItem}
                            onRemove={removeItem}
                        />
                    ))}

                    {/* Add more button */}
                    <button
                        onClick={addItem}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 text-sm hover:border-slate-500 hover:text-white transition mb-5 disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Adicionar mais um arquivo
                    </button>

                    {/* Submit all */}
                    <button
                        onClick={handleUploadAll}
                        disabled={uploading || readyCount === 0}
                        className={`w-full py-3.5 rounded-xl text-sm font-bold transition ${
                            uploading || readyCount === 0
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400'
                        }`}
                    >
                        {uploading
                            ? 'Enviando...'
                            : readyCount === 0 && doneCount > 0
                            ? `✓ ${doneCount} arquivo${doneCount > 1 ? 's' : ''} enviado${doneCount > 1 ? 's' : ''}`
                            : `Enviar ${readyCount} arquivo${readyCount !== 1 ? 's' : ''}`
                        }
                    </button>

                    {/* Reset after upload */}
                    {doneCount > 0 && readyCount === 0 && (
                        <button
                            onClick={() => setItems([makeItem()])}
                            className="w-full mt-3 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition"
                        >
                            Enviar novos arquivos
                        </button>
                    )}
                </div>
            )}

            {/* ─── TAB: LIST ─── */}
            {tab === 'lista' && (
                <div>
                    {loadingList ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-yellow-500" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen size={48} className="mx-auto mb-3 text-slate-700" />
                            <p className="text-slate-400 text-sm">Nenhum arquivo publicado ainda.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                                <table className="w-full min-w-[600px] text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950">
                                            <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Arquivo</th>
                                            <th className="text-left text-xs text-slate-500 font-medium py-3">Tipo</th>
                                            <th className="text-left text-xs text-slate-500 font-medium py-3">Categoria</th>
                                            <th className="text-center text-xs text-slate-500 font-medium py-3">Downloads</th>
                                            <th className="text-center text-xs text-slate-500 font-medium px-5 py-3">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map(file => (
                                            <tr key={file.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition ${!file.is_visible ? 'opacity-50' : ''}`}>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                                            {getFileIcon(file.file_type, 16)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium truncate max-w-[200px]">{file.title}</p>
                                                            <p className="text-slate-500 text-xs">{formatBytes(file.file_size)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                        {file.file_type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-slate-400 text-xs capitalize">
                                                    {file.category}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Download size={12} className="text-slate-500" />
                                                        <span className="text-slate-300 font-medium">{file.download_count}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => toggleFileVisibility(file.id, !file.is_visible).then(() => { toast.success(file.is_visible ? 'Arquivo ocultado' : 'Arquivo publicado'); loadList(); })}
                                                            title={file.is_visible ? 'Ocultar' : 'Publicar'}
                                                            className="p-1.5 text-slate-400 hover:text-yellow-500 transition"
                                                        >
                                                            {file.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete({ id: file.id, path: file.file_path, title: file.title })}
                                                            className="p-1.5 text-slate-400 hover:text-red-400 transition"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-slate-500 text-xs text-right mt-3">
                                {files.length} arquivo{files.length !== 1 ? 's' : ''} ·{' '}
                                {files.reduce((a, f) => a + f.download_count, 0)} downloads totais
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>

            <AdminConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={async () => {
                    if (!confirmDelete) return;
                    setDeleting(true);
                    const ok = await deleteFile(confirmDelete.id, confirmDelete.path);
                    setDeleting(false);
                    if (ok) {
                        toast.success('Arquivo excluído');
                        setConfirmDelete(null);
                        loadList();
                    } else {
                        toast.error('Erro ao excluir arquivo');
                    }
                }}
                title="Excluir Arquivo"
                message={`"${confirmDelete?.title}" será removido permanentemente.`}
                confirmText="Excluir"
                isDestructive
                isLoading={deleting}
            />
        </>
    );
};

export default AdminFilesModule;
