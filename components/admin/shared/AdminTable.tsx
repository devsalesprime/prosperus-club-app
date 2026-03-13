// ============================================
// ADMIN TABLE - Shared Component
// ============================================
// Wrapper padronizado para tabelas do Admin
// Resolve layout responsivo mobile com overflow-x-auto

import React from 'react';

interface AdminTableProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
}

export const AdminTable: React.FC<AdminTableProps> = ({
    children,
    title,
    subtitle,
    headerAction,
}) => {
    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            {/* Optional header row */}
            {(title || headerAction) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
                    <div>
                        {title && (
                            <h3 className="text-sm font-semibold text-white">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">{headerAction}</div>
                    )}
                </div>
            )}

            {/* Scrollable table container — blindagem mobile */}
            <div className="overflow-x-auto">
                {children}
            </div>
        </div>
    );
};
