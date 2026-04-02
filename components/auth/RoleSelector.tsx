import React from 'react';
import { X, User, Shield } from 'lucide-react';

interface RoleSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRole: (role: 'MEMBER' | 'ADMIN') => void;
    userName: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ isOpen, onClose, onSelectRole, userName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                    title="Fechar"
                >
                    <X size={20} />
                </button>

                {/* HEADER */}
                <div className="text-center mb-8">
                    <img
                        src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg"
                        alt="Prosperus Logo"
                        className="h-12 mx-auto mb-4"
                    />
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Bem-vindo, {userName}!
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Como você deseja acessar a plataforma?
                    </p>
                </div>

                {/* OPTIONS */}
                <div className="space-y-4">
                    {/* MEMBER ACCESS */}
                    <button
                        onClick={() => onSelectRole('MEMBER')}
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-600/50 rounded-xl p-6 transition-all duration-300 group text-left"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-yellow-600 transition-colors">
                                <User size={24} className="text-yellow-500 group-hover:text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">Acessar como Sócio</h3>
                                <p className="text-sm text-slate-400">
                                    Visualize eventos, academy, membros e todas as funcionalidades do clube.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* ADMIN ACCESS */}
                    <button
                        onClick={() => onSelectRole('ADMIN')}
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-600/50 rounded-xl p-6 transition-all duration-300 group text-left"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-red-600 transition-colors">
                                <Shield size={24} className="text-red-500 group-hover:text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">Acessar como Administrador</h3>
                                <p className="text-sm text-slate-400">
                                    Gerencie conteúdo, membros, eventos e configurações do sistema.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* INFO */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 text-center">
                        Você pode alternar entre os modos a qualquer momento fazendo logout e login novamente.
                    </p>
                </div>
            </div>
        </div>
    );
};
