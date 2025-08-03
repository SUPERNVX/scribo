// Custom hook for managing daily quotes
import { useState, useEffect, useCallback } from 'react';

import { apiService } from '../services/api';

/**
 * Custom hook for managing daily quotes
 */
export const useQuotes = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load random quote from API
   */
  const loadQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRandomQuote();
      setQuote(data);
    } catch (err) {
      console.error('Error loading quote:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar citação');
      // Set fallback quote
      setQuote({
        content:
          'A educação é a arma mais poderosa que você pode usar para mudar o mundo.',
        author: 'Nelson Mandela',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get new random quote
   */
  const refreshQuote = useCallback(() => {
    loadQuote();
  }, [loadQuote]);

  // Load quote on mount
  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  return {
    quote,
    loading,
    error,
    loadQuote,
    refreshQuote,
  };
};

export default useQuotes;
