// Custom hook for managing essays data
import { useState, useEffect, useCallback } from 'react';

import { apiService } from '../services/api';

/**
 * Custom hook for managing user essays
 * Provides essays data, loading states, and CRUD operations
 */
export const useEssays = () => {
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Load user essays from API
   */
  const loadEssays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMyEssays();
      setEssays(data);
    } catch (err) {
      console.error('Error loading essays:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar redações');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submit new essay
   */
  const submitEssay = useCallback(
    async essayData => {
      try {
        setSubmitting(true);
        setError(null);

        // Transform essay data to match API expectations
        const transformedData = {
          theme_id: essayData.theme?.id || essayData.theme_id,
          theme_title: essayData.theme?.titulo || essayData.theme?.title || essayData.theme_title || 'Tema não especificado',
          content: essayData.content,
          ai_model: essayData.model || essayData.ai_model || 'deepseek'
        };

        console.log('Original essay data:', essayData);
        console.log('Transformed essay data:', transformedData);

        // Create essay
        const newEssay = await apiService.submitEssay(transformedData);

        // Correct essay automatically
        await apiService.correctEssay(newEssay.id, transformedData.ai_model);

        // Reload essays to get updated data
        await loadEssays();

        return { success: true, essay: newEssay };
      } catch (err) {
        console.error('Error submitting essay:', err);
        
        // Handle different types of error responses
        let errorMessage = 'Erro ao enviar redação';
        
        if (err.response?.data) {
          const errorData = err.response.data;
          
          // Handle Pydantic validation errors
          if (Array.isArray(errorData.detail)) {
            const validationErrors = errorData.detail.map(error => {
              if (typeof error === 'object' && error.msg) {
                return `${error.loc ? error.loc.join('.') + ': ' : ''}${error.msg}`;
              }
              return String(error);
            });
            errorMessage = `Erro de validação: ${validationErrors.join(', ')}`;
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
        
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setSubmitting(false);
      }
    },
    [loadEssays]
  );

  /**
   * Delete essay
   */
  const deleteEssay = useCallback(async essayId => {
    try {
      await apiService.deleteEssay(essayId);
      setEssays(prev => prev.filter(essay => essay.id !== essayId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting essay:', err);
      const errorMessage =
        err.response?.data?.detail || 'Erro ao excluir redação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Get specific essay
   */
  const getEssay = useCallback(async essayId => {
    try {
      const essay = await apiService.getEssay(essayId);
      return { success: true, essay };
    } catch (err) {
      console.error('Error getting essay:', err);
      const errorMessage =
        err.response?.data?.detail || 'Erro ao carregar redação';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Load essays on mount
  useEffect(() => {
    loadEssays();
  }, [loadEssays]);

  return {
    essays,
    loading,
    error,
    submitting,
    loadEssays,
    submitEssay,
    deleteEssay,
    getEssay,
    refetch: loadEssays,
  };
};

export default useEssays;
