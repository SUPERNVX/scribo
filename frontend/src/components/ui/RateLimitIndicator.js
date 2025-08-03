import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SmartIcon } from '../ModernIcons';
import './RateLimitIndicator.css';

/**
 * Componente para mostrar o status do rate limit do usuário
 */
const RateLimitIndicator = ({ 
  variant = 'default', // 'default', 'compact', 'settings'
  showLabel = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRateLimitStatus = async () => {
    if (!user?.email) {
      setLoading(false);
      setError('Usu�rio n�o autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Em desenvolvimento, sempre usar dados mock
      if (!token || process.env.NODE_ENV === 'development') {
        console.log('Usando dados mock para desenvolvimento');
        
        const devPremiumMode = localStorage.getItem('dev_premium_mode') === 'true';
        const userTier = devPremiumMode ? 'premium' : 'free';
        
        const tierLimits = {
          free: { daily: 3, monthly: 50 },
          premium: { daily: 50, monthly: 1000 },
          vitalicio: { daily: 100, monthly: 5000 }
        };
        
        const mockData = {
          user_id: user.email,
          tier: userTier,
          limits: tierLimits[userTier],
          usage: {
            daily: Math.floor(Math.random() * tierLimits[userTier].daily),
            monthly: Math.floor(Math.random() * tierLimits[userTier].monthly)
          },
          reset_times: {
            daily: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            monthly: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };
        
        setRateLimitStatus(mockData);
        setError(null);
        return;
      }

      // Fazer requisi��o real apenas em produ��o com token
      const response = await fetch(`/api/ai/rate-limit/${encodeURIComponent(user.email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setRateLimitStatus(data);
      setError(null);

    } catch (err) {
      console.error('Erro ao buscar rate limit:', err);
      
      // Em caso de erro, usar dados mock em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Usando dados mock devido ao erro');
        
        const devPremiumMode = localStorage.getItem('dev_premium_mode') === 'true';
        const userTier = devPremiumMode ? 'premium' : 'free';
        
        const tierLimits = {
          free: { daily: 3, monthly: 50 },
          premium: { daily: 50, monthly: 1000 },
          vitalicio: { daily: 100, monthly: 5000 }
        };
        
        const mockData = {
          user_id: user.email,
          tier: userTier,
          limits: tierLimits[userTier],
          usage: {
            daily: Math.floor(Math.random() * tierLimits[userTier].daily),
            monthly: Math.floor(Math.random() * tierLimits[userTier].monthly)
          },
          reset_times: {
            daily: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            monthly: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };
        
        setRateLimitStatus(mockData);
        setError(null);
      } else {
        setError('Erro ao carregar informa��es de limite');
      }
    } finally {
      setLoading(false);
    }
  };

  // Buscar status inicial e configurar atualização automática
  useEffect(() => {
    if (user?.email) {
      fetchRateLimitStatus();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchRateLimitStatus, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Se não há usuário, limpar estados
      setRateLimitStatus(null);
      setError(null);
      setLoading(false);
    }
  }, [user?.email]);

  // Escutar mudan�as no dev_premium_mode para atualizar em tempo real
  useEffect(() => {
    const handleStorageChange = () => {
      if (process.env.NODE_ENV === 'development' && user?.email) {
        fetchRateLimitStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Tamb�m escutar mudan�as manuais no localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments);
      if (key === 'dev_premium_mode') {
        handleStorageChange();
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, [user?.email]);

  // Calcular porcentagem de uso (usando análise de parágrafo para versão compacta)
  const getUsagePercentage = (analysisType = 'paragraph_analysis') => {
    if (!rateLimitStatus?.analysis_types?.[analysisType]) return 0;
    const analysis = rateLimitStatus.analysis_types[analysisType];
    
    if (analysis.unlimited) return 0; // Unlimited users show 0%
    if (analysis.limit === 0) return 0;
    
    return (analysis.usage / analysis.limit) * 100;
  };

  // Determinar cor da barra baseada no uso
  const getBarColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'var(--color-red-500)';
    if (percentage >= 70) return 'var(--color-yellow-500)';
    return 'var(--color-green-500)';
  };

  // Formatar tempo de reset
  const formatResetTime = (resetTime) => {
    if (!resetTime) return null;
    
    const now = new Date();
    const reset = new Date(resetTime);
    const diffMs = reset - now;
    
    if (diffMs <= 0) return 'Disponível agora';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    if (diffMinutes === 1) return '1 minuto';
    return `${diffMinutes} minutos`;
  };

  if (loading && !rateLimitStatus) {
    return (
      <div className={`rate-limit-indicator ${variant} ${className}`}>
        <div className="rate-limit-loading">
          <SmartIcon type="loading" size={16} className="animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rate-limit-indicator ${variant} error ${className}`}>
        <SmartIcon type="warning" size={16} />
        <span>Erro ao carregar status</span>
      </div>
    );
  }

  if (!rateLimitStatus) return null;

  // Para versão compacta, usar análise de parágrafo; para outras, usar correção completa
  const analysisType = variant === 'compact' ? 'paragraph_analysis' : 'essay_correction';
  const percentage = getUsagePercentage(analysisType);
  const analysis = rateLimitStatus.analysis_types?.[analysisType];
  const isLimitReached = analysis && !analysis.unlimited && analysis.remaining === 0;
  const resetTimeFormatted = formatResetTime(rateLimitStatus.reset_time);
  const isUnlimited = analysis?.unlimited || false;

  return (
    <div className={`rate-limit-indicator ${variant} ${isLimitReached ? 'limit-reached' : ''} ${className}`}>
      {showLabel && (
        <div className="rate-limit-label">
          <SmartIcon type="zap" size={16} />
          <span>
            {variant === 'compact' ? 'Análises de parágrafo restantes' : 'Análises de IA'}
          </span>
        </div>
      )}
      
      <div className="rate-limit-content">
        <div className="rate-limit-bar-container">
          <div className="rate-limit-bar">
            <div 
              className="rate-limit-fill"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: getBarColor()
              }}
            />
          </div>
          
          <div className="rate-limit-text">
            <span className="rate-limit-usage">
              {isUnlimited ? (
                `${analysis.usage} / ∞`
              ) : (
                `${analysis?.usage || 0} / ${analysis?.limit || 0}`
              )}
            </span>
            
            {variant !== 'compact' && (
              <span className="rate-limit-status">
                {isUnlimited ? (
                  <span className="unlimited-text">Ilimitado</span>
                ) : isLimitReached ? (
                  resetTimeFormatted ? (
                    <span className="reset-time">
                      <SmartIcon type="clock" size={12} />
                      Renova em {resetTimeFormatted}
                    </span>
                  ) : (
                    <span className="limit-reached-text">Limite atingido</span>
                  )
                ) : (
                  <span className="remaining-text">
                    {analysis?.remaining || 0} restante{(analysis?.remaining || 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {variant === 'settings' && (
          <div className="rate-limit-details">
            <p className="rate-limit-description">
              {isUnlimited ? (
                `Você tem acesso ilimitado a análises de IA. Plano: ${rateLimitStatus.user_tier || 'Vitalício'}.`
              ) : (
                `Seus limites semanais de análise (renovam toda segunda-feira):`
              )}
            </p>
            
            {!isUnlimited && (
              <div className="analysis-cards">
                {/* Card Análise de Parágrafo */}
                <div className="analysis-card paragraph">
                  <div className="analysis-card-header">
                    <SmartIcon type="file-text" size={20} />
                    <span className="analysis-card-title">Análise de Parágrafo</span>
                  </div>
                  <div className="analysis-card-content">
                    <div className="analysis-progress">
                      <div className="analysis-progress-bar">
                        <div 
                          className="analysis-progress-fill paragraph"
                          style={{ 
                            width: `${getUsagePercentage('paragraph_analysis')}%`
                          }}
                        />
                      </div>
                      <span className="analysis-usage-text">
                        {rateLimitStatus.analysis_types?.paragraph_analysis?.usage || 0} / {rateLimitStatus.analysis_types?.paragraph_analysis?.limit || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Correção Completa */}
                <div className="analysis-card complete">
                  <div className="analysis-card-header">
                    <SmartIcon type="check-circle" size={20} />
                    <span className="analysis-card-title">Correção Completa</span>
                  </div>
                  <div className="analysis-card-content">
                    <div className="analysis-progress">
                      <div className="analysis-progress-bar">
                        <div 
                          className="analysis-progress-fill complete"
                          style={{ 
                            width: `${getUsagePercentage('essay_correction')}%`
                          }}
                        />
                      </div>
                      <span className="analysis-usage-text">
                        {rateLimitStatus.analysis_types?.essay_correction?.usage || 0} / {rateLimitStatus.analysis_types?.essay_correction?.limit || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Análise Profunda */}
                <div className="analysis-card deep">
                  <div className="analysis-card-header">
                    <SmartIcon type="brain" size={20} />
                    <span className="analysis-card-title">Análise Profunda</span>
                  </div>
                  <div className="analysis-card-content">
                    <div className="analysis-progress">
                      <div className="analysis-progress-bar">
                        <div 
                          className="analysis-progress-fill deep"
                          style={{ 
                            width: `${getUsagePercentage('deep_analysis')}%`
                          }}
                        />
                      </div>
                      <span className="analysis-usage-text">
                        {rateLimitStatus.analysis_types?.deep_analysis?.usage || 0} / {rateLimitStatus.analysis_types?.deep_analysis?.limit || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!isUnlimited && rateLimitStatus.user_tier === 'free' && (
              <p className="rate-limit-upgrade">
                💡 <strong>Dica:</strong> Faça upgrade para Premium e tenha muito mais análises por semana!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RateLimitIndicator;