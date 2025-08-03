// Centralized API Service for EnemIA
import axios from 'axios';

import { API_CONFIG } from '../constants';
import { storage } from '../utils/storage';
import { apiCache } from '../utils/cache';
import { debounce } from '../utils/performance';
import { logError, logWarning, logInfo } from '../utils/errorLogger';
import { executeWithRetry, handleNetworkError } from '../utils/networkErrorHandler';

/**
 * Centralized API Service Class
 * Handles all HTTP requests with automatic token management,
 * error handling, and retry logic
 */
class APIService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;

    // Create axios instance
    this.api = axios.create({
      baseURL: `${this.baseURL}/api`,
      timeout: 200000, // Aumentar timeout para 200 segundos para análise profunda
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      config => {
        const token = storage.getToken();
        if (token) {
          // Remove quotes if present and ensure proper format
          const cleanToken = token.replace(/"/g, '');
          config.headers.Authorization = `Bearer ${cleanToken}`;
          
          // Token added to request
        } else {
          // No token available for request
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        if (process.env.REACT_APP_DEBUG === 'true') {
          console.log(
            `API Request: ${config.method?.toUpperCase()} ${config.url}`
          );
        }

        return config;
      },
      error => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and logging
    this.api.interceptors.response.use(
      response => {
        // Calculate request duration
        const duration = new Date() - response.config.metadata.startTime;

        if (process.env.REACT_APP_DEBUG === 'true') {
          console.log(
            `API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`
          );
        }

        return response;
      },
      error => {
        this.handleAPIError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Enhanced API error handling with structured logging
   */
  handleAPIError(error) {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;
    const url = error.config?.url;
    const method = error.config?.method;

    // Log error with structured logging
    logError(error, {
      context: 'api_service',
      status,
      url,
      method,
      message,
      timestamp: Date.now(),
    });

    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        logWarning('Unauthorized access, clearing tokens', { url, method });
        storage.removeToken();
        storage.removeUser();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;

      case 403:
        logWarning('Access forbidden', { url, method });
        break;

      case 404:
        logWarning('Resource not found', { url, method });
        break;

      case 429:
        logWarning('Rate limit exceeded', { url, method });
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        logError(error, { context: 'server_error', status, url, method });
        break;

      default:
        if (error.code === 'ECONNABORTED') {
          logError(error, { context: 'request_timeout', url, method });
        } else if (error.code === 'NETWORK_ERROR') {
          logError(error, { context: 'network_error', url, method });
        }
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  /**
   * Login with Google token
   */
  async loginWithGoogle(googleToken) {
    console.log('Calling loginWithGoogle with token:', googleToken?.substring(0, 20) + '...');
    
    try {
      const response = await this.api.post('/auth/google', {
        token: googleToken,
      });
      
      console.log('Google login response:', response.status);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  async checkUsernameAvailability(username) {
    const response = await this.api.get(`/auth/check-username/${username}`);
    return response.data;
  }

  async updateUsername(username) {
    const response = await this.api.put('/auth/username', { username });
    return response.data;
  }

  // ==================== PARAGRAPH ANALYSIS ====================

  /**
   * Analyze paragraph with AI
   */
  async analyzeParagraph(paragraphData) {
    console.log('Calling analyzeParagraph:', paragraphData);
    const response = await this.api.post('/ai/analyze-paragraph', paragraphData);
    return response.data;
  }

  // ==================== ESSAYS ENDPOINTS ====================

  /**
   * Get user's essays with caching
   */
  async getMyEssays() {
    const cacheKey = 'user_essays';
    const cached = apiCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await this.api.get('/essays/my');
    apiCache.set(cacheKey, response.data, 2 * 60 * 1000); // Cache por 2 minutos
    return response.data;
  }

  /**
   * Get specific essay by ID
   */
  async getEssay(essayId) {
    const response = await this.api.get(`/essays/${essayId}`);
    return response.data;
  }

  /**
   * Submit new essay and invalidate cache
   */
  async submitEssay(essayData) {
    const response = await this.api.post('/essays', essayData);

    // Invalidate related caches
    apiCache.delete('user_essays');
    apiCache.delete('user_stats');

    return response.data;
  }

  /**
   * Correct essay
   */
  async correctEssay(essayId, aiModel) {
    const response = await this.api.post(`/essays/${essayId}/correct`, {
      essay_id: essayId,
      ai_model: aiModel,
    });
    return response.data;
  }

  /**
   * Delete essay
   */
  async deleteEssay(essayId) {
    const response = await this.api.delete(`/essays/${essayId}`);
    return response.data;
  }

  // ==================== DEEP ANALYSIS ENDPOINTS ====================

  /**
   * Perform deep analysis on content
   */
  async performDeepAnalysis(analysisData) {
    try {
      const response = await this.api.post('/deep-analysis', analysisData);
      return response.data;
    } catch (error) {
      console.error('Deep analysis error:', error);
      throw error;
    }
  }

  /**
   * Perform enhanced deep analysis for saved essays (Two-Phase System)
   */
  async performEnhancedDeepAnalysis(essayId) {
    try {
      const response = await this.api.post(`/essays/${essayId}/enhanced-deep-analysis`);
      return response.data;
    } catch (error) {
      console.error('Enhanced deep analysis error:', error);
      throw error;
    }
  }

  /**
   * Perform essay-specific deep analysis
   */
  async performEssayDeepAnalysis(essayId) {
    try {
      const response = await this.api.post(`/essays/${essayId}/deep-analysis`);
      return response.data;
    } catch (error) {
      console.error('Essay deep analysis error:', error);
      throw error;
    }
  }

  // ==================== STATS ENDPOINTS ====================

  /**
   * Get user statistics with caching
   */
  async getMyStats() {
    const cacheKey = 'user_stats';
    const cached = apiCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await this.api.get('/stats/my');
    apiCache.set(cacheKey, response.data, 5 * 60 * 1000); // Cache por 5 minutos
    return response.data;
  }

  // ==================== THEMES ENDPOINTS ====================

  /**
   * Get available essay themes
   */
  async getThemes() {
    const response = await this.api.get('/themes');
    return response.data;
  }

  // ==================== MODELS ENDPOINTS ====================

  /**
   * Get available AI models
   */
  async getModels() {
    const response = await this.api.get('/models');
    return response.data;
  }

  // ==================== EXTERNAL APIs ====================

  /**
   * Get random quote
   */
  async getRandomQuote() {
    try {
      const response = await this.api.get('/quotes');
      return response.data;
    } catch (error) {
      // Fallback quote
      return {
        content: 'A educação é a arma mais poderosa que você pode usar para mudar o mundo.',
        author: 'Nelson Mandela',
      };
    }
  }

  /**
   * Search Wikipedia
   */
  async searchWikipedia(query) {
    try {
      const response = await this.api.get(
        `/wikipedia/${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      // Fallback response
      return {
        title: query,
        extract: 'Informação não disponível no momento.',
        thumbnail: null,
      };
    }
  }

  /**
   * Check grammar using LanguageTool
   */
  async checkGrammar(text, language = 'pt-BR') {
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Grammar check error:', error);
      return { matches: [] };
    }
  }
}

// Create and export singleton instance
export const apiService = new APIService();
export default apiService;