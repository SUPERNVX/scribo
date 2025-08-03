// Local Storage Utilities
import { STORAGE_KEYS } from '../constants';

/**
 * Safe localStorage wrapper with error handling
 */
class StorageManager {
  /**
   * Get item from localStorage
   */
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage
   */
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Specific storage functions for the app
export const storage = {
  // Token management
  getToken: () => StorageManager.get(STORAGE_KEYS.TOKEN),
  setToken: token => StorageManager.set(STORAGE_KEYS.TOKEN, token),
  removeToken: () => StorageManager.remove(STORAGE_KEYS.TOKEN),

  // User management
  getUser: () => StorageManager.get(STORAGE_KEYS.USER),
  setUser: user => StorageManager.set(STORAGE_KEYS.USER, user),
  removeUser: () => StorageManager.remove(STORAGE_KEYS.USER),

  // Theme management
  getTheme: () => StorageManager.get(STORAGE_KEYS.THEME) || 'light',
  setTheme: theme => StorageManager.set(STORAGE_KEYS.THEME, theme),

  // Onboarding management
  getOnboardingStatus: () =>
    StorageManager.get(STORAGE_KEYS.ONBOARDING) || false,
  setOnboardingCompleted: () =>
    StorageManager.set(STORAGE_KEYS.ONBOARDING, true),

  // Clear all app data - CORRIGIDO
  clearAll: () => {
    try {
      console.log('DEBUG: Iniciando limpeza completa do storage...');

      // Remover chaves específicas da aplicação
      StorageManager.remove(STORAGE_KEYS.TOKEN);
      StorageManager.remove(STORAGE_KEYS.USER);
      StorageManager.remove(STORAGE_KEYS.THEME);
      StorageManager.remove(STORAGE_KEYS.ONBOARDING);

      // Remover todas as chaves de onboarding específicas por usuário
      const allKeys = Object.keys(localStorage);
      const onboardingKeys = allKeys.filter(
        key =>
          key.startsWith('onboarding_completed_') ||
          key.startsWith('onboarding_data_')
      );

      console.log('DEBUG: Removendo chaves de onboarding:', onboardingKeys);
      onboardingKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('DEBUG: Storage limpo com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
      return false;
    }
  },
};

export default StorageManager;
