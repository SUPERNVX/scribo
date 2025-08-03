// Keyboard Navigation Hook for accessibility
import { useEffect, useCallback } from 'react';

/**
 * useKeyboardNavigation Hook
 * Gerencia navegação por teclado sem alterar estilos
 */
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    trapFocus = false,
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  } = options;

  const handleKeyDown = useCallback(
    event => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape(event);
          }
          break;

        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter(event);
          }
          break;

        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp(event);
          }
          break;

        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown(event);
          }
          break;

        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft(event);
          }
          break;

        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight(event);
          }
          break;

        case 'Tab':
          if (onTab) {
            onTab(event);
          }
          if (trapFocus) {
            handleFocusTrap(event);
          }
          break;
      }
    },
    [
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      trapFocus,
    ]
  );

  const handleFocusTrap = useCallback(
    event => {
      const focusableElements = document.querySelectorAll(focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [focusableSelector]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
};

/**
 * useFocusManagement Hook
 * Gerencia foco para modais e componentes
 */
export const useFocusManagement = (isOpen = false, restoreFocus = true) => {
  const previousActiveElement = useRef();

  useEffect(() => {
    if (isOpen) {
      // Salvar elemento ativo atual
      previousActiveElement.current = document.activeElement;

      // Focar no primeiro elemento focável do modal
      setTimeout(() => {
        const firstFocusable = document.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }, 100);
    } else if (restoreFocus && previousActiveElement.current) {
      // Restaurar foco ao fechar
      previousActiveElement.current.focus();
    }
  }, [isOpen, restoreFocus]);

  return {
    previousActiveElement: previousActiveElement.current,
  };
};

/**
 * useSkipNavigation Hook
 * Skip links para navegação rápida
 */
export const useSkipNavigation = () => {
  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector(
      'main, #main-content, [role="main"]'
    );
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.querySelector('nav, [role="navigation"]');
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    skipToContent,
    skipToNavigation,
  };
};

export default {
  useKeyboardNavigation,
  useFocusManagement,
  useSkipNavigation,
};
