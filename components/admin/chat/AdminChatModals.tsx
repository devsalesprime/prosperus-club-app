// ============================================
// ADMIN CHAT MODALS — Block, New Conversation, Delete Conversation
// Extracted from AdminChatManager.tsx (Operação Estilhaço)
// Presenter component
// ============================================

import React from 'react';
import {
    MessageSquare, Search, X, Loader2, Ban, UserCheck,
    AlertTriangle, Trash2, Send, CheckCircle,
} from 'lucide-react';

// ── Block User Modal ──
export interface BlockUserModalProps {
    isOpen: boolean;
    user: { id: string; name: string; isBlocked: boolean } | null;
    blockReason: string;
    blockingUser: boolean;
    onReasonChange: (value: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
    isOpen, user, blockReason, blockingUser, onReasonChange, onConfirm, onClose,
}) => {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-prosperus-navy border border-prosperus-navy-light rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${user.isBlocked ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                        {user.isBlocked
                            ? <UserCheck className="text-green-400" size={24} />
                            : <Ban className="text-orange-400" size={24} />
                        }
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white">
                            {user.isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                        </h4>
                        <p className="text-sm text-prosperus-grey">{user.name}</p>
                    </div>
                </div>

                {user.isBlocked ? (
                    <p className="text-prosperus-grey mb-6">
                        O usuário <strong className="text-white">{user.name}</strong> será
                        <span className="text-green-400"> desbloqueado</span> e poderá enviar mensagens novamente.
                    </p>
                ) : (
                    <>
                        <p className="text-prosperus-grey mb-4">
                            O usuário <strong className="text-white">{user.name}</strong> será
                            <span className="text-orange-400"> bloqueado</span> e não poderá enviar mensagens.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm text-prosperus-grey mb-2">Motivo (opcional)</label>
                            <textarea
                                value={blockReason}
                                onChange={(e) => onReasonChange(e.target.value)}
                                placeholder="Ex: Violação de regras de conduta..."
                                className="w-full bg-prosperus-navy-light border border-prosperus-grey/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-prosperus-gold transition resize-none"
                                rows={3}
                            />
                        </div>
                    </>
                )}

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 px-4 bg-prosperus-navy-light hover:bg-prosperus-grey/20 text-white rounded-lg transition">Cancelar</button>
                    <button
                        onClick={onConfirm}
                        disabled={blockingUser}
                        className={`flex-1 py-2 px-4 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${user.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        {blockingUser ? (
                            <><Loader2 className="animate-spin" size={16} /> Processando...</>
                        ) : user.isBlocked ? (
                            <><UserCheck size={16} /> Desbloquear</>
                        ) : (
                            <><Ban size={16} /> Bloquear</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── New Conversation Modal ──
export interface NewConversationModalProps {
    isOpen: boolean;
    userSearchQuery: string;
    searchedUsers: any[];
    selectedUser: any | null;
    newConversationMessage: string;
    creatingConversation: boolean;
    onSearchChange: (value: string) => void;
    onSelectUser: (user: any) => void;
    onDeselectUser: () => void;
    onMessageChange: (value: string) => void;
    onCreate: () => void;
    onClose: () => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
    isOpen, userSearchQuery, searchedUsers, selectedUser,
    newConversationMessage, creatingConversation,
    onSearchChange, onSelectUser, onDeselectUser, onMessageChange, onCreate, onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-prosperus-navy border border-prosperus-navy-light rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare className="text-prosperus-gold" size={24} />
                        Nova Conversa
                    </h4>
                    <button onClick={onClose} className="p-1 hover:bg-prosperus-navy-light rounded transition">
                        <X size={20} className="text-prosperus-grey" />
                    </button>
                </div>

                {!selectedUser ? (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm text-prosperus-grey mb-2">Buscar usuário</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={userSearchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Digite o nome ou email..."
                                    className="w-full px-4 py-2 pl-10 bg-prosperus-navy-light text-white rounded-lg border border-prosperus-grey/20 focus:border-prosperus-gold focus:outline-none"
                                />
                                <Search className="absolute left-3 top-2.5 text-prosperus-grey" size={18} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                            {searchedUsers.length === 0 ? (
                                <p className="text-center text-prosperus-grey py-8">
                                    {userSearchQuery ? 'Nenhum usuário encontrado' : 'Digite para buscar usuários'}
                                </p>
                            ) : (
                                searchedUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => onSelectUser(user)}
                                        className="w-full p-3 bg-prosperus-navy-light hover:bg-prosperus-grey/20 rounded-lg transition text-left flex items-center gap-3"
                                    >
                                        <img src={user.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white truncate">{user.name}</p>
                                            <p className="text-sm text-prosperus-grey truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-4 p-3 bg-prosperus-navy-light rounded-lg flex items-center gap-3">
                            <img src={selectedUser.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                                <p className="font-semibold text-white">{selectedUser.name}</p>
                                <p className="text-sm text-prosperus-grey">{selectedUser.email}</p>
                            </div>
                            <button onClick={onDeselectUser} className="p-1 hover:bg-prosperus-navy rounded transition">
                                <X size={18} className="text-prosperus-grey" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm text-prosperus-grey mb-2">Mensagem inicial</label>
                            <textarea
                                value={newConversationMessage}
                                onChange={(e) => onMessageChange(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                className="w-full bg-prosperus-navy-light border border-prosperus-grey/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-prosperus-gold transition resize-none"
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-2 px-4 bg-prosperus-navy-light hover:bg-prosperus-grey/20 text-white rounded-lg transition">Cancelar</button>
                            <button
                                onClick={onCreate}
                                disabled={!newConversationMessage.trim() || creatingConversation}
                                className="flex-1 py-2 px-4 bg-prosperus-gold text-prosperus-navy rounded-lg font-semibold hover:bg-prosperus-gold/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creatingConversation ? (
                                    <><Loader2 className="animate-spin" size={16} /> Criando...</>
                                ) : (
                                    <><Send size={16} /> Enviar</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ── Delete Conversation Modal ──
export interface DeleteConversationModalProps {
    isOpen: boolean;
    convName: string;
    deleteReason: string;
    deletingConv: boolean;
    deleteReasons: string[];
    onReasonChange: (value: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export const DeleteConversationModal: React.FC<DeleteConversationModalProps> = ({
    isOpen, convName, deleteReason, deletingConv, deleteReasons,
    onReasonChange, onConfirm, onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-prosperus-navy border border-prosperus-navy-light rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-red-500/20">
                        <AlertTriangle className="text-red-400" size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white">Excluir Conversa</h4>
                        <p className="text-sm text-prosperus-grey">{convName}</p>
                    </div>
                </div>

                <p className="text-prosperus-grey mb-4 text-sm">
                    Esta ação é <span className="text-red-400 font-semibold">irreversível</span>.
                    Todas as mensagens e mídias serão excluídas permanentemente.
                </p>

                <label className="block text-sm text-prosperus-grey mb-2">Motivo da exclusão</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {deleteReasons.map((reason) => (
                        <button
                            key={reason}
                            onClick={() => onReasonChange(reason)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deleteReason === reason
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-prosperus-navy-light text-prosperus-grey border border-prosperus-grey/20 hover:border-prosperus-grey/40'
                                }`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>

                <textarea
                    value={deleteReasons.includes(deleteReason) ? '' : deleteReason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    placeholder="Ou descreva outro motivo..."
                    className="w-full bg-prosperus-navy-light border border-prosperus-grey/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-prosperus-gold transition resize-none mb-4"
                    rows={2}
                />

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={deletingConv}
                        className="flex-1 py-2.5 rounded-lg border border-prosperus-grey/30 text-sm text-prosperus-grey hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deletingConv}
                        className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deletingConv ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <><Trash2 size={14} /> Excluir</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Admin Toast ──
export interface AdminToastProps {
    message: string | null;
}

export const AdminToast: React.FC<AdminToastProps> = ({ message }) => {
    if (!message) return null;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]
                flex items-center gap-2 px-5 py-3 rounded-xl
                bg-slate-800 border border-slate-700 shadow-2xl"
                style={{ animation: 'fadeInUp 0.3s ease-out' }}
            >
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-sm text-white font-medium">{message}</span>
            </div>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};
