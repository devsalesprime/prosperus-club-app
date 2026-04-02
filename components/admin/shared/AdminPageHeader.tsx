// ============================================
// ADMIN PAGE HEADER - Shared Component
// ============================================
// Padroniza o header de todas as páginas admin

import React from 'react';

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, subtitle, action }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action}
    </div>
);
