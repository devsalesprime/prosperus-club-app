// ============================================
// ERROR RETRY — Fallback elegante com retry
// ============================================

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { COPY } from '../../utils/copy';

interface ErrorRetryProps {
    message?: string;
    onRetry: () => void;
    fullHeight?: boolean;
}

export const ErrorRetry: React.FC<ErrorRetryProps> = ({
    message,
    onRetry,
    fullHeight = false
}) => (
    <button
        onClick={onRetry}
        className={`w-full text-center ${fullHeight ? 'flex flex-col items-center justify-center py-20' : 'py-8'}`}
    >
        <div className="flex flex-col items-center gap-2">
            <RefreshCw size={20} className="text-slate-600" />
            <p className="text-sm text-slate-500">
                {message || COPY.errors.load}
            </p>
            <span className="text-xs text-yellow-500 font-medium">
                Toque para tentar novamente
            </span>
        </div>
    </button>
);

export default ErrorRetry;
