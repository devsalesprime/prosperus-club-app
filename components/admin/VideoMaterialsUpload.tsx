// ============================================
// VideoMaterialsUpload.tsx — Admin sub-component
// ============================================
// Used inside AcademyModule when editing OR creating a video
// Allows uploading PDFs, PPTs, and images as supplementary materials
// Supports "pending mode" (no videoId) where files are queued for later upload

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Paperclip, X, Upload, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { videoService, VideoMaterial } from '../../services/videoService';
import { AdminConfirmDialog } from './shared/AdminConfirmDialog';

const GOLD   = '#FFDA71';
const NAVY   = '#031A2B';
const CARD   = '#0D2E44';
const GREY   = '#A8B4BC';
const BORDER = '#123F5B';

const ACCEPT = '.pdf,.ppt,.pptx,.jpg,.jpeg,.png,.webp';

interface UploadItem {
    id: string;
    type: 'file' | 'link';
    file: File | null;
    url: string;
    title: string;
    status: 'idle' | 'uploading' | 'done' | 'error';
    errorMsg: string;
}

function makeItem(type: 'file' | 'link' = 'file'): UploadItem {
    return { id: crypto.randomUUID(), type, file: null, url: '', title: '', status: 'idle', errorMsg: '' };
}

function formatBytes(b: number) {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export interface PendingMaterial {
    file?: File;
    url?: string;
    title: string;
    type: 'file' | 'link';
}

interface Props {
    videoId?: string;             // undefined = new video (pending mode)
    videoTitle: string;
    onPendingChange?: (items: PendingMaterial[]) => void;  // called in pending mode
}

export const VideoMaterialsUpload: React.FC<Props> = ({ videoId, videoTitle, onPendingChange }) => {
    const isPendingMode = !videoId;
    const [existing, setExisting] = useState<VideoMaterial[]>([]);
    const [items, setItems] = useState<UploadItem[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    // Delete confirmation — replaces native confirm()
    const [materialToDelete, setMaterialToDelete] = useState<VideoMaterial | null>(null);

    useEffect(() => {
        if (videoId) loadExisting();
    }, [videoId]);

    // Report pending files to parent when items change (pending mode only)
    useEffect(() => {
        if (isPendingMode && onPendingChange) {
            const pending = items
                .filter(i => i.title.trim() && (i.type === 'link' ? i.url.trim() : i.file))
                .map(i => ({
                    type: i.type,
                    file: i.type === 'file' ? i.file! : undefined,
                    url: i.type === 'link' ? i.url.trim() : undefined,
                    title: i.title.trim(),
                }));
            onPendingChange(pending);
        }
    }, [items, isPendingMode]);

    const loadExisting = async () => {
        if (!videoId) return;
        const data = await videoService.getVideoMaterials(videoId);
        setExisting(data);
    };

    const updateItem = (id: string, patch: Partial<UploadItem>) =>
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

    const removeItem = (id: string) =>
        setItems(prev => {
            const next = prev.filter(i => i.id !== id);
            if (next.length === 0) setShowForm(false);
            return next;
        });

    const addItem = (type: 'file' | 'link' = 'file') => {
        if (!showForm) setShowForm(true);
        setItems(prev => [...prev, makeItem(type)]);
    };

    const handleFileSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const suggestedTitle = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        updateItem(id, { file: f, title: suggestedTitle, status: 'idle' });
        e.target.value = '';
    };

    const handleUploadAll = async () => {
        if (isPendingMode) return; // Parent handles upload after video creation
        const ready = items.filter(i => {
            if (i.status === 'done') return false;
            if (!i.title.trim()) return false;
            return i.type === 'link' ? i.url.trim() : !!i.file;
        });
        if (!ready.length) return;
        setLoading(true);

        for (let i = 0; i < ready.length; i++) {
            const item = ready[i];
            updateItem(item.id, { status: 'uploading' });

            let result: { error: string | null };
            if (item.type === 'link') {
                result = await videoService.addVideoMaterialLink(
                    videoId!, item.url.trim(), item.title.trim(), existing.length + i
                );
            } else {
                result = await videoService.uploadVideoMaterial(
                    videoId!, item.file!, item.title.trim(), existing.length + i
                );
            }

            if (result.error) {
                updateItem(item.id, { status: 'error', errorMsg: result.error });
            } else {
                updateItem(item.id, { status: 'done' });
            }
        }

        setLoading(false);
        await loadExisting();

        // Clear completed items
        setItems(prev => prev.filter(i => i.status !== 'done'));
        if (items.every(i => i.status === 'done' || !i.file)) {
            setItems([]);
            setShowForm(false);
        }
    };

    const handleDelete = async (mat: VideoMaterial) => {
        setMaterialToDelete(mat);
    };

    const confirmDelete = async () => {
        if (!materialToDelete) return;
        await videoService.deleteVideoMaterial(materialToDelete.id, materialToDelete.file_path);
        setMaterialToDelete(null);
        await loadExisting();
    };

    const readyCount = items.filter(i => {
        if (i.status === 'done') return false;
        if (!i.title.trim()) return false;
        return i.type === 'link' ? i.url.trim() : !!i.file;
    }).length;
    const pendingCount = isPendingMode ? items.filter(i => {
        if (!i.title.trim()) return false;
        return i.type === 'link' ? i.url.trim() : !!i.file;
    }).length : 0;

    return (
        <div style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: '#0f172a',
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Paperclip size={15} color={GOLD} />
                    <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>
                        Materiais complementares
                    </span>
                    {existing.length > 0 && (
                        <span style={{
                            fontSize: 11, color: GREY,
                            background: CARD, padding: '2px 8px', borderRadius: 10,
                        }}>
                            {existing.length}
                        </span>
                    )}
                </div>

                {/* Add buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => addItem('file')}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 8,
                            border: `1px solid ${BORDER}`, background: 'transparent',
                            color: GREY, fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        <Plus size={13} color={GREY} />
                        Adicionar
                    </button>
                    <button
                        onClick={() => addItem('link')}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 8,
                            border: `1px solid ${BORDER}`, background: 'transparent',
                            color: GREY, fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        <LinkIcon size={13} color={GREY} />
                        + Link
                    </button>
                </div>
            </div>

            {/* Existing materials */}
            {existing.map(mat => (
                <div key={mat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', marginBottom: 6,
                    background: CARD, borderRadius: 8,
                    border: `1px solid ${BORDER}`,
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 12, fontWeight: 600, color: '#FCF7F0',
                            margin: '0 0 1px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {mat.title}
                        </p>
                        <p style={{ fontSize: 11, color: GREY, margin: 0 }}>
                            {mat.file_type === 'link'
                                ? 'LINK'
                                : `${mat.file_type.toUpperCase()} · ${formatBytes(mat.file_size)}`
                            }
                        </p>
                    </div>
                    {mat.file_type === 'link' && (
                        <a
                            href={mat.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                            <ExternalLink size={14} color="#3B82F6" />
                        </a>
                    )}
                    <button
                        onClick={() => handleDelete(mat)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                        <Trash2 size={14} color="#EF4444" />
                    </button>
                </div>
            ))}

            {/* Upload form items */}
            {showForm && items.map(item => {
                const fileInputRef = React.createRef<HTMLInputElement>();
                return (
                    <div key={item.id} style={{
                        padding: 12, marginBottom: 8,
                        background: CARD, borderRadius: 8,
                        border: `1px solid ${item.status === 'error' ? '#EF4444' : BORDER}`,
                    }}>
                        {/* Type badge */}
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: item.type === 'link' ? '#3B82F6' : GOLD,
                                background: item.type === 'link' ? '#3B82F620' : '#FFDA7120',
                                padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase',
                            }}>
                                {item.type === 'link' ? '🔗 Link' : '📎 Arquivo'}
                            </span>
                        </div>

                        {/* File selector (only for file type) */}
                        {item.type === 'file' && (
                            !item.file ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `1px dashed ${BORDER}`, borderRadius: 6,
                                        padding: '12px', textAlign: 'center', cursor: 'pointer',
                                        marginBottom: 8,
                                    }}
                                >
                                    <Upload size={16} color={GREY} style={{ marginBottom: 4 }} />
                                    <p style={{ color: GREY, fontSize: 12, margin: 0 }}>Selecionar arquivo</p>
                                    <p style={{ color: '#5F7A8A', fontSize: 10, margin: '2px 0 0' }}>PDF · PPT · Imagens</p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '6px 8px', background: NAVY, borderRadius: 6, marginBottom: 8,
                                }}>
                                    <span style={{ flex: 1, fontSize: 11, color: GREY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.file.name} · {formatBytes(item.file.size)}
                                    </span>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: GREY, fontSize: 11 }}
                                    >
                                        Trocar
                                    </button>
                                </div>
                            )
                        )}

                        {/* URL input (only for link type) */}
                        {item.type === 'link' && (
                            <input
                                type="url"
                                placeholder="https://exemplo.com/recurso"
                                value={item.url}
                                onChange={e => updateItem(item.id, { url: e.target.value })}
                                disabled={loading}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: NAVY, border: `1px solid ${BORDER}`,
                                    borderRadius: 6, padding: '7px 10px',
                                    color: '#FCF7F0', fontSize: 12, marginBottom: 8,
                                }}
                            />
                        )}

                        <input ref={fileInputRef} type="file" accept={ACCEPT}
                            onChange={e => handleFileSelect(item.id, e)} style={{ display: 'none' }} />

                        {/* Title input */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Título do material *"
                                value={item.title}
                                onChange={e => updateItem(item.id, { title: e.target.value })}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    background: NAVY, border: `1px solid ${BORDER}`,
                                    borderRadius: 6, padding: '7px 10px',
                                    color: '#FCF7F0', fontSize: 12,
                                }}
                            />
                            <button
                                onClick={() => removeItem(item.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            >
                                <X size={14} color={GREY} />
                            </button>
                        </div>

                        {/* Status */}
                        {item.status === 'uploading' && (
                            <p style={{ color: GOLD, fontSize: 11, margin: '6px 0 0' }}>Enviando...</p>
                        )}
                        {item.status === 'error' && (
                            <p style={{ color: '#EF4444', fontSize: 11, margin: '6px 0 0' }}>
                                {item.errorMsg}
                            </p>
                        )}
                    </div>
                );
            })}

            {/* Submit button (only in edit mode when items are ready) */}
            {!isPendingMode && readyCount > 0 && (
                <button
                    onClick={handleUploadAll}
                    disabled={loading}
                    style={{
                        width: '100%', marginTop: 8, padding: '10px',
                        borderRadius: 8, border: 'none',
                        background: loading ? '#1A3A4A' : GOLD,
                        color: loading ? GREY : NAVY,
                        fontSize: 13, fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading
                        ? 'Enviando...'
                        : `Enviar ${readyCount} ${readyCount !== 1 ? 'materiais' : 'material'}`
                    }
                </button>
            )}

            {/* Pending mode info */}
            {isPendingMode && pendingCount > 0 && (
                <p style={{ color: GOLD, fontSize: 11, margin: '8px 0 0', fontStyle: 'italic' }}>
                    📎 {pendingCount} {pendingCount !== 1 ? 'materiais' : 'material'} será{pendingCount !== 1 ? 'ão' : ''} salvo{pendingCount !== 1 ? 's' : ''} ao salvar o vídeo.
                </p>
            )}

            {/* Empty state */}
            {existing.length === 0 && !showForm && (
                <p style={{ color: GREY, fontSize: 12, margin: 0 }}>
                    Nenhum material ainda. Clique em "Adicionar" para anexar PDFs ou apresentações.
                </p>
            )}

            {/* Delete Confirmation Dialog */}
            <AdminConfirmDialog
                isOpen={!!materialToDelete}
                onClose={() => setMaterialToDelete(null)}
                onConfirm={confirmDelete}
                title="Remover material"
                message={<>Tem certeza que deseja remover <strong className="text-white">"{materialToDelete?.title}"</strong>? Esta ação não pode ser desfeita.</>}
                confirmText="Remover"
                isDestructive
            />
        </div>
    );
};
