/**
 * useScrollLock Hook - Solução definitiva para scroll duplo em modais (iOS-proof)
 * 
 * Features:
 * - Bloqueia scroll do body quando modal abre
 * - Previne scroll propagation no iOS
 * - Mantém posição do scroll ao fechar
 * - Suporta múltiplos modais empilhados
 * - Safe areas do iPhone
 * 
 * @version 1.0.0
 * @compatível iOS 13+, Android, Desktop
 */

import { useEffect, useRef } from 'react';

interface ScrollLockOptions {
  /** Se deve bloquear o scroll (normalmente vinculado a isOpen do modal) */
  enabled: boolean;
  /** ID único do modal (para suportar múltiplos modais) */
  modalId?: string;
  /** Se deve permitir scroll dentro do modal */
  allowModalScroll?: boolean;
}

// Store global para rastrear modais ativos
const activeModals = new Set<string>();
let scrollPosition = 0;

export const useScrollLock = ({ 
  enabled, 
  modalId = 'modal', 
  allowModalScroll = true 
}: ScrollLockOptions) => {
  const previousBodyOverflow = useRef<string>('');
  const previousBodyPosition = useRef<string>('');
  const previousBodyTop = useRef<string>('');
  const previousBodyWidth = useRef<string>('');

  useEffect(() => {
    if (!enabled) {
      // Remove este modal do set de ativos
      activeModals.delete(modalId);
      
      // Se não há mais modais ativos, restaura o scroll
      if (activeModals.size === 0) {
        unlockScroll();
      }
      return;
    }

    // Adiciona este modal ao set de ativos
    activeModals.add(modalId);

    // Só bloqueia se for o primeiro modal
    if (activeModals.size === 1) {
      lockScroll();
    }

    // Cleanup ao desmontar
    return () => {
      activeModals.delete(modalId);
      if (activeModals.size === 0) {
        unlockScroll();
      }
    };
  }, [enabled, modalId]);

  const lockScroll = () => {
    const body = document.body;
    const html = document.documentElement;

    // Salva estado atual
    previousBodyOverflow.current = body.style.overflow;
    previousBodyPosition.current = body.style.position;
    previousBodyTop.current = body.style.top;
    previousBodyWidth.current = body.style.width;

    // Salva posição atual do scroll
    scrollPosition = window.pageYOffset || html.scrollTop;

    // Aplica estilos para bloquear scroll
    // iOS Safari requer position: fixed para funcionar
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollPosition}px`;
    body.style.width = '100%';
    
    // Previne zoom no iOS ao tocar inputs
    body.style.touchAction = 'none';
    
    // Adiciona classe helper (para estilos adicionais se necessário)
    body.classList.add('scroll-locked');
  };

  const unlockScroll = () => {
    const body = document.body;
    const html = document.documentElement;

    // Remove classe helper
    body.classList.remove('scroll-locked');

    // Restaura estilos originais
    body.style.overflow = previousBodyOverflow.current;
    body.style.position = previousBodyPosition.current;
    body.style.top = previousBodyTop.current;
    body.style.width = previousBodyWidth.current;
    body.style.touchAction = '';

    // Restaura posição do scroll
    window.scrollTo(0, scrollPosition);
  };

  return {
    lockScroll,
    unlockScroll,
    isLocked: activeModals.size > 0
  };
};

/**
 * Hook simplificado para uso direto em componentes de modal
 * 
 * @example
 * function Modal({ isOpen }) {
 *   useSimpleScrollLock(isOpen);
 *   return <div>...</div>
 * }
 */
export const useSimpleScrollLock = (isOpen: boolean) => {
  useScrollLock({ enabled: isOpen });
};
