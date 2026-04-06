// components/profile/ProfileAvatarSection.tsx
// Avatar section — sem campo de URL, estilo Gmail/LinkedIn

import React from 'react';

interface ProfileAvatarSectionProps {
    imageUrl: string;
    onImageUrlChange: (url: string) => void; // mantida para compatibilidade
    onOpenUpload: () => void;
}

export const ProfileAvatarSection: React.FC<ProfileAvatarSectionProps> = ({
    imageUrl,
    onOpenUpload,
}) => {
    const avatarSrc = imageUrl && !imageUrl.includes('default-avatar')
        ? imageUrl
        : `${import.meta.env.BASE_URL}default-avatar.svg`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            {/* Avatar clicável com badge de câmera */}
            <button
                type="button"
                onClick={onOpenUpload}
                title="Editar foto de perfil"
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    borderRadius: '50%',
                    display: 'block',
                }}
            >
                <img
                    src={avatarSrc}
                    alt="Foto de perfil"
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2.5px solid #1A4A6B',
                        background: '#0D2E44',
                        display: 'block',
                    }}
                    onError={(e) => {
                        e.currentTarget.src = `${import.meta.env.BASE_URL}default-avatar.svg`;
                    }}
                />

                {/* Badge câmera (canto inferior direito) */}
                <span
                    style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#FFDA71',
                        border: '2.5px solid #ba8f41',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-hidden
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#031A2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/>
                        <circle cx="12" cy="13" r="3"/>
                    </svg>
                </span>
            </button>

            {/* Botão textual */}
            <button
                type="button"
                onClick={onOpenUpload}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFDA71',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 0',
                    letterSpacing: '0.01em',
                }}
            >
                Editar foto
            </button>
        </div>
    );
};
