// Utility Functions for EnemIA Frontend

/**
 * Format date to Brazilian format
 */
export const formatDate = date => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = date => {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Calculate reading time in minutes
 */
export const calculateReadingTime = text => {
  if (!text) return 0;
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if user is on mobile device
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
};

/**
 * Scroll to top smoothly
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

/**
 * Validate email format
 */
export const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format score with proper styling
 */
export const formatScore = score => {
  if (typeof score !== 'number') return '0';
  return score.toFixed(1);
};

/**
 * Get score color based on value
 */
export const getScoreColor = score => {
  if (score >= 900) return 'text-green-600';
  if (score >= 700) return 'text-blue-600';
  if (score >= 500) return 'text-yellow-600';
  if (score >= 300) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Calculate essay statistics
 */
export const calculateEssayStats = essays => {
  if (!essays || essays.length === 0) {
    return {
      total: 0,
      averageScore: 0,
      bestScore: 0,
      lastWeekCount: 0,
      improvementRate: 0,
    };
  }

  const total = essays.length;
  const scores = essays.map(essay => essay.score || 0);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / total;
  const bestScore = Math.max(...scores);

  // Essays from last week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekCount = essays.filter(
    essay => new Date(essay.created_at) > oneWeekAgo
  ).length;

  // Calculate improvement rate (last 5 vs previous 5)
  let improvementRate = 0;
  if (total >= 10) {
    const recent5 = scores.slice(-5);
    const previous5 = scores.slice(-10, -5);
    const recentAvg = recent5.reduce((sum, score) => sum + score, 0) / 5;
    const previousAvg = previous5.reduce((sum, score) => sum + score, 0) / 5;
    improvementRate = ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  return {
    total,
    averageScore: Number(averageScore.toFixed(1)),
    bestScore,
    lastWeekCount,
    improvementRate: Number(improvementRate.toFixed(1)),
  };
};

// Export all utility modules
export * from './storage';
export * from './performance';
export * from './cache';
export * from './lazyImports';
export * from './bundleOptimization';
export * from './productionOptimizations';
export * from './onboardingStorage';
