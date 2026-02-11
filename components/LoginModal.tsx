import React, { useState } from 'react';
import { X, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { dataService } from '../services/mockData';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import type { User } from '@supabase/supabase-js';

// Helper function to generate a valid UUID v4
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User, loginMode: 'MEMBER' | 'ADMIN') => void;
}

type ModalView = 'LOGIN' | 'CHECK_EMAIL' | 'CREATE_PASSWORD';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [view, setView] = useState<ModalView>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loginMode, setLoginMode] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
    const [profileData, setProfileData] = useState<{ fullName?: string; jobTitle?: string; company?: string; phone?: string } | null>(null); // Store HubSpot profile data

    // Hardcoded Admin Email (as per requirements)
    const ADMIN_EMAIL = 'admin@salesprime.com.br';

    if (!isOpen) return null;

    const resetState = () => {
        setError(null);
        setSuccessMsg(null);
        setLoading(false);
    };

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

                // Handle specific error cases with user-friendly messages
                if (authError.message?.includes('Email not confirmed')) {
                    throw new Error('Seu email ainda não foi confirmado. Verifique a caixa de entrada (ou spam) do seu email.');
                }

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

            const user = authData.user;

            // Pass the authenticated user directly - App.tsx will handle profile fetching
            // Do NOT override the user.id with mock data!
            onLoginSuccess(user, loginMode);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckFirstAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetState();

        try {
            // Call the Supabase Edge Function to validate against HubSpot
            const { data, error } = await supabase.functions.invoke('login-socio', {
                body: { email }
            });

            if (error) {
                console.error('Edge Function Error:', error);
                throw new Error('Erro ao validar cadastro. Tente novamente.');
            }

            // Check validation result
            if (data?.valid) {
                // Store profile data from HubSpot
                setProfileData(data.profile);
                setSuccessMsg('Email localizado! Defina sua senha de acesso.');
                setView('CREATE_PASSWORD');
            } else {
                // Invalid or payment proof not found
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
            // 1. Update Supabase Auth (Sign Up)
            // In a real "First Access" scenario, the user might not exist in Auth yet, only in DB.
            // So we use signUp. If they exist, it might return error or we use updateUser.
            // For this project context: we assume signUp.

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

            // If real success
            setSuccessMsg('Conta ativada com sucesso! Entrando...');

            setTimeout(() => {
                if (data.user) {
                    // Enrich user object with HubSpot profile data
                    const enrichedUser = {
                        ...data.user,
                        user_metadata: {
                            ...data.user.user_metadata,
                            full_name: profileData?.fullName || data.user.email,
                            job_title: profileData?.jobTitle || '',
                            company: profileData?.company || '',
                            phone: profileData?.phone || ''
                        }
                    };
                    onLoginSuccess(enrichedUser, 'MEMBER');
                    onClose();
                } else {
                    // Sometimes signUp requires email confirmation. 
                    setError('Verifique seu e-mail para confirmar o cadastro antes de entrar.');
                    setView('LOGIN');
                }
            }, 1500);

        } catch (err: unknown) {
            console.error('Signup error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4"
                    title="Fechar"
                >
                    <X size={20} />
                </Button>

                {/* HEADER */}
                <div className="text-center mb-8">
                    <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus Logo" className="h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">
                        {view === 'LOGIN' ? 'Bem-vindo de volta' : view === 'CHECK_EMAIL' ? 'Primeiro Acesso' : 'Criar Senha'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {view === 'LOGIN' ? 'Escolha como deseja acessar' : view === 'CHECK_EMAIL' ? 'Vamos verificar seu cadastro de sócio' : 'Defina uma senha segura para seu acesso'}
                    </p>
                </div>

                {/* ALERTS */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2">
                        <CheckCircle size={16} />
                        {successMsg}
                    </div>
                )}

                {/* VIEW 1: LOGIN - MODE SELECTION */}
                {view === 'LOGIN' && !loginMode && (
                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setLoginMode('MEMBER')}
                            className="w-full rounded-xl py-4"
                        >
                            Entrar como Sócio
                        </Button>
                        <Button
                            variant="danger"
                            size="lg"
                            onClick={() => setLoginMode('ADMIN')}
                            className="w-full rounded-xl py-4 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20"
                        >
                            Entrar como Administrador
                        </Button>
                        <div className="mt-6 text-center">
                            <Button variant="ghost" size="sm" onClick={() => { setView('CHECK_EMAIL'); resetState(); }} className="text-xs">
                                Primeiro Acesso?
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW 1B: LOGIN FORM (after mode selection) */}
                {view === 'LOGIN' && loginMode && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                            <p className="text-xs text-slate-300 text-center">
                                Modo: <span className="font-bold text-{loginMode === 'ADMIN' ? 'red' : 'yellow'}-400">{loginMode === 'ADMIN' ? 'Administrador' : 'Sócio'}</span>
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant={loginMode === 'ADMIN' ? 'danger' : 'primary'}
                            size="lg"
                            isLoading={loading}
                            className={`w-full rounded-xl py-3.5 ${loginMode === 'ADMIN' ? 'bg-red-600 hover:bg-red-500' : ''}`}
                        >
                            {loading ? 'Verificando...' : 'Entrar na Plataforma'}
                        </Button>

                        <div className="mt-6 flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => { setLoginMode(null); resetState(); }} className="text-xs text-yellow-500 hover:text-yellow-400">
                                ← Voltar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs">Esqueceu sua senha?</Button>
                        </div>
                    </form>
                )}

                {/* VIEW 2: CHECK EMAIL */}
                {view === 'CHECK_EMAIL' && (
                    <form onSubmit={handleCheckFirstAccess} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Cadastrado (HubSpot)</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
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

                        <Button variant="ghost" size="md" onClick={() => { setView('LOGIN'); resetState(); }} className="w-full mt-2">
                            <ArrowLeft size={16} /> Voltar para Login
                        </Button>
                    </form>
                )}

                {/* VIEW 3: CREATE PASSWORD */}
                {view === 'CREATE_PASSWORD' && (
                    <form onSubmit={handleCreatePassword} className="space-y-4">
                        <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-300 mb-4 border border-slate-700">
                            Olá! Localizamos seu cadastro. Defina sua senha pessoal para acessar o clube.
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nova Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirmar Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                placeholder="Repita a senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
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

                        <Button variant="ghost" size="md" onClick={() => { setView('LOGIN'); resetState(); }} className="w-full mt-2">
                            Cancelar
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
