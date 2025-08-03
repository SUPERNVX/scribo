import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar o tier/plano do usuário
 */
const useUserTier = () => {
  const { user, isAuthenticated } = useAuth();
  const [userTier, setUserTier] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserTier('free');
      setIsLoading(false);
      return;
    }

    // Verificar modo de desenvolvimento
    const devPremiumMode = process.env.NODE_ENV === 'development' && 
                          localStorage.getItem('dev_premium_mode') === 'true';

    if (devPremiumMode) {
      setUserTier('premium');
      setIsLoading(false);
      return;
    }

    // Buscar tier real do backend
    const fetchUserTier = async () => {
      try {
        const response = await fetch('/api/user/tier', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserTier(data.tier || 'free');
        } else {
          // Fallback para tier do usuário ou free
          setUserTier(user.subscription_tier || user.tier || user.user_tier || 'free');
        }
      } catch (error) {
        console.error('Error fetching user tier:', error);
        // Fallback para tier do usuário ou free
        setUserTier(user.subscription_tier || user.tier || user.user_tier || 'free');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTier();
  }, [user, isAuthenticated]);

  const isPremium = userTier === 'premium';
  const isFree = userTier === 'free';
  const isVitalicio = userTier === 'vitalicio'; // Future implementation

  const tierLimits = {
    free: {
      weekly: {
        paragraph_analysis: 30,
        essay_correction: 8,
        deep_analysis: 3
      },
      features: {
        analytics: false,
        advanced_reports: false,
        comparison: false,
        priority_support: false,
        advanced_badges: false,
        essay_history_days: 30 // Limited to 30 days
      }
    },
    premium: {
      weekly: {
        paragraph_analysis: 200,
        essay_correction: 50,
        deep_analysis: 20
      },
      features: {
        analytics: true,
        advanced_reports: true,
        comparison: true,
        priority_support: true,
        advanced_badges: true,
        essay_history_days: null // Unlimited history
      }
    },
    // Future implementation: vitalicio tier for unlimited access
    vitalicio: {
      weekly: {
        paragraph_analysis: -1, // Unlimited
        essay_correction: -1,   // Unlimited
        deep_analysis: -1       // Unlimited
      },
      features: {
        analytics: true,
        advanced_reports: true,
        comparison: true,
        priority_support: true,
        advanced_badges: true,
        essay_history_days: null, // Unlimited history
        exclusive_features: true, // Future exclusive features
        api_access: true          // Future API access
      }
    }
  };

  const currentLimits = tierLimits[userTier] || tierLimits.free;

  const hasFeature = (feature) => {
    return currentLimits.features[feature] || false;
  };

  const getWeeklyLimit = (analysisType) => {
    return currentLimits.weekly[analysisType] || 0;
  };

  return {
    userTier,
    isPremium,
    isFree,
    isVitalicio,
    isLoading,
    hasFeature,
    getWeeklyLimit,
    currentLimits
  };
};

export default useUserTier;