// ============================================
// PROGRESS PREVIEW MODAL — HTML/File Preview
// Extracted from AdminMemberProgress.tsx (Operação Estilhaço)
// Presenter component
// ============================================

import React from 'react';
import { X, FileCode, Loader2 } from 'lucide-react';

export interface ProgressPreviewModalProps {
    previewUrl: string | null;
    previewTitle: string;
    previewMemberName: string;
    loadingPreview: boolean;
    onClose: () => void;
}

export const ProgressPreviewModal: React.FC<ProgressPreviewModalProps> = ({
    previewUrl,
    previewTitle,
    previewMemberName,
    loadingPreview,
    onClose,
}) => {
    if (loadingPreview) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-yellow-500 mx-auto mb-3" size={32} />
                    <p className="text-white text-sm">Carregando relatório...</p>
                </div>
            </div>
        );
    }

    if (!previewUrl) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <FileCode size={20} className="text-orange-400" />
                        <div>
                            <h3 className="font-bold text-white">{previewTitle}</h3>
                            <p className="text-xs text-slate-400">{previewMemberName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden reports-container">
                    <style>{`
                        .reports-container * {
                            max-width: 100%;
                            box-sizing: border-box;
                        }
                        .reports-container img {
                            height: auto;
                        }
                    `}</style>
                    <iframe
                        src={previewUrl}
                        className="w-full h-full min-h-[60vh] bg-white rounded-b-xl"
                        title={previewTitle}
                    />
                </div>
            </div>
        </div>
    );
};
