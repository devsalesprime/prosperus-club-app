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
    <div className="font-sans flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw size={32} className="text-prosperus-ouro-vivo animate-spin" />
        <p className="text-sm text-prosperus-text-off">{message}</p>
    </div>
);
