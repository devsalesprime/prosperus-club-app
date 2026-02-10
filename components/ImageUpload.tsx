// ImageUpload.tsx
// Component for uploading and cropping profile images

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { ModalWrapper, ModalBody, ModalFooter } from './ui/ModalWrapper';
import { ModalHeader } from './ModalHeader';

interface ImageUploadProps {
    currentImageUrl?: string;
    userId: string;
    supabase: SupabaseClient; // Receive authenticated client
    onImageUploaded: (url: string) => void;
    onCancel: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    currentImageUrl,
    userId,
    supabase, // Use authenticated client
    onImageUploaded,
    onCancel
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione uma imagem válida');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 5MB');
            return;
        }

        setSelectedFile(file);
        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        try {
            // Generate unique filename
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, selectedFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                // Handle specific Storage errors gracefully
                const errorMessage = uploadError.message?.toLowerCase() || '';
                const statusCode = (uploadError as any)?.statusCode || (uploadError as any)?.status;

                if (statusCode === 403 || errorMessage.includes('policy') || errorMessage.includes('rls')) {
                    throw new Error('Sem permissão para upload. Verifique as configurações do Storage ou use uma URL externa.');
                } else if (errorMessage.includes('bucket') || errorMessage.includes('not found')) {
                    throw new Error('Bucket de avatars não configurado. Use o campo de URL para inserir uma imagem externa.');
                } else if (statusCode === 413 || errorMessage.includes('size')) {
                    throw new Error('Imagem muito grande. Máximo permitido: 5MB.');
                } else {
                    throw uploadError;
                }
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setSuccess(true);
            setTimeout(() => {
                onImageUploaded(publicUrl);
            }, 1000);

        } catch (err: unknown) {
            console.error('Error uploading image:', err);

            // Create user-friendly error message
            let friendlyError = 'Erro ao fazer upload da imagem.';

            if (err instanceof Error && err.message) {
                friendlyError = err.message;
            }

            // Add helpful tip for Storage errors
            if (friendlyError.includes('URL') || friendlyError.includes('bucket') || friendlyError.includes('permissão')) {
                friendlyError += ' Você pode colar uma URL de imagem diretamente no campo de foto.';
            }

            setError(friendlyError);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <ModalWrapper isOpen={true} onClose={onCancel} maxWidth="md">
            <ModalHeader
                title="Upload de Foto"
                onClose={onCancel}
            />

            <ModalBody>
                {/* Content */}
                <div className="space-y-4">
                    {/* Current Image */}
                    {currentImageUrl && !previewUrl && (
                        <div>
                            <p className="text-sm text-slate-400 mb-2">Imagem Atual:</p>
                            <img
                                src={currentImageUrl}
                                alt="Current"
                                className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-slate-700"
                            />
                        </div>
                    )}

                    {/* Preview */}
                    {previewUrl && (
                        <div>
                            <p className="text-sm text-slate-400 mb-2">Preview:</p>
                            <div className="relative">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-yellow-600"
                                />
                                <button
                                    onClick={handleRemoveSelection}
                                    className="absolute top-0 right-1/2 translate-x-16 -translate-y-2 p-1 bg-red-600 hover:bg-red-700 rounded-full text-white transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">
                                {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(0)} KB)
                            </p>
                        </div>
                    )}

                    {/* Upload Button */}
                    {!previewUrl && (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-12 border-2 border-dashed border-slate-700 hover:border-yellow-600 rounded-xl transition flex flex-col items-center gap-3 text-slate-400 hover:text-yellow-500"
                            >
                                <Upload size={32} />
                                <div className="text-center">
                                    <p className="font-bold">Clique para selecionar</p>
                                    <p className="text-xs">ou arraste uma imagem aqui</p>
                                    <p className="text-xs mt-1">Máx: 5MB (JPG, PNG, GIF)</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg flex items-start gap-2">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg flex items-start gap-2">
                            <Check className="text-green-500 shrink-0" size={18} />
                            <p className="text-sm text-green-400">Imagem enviada com sucesso!</p>
                        </div>
                    )}
                </div>
            </ModalBody>

            {/* Actions */}
            <ModalFooter>
                <button
                    onClick={onCancel}
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Upload size={18} />
                            Enviar
                        </>
                    )}
                </button>
            </ModalFooter>
        </ModalWrapper>
    );
};
