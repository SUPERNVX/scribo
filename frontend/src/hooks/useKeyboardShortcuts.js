// Keyboard Shortcuts Hook for fluid interactions
import { useEffect, useCallback } from 'react';

/**
 * useKeyboardShortcuts Hook
 * Gerencia atalhos de teclado úteis para melhorar a experiência
 */
export const useKeyboardShortcuts = (shortcuts = {}) => {
  const handleKeyDown = useCallback(
    event => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      // Criar chave do atalho
      let shortcutKey = '';
      if (isModifierPressed) shortcutKey += 'ctrl+';
      if (shiftKey) shortcutKey += 'shift+';
      if (altKey) shortcutKey += 'alt+';
      shortcutKey += key.toLowerCase();

      // Executar ação se atalho existir
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey](event);
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
};

/**
 * useGlobalShortcuts Hook
 * Atalhos globais comuns para a aplicação
 */
export const useGlobalShortcuts = (options = {}) => {
  const { onSave, onUndo, onRedo, onSearch, onNew, onHelp, onEscape } = options;

  const shortcuts = {
    // Salvar
    'ctrl+s': onSave,

    // Desfazer/Refazer
    'ctrl+z': onUndo,
    'ctrl+shift+z': onRedo,
    'ctrl+y': onRedo,

    // Buscar
    'ctrl+f': onSearch,
    'ctrl+k': onSearch,

    // Novo
    'ctrl+n': onNew,

    // Ajuda
    f1: onHelp,
    'ctrl+shift+?': onHelp,

    // Escape
    escape: onEscape,
  };

  useKeyboardShortcuts(shortcuts);

  return {
    shortcuts: Object.keys(shortcuts).filter(key => shortcuts[key]),
  };
};

/**
 * useEditorShortcuts Hook
 * Atalhos específicos para editores de texto
 */
export const useEditorShortcuts = (textareaRef, options = {}) => {
  const { onSave, onUndo, onRedo, onBold, onItalic, onSelectAll } = options;

  const shortcuts = {
    'ctrl+s': onSave,
    'ctrl+z': onUndo,
    'ctrl+shift+z': onRedo,
    'ctrl+y': onRedo,
    'ctrl+b': onBold,
    'ctrl+i': onItalic,
    'ctrl+a': onSelectAll,
  };

  useKeyboardShortcuts(shortcuts);

  // Função para inserir texto na posição do cursor
  const insertTextAtCursor = useCallback(
    (text, selectText = false) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const newValue = value.substring(0, start) + text + value.substring(end);
      textarea.value = newValue;

      // Disparar evento de mudança
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      // Posicionar cursor
      if (selectText) {
        textarea.setSelectionRange(start, start + text.length);
      } else {
        textarea.setSelectionRange(start + text.length, start + text.length);
      }

      textarea.focus();
    },
    [textareaRef]
  );

  return {
    insertTextAtCursor,
    shortcuts: Object.keys(shortcuts).filter(key => shortcuts[key]),
  };
};

export default {
  useKeyboardShortcuts,
  useGlobalShortcuts,
  useEditorShortcuts,
};
