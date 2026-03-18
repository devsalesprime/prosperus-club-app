// ============================================
// ADMIN BULK ACTION BAR — Floating Action Bar
// ============================================
// Appears at the bottom of the screen when items are selected.
// Generic: receives count and action buttons via props.

import React from 'react';
import { X } from 'lucide-react';

export interface BulkAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'success' | 'danger' | 'default';
    disabled?: boolean;
}

interface AdminBulkActionBarProps {
    count: number;
    actions: BulkAction[];
    onClear: () => void;
}

const variantClasses: Record<string, string> = {
    primary: 'bg-yellow-600 hover:bg-yellow-500 text-white',
    success: 'bg-green-600 hover:bg-green-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    default: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
};

export const AdminBulkActionBar: React.FC<AdminBulkActionBarProps> = ({
    count,
    actions,
    onClear,
}) => {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 shadow-2xl rounded-full px-6 py-3">
                {/* Counter */}
                <span className="text-sm font-bold text-white whitespace-nowrap">
                    {count} {count === 1 ? 'item' : 'itens'}
                </span>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-600" />

                {/* Action Buttons */}
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 ${
                            variantClasses[action.variant || 'default']
                        }`}
                    >
                        {action.icon}
                        {action.label}
                    </button>
                ))}

                {/* Clear Button */}
                <button
                    onClick={onClear}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition"
                    title="Limpar seleção"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default AdminBulkActionBar;
