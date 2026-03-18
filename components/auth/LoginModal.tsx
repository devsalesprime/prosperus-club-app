import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, CheckCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

// ── State machine for the login flow ──────────────────────────
type LoginStep =
    | 'idle'           // Email empty or not yet validated
    | 'checking'       // Debounce fired, verifying email
    | 'password'       // Known user with password → login
    | 'first-access'   // HubSpot user, no password yet → create
    | 'not-found'      // Email not in profiles AND not in HubSpot
    | 'forgot';        // Password recovery view

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEBOUNCE_MS = 600;

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const { resetPassword } = useAuth();

    // ── Form state ────────────────────────────────────────────
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<LoginStep>('idle');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [profileData, setProfileData] = useState<{
        fullName?: string; jobTitle?: string; company?: string; phone?: string;
    } | null>(null);

    // ── Refs ──────────────────────────────────────────────────
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const lastChecked = useRef('');
    const passwordRef = useRef<HTMLInputElement>(null);

    // Cleanup debounce on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    if (!isOpen) return null;

    // ── Auto-check email (debounced) ──────────────────────────
    const checkEmail = async (value: string) => {
        if (!EMAIL_REGEX.test(value)) return;
        if (value === lastChecked.current) return;
        lastChecked.current = value;

        setStep('checking');
        setError(null);

        try {
            // 1. Fast check: profiles + auth.users
            const { data, error: fnError } = await supabase.functions.invoke(
                'check-email-exists',
                { body: { email: value.toLowerCase().trim() } }
            );

            if (fnError) throw fnError;

            if (data?.exists) {
                // User found in profiles
                // has_password defaults to true for backward compatibility
                // (old edge function returns only { exists } without has_password)
                const hasPassword = data.has_password !== false;

                if (hasPassword) {
                    // Known user with password → show password field
                    setStep('password');
                    setTimeout(() => passwordRef.current?.focus(), 280);
                } else {
                    // Profile exists but no password (rare edge case)
                    setStep('first-access');
                    setTimeout(() => passwordRef.current?.focus(), 280);
                }
            } else {
                // Not in profiles → check HubSpot
                await checkHubSpot(value);
            }
        } catch {
            setStep('idle');
            setError('Não foi possível verificar. Tente novamente.');
        }
    };

    // ── HubSpot check for first-access users ──────────────────
    const checkHubSpot = async (emailValue: string) => {
        try {
            const { data, error: fnError } = await supabase.functions.invoke(
                'login-socio',
                { body: { email: emailValue.toLowerCase().trim() } }
            );

            if (fnError) throw fnError;

            if (data?.valid) {
                setProfileData(data.profile);
                setStep('first-access');
                setTimeout(() => passwordRef.current?.focus(), 280);
            } else {
                setStep('not-found');
            }
        } catch {
            setStep('not-found');
        }
    };

    // ── Handle email input with debounce ──────────────────────
    const handleEmailChange = (value: string) => {
        setEmail(value);
        setError(null);
        setSuccessMsg(null);

        // Reset if email changed after a check
        if (value !== lastChecked.current) {
            setStep('idle');
            setPassword('');
            setConfirmPassword('');
            setProfileData(null);
        }

        clearTimeout(debounceRef.current);
        if (!EMAIL_REGEX.test(value)) return;

        debounceRef.current = setTimeout(() => checkEmail(value), DEBOUNCE_MS);
    };

    // ── Submit: login or create password ──────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || step === 'idle' || step === 'checking') return;

        setLoading(true);
        setError(null);

        try {
            if (step === 'password') {
                // ── Login with password ───────────────────
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: email.toLowerCase().trim(),
                    password,
                });

                if (authError) {
                    if (authError.message?.includes('Invalid login credentials')) {
                        throw new Error('Senha incorreta. Tente novamente.');
                    }
                    if (authError.status === 429 || authError.message?.includes('rate limit')) {
                        throw new Error('Muitas tentativas. Aguarde alguns minutos.');
                    }
                    if (authError.message?.includes('Failed to fetch')) {
                        throw new Error('Erro de conexão. Verifique sua internet.');
                    }
                    throw new Error(authError.message || 'Falha na autenticação.');
                }

                if (!authData.user) throw new Error('Usuário não encontrado.');
                onLoginSuccess(authData.user);

            } else if (step === 'first-access') {
                // ── Create password + auto-login ──────────
                if (password.length < 6) {
                    throw new Error('Senha deve ter pelo menos 6 caracteres.');
                }
                if (password !== confirmPassword) {
                    throw new Error('As senhas não coincidem.');
                }

                const normalizedEmail = email.toLowerCase().trim();

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password,
                    options: {
                        data: {
                            full_name: profileData?.fullName || normalizedEmail,
                            job_title: profileData?.jobTitle || '',
                            company: profileData?.company || '',
                            phone: profileData?.phone || '',
                        },
                    },
                });

                if (signUpError) {
                    if (signUpError.status === 429) {
                        throw new Error('Muitas tentativas. Aguarde alguns minutos.');
                    }
                    if (signUpError.message?.includes('User already registered')) {
                        throw new Error('Este email já está cadastrado. Tente fazer login com senha.');
                    }
                    throw new Error(signUpError.message || 'Erro ao ativar conta.');
                }

                setSuccessMsg('Conta ativada! Entrando...');

                // Auto-login after signup
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password,
                });

                if (loginError || !loginData.user) {
                    if (signUpData.user) {
                        setTimeout(() => { onLoginSuccess(signUpData.user!); onClose(); }, 1500);
                    } else {
                        throw new Error('Conta criada, mas erro ao entrar. Faça login normalmente.');
                    }
                } else {
                    setTimeout(() => { onLoginSuccess(loginData.user); onClose(); }, 1500);
                }
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro inesperado.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot password ───────────────────────────────────────
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await resetPassword(email);
        setLoading(false);
        if (result.success) {
            setResetEmailSent(true);
            setSuccessMsg('Link enviado! Verifique sua caixa de entrada e spam.');
        } else {
            setError(result.error || 'Erro ao enviar email.');
        }
    };

    // ── UI Helpers ────────────────────────────────────────────
    const showPasswordFields = step === 'password' || step === 'first-access';
    const title = step === 'first-access'
        ? 'Bem-vindo ao clube!'
        : step === 'forgot'
            ? 'Recuperar Senha'
            : 'Acesse sua conta';
    const subtitle = step === 'first-access'
        ? 'Crie sua senha para ativar o acesso.'
        : step === 'forgot'
            ? 'Enviaremos um link para redefinir sua senha.'
            : 'Digite seu email para continuar.';

    // ── RENDER ────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">

                {/* Back button for forgot password view */}
                {step === 'forgot' && (
                    <button
                        onClick={() => { setStep('password'); setError(null); setSuccessMsg(null); setResetEmailSent(false); }}
                        className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        ← Voltar
                    </button>
                )}

                {/* ── HEADER ────────────────────────────────── */}
                <div className="text-center mb-8">
                    <img
                        src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg"
                        alt="Prosperus Logo"
                        className="h-12 mx-auto mb-4"
                    />
                    <p className="text-slate-400 text-sm mb-3">Bem-vindo ao aplicativo do Prosperus Club.</p>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
                </div>

                {/* ── ALERTS ────────────────────────────────── */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4 flex items-center gap-2 animate-in fade-in duration-150">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl mb-4 flex items-center gap-2 animate-in fade-in duration-150">
                        <CheckCircle size={16} className="shrink-0" />
                        {successMsg}
                    </div>
                )}

                {/* ═══════════ FORGOT PASSWORD VIEW ═══════════ */}
                {step === 'forgot' ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in duration-200">
                        {!resetEmailSent ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
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
                                <p className="text-slate-300 text-sm">
                                    Verifique o email <span className="font-bold text-white">{email}</span>
                                </p>
                                <p className="text-slate-500 text-xs mt-2">
                                    Não recebeu? Cheque a pasta de spam ou tente novamente.
                                </p>
                            </div>
                        )}
                    </form>
                ) : (
                    /* ═══════════ MAIN LOGIN FLOW ═══════════ */
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                        {/* ── Email input with status indicator ── */}
                        <div className="relative">
                            <input
                                type="email"
                                inputMode="email"
                                value={email}
                                onChange={e => handleEmailChange(e.target.value)}
                                placeholder="seu@email.com"
                                autoComplete="email"
                                autoFocus
                                className={`
                                    w-full bg-slate-950 rounded-xl px-4 py-3.5 pr-10
                                    text-white placeholder-slate-600
                                    focus:outline-none transition-all
                                    border ${step === 'not-found'
                                        ? 'border-red-500/50'
                                        : showPasswordFields
                                            ? 'border-emerald-500/50'
                                            : 'border-slate-800 focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30'}
                                `}
                            />

                            {/* Status indicator: spinner / check / x */}
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                                {step === 'checking' && (
                                    <div className="w-4 h-4 border-2 border-yellow-600/60 border-t-yellow-500 rounded-full animate-spin" />
                                )}
                                {showPasswordFields && (
                                    <span className="text-emerald-400 text-base leading-none">✓</span>
                                )}
                                {step === 'not-found' && (
                                    <span className="text-red-400 text-base leading-none">✕</span>
                                )}
                            </div>
                        </div>

                        {/* ── Password fields: animated slide + fade ── */}
                        <div
                            className="flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-out"
                            style={{
                                maxHeight: showPasswordFields ? '300px' : '0px',
                                opacity: showPasswordFields ? 1 : 0,
                                transform: showPasswordFields ? 'translateY(0)' : 'translateY(-8px)',
                            }}
                        >
                            {/* Password input */}
                            <div className="relative">
                                <input
                                    ref={passwordRef}
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={step === 'first-access' ? 'Criar senha (mín. 6 caracteres)' : 'Sua senha'}
                                    autoComplete={step === 'first-access' ? 'new-password' : 'current-password'}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Confirm password: first-access only */}
                            {step === 'first-access' && (
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmar senha"
                                        autoComplete="new-password"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/30 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            )}

                            {/* Forgot password link: login only */}
                            {step === 'password' && (
                                <button
                                    type="button"
                                    onClick={() => { setStep('forgot'); setError(null); setSuccessMsg(null); setResetEmailSent(false); }}
                                    className="text-xs text-yellow-600/70 text-right hover:text-yellow-400 transition-colors -mt-1"
                                >
                                    Esqueci minha senha
                                </button>
                            )}
                        </div>

                        {/* ── Not found message ────────────────── */}
                        {step === 'not-found' && (
                            <div className="text-center py-3 animate-in fade-in duration-200">
                                <p className="text-sm text-red-400 mb-2">
                                    Email não encontrado no clube.
                                </p>
                                <a
                                    href="https://wa.me/5511918236211"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-yellow-600/70 underline underline-offset-2 hover:text-yellow-400 transition-colors"
                                >
                                    Falar com o suporte
                                </a>
                            </div>
                        )}

                        {/* ── Submit button ─────────────────────── */}
                        {showPasswordFields && (
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                isLoading={loading}
                                disabled={loading || !password || (step === 'first-access' && !confirmPassword)}
                                className={`w-full rounded-xl py-3.5 mt-1 animate-in slide-in-from-bottom-2 duration-300 ${step === 'first-access'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
                                    : ''
                                    }`}
                            >
                                {loading
                                    ? 'Aguarde...'
                                    : step === 'first-access'
                                        ? 'Ativar Minha Conta'
                                        : 'Entrar'}
                            </Button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};
