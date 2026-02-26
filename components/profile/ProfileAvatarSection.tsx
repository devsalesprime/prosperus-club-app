// components/profile/ProfileAvatarSection.tsx
// Extracted from ProfileEdit.tsx L300-345 — Avatar display + upload trigger

import React from 'react';
import { Upload } from 'lucide-react';
import { AvatarEditable } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ProfileAvatarSectionProps {
    imageUrl: string;
    onImageUrlChange: (url: string) => void;
    onOpenUpload: () => void;
}

export const ProfileAvatarSection: React.FC<ProfileAvatarSectionProps> = ({
    imageUrl,
    onImageUrlChange,
    onOpenUpload,
}) => {
    return (
        <div>
            <label className="block text-sm font-bold text-white mb-2">
                Foto de Perfil
            </label>
            {/* Layout responsivo: empilha no mobile, inline no desktop */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                {/* Clickable avatar with camera overlay */}
                <button
                    type="button"
                    onClick={onOpenUpload}
                    className="relative shrink-0 group"
                    title="Trocar foto de perfil"
                >
                    <AvatarEditable
                        src={imageUrl}
                        alt="Preview"
                        size="xl"
                    />
                    {/* Camera overlay */}
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white" />
                    </div>
                </button>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => onImageUrlChange(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                    />
                    <Button
                        variant="primary"
                        size="md"
                        onClick={onOpenUpload}
                        className="w-full sm:w-auto shrink-0"
                    >
                        <Upload size={18} />
                        Upload
                    </Button>
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center sm:text-left">
                Toque na foto ou clique em Upload para alterar
            </p>
        </div>
    );
};
