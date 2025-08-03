import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';

/**
 * Hook para validação de nome de usuário
 * Inclui debounce para evitar muitas requisições
 */
export const useUsernameValidation = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState('');
  const [lastCheckedUsername, setLastCheckedUsername] = useState('');
  const timeoutRef = useRef(null);

  const validateUsername = useCallback((username) => {
    // Validações básicas no frontend
    if (!username || username.length < 3) {
      return 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    if (username.length > 20) {
      return 'Nome de usuário deve ter no máximo 20 caracteres';
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Nome de usuário pode conter apenas letras, números, _ e -';
    }

    if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
      return 'Nome de usuário não pode começar ou terminar com _ ou -';
    }

    return null;
  }, []);

  const checkAvailability = useCallback(async (username) => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const trimmedUsername = username.trim().toLowerCase();
    
    // Validação básica primeiro
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      setError(validationError);
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }

    // Se é o mesmo username já verificado, não fazer nova requisição
    if (trimmedUsername === lastCheckedUsername && isAvailable !== null) {
      return;
    }

    setIsChecking(true);
    setError('');

    // Debounce de 500ms
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiService.checkUsernameAvailability(trimmedUsername);
        setIsAvailable(response.available);
        setLastCheckedUsername(trimmedUsername);
        
        if (!response.available) {
          setError('Este nome de usuário já está em uso, por favor escolha outro');
        }
      } catch (err) {
        console.error('Erro ao verificar disponibilidade do username:', err);
        setError('Erro ao verificar disponibilidade. Tente novamente.');
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }, 500);
  }, [validateUsername, lastCheckedUsername, isAvailable]);

  const updateUsername = useCallback(async (username) => {
    const trimmedUsername = username.trim().toLowerCase();
    
    // Validação básica primeiro
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      const response = await apiService.updateUsername(trimmedUsername);
      return response;
    } catch (err) {
      if (err.response?.status === 409) {
        throw new Error('Este nome de usuário já está em uso');
      }
      throw new Error('Erro ao atualizar nome de usuário. Tente novamente.');
    }
  }, [validateUsername]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsChecking(false);
    setIsAvailable(null);
    setError('');
    setLastCheckedUsername('');
  }, []);

  return {
    isChecking,
    isAvailable,
    error,
    checkAvailability,
    updateUsername,
    validateUsername,
    reset
  };
};

export default useUsernameValidation;