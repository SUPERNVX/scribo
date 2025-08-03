// Dictionary Hook - Hook para funcionalidades do dicionário
import { useState, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar funcionalidades do dicionário
 * Carrega definições de palavras do arquivo dictionary.json
 */
export const useDictionary = () => {
  const [dictionary, setDictionary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dictionaryRef = useRef(null);

  // Carregar dicionário
  const loadDictionary = useCallback(async () => {
    if (dictionaryRef.current) {
      return dictionaryRef.current; // Já carregado
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/dictionary.json');
      if (!response.ok) {
        throw new Error('Erro ao carregar dicionário');
      }

      const data = await response.json();
      dictionaryRef.current = data;
      setDictionary(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Erro ao carregar dicionário:', err);
      return null;
    }
  }, []);

  // Buscar definição de uma palavra
  const getWordDefinition = useCallback(
    async word => {
      if (!word || typeof word !== 'string') {
        return null;
      }

      // Normalizar palavra (remover acentos, converter para minúscula)
      const normalizedWord = word
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

      let dict = dictionaryRef.current;

      if (!dict) {
        dict = await loadDictionary();
        if (!dict) return null;
      }

      // Buscar palavra exata
      if (dict[normalizedWord]) {
        return {
          word: word,
          definition: dict[normalizedWord],
        };
      }

      // Buscar palavra original (com acentos)
      const originalWord = word.toLowerCase();
      if (dict[originalWord]) {
        return {
          word: word,
          definition: dict[originalWord],
        };
      }

      // Buscar palavras similares (começam com as mesmas letras)
      const similarWords = Object.keys(dict).filter(
        key =>
          key.startsWith(normalizedWord.substring(0, 3)) ||
          key.startsWith(originalWord.substring(0, 3))
      );

      if (similarWords.length > 0) {
        // Retornar a primeira palavra similar encontrada
        const similarWord = similarWords[0];
        return {
          word: word,
          definition: dict[similarWord],
          suggestion: similarWord,
        };
      }

      return null;
    },
    [loadDictionary]
  );

  // Buscar múltiplas palavras
  const getMultipleDefinitions = useCallback(
    async words => {
      const results = [];

      for (const word of words) {
        const definition = await getWordDefinition(word);
        if (definition) {
          results.push(definition);
        }
      }

      return results;
    },
    [getWordDefinition]
  );

  // Verificar se uma palavra existe no dicionário
  const wordExists = useCallback(
    async word => {
      const definition = await getWordDefinition(word);
      return definition !== null;
    },
    [getWordDefinition]
  );

  // Obter estatísticas do dicionário
  const getDictionaryStats = useCallback(async () => {
    let dict = dictionaryRef.current;

    if (!dict) {
      dict = await loadDictionary();
      if (!dict) return null;
    }

    const words = Object.keys(dict);
    const wordTypes = {};

    words.forEach(word => {
      const type = dict[word].p || 'indefinido';
      wordTypes[type] = (wordTypes[type] || 0) + 1;
    });

    return {
      totalWords: words.length,
      wordTypes,
      isLoaded: true,
    };
  }, [loadDictionary]);

  return {
    dictionary,
    loading,
    error,
    loadDictionary,
    getWordDefinition,
    getMultipleDefinitions,
    wordExists,
    getDictionaryStats,
    isLoaded: dictionaryRef.current !== null,
  };
};

/**
 * Hook para funcionalidades de seleção de texto e dicionário
 */
export const useTextSelection = () => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });

  // Obter texto selecionado
  const getSelectedText = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text) {
      // Obter posição da seleção
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });

      return {
        text,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
        },
      };
    }

    return null;
  }, []);

  // Limpar seleção
  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionPosition({ x: 0, y: 0 });

    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }, []);

  // Verificar se é uma palavra única
  const isSingleWord = useCallback(text => {
    if (!text) return false;

    // Remover pontuação e verificar se é uma palavra única
    const cleanText = text.replace(/[^\w\s]/g, '').trim();
    const words = cleanText.split(/\s+/);

    return words.length === 1 && words[0].length > 0;
  }, []);

  return {
    selectedText,
    selectionPosition,
    getSelectedText,
    clearSelection,
    isSingleWord,
  };
};

export default useDictionary;
