// ============================================
// ERROR BOUNDARY — Generic React Error Boundary
// ============================================
// Catches unhandled JS errors in React component trees.
// Prevents white-screen-of-death by showing an elegant fallback UI.
//
// ⚡ ChunkLoadError: após deploy, chunks antigos ficam inacessíveis.
//    Detectamos isso e recarregamos automaticamente (uma única vez).
//
// 🛰 Sentry (ADR-014): erros não-ChunkLoadError são reportados via
//    Sentry.captureException com `react.componentStack` como contexto.
//    Decisão de design: mantemos este boundary próprio (em vez do
//    Sentry.ErrorBoundary nativo) para preservar o auto-reload de
//    ChunkLoadError, que é UX crítica em deploys frequentes.
//
// Usage: <ErrorBoundary><YourComponent /></ErrorBoundary>

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sentry } from '../../lib/sentry';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    /** Optional fallback component override */
    fallback?: React.ReactNode;
    /** Module name for better error messages */
    moduleName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    isChunkError: boolean;
}

/** Detecta se o erro é um stale-chunk após deploy */
function isChunkLoadError(error: Error): boolean {
    const msg = error.message || '';
    return (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('ChunkLoadError') ||
        error.name === 'ChunkLoadError'
    );
}

const CHUNK_RELOAD_KEY = 'prosperus_chunk_reload_attempted';

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, isChunkError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, isChunkError: isChunkLoadError(error) };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Caught error:', error.message, errorInfo.componentStack);

        // ── Auto-reload para chunk errors (nova versão deployada) ──────────
        if (isChunkLoadError(error)) {
            const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_KEY);
            if (!alreadyAttempted) {
                sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
                // Pequeno delay para a UI ser rendererizada antes de recarregar
                setTimeout(() => window.location.reload(), 300);
                return;
            }
            // Se já tentou recarregar, mostra UI para o usuário agir.
            // Reportamos ao Sentry como warning (UX recuperável, mas indica
            // problema de deploy/cache mais persistente).
            Sentry.captureException(error, {
                level: 'warning',
                tags: { boundary: 'app-root', error_type: 'chunk-load' },
                contexts: { react: { componentStack: errorInfo.componentStack ?? '' } },
            });
            return;
        }

        // ── Erros reais: reportar ao Sentry com componentStack ─────────────
        Sentry.captureException(error, {
            level: 'error',
            tags: {
                boundary: 'app-root',
                module: this.props.moduleName ?? 'unknown',
            },
            contexts: { react: { componentStack: errorInfo.componentStack ?? '' } },
        });
    }

    handleRetry = (): void => {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        this.setState({ hasError: false, error: null, isChunkError: false });
    };

    handleReload = (): void => {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        window.location.reload();
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const moduleName = this.props.moduleName || 'módulo';
            const { isChunkError, error } = this.state;

            return (
                <div className="flex items-center justify-center min-h-[300px] p-8 bg-prosperus-azul-profundo">
                    <div className="max-w-md w-full bg-prosperus-bg-box border border-prosperus-stroke rounded-2xl p-8 text-center shadow-xl">
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-red-400" />
                        </div>

                        {/* Title */}
                        <h3 className="font-display text-lg font-bold text-prosperus-text mb-2">
                            {isChunkError ? 'Nova versão disponível' : 'Algo deu errado'}
                        </h3>

                        {/* Description */}
                        <p className="font-sans text-sm text-prosperus-text-off mb-6 leading-relaxed">
                            {isChunkError
                                ? 'O aplicativo foi atualizado. Recarregue para carregar a versão mais recente.'
                                : `Ocorreu um erro inesperado ao carregar o ${moduleName}.`
                            }
                            {!isChunkError && error?.message && (
                                <span className="block mt-2 text-xs text-prosperus-text-off font-mono bg-prosperus-azul-profundo rounded-lg p-2 break-all border border-prosperus-stroke">
                                    {error.message}
                                </span>
                            )}
                        </p>

                        {/* Actions */}
                        <div className="font-sans flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={isChunkError ? this.handleReload : this.handleRetry}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-prosperus-ouro-vivo to-prosperus-ouro-nobre text-prosperus-bg-primary font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 hover:opacity-90 shadow-lg shadow-prosperus-ouro-nobre/20"
                            >
                                <RefreshCw size={16} />
                                {isChunkError ? 'Recarregar Agora' : 'Tentar Novamente'}
                            </button>
                            {!isChunkError && (
                                <button
                                    onClick={this.handleReload}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-prosperus-stroke hover:bg-prosperus-azul-lideranca text-prosperus-text font-medium text-sm rounded-xl transition-all"
                                >
                                    Recarregar Página
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
