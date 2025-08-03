// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  TIMEOUT: 60000, // Increased to 60 seconds for AI analysis
  RETRY_ATTEMPTS: 3,
};

// Application Constants
export const APP_CONFIG = {
  NAME: 'Scribo',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
};

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  LOADING_DELAY: 300,
  ANIMATION_DURATION: 200,
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  WRITE: '/write',
  DASHBOARD: '/dashboard',
  PRICING: '/planos',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  ONBOARDING: 'onboarding_completed',
};

// Essay Status
export const ESSAY_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  CORRECTED: 'corrected',
  ARCHIVED: 'archived',
};

// AI Models
export const AI_MODELS = {
  DEEPSEEK: 'deepseek',
  GPT4: 'gpt-4',
  CLAUDE: 'claude',
};
