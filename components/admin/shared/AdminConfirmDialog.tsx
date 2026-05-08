// ============================================
// ADMIN CONFIRM DIALOG - Shared Component
// ============================================
// Modal elegante para substituir window.confirm()
// Suporta ações destrutivas (vermelho) e loading state

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AdminConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-prosperus-preto-absoluto/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div
                className="bg-prosperus-bg-box rounded-xl border border-prosperus-stroke w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-0">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                            isDestructive
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-prosperus-ouro-vivo/10 text-prosperus-ouro-vivo'
                        }`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3
                                id="confirm-dialog-title"
                                className="text-lg font-bold text-prosperus-text leading-tight"
                            >
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-prosperus-text-off hover:text-prosperus-text transition p-1 rounded-lg hover:bg-prosperus-bg-primary disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Message */}
                <div className="px-5 pt-3 pb-5">
                    <div className="font-sans text-sm text-prosperus-text-off leading-relaxed pl-[44px]">
                        {message}
                    </div>
                </div>

                {/* Actions */}
                <div className="font-sans flex items-center justify-end gap-3 px-5 py-4 border-t border-prosperus-stroke bg-prosperus-bg-primary/50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-prosperus-text hover:bg-prosperus-stroke transition disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                            isDestructive
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20 text-prosperus-text'
                                : 'bg-gradient-to-br from-prosperus-ouro-vivo to-prosperus-ouro-nobre hover:opacity-90 text-prosperus-bg-primary shadow-prosperus-ouro-nobre/20'
                        }`}
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
