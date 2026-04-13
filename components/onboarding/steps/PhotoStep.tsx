// PhotoStep — Step 1 (Operação Estilhaço)
import React from 'react';
import { Camera } from 'lucide-react';

export interface PhotoStepProps {
    imageUrl: string;
    uploadingPhoto: boolean;
    errors: Record<string, string>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTriggerFileInput: () => void;
}

export const PhotoStep: React.FC<PhotoStepProps> = ({
    imageUrl, uploadingPhoto, errors, fileInputRef, onPhotoUpload, onTriggerFileInput,
}) => (
    <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Sua foto é sua presença.</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
            Sócios com foto recebem <strong className="text-yellow-500">3× mais conexões</strong> estratégicas.
        </p>

        <div className="flex justify-center mb-4">
            <div className="relative">
                <div
                    className="w-32 h-32 rounded-full border-4 border-yellow-600/50 overflow-hidden bg-slate-800 cursor-pointer hover:border-yellow-500 transition-colors"
                    onClick={onTriggerFileInput}
                >
                    <img src={imageUrl || `${import.meta.env.BASE_URL}default-avatar.svg`} alt="Avatar" className="w-full h-full object-cover" />
                    {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
                <button
                    onClick={onTriggerFileInput}
                    className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-500 text-white p-2.5 rounded-full shadow-lg transition-colors"
                >
                    <Camera size={16} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={onPhotoUpload}
                    className="hidden"
                />
            </div>
        </div>

        {errors.photo && (
            <div className="flex items-center justify-center gap-1.5 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <p className="text-xs text-red-400">📷 {errors.photo}</p>
                </div>
            </div>
        )}

        <button
            onClick={onTriggerFileInput}
            disabled={uploadingPhoto}
            className="text-sm font-semibold transition-colors disabled:opacity-40"
            style={{ color: '#FFDA71' }}
        >
            {uploadingPhoto ? 'Processando...' : imageUrl && !imageUrl.includes('default-avatar') ? 'Trocar foto' : 'Adicionar foto'}
        </button>

        {(!imageUrl || imageUrl.includes('default-avatar')) && (
            <p className="text-[10px] mt-3" style={{ color: '#95A4B4', opacity: 0.5 }}>
                JPG, PNG, HEIC · máx. 15MB · Google Fotos ✓
            </p>
        )}
    </div>
);
