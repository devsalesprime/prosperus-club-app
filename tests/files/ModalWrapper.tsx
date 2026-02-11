/**
 * ModalWrapper Component - Modal universal iOS-proof
 * 
 * Features:
 * - Bloqueio automático de scroll do body
 * - Scroll próprio funcional dentro do modal
 * - Click fora para fechar
 * - Tecla ESC para fechar
 * - Animações suaves
 * - Safe areas do iPhone
 * - Acessibilidade (ARIA)
 * 
 * @version 2.0.0
 * @compatível iOS 13+, Android, Desktop
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

interface ModalWrapperProps {
  /** Controla visibilidade do modal */
  isOpen: boolean;
  /** Callback ao fechar modal */
  onClose: () => void;
  /** Título do modal (opcional) */
  title?: string;
  /** Conteúdo do modal */
  children: React.ReactNode;
  /** Largura máxima do modal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Se deve mostrar botão X de fechar */
  showCloseButton?: boolean;
  /** Se deve fechar ao clicar fora */
  closeOnOverlayClick?: boolean;
  /** Se deve fechar ao pressionar ESC */
  closeOnEsc?: boolean;
  /** Altura máxima do modal (para controle de scroll) */
  maxHeight?: string;
  /** Classes CSS adicionais para o container do modal */
  className?: string;
  /** ID único do modal (para múltiplos modais) */
  modalId?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full mx-4'
};

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  maxHeight = '85vh',
  className = '',
  modalId = 'modal-wrapper'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Hook de bloqueio de scroll
  useScrollLock({ 
    enabled: isOpen, 
    modalId,
    allowModalScroll: true 
  });

  // Handler para fechar com ESC
  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEsc) {
      onClose();
    }
  }, [onClose, closeOnEsc]);

  // Handler para click no overlay
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  // Previne scroll propagation dentro do modal (crítico para iOS)
  const handleTouchMove = useCallback((event: TouchEvent) => {
    const target = event.target as HTMLElement;
    const scrollableContent = contentRef.current;
    
    if (!scrollableContent) return;

    // Se o toque está dentro do conteúdo scrollável
    if (scrollableContent.contains(target)) {
      const isScrollable = scrollableContent.scrollHeight > scrollableContent.clientHeight;
      
      if (!isScrollable) {
        // Não há scroll, bloqueia o touch
        event.preventDefault();
      } else {
        // Há scroll, mas previne bounce nas extremidades (iOS)
        const { scrollTop, scrollHeight, clientHeight } = scrollableContent;
        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight;

        // Detecta direção do scroll
        const touchY = event.touches[0].clientY;
        const prevTouchY = (event as any).prevTouchY || touchY;
        const isScrollingDown = touchY < prevTouchY;
        const isScrollingUp = touchY > prevTouchY;
        (event as any).prevTouchY = touchY;

        // Previne bounce no topo e no fundo
        if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
          event.preventDefault();
        }
      }
    } else {
      // Toque fora do conteúdo, bloqueia tudo
      event.preventDefault();
    }
  }, []);

  // Listeners de eventos
  useEffect(() => {
    if (!isOpen) return;

    // ESC key listener
    document.addEventListener('keydown', handleEscKey);

    // Touch move listener (iOS)
    const modalElement = modalRef.current;
    if (modalElement) {
      modalElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    // Focus trap - foca no modal ao abrir
    if (contentRef.current) {
      contentRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      if (modalElement) {
        modalElement.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isOpen, handleEscKey, handleTouchMove]);

  // Não renderiza se não estiver aberto
  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${modalId}-title` : undefined}
      style={{
        // Garante que o overlay cubra toda a tela incluindo safe areas do iOS
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div
        ref={contentRef}
        className={`
          relative bg-white rounded-lg shadow-xl w-full
          ${maxWidthClasses[maxWidth]}
          ${className}
          transform transition-all duration-300 ease-out
          animate-in fade-in slide-in-from-bottom-4
        `}
        style={{
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            {title && (
              <h2 
                id={`${modalId}-title`}
                className="text-xl font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-auto"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content - Área scrollável */}
        <div 
          className="overflow-y-auto overflow-x-hidden flex-1"
          style={{
            // Força scroll suave no iOS
            WebkitOverflowScrolling: 'touch',
            // Previne bounce scroll (iOS)
            overscrollBehavior: 'contain',
          }}
        >
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
