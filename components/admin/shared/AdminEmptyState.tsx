// ============================================
// ADMIN EMPTY STATE - Shared Component
// ============================================
// Empty state padronizado para tabelas e listas vazias

import React from 'react';
import { Inbox } from 'lucide-react';

interface AdminEmptyStateProps {
    icon?: React.ReactNode;
    message: string;
    description?: string;
    action?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({ icon, message, description, action }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
        <div className="text-slate-600">
            {icon || <Inbox size={48} />}
        </div>
        <p className="text-slate-400 font-medium">{message}</p>
        {description && <p className="text-sm text-slate-500 max-w-md">{description}</p>}
        {action}
    </div>
);
