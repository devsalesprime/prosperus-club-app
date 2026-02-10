// ============================================
// ADMIN MODAL - Shared Component
// ============================================
// Modal unificado para todos os módulos admin
// Substitui as 2 implementações duplicadas (AdminApp + BannersModule)

import React from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
};

export const AdminModal: React.FC<AdminModalProps> = ({ title, onClose, children, maxWidth = '2xl' }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
            className={`bg-slate-900 rounded-xl border border-slate-800 w-full ${maxWidthMap[maxWidth]} max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800">
                    <X size={20} />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);
