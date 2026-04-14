// ============================================
// DELETE CONFIRM SHEET — Bottom sheet de confirmação
// ============================================
// Para ações destrutivas irreversíveis (deletar conversa, negócio, etc)

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmSheetProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmSheet: React.FC<DeleteConfirmSheetProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[10001]
                bg-slate-900 border-t border-slate-800 rounded-t-3xl
                p-6 pb-10
                animate-in slide-in-from-bottom-4 duration-200"
            >
                {/* Handle */}
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <h3 className="text-white font-semibold text-base">
                        {title}
                    </h3>
                </div>

                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600
                            text-white font-semibold transition-colors active:scale-[0.98]"
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700
                            text-slate-300 font-medium transition-colors active:scale-[0.98]"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </>
    );
};

export default DeleteConfirmSheet;
