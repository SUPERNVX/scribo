// Hook para atalhos globais da aplicação
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook para gerenciar atalhos globais da aplicação
 */
export const useGlobalKeyboardShortcuts = ({ 
  onOpenShortcuts = () => {},
  onOpenFocusMode = () => {},
  isAuthenticated = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback((event) => {
    // Não processar atalhos se estiver digitando em inputs
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.contentEditable === 'true'
    ) {
      // Exceção para alguns atalhos específicos que devem funcionar mesmo em inputs
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        onOpenShortcuts();
        return;
      }
      return;
    }

    const { ctrlKey, altKey, shiftKey, key } = event;

    // Atalho para abrir modal de atalhos (Ctrl + /)
    if (ctrlKey && key === '/') {
      event.preventDefault();
      onOpenShortcuts();
      return;
    }

    // Atalhos de navegação (Alt + tecla)
    if (altKey && !ctrlKey && !shiftKey) {
      switch (key.toLowerCase()) {
        case 'h':
          event.preventDefault();
          navigate('/');
          break;
        case 'd':
          if (isAuthenticated) {
            event.preventDefault();
            navigate('/dashboard');
          }
          break;
        case 'w':
          if (isAuthenticated) {
            event.preventDefault();
            navigate('/write');
          }
          break;
        case 'r':
          if (isAuthenticated) {
            event.preventDefault();
            navigate('/ranking');
          }
          break;
        case 'a':
          if (isAuthenticated) {
            event.preventDefault();
            navigate('/analytics');
          }
          break;
        case '1':
          // Pular para conteúdo principal
          event.preventDefault();
          const mainContent = document.querySelector('main');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        case '2':
          // Pular para navegação
          event.preventDefault();
          const navigation = document.querySelector('nav');
          if (navigation) {
            navigation.focus();
            navigation.scrollIntoView({ behavior: 'smooth' });
          }
          break;
      }
    }

    // Atalho para modo foco (Alt + F) - apenas na página de escrita
    if (altKey && !ctrlKey && !shiftKey && key === 'f' && location.pathname === '/write') {
      event.preventDefault();
      onOpenFocusMode();
      return;
    }

    // Atalho para ajuda (F1)
    if (key === 'F1') {
      event.preventDefault();
      onOpenShortcuts();
      return;
    }

    // Atalho para escape - fechar modais
    if (key === 'Escape') {
      // Deixar que os componentes individuais lidem com o escape
      // Este é apenas um fallback
      const modals = document.querySelectorAll('[role="dialog"], .modal, .dropdown');
      if (modals.length > 0) {
        // Fechar o último modal aberto
        const lastModal = modals[modals.length - 1];
        const closeButton = lastModal.querySelector('[aria-label="Close"], [title*="Fechar"], button[aria-label*="fechar"]');
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  }, [navigate, location.pathname, onOpenShortcuts, onOpenFocusMode, isAuthenticated]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // Retorna funções utilitárias se necessário
    navigate,
    currentPath: location.pathname,
  };
};

export default useGlobalKeyboardShortcuts;