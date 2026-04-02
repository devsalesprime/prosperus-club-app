// ============================================
// ERROR BOUNDARY — Generic React Error Boundary
// ============================================
// Catches unhandled JS errors in React component trees.
// Prevents white-screen-of-death by showing an elegant fallback UI.
// Usage: <ErrorBoundary><YourComponent /></ErrorBoundary>

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log to our logger (production-safe)
        console.error('[ErrorBoundary] Caught error:', error.message, errorInfo.componentStack);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            // Custom fallback override
            if (this.props.fallback) return this.props.fallback;

            const moduleName = this.props.moduleName || 'módulo';

            return (
                <div className="flex items-center justify-center min-h-[300px] p-8">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-red-400" />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white mb-2">
                            Algo deu errado
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            Ocorreu um erro inesperado ao carregar o {moduleName}.
                            {this.state.error?.message && (
                                <span className="block mt-2 text-xs text-slate-500 font-mono bg-slate-800 rounded-lg p-2 break-all">
                                    {this.state.error.message}
                                </span>
                            )}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-yellow-900/20"
                            >
                                <RefreshCw size={16} />
                                Tentar Novamente
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl transition-all"
                            >
                                Recarregar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
