// ModalWrapper.tsx
// Componente container reutilizável para modais
// Padroniza backdrop, posicionamento, animação e scroll
// iOS-proof: uses useScrollLock for position:fixed body lock

import React, { useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    className?: string;
    modalId?: string;
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
};

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
    isOpen,
    onClose,
    children,
    maxWidth = 'lg',
    className = '',
    modalId = 'modal-wrapper'
}) => {
    // iOS-proof scroll lock (position: fixed + scroll position save/restore)
    useScrollLock({ enabled: isOpen, modalId });

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                // Fechar ao clicar no backdrop
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Container */}
            <div
                className={`
                    relative w-full ${maxWidthClasses[maxWidth]}
                    bg-slate-950 border border-slate-800 
                    rounded-2xl shadow-2xl
                    max-h-[90vh] overflow-hidden
                    flex flex-col
                    animate-in zoom-in-95 duration-200
                    ${className}
                `}
            >
                {children}
            </div>
        </div>
    );
};

// Componente para o corpo do modal com scroll
interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
    children,
    className = '',
    noPadding = false
}) => {
    return (
        <div
            className={`
                flex-1 overflow-y-auto
                ${noPadding ? '' : 'p-6'}
                ${className}
            `}
            style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
            }}
        >
            {children}
        </div>
    );
};

// Componente para o rodapé do modal (ações)
interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
    children,
    className = ''
}) => {
    return (
        <div
            className={`
                p-6 border-t border-slate-800
                flex items-center gap-3
                ${className}
            `}
        >
            {children}
        </div>
    );
};
