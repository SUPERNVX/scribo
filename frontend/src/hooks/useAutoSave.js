// Auto-save Hook for forms and content
import { useEffect, useRef, useCallback } from 'react';

import { useLocalStorage } from './useLocalStorage';

/**
 * useAutoSave Hook
 * Salva automaticamente o conteúdo em intervalos regulares
 */
export const useAutoSave = (data, saveKey, options = {}) => {
  const {
    interval = 30000, // 30 segundos por padrão
    onSave,
    onError,
    enabled = true,
    debounceDelay = 1000, // 1 segundo de debounce
  } = options;

  const [savedData, setSavedData] = useLocalStorage(saveKey, null);
  const timeoutRef = useRef();
  const intervalRef = useRef();
  const lastSaveRef = useRef();

  // Função de salvamento
  const save = useCallback(async () => {
    if (!enabled || !data) return;

    try {
      const dataToSave = {
        content: data,
        timestamp: Date.now(),
        version: '1.0',
      };

      setSavedData(dataToSave);
      lastSaveRef.current = Date.now();

      if (onSave) {
        await onSave(dataToSave);
      }

      console.log('Auto-save successful:', saveKey);
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [data, enabled, saveKey, setSavedData, onSave, onError]);

  // Salvamento com debounce
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceDelay);
  }, [save, debounceDelay]);

  // Salvamento manual
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  // Limpar dados salvos
  const clearSaved = useCallback(() => {
    setSavedData(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [setSavedData]);

  // Restaurar dados salvos
  const restoreSaved = useCallback(() => {
    return savedData?.content || null;
  }, [savedData]);

  // Verificar se há dados salvos
  const hasSavedData = useCallback(() => {
    return savedData && savedData.content && savedData.timestamp;
  }, [savedData]);

  // Obter tempo desde último salvamento
  const getTimeSinceLastSave = useCallback(() => {
    if (!lastSaveRef.current) return null;
    return Date.now() - lastSaveRef.current;
  }, []);

  // Effect para auto-save por mudança de dados
  useEffect(() => {
    if (enabled && data) {
      debouncedSave();
    }
  }, [data, enabled, debouncedSave]);

  // Effect para auto-save por intervalo
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (data) {
        save();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, data, save]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    save: saveNow,
    clearSaved,
    restoreSaved,
    hasSavedData: hasSavedData(),
    savedData,
    timeSinceLastSave: getTimeSinceLastSave(),
    isEnabled: enabled,
  };
};

/**
 * useFormAutoSave Hook
 * Auto-save específico para formulários
 */
export const useFormAutoSave = (formData, formId, options = {}) => {
  const saveKey = `form_autosave_${formId}`;

  const autoSave = useAutoSave(formData, saveKey, {
    interval: 60000, // 1 minuto para formulários
    debounceDelay: 2000, // 2 segundos de debounce
    ...options,
  });

  // Verificar se formulário foi modificado
  const isModified = useCallback(() => {
    const saved = autoSave.restoreSaved();
    if (!saved) return false;

    return JSON.stringify(formData) !== JSON.stringify(saved);
  }, [formData, autoSave]);

  return {
    ...autoSave,
    isModified: isModified(),
  };
};

/**
 * useEssayAutoSave Hook
 * Auto-save específico para redações
 */
export const useEssayAutoSave = (essayContent, themeId, options = {}) => {
  const saveKey = `essay_autosave_${themeId}`;

  return useAutoSave(essayContent, saveKey, {
    interval: 30000, // 30 segundos para redações
    debounceDelay: 1500, // 1.5 segundos de debounce
    ...options,
  });
};

export default {
  useAutoSave,
  useFormAutoSave,
  useEssayAutoSave,
};
