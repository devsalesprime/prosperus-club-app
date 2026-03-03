// ============================================
// MESSAGE CONTEXT MENU — Menu contextual ao long press
// ============================================
// Bottom sheet com ações: Responder, Copiar, Deletar (só própria)

import React from 'react';
import { Reply, Copy, Trash2, X } from 'lucide-react';

interface MessageContextMenuProps {
    messageContent: string;
    isOwnMessage: boolean;
    onClose: () => void;
    onReply: () => void;
    onCopy: () => void;
    onDelete?: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    messageContent,
    isOwnMessage,
    onClose,
    onReply,
    onCopy,
    onDelete,
}) => {
    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm
                    animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50
                bg-slate-900 border-t border-slate-800
                rounded-t-3xl p-4 pb-8
                animate-in slide-in-from-bottom-4 duration-200"
            >
                {/* Handle */}
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-1 bg-slate-700 rounded-full" />
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-500 hover:text-slate-300 transition"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Message preview */}
                <div className="bg-slate-800 rounded-2xl p-3 mb-4
                    text-sm text-slate-400 line-clamp-2 break-words">
                    {messageContent}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => { onReply(); onClose(); }}
                        className="flex flex-col items-center gap-2 p-3
                            rounded-2xl bg-slate-800 hover:bg-slate-700
                            text-slate-300 transition active:scale-95"
                    >
                        <Reply size={20} />
                        <span className="text-xs">Responder</span>
                    </button>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(messageContent);
                            onCopy();
                            onClose();
                        }}
                        className="flex flex-col items-center gap-2 p-3
                            rounded-2xl bg-slate-800 hover:bg-slate-700
                            text-slate-300 transition active:scale-95"
                    >
                        <Copy size={20} />
                        <span className="text-xs">Copiar</span>
                    </button>

                    {isOwnMessage && onDelete && (
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="flex flex-col items-center gap-2 p-3
                                rounded-2xl bg-red-500/10 hover:bg-red-500/20
                                text-red-400 transition active:scale-95"
                        >
                            <Trash2 size={20} />
                            <span className="text-xs">Deletar</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default MessageContextMenu;
