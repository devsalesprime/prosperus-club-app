// ModalWrapper.tsx
// Componente container reutilizável para modais
// Padroniza backdrop, posicionamento, animação e scroll
// iOS-proof: useScrollLock + touchmove prevention

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // iOS-proof scroll lock
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

    // iOS touchmove prevention: only blocks scroll on the BACKDROP overlay.
    // Content inside the modal scrolls freely — body overflow:hidden already
    // prevents bleed-through. Previous approach tracked scroll edges but
    // caused false positives during iOS momentum scrolling.
    const handleTouchMove = useCallback((e: TouchEvent) => {
        const target = e.target as HTMLElement;
        const content = contentRef.current;

        if (!content) return;

        // Touch is OUTSIDE the modal content (on overlay backdrop) — block it
        if (!content.contains(target)) {
            e.preventDefault();
        }
        // Touch is INSIDE the modal — let it scroll naturally
        // No edge detection, no __lastTouchY tracking — iOS handles it
    }, []);

    // Attach touchmove listener with { passive: false } (required for preventDefault)
    useEffect(() => {
        if (!isOpen) return;
        const overlay = overlayRef.current;
        if (!overlay) return;

        overlay.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            overlay.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isOpen, handleTouchMove]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Container */}
            <div
                ref={contentRef}
                className={`
                    relative w-full ${maxWidthClasses[maxWidth]}
                    bg-slate-950 border border-slate-800 
                    rounded-2xl shadow-2xl
                    max-h-[90dvh] overflow-hidden
                    flex flex-col
                    animate-in zoom-in-95 duration-200
                    ${className}
                `}
            >
                {children}
            </div>
        </div>,
        document.body
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
