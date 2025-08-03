// Enhanced AI Suggestions Component for Complete Essay Analysis
import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DeepAnalysisModal from './DeepAnalysisModal';

const EnhancedAISuggestions = ({ 
  essayContent, 
  theme, 
  onAnalysisComplete,
  className = '' 
}) => {
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // Check if essay is ready for analysis
  const isEssayReady = essayContent && essayContent.trim().length >= 1000;
  const wordCount = essayContent ? essayContent.trim().split(/\s+/).length : 0;
  const charCount = essayContent ? essayContent.length : 0;

  // Load analysis history from localStorage
  useEffect(() => {
    const loadHistory = async () => {
      if (essayContent) {
        try {
          const contentHash = await generateContentHash(essayContent);
          const cached = localStorage.getItem(`analysis_history_${contentHash}`);
          if (cached) {
            setAnalysisHistory(JSON.parse(cached));
          }
        } catch (error) {
          console.error('Error loading analysis history:', error);
        }
      }
    };
    loadHistory();
  }, [essayContent]);

  const generateContentHash = async (content) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  const handleOpenDeepAnalysis = useCallback(() => {
    if (!isEssayReady) {
      toast.error('Escreva pelo menos 1000 caracteres antes da análise profunda.');
      return;
    }
    setShowDeepAnalysis(true);
  }, [isEssayReady]);

  const handleCloseDeepAnalysis = useCallback(() => {
    setShowDeepAnalysis(false);
  }, []);

  const handleAnalysisComplete = useCallback((result) => {
    setLastAnalysis(result);
    if (onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  }, [onAnalysisComplete]);

  const getReadinessStatus = () => {
    if (charCount < 500) {
      return {
        status: 'too_short',
        message: 'Muito curta para análise',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '❌'
      };
    } else if (charCount < 1000) {
      return {
        status: 'short',
        message: 'Pode ser analisada, mas recomendamos mais conteúdo',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '⚠️'
      };
    } else if (charCount < 2500) {
      return {
        status: 'good',
        message: 'Pronta para análise profunda',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '✅'
      };
    } else {
      return {
        status: 'excellent',
        message: 'Tamanho ideal para análise completa',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '🎯'
      };
    }
  };

  const readinessStatus = getReadinessStatus();

  const formatReliabilityLevel = (level) => {
    const levels = {
      'very_high': { text: 'Muito Alta', color: 'text-green-600' },
      'high': { text: 'Alta', color: 'text-green-600' },
      'medium': { text: 'Moderada', color: 'text-yellow-600' },
      'low': { text: 'Baixa', color: 'text-orange-600' },
      'very_low': { text: 'Muito Baixa', color: 'text-red-600' }
    };
    return levels[level] || levels['medium'];
  };

  return (
    <div className={`enhanced-ai-suggestions ${className}`}>
      {/* Analysis Status Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-lg p-6 mb-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <span>Análise Inteligente</span>
          </h3>
          <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${readinessStatus.bgColor} ${readinessStatus.color}`}>
            {readinessStatus.icon} {readinessStatus.message}
          </div>
        </div>

        {/* Essay Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Palavras</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{charCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Caracteres</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analysisHistory.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Análises</div>
          </div>
        </div>

        {/* Last Analysis Summary */}
        {lastAnalysis && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                Última Análise Profunda
              </h4>
              <div className="flex items-center gap-2">
                {lastAnalysis.final_score && (
                  <span className="text-lg font-bold text-purple-600">
                    {Math.round(lastAnalysis.final_score)}/1000
                  </span>
                )}
                <span className={`text-sm font-medium ${formatReliabilityLevel(lastAnalysis.consensus_metrics?.reliability_level).color}`}>
                  {formatReliabilityLevel(lastAnalysis.consensus_metrics?.reliability_level).text}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Análise com {lastAnalysis.model_results?.filter(r => r.success).length || 0} modelos de IA • 
              {Math.round(lastAnalysis.consensus_metrics?.agreement_percentage || 0)}% de concordância
            </p>
          </div>
        )}

        {/* Analysis Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleOpenDeepAnalysis}
            disabled={!essayContent?.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="text-lg">🧠</span>
            <span>Análise Profunda</span>
            {!isEssayReady && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                Mín. 1000 chars
              </span>
            )}
          </button>

          {analysisHistory.length > 0 && (
            <button
              onClick={() => setShowDeepAnalysis(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200"
            >
              <span>📊</span>
              <span>Ver Histórico</span>
            </button>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 Dicas para Análise Profunda:
          </h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Escreva pelo menos 1000 caracteres para análise precisa</li>
            <li>• A análise profunda usa múltiplos modelos de IA</li>
            <li>• Resultados são salvos automaticamente para comparação</li>
            <li>• Foque em competências específicas quando necessário</li>
          </ul>
        </div>
      </div>

      {/* Analysis History Preview */}
      {analysisHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            📈 Histórico de Análises
          </h3>
          
          <div className="space-y-3">
            {analysisHistory.slice(0, 3).map((entry, index) => {
              const reliability = formatReliabilityLevel(
                entry.result?.consensus_metrics?.reliability_level || 'medium'
              );
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {entry.competency === 'all' ? 'Análise Completa' : `Competência ${entry.competency.slice(-1)}`}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.result?.final_score && (
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(entry.result.final_score)}/1000
                      </div>
                    )}
                    <div className={`text-sm ${reliability.color}`}>
                      {reliability.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {analysisHistory.length > 3 && (
            <button
              onClick={() => setShowDeepAnalysis(true)}
              className="w-full mt-3 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Ver todas as {analysisHistory.length} análises
            </button>
          )}
        </div>
      )}

      {/* Deep Analysis Modal */}
      <DeepAnalysisModal
        isOpen={showDeepAnalysis}
        onClose={handleCloseDeepAnalysis}
        essayContent={essayContent}
        theme={theme}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
};

export default EnhancedAISuggestions;