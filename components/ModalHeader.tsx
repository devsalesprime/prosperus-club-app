// ModalHeader.tsx
// Componente padronizado para header de modais
// Garante alinhamento consistente do botão fechar

import React from 'react';
import { X, LucideIcon } from 'lucide-react';

interface ModalHeaderProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    actions?: React.ReactNode; // Botões adicionais (Preview, History, etc.)
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
    title,
    subtitle,
    onClose,
    actions
}) => {
    return (
        <div className="border-b border-slate-800 flex items-center justify-between">
            {title && (
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-slate-400 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}

            <div className={`flex items-center gap-2 ${title ? 'ml-4' : 'ml-auto'}`}>
                {/* Additional action buttons */}
                {actions}

                {/* Close button - always last and aligned */}
                <button
                    onClick={onClose}
                    className="btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white flex-shrink-0"
                    title="Fechar"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

// Optional: Icon button component for consistency
interface IconButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    title: string;
    className?: string;
}

export const ModalHeaderIconButton: React.FC<IconButtonProps> = ({
    icon: Icon,
    onClick,
    title,
    className = ''
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-yellow-500 flex-shrink-0 ${className}`}
            title={title}
        >
            <Icon size={20} />
        </button>
    );
};
