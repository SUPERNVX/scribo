// Custom hook for paragraph analysis functionality
import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { processParagraphFeedback } from '../utils/aiResponseProcessor';

/**
 * Custom hook for paragraph analysis with caching and fallback
 * Provides on-demand analysis for individual paragraphs
 */
export const useParagraphAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for analysis results to avoid re-requests
  const analysisCache = useRef(new Map());
  
  // Fallback analysis when API is unavailable
  const fallbackAnalysis = useCallback((text, paragraphId) => {
    const suggestions = [];
    let suggestionId = 1;

    // Basic repetition detection
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    const wordPositions = {};

    words.forEach((word, index) => {
      if (word.length > 3) { // Only check words longer than 3 characters
        if (!wordCounts[word]) {
          wordCounts[word] = 0;
          wordPositions[word] = [];
        }
        wordCounts[word]++;
        wordPositions[word].push(index);
      }
    });

    // Find repeated words
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count > 2) { // Word appears more than twice
        const positions = wordPositions[word];
        positions.forEach((pos, idx) => {
          if (idx > 0) { // Skip first occurrence
            const start = text.toLowerCase().indexOf(word, 
              idx > 1 ? text.toLowerCase().indexOf(word, text.toLowerCase().indexOf(word) + 1) : text.toLowerCase().indexOf(word) + 1
            );
            
            if (start !== -1) {
              suggestions.push({
                id: suggestionId++,
                type: 'repetition',
                message: `A palavra "${word}" está sendo repetida com frequência. Considere usar sinônimos.`,
                start: start,
                end: start + word.length,
                originalText: word,
                replacement: null,
                confidence: 75,
                explanation: 'Repetições excessivas podem tornar o texto monótono. Varie o vocabulário para enriquecer sua redação.',
              });
            }
          }
        });
      }
    });

    return {
      suggestions: suggestions.slice(0, 10), // Limit to 10 suggestions
      summary: `Análise offline concluída. ${suggestions.length} sugestões encontradas.`,
      analysisType: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }, []);

  // Main analysis function
  const analyzeParagraph = useCallback(async (text, paragraphId) => {
    if (!text || text.trim().length < 10) {
      throw new Error('Texto muito curto para análise');
    }

    // Check cache first
    const cacheKey = `${paragraphId}_${text.substring(0, 100)}`;
    if (analysisCache.current.has(cacheKey)) {
      return analysisCache.current.get(cacheKey);
    }

    setLoading(true);
    setError(null);

    try {
      // Try API analysis first
      console.log('Iniciando análise de parágrafo via API...');
      console.log('Token presente:', !!localStorage.getItem('token'));
      console.log('⏱️ Análise pode demorar até 2-3 minutos, aguarde...');
      
      const response = await apiService.api.post('/ai/analyze-paragraph', {
        content: text,
        theme: 'Análise de parágrafo',
        ai_model: 'deepseek_14b',  // Use DeepSeek 14B model for paragraph analysis
        theme_data: null  // Will be populated when we have theme context
      }, {
        timeout: 180000 // 3 minutes timeout for AI analysis (backend pode demorar até 2 min)
      });
      
      console.log('Análise de parágrafo concluída com sucesso');

      // Processar feedback da IA (remover pensamentos e formatar)
      const feedbackData = processParagraphFeedback(response.data.feedback || '');
      
      const result = {
        suggestions: response.data.feedback?.suggestions || [],
        summary: feedbackData.processed || 'Análise concluída com sucesso.',
        feedback: feedbackData.processed || 'Análise concluída com sucesso.',
        rawFeedback: response.data.feedback, // Manter original para debug
        analysisType: 'api',
        timestamp: new Date().toISOString(),
        score: response.data.score,
        model: response.data.model,
        processing_time: response.data.processing_time,
        thoughtsRemoved: feedbackData.thoughtsRemoved
      };

      // Cache the result
      analysisCache.current.set(cacheKey, result);
      
      // Limit cache size
      if (analysisCache.current.size > 50) {
        const firstKey = analysisCache.current.keys().next().value;
        analysisCache.current.delete(firstKey);
      }

      return result;
    } catch (error) {
      console.error('API analysis failed:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.detail || error.message);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.error('AUTHENTICATION ERROR - Token invalid or expired');
        console.error('User needs to login again');
        
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          return;
        }
      }
      
      console.warn('Using fallback analysis due to API error');
      
      // Use fallback analysis
      const fallbackResult = fallbackAnalysis(text, paragraphId);
      
      // Cache fallback result too
      analysisCache.current.set(cacheKey, fallbackResult);
      
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  }, [fallbackAnalysis]);

  // Clear cache function
  const clearCache = useCallback(() => {
    analysisCache.current.clear();
  }, []);

  // Get cache size for debugging
  const getCacheSize = useCallback(() => {
    return analysisCache.current.size;
  }, []);

  return {
    analyzeParagraph,
    loading,
    error,
    clearCache,
    getCacheSize,
  };
};

export default useParagraphAnalysis;