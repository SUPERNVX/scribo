// Custom hook for managing AI models
import { useState, useEffect, useCallback } from 'react';

import { apiService } from '../services/api';
import { AI_MODELS } from '../constants';

/**
 * Custom hook for managing AI models
 */
export const useModels = () => {
  const [models, setModels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS.DEEPSEEK);

  /**
   * Load available AI models from API
   */
  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getModels();
      setModels(data);
    } catch (err) {
      console.error('Error loading models:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar modelos');
      // Fallback to default models
      setModels({
        [AI_MODELS.DEEPSEEK]: { name: 'DeepSeek', available: true },
        [AI_MODELS.GPT4]: { name: 'GPT-4', available: false },
        [AI_MODELS.CLAUDE]: { name: 'Claude', available: false },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select an AI model
   */
  const selectModel = useCallback(
    modelKey => {
      if (models[modelKey]?.available) {
        setSelectedModel(modelKey);
        return true;
      }
      return false;
    },
    [models]
  );

  /**
   * Get available models list
   */
  const getAvailableModels = useCallback(() => {
    return Object.entries(models)
      .filter(([_, model]) => model.available)
      .map(([key, model]) => ({ key, ...model }));
  }, [models]);

  /**
   * Check if a model is available
   */
  const isModelAvailable = useCallback(
    modelKey => {
      return models[modelKey]?.available || false;
    },
    [models]
  );

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    loading,
    error,
    selectedModel,
    loadModels,
    selectModel,
    getAvailableModels,
    isModelAvailable,
    refetch: loadModels,
  };
};

export default useModels;
