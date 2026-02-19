// components/UpdatePasswordModal.tsx
// Full-screen modal for setting a new password after clicking recovery email link
// Blocks access to the rest of the app until password is updated

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

export const UpdatePasswordModal: React.FC = () => {
    const { updateUserPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        const result = await updateUserPassword(password);
        setLoading(false);

        if (result.success) {
            setSuccess(true);
            // Auto-redirect after 2 seconds (isPasswordRecovery is cleared by updateUserPassword)
            setTimeout(() => {
                // The modal will unmount because isPasswordRecovery becomes false
            }, 2000);
        } else {
            setError(result.error || 'Erro ao atualizar senha.');
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
                {/* HEADER */}
                <div className="text-center mb-8">
                    <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus Logo" className="h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">
                        {success ? 'Senha Atualizada!' : 'Criar Nova Senha'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {success ? 'Você será redirecionado automaticamente.' : 'Defina uma nova senha segura para seu acesso'}
                    </p>
                </div>

                {/* ALERTS */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-6">
                        <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
                        <p className="text-emerald-400 font-semibold">Senha atualizada com sucesso!</p>
                        <p className="text-slate-500 text-sm mt-2">Redirecionando para o Dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-yellow-600 transition"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirmar Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-yellow-600 transition"
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Password strength indicator */}
                        {password.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                                <Lock size={12} className={password.length >= 6 ? 'text-emerald-400' : 'text-slate-500'} />
                                <span className={password.length >= 6 ? 'text-emerald-400' : 'text-slate-500'}>
                                    {password.length >= 6 ? 'Tamanho OK' : `${password.length}/6 caracteres`}
                                </span>
                                {confirmPassword.length > 0 && (
                                    <>
                                        <span className="text-slate-700">•</span>
                                        <span className={password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}>
                                            {password === confirmPassword ? 'Senhas coincidem ✓' : 'Senhas não coincidem'}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full rounded-xl py-3.5 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                        >
                            {loading ? 'Atualizando...' : 'Atualizar Senha'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
