// Updated Themes Hook - Hook para gerenciar temas de redação com sistema aleatório
import { useState, useEffect, useCallback } from 'react';

import temasService from '../services/temasService';

/**
 * Hook para gerenciar temas de redação com seleção aleatória
 */
export const useThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);

  /**
   * Load random themes from service
   */
  const loadThemes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get 5 random themes from the service
      const temasAleatorios = temasService.getTemasAleatorios(5);
      console.log('Temas aleatórios obtidos:', temasAleatorios.map(t => t.titulo));

      // Convert to the expected format
      const themesFormatted = temasAleatorios.map(tema => ({
        id: tema.id,
        title: tema.titulo,
        description: tema.descricao,
        category: tema.area,
        difficulty: 'Médio', // Default difficulty
        year: tema.ano,
        faculdade: tema.faculdade,
        estilo: tema.estilo,
      }));

      console.log('Temas formatados:', themesFormatted.map(t => t.title));
      setThemes(themesFormatted);
    } catch (err) {
      console.error('Error loading themes:', err);
      setError(err.message || 'Erro ao carregar temas');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh themes (get new random selection)
   */
  const refreshThemes = useCallback(async () => {
    console.log('refreshThemes chamado!');
    setRefreshing(true);
    temasService.resetarSessao(); // Reset session to allow repetition
    console.log('Sessão resetada, carregando novos temas...');
    await loadThemes();
    setRefreshing(false);
  }, [loadThemes]);

  /**
   * Get theme by ID
   */
  const getTheme = useCallback(
    id => {
      return themes.find(theme => theme.id === id);
    },
    [themes]
  );

  /**
   * Select a theme
   */
  const selectTheme = useCallback(theme => {
    setSelectedTheme(theme);
  }, []);

  /**
   * Clear selected theme
   */
  const clearSelectedTheme = useCallback(() => {
    setSelectedTheme(null);
  }, []);

  /**
   * Get random theme from current selection
   */
  const getRandomTheme = useCallback(() => {
    if (themes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * themes.length);
    return themes[randomIndex];
  }, [themes]);

  /**
   * Filter themes by various criteria
   */
  const filterThemes = useCallback(
    (filters = {}) => {
      let filtered = [...themes];

      if (filters.category) {
        filtered = filtered.filter(theme =>
          theme.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }

      if (filters.faculdade) {
        filtered = filtered.filter(
          theme =>
            theme.faculdade.toLowerCase() === filters.faculdade.toLowerCase()
        );
      }

      if (filters.estilo) {
        filtered = filtered.filter(
          theme => theme.estilo.toLowerCase() === filters.estilo.toLowerCase()
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(
          theme =>
            theme.title.toLowerCase().includes(searchTerm) ||
            theme.description.toLowerCase().includes(searchTerm) ||
            theme.category.toLowerCase().includes(searchTerm)
        );
      }

      return filtered;
    },
    [themes]
  );

  /**
   * Get themes by university
   */
  const getThemesByUniversity = useCallback(
    faculdade => {
      return themes.filter(theme => theme.faculdade === faculdade);
    },
    [themes]
  );

  /**
   * Get themes by style
   */
  const getThemesByStyle = useCallback(
    estilo => {
      return themes.filter(theme => theme.estilo === estilo);
    },
    [themes]
  );

  /**
   * Get themes by category
   */
  const getThemesByCategory = useCallback(
    category => {
      return themes.filter(theme => theme.category === category);
    },
    [themes]
  );

  /**
   * Search themes
   */
  const searchThemes = useCallback(
    query => {
      const lowercaseQuery = query.toLowerCase();
      return themes.filter(
        theme =>
          theme.title.toLowerCase().includes(lowercaseQuery) ||
          theme.description.toLowerCase().includes(lowercaseQuery) ||
          theme.category.toLowerCase().includes(lowercaseQuery)
      );
    },
    [themes]
  );

  // Load themes on mount
  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  // Reset themes only when user closes/reloads the page (not just changing tabs)
  useEffect(() => {
    const handleBeforeUnload = () => {
      temasService.resetarSessao();
    };

    // Only add beforeunload listener (not visibilitychange)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    themes,
    loading,
    refreshing,
    error,
    selectedTheme,
    loadThemes,
    refreshThemes,
    getTheme,
    selectTheme,
    clearSelectedTheme,
    getRandomTheme,
    filterThemes,
    getThemesByUniversity,
    getThemesByStyle,
    getThemesByCategory,
    searchThemes,
    refetch: loadThemes,
    hasThemes: themes.length > 0,
    // Service methods for advanced usage
    temasService,
  };
};

export default useThemes;
