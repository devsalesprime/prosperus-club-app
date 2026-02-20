import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

type ModalView = 'LOGIN' | 'LOGIN_PASSWORD' | 'CHECK_EMAIL' | 'CREATE_PASSWORD' | 'FORGOT_PASSWORD';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const { resetPassword } = useAuth();
    const [view, setView] = useState<ModalView>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<{ fullName?: string; jobTitle?: string; company?: string; phone?: string } | null>(null);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!isOpen) return null;

    const resetState = () => {
        setError(null);
        setSuccessMsg(null);
        setLoading(false);
    };

    // ─── VIEW HEADERS ───────────────────────────────────────────────

    const getViewTitle = (): string => {
        switch (view) {
            case 'LOGIN': return 'Bem-vindo ao Prosperus';
            case 'LOGIN_PASSWORD': return 'Bem-vindo de volta';
            case 'CHECK_EMAIL': return 'Primeiro Acesso';
            case 'CREATE_PASSWORD': return 'Criar Senha';
            case 'FORGOT_PASSWORD': return 'Recuperar Senha';
            default: return '';
        }
    };

    const getViewSubtitle = (): string => {
        switch (view) {
            case 'LOGIN': return 'Digite seu email para continuar';
            case 'LOGIN_PASSWORD': return 'Digite sua senha para acessar';
            case 'CHECK_EMAIL': return 'Vamos verificar seu cadastro de sócio';
            case 'CREATE_PASSWORD': return 'Defina uma senha segura para seu acesso';
            case 'FORGOT_PASSWORD': return 'Digite o e-mail cadastrado para receber um link';
            default: return '';
        }
    };

    // ─── STEP 1: EMAIL CHECK ────────────────────────────────────────

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        resetState();

        try {
            // Check if email already has an account via Edge Function
            const { data, error: fnError } = await supabase.functions.invoke('check-email-exists', {
                body: { email: email.trim().toLowerCase() }
            });

            if (fnError) {
                console.error('check-email-exists error:', fnError);
                // On error, assume user exists and let them try to login
                setView('LOGIN_PASSWORD');
                return;
            }

            if (data?.exists) {
                // Email found — go to password
                setView('LOGIN_PASSWORD');
            } else {
                // Email not found — redirect to first access (HubSpot check)
                setSuccessMsg('Vamos verificar seu cadastro de sócio');
                setView('CHECK_EMAIL');
            }

        } catch (err: unknown) {
            console.error('Email check error:', err);
            // Fallback: go to password view anyway
            setView('LOGIN_PASSWORD');
        } finally {
            setLoading(false);
        }
    };

    // ─── STEP 2: LOGIN WITH PASSWORD ────────────────────────────────

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Authenticate with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                console.error('Supabase Auth Error:', authError);

                if (authError.message?.includes('Invalid login credentials')) {
                    throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
                }

                if (authError.status === 429 || authError.message?.includes('rate limit')) {
                    throw new Error('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
                }

                if (authError.message?.includes('Failed to fetch')) {
                    throw new Error('Erro de conexão com o servidor. Verifique sua internet.');
                }

                throw new Error(authError.message || 'Falha na autenticação. Verifique suas credenciais.');
            }

            if (!authData.user) throw new Error('Usuário não encontrado.');

            // 2. Pass user to App.tsx — role routing is handled there via AuthContext
            onLoginSuccess(authData.user);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ─── FIRST ACCESS: CHECK HUBSPOT ────────────────────────────────

    const handleCheckFirstAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetState();

        try {
            const { data, error } = await supabase.functions.invoke('login-socio', {
                body: { email }
            });

            if (error) {
                console.error('Edge Function Error:', error);
                throw new Error('Erro ao validar cadastro. Tente novamente.');
            }

            if (data?.valid) {
                setProfileData(data.profile);
                setSuccessMsg('Email localizado! Defina sua senha de acesso.');
                setView('CREATE_PASSWORD');
            } else {
                const message = data?.message || 'Cadastro não encontrado ou etapa de pagamento pendente.';
                setError(message);
            }

        } catch (err: unknown) {
            console.error('First Access Validation Error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar cadastro. Entre em contato com o suporte.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ─── CREATE PASSWORD + AUTO-LOGIN ───────────────────────────────

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);
        resetState();

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: profileData?.fullName || email,
                        job_title: profileData?.jobTitle || '',
                        company: profileData?.company || '',
                        phone: profileData?.phone || ''
                    }
                }
            });

            if (error) {
                console.error('Supabase SignUp Error:', error);

                if (error.status === 429 || error.message?.includes('rate limit')) {
                    throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
                }

                if (error.message?.includes('User already registered')) {
                    throw new Error('Este email já está cadastrado. Use a opção "Login" com sua senha.');
                }

                if (error.message?.includes('Failed to fetch')) {
                    throw new Error('Erro de conexão com o servidor. Verifique sua internet.');
                }

                throw new Error(error.message || 'Erro ao criar conta. Tente novamente.');
            }

            // Account created — auto-login
            setSuccessMsg('Conta ativada com sucesso! Entrando...');

            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError || !loginData.user) {
                // Fallback: use the signUp user if auto-login fails
                if (data.user) {
                    setTimeout(() => {
                        onLoginSuccess(data.user!);
                        onClose();
                    }, 1500);
                } else {
                    throw new Error('Conta criada, mas houve um erro ao entrar. Faça login normalmente.');
                }
            } else {
                // Auto-login succeeded
                setTimeout(() => {
                    onLoginSuccess(loginData.user);
                    onClose();
                }, 1500);
            }

        } catch (err: unknown) {
            console.error('Signup error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ─── RENDER ─────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
                {/* Close button — only visible on non-primary views */}
                {view !== 'LOGIN' && (
                    <button
                        onClick={() => {
                            if (view === 'LOGIN_PASSWORD' || view === 'CHECK_EMAIL') {
                                setView('LOGIN');
                                resetState();
                            } else if (view === 'FORGOT_PASSWORD') {
                                setView('LOGIN_PASSWORD');
                                resetState();
                                setResetEmailSent(false);
                            } else if (view === 'CREATE_PASSWORD') {
                                setView('CHECK_EMAIL');
                                resetState();
                            }
                        }}
                        className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* HEADER */}
                <div className="text-center mb-8">
                    <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus Logo" className="h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">
                        {getViewTitle()}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {getViewSubtitle()}
                    </p>
                </div>

                {/* ALERTS */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
                        <CheckCircle size={16} className="shrink-0" />
                        {successMsg}
                    </div>
                )}

                {/* ═══════════════ VIEW: LOGIN (email-first) ═══════════════ */}
                {view === 'LOGIN' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in fade-in duration-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                            <input
                                type="email"
                                required
                                autoFocus
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Verificando...' : (
                                <>
                                    Continuar
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </Button>

                        <div className="mt-6 text-center">
                            <span className="text-slate-500 text-sm">Primeiro Acesso? </span>
                            <button
                                type="button"
                                onClick={() => { setView('CHECK_EMAIL'); resetState(); }}
                                className="text-yellow-600 hover:text-yellow-400 text-sm font-medium transition-colors"
                            >
                                Ative sua conta →
                            </button>
                        </div>
                    </form>
                )}

                {/* ═══════════════ VIEW: LOGIN_PASSWORD ═══════════════ */}
                {view === 'LOGIN_PASSWORD' && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Email chip */}
                        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 mb-1">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                <span className="text-sm text-slate-300">{email}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setView('LOGIN'); resetState(); }}
                                className="text-xs text-yellow-600 hover:text-yellow-400 transition-colors font-medium"
                            >
                                Trocar
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                    placeholder="••••••••"
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

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full rounded-xl py-3.5"
                        >
                            {loading ? 'Verificando...' : 'Entrar na Plataforma'}
                        </Button>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => { setView('FORGOT_PASSWORD'); resetState(); setResetEmailSent(false); }}
                                className="text-yellow-600/70 hover:text-yellow-400 text-sm transition-colors"
                            >
                                Esqueci minha senha
                            </button>
                        </div>
                    </form>
                )}

                {/* ═══════════════ VIEW: CHECK_EMAIL (HubSpot) ═══════════════ */}
                {view === 'CHECK_EMAIL' && (
                    <form onSubmit={handleCheckFirstAccess} className="space-y-4 animate-in fade-in duration-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Cadastrado (HubSpot)</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                placeholder="ex: carlos@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full rounded-xl py-3.5"
                        >
                            {loading ? 'Buscando...' : 'Verificar Cadastro'}
                        </Button>
                    </form>
                )}

                {/* ═══════════════ VIEW: FORGOT_PASSWORD ═══════════════ */}
                {view === 'FORGOT_PASSWORD' && (
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        resetState();
                        const result = await resetPassword(email);
                        setLoading(false);
                        if (result.success) {
                            setResetEmailSent(true);
                            setSuccessMsg('Link enviado! Verifique sua caixa de entrada e spam.');
                        } else {
                            setError(result.error || 'Erro ao enviar email.');
                        }
                    }} className="space-y-4 animate-in fade-in duration-200">
                        {!resetEmailSent ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Cadastrado</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    isLoading={loading}
                                    className="w-full rounded-xl py-3.5"
                                >
                                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <Mail size={40} className="mx-auto text-yellow-500 mb-3" />
                                <p className="text-slate-300 text-sm">Verifique o email <span className="font-bold text-white">{email}</span></p>
                                <p className="text-slate-500 text-xs mt-2">Não recebeu? Cheque a pasta de spam ou tente novamente.</p>
                            </div>
                        )}
                    </form>
                )}

                {/* ═══════════════ VIEW: CREATE_PASSWORD ═══════════════ */}
                {view === 'CREATE_PASSWORD' && (
                    <form onSubmit={handleCreatePassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-3 bg-slate-800 rounded-xl text-xs text-slate-300 mb-4 border border-slate-700">
                            Olá! Localizamos seu cadastro. Defina sua senha pessoal para acessar o clube.
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
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
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirmar Senha</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                    placeholder="Repita a senha"
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

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full rounded-xl py-3.5 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                        >
                            {loading ? 'Ativando...' : 'Ativar Minha Conta'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
