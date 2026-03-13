// ============================================
// ADMIN FILE UPLOAD - Shared Component
// ============================================
// Drag-and-drop upload zone com preview (imagem ou PDF)
// Usa uploadService para enviar ao servidor próprio

import React, { useState, useRef, useCallback } from 'react';
import {
    Upload,
    X,
    FileText,
    Image as ImageIcon,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { uploadService, UploadResult } from '../../../services/uploadService';

interface AdminFileUploadProps {
    /** Current file URL (for edit mode / pre-populated) */
    value?: string;
    /** Called when upload completes with the public URL */
    onUploaded: (url: string) => void;
    /** Called when file is cleared */
    onClear?: () => void;
    /** Accepted file types */
    accept?: string;
    /** Label text */
    label?: string;
    /** Helper text */
    hint?: string;
    /** Compact mode (no drag zone, just button) */
    compact?: boolean;
}

export const AdminFileUpload: React.FC<AdminFileUploadProps> = ({
    value,
    onUploaded,
    onClear,
    accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
    label = 'Arquivo',
    hint = 'JPG, PNG, WebP, GIF ou PDF. Máx 10MB.',
    compact = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const fileType = value ? uploadService.getFileType(value) : null;

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setUploading(true);
        setProgress(0);

        const result: UploadResult = await uploadService.uploadFile(file, (p) => setProgress(p));

        if (result.success && result.url) {
            onUploaded(result.url);
        } else {
            setError(result.error || 'Erro no upload');
        }

        setUploading(false);
    }, [onUploaded]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
            e.target.value = '';
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleClear = () => {
        onUploaded('');
        onClear?.();
        setError(null);
        setProgress(0);
    };

    // --- PREVIEW ---
    const renderPreview = () => {
        if (!value) return null;

        return (
            <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700">
                {/* Thumbnail */}
                {fileType === 'image' ? (
                    <img
                        src={value}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-600 shrink-0"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : fileType === 'pdf' ? (
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={24} className="text-red-400" />
                    </div>
                ) : (
                    <div className="w-16 h-16 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center shrink-0">
                        <ImageIcon size={24} className="text-slate-400" />
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                        {value.split('/').pop()}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{value}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <CheckCircle size={12} className="text-green-400" />
                        <span className="text-xs text-green-400">Enviado</span>
                    </div>
                </div>

                {/* Remove */}
                <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition shrink-0"
                    title="Remover arquivo"
                    style={{ minHeight: 'auto', minWidth: 'auto' }}
                >
                    <X size={16} />
                </button>
            </div>
        );
    };

    // --- UPLOAD ZONE ---
    const renderUploadZone = () => {
        if (uploading) {
            return (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 text-center space-y-3">
                    <Loader2 size={24} className="animate-spin text-yellow-500 mx-auto" />
                    <div>
                        <p className="text-sm text-white font-medium">Enviando... {progress}%</p>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
                            <div
                                className="bg-yellow-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (compact) {
            return (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition text-sm"
                >
                    <Upload size={16} />
                    Fazer Upload
                </button>
            );
        }

        return (
            <div
                className={`rounded-lg p-6 border-2 border-dashed transition cursor-pointer text-center ${
                    dragOver
                        ? 'border-yellow-500 bg-yellow-500/5'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-yellow-500' : 'text-slate-500'}`} />
                <p className="text-sm text-slate-300 font-medium">
                    {dragOver ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-xs text-slate-500 mt-1">{hint}</p>
            </div>
        );
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>

            {value ? renderPreview() : renderUploadZone()}

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
};

export default AdminFileUpload;
