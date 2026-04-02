// ============================================
// ADMIN LOADING STATE - Shared Component
// ============================================
// Loading spinner padronizado para todos os módulos admin

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface AdminLoadingStateProps {
    message?: string;
}

export const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({ message = 'Carregando...' }) => (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw size={32} className="text-yellow-500 animate-spin" />
        <p className="text-sm text-slate-400">{message}</p>
    </div>
);
