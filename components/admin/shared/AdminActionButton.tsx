// ============================================
// ADMIN ACTION BUTTON - Shared Component
// ============================================
// Botão discreto para ações em linhas de tabela
// Variantes: primary (gold), danger (red), ghost (slate)

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminActionButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'ghost';
    disabled?: boolean;
    title?: string;
    size?: number;
    label?: string;
}

const variantStyles: Record<string, string> = {
    primary: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
};

export const AdminActionButton: React.FC<AdminActionButtonProps> = ({
    icon: Icon,
    onClick,
    variant = 'ghost',
    disabled = false,
    title,
    size = 16,
    label,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                inline-flex items-center gap-1.5
                p-2 rounded-lg transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                ${variantStyles[variant]}
            `}
        >
            <Icon size={size} />
            {label && (
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
            )}
        </button>
    );
};
