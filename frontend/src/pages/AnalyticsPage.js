// Analytics Page Component
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { 
  AnalyticsDashboard, 
  InsightsEngine, 
  ComparisonBenchmarks, 
  DataExporter 
} from '../components/analytics';
import ModernButton from '../components/ModernButton';
import GradientText from '../components/GradientText';
import { useWritingAnalytics } from '../hooks/useWritingAnalytics';
import useUserTier from '../hooks/useUserTier';
import PremiumUpgrade from '../components/ui/PremiumUpgrade';

/**
 * Analytics Page Component
 * Main page for displaying comprehensive writing analytics
 */
export const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { isPremium, isLoading: tierLoading } = useUserTier();
  const [activeView, setActiveView] = useState('dashboard');
  const { analyticsData, loading, error } = useWritingAnalytics('month');

  // Se não é premium, mostrar tela de upgrade
  if (!tierLoading && !isPremium) {
    return (
      <PremiumUpgrade 
        feature="analytics"
        title="Analytics Avançado"
        description="Acesse insights detalhados sobre sua evolução na escrita com gráficos, relatórios e análises personalizadas."
      />
    );
  }

  // Loading state while checking tier
  if (tierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // View options
  const viewOptions = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Visão geral completa',
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: TrendingUp,
      description: 'Análises personalizadas',
    },
    {
      id: 'comparisons',
      label: 'Comparações',
      icon: Users,
      description: 'Benchmarks e comparações',
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: Download,
      description: 'Exportar dados',
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ModernButton
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </ModernButton>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  <GradientText>Analytics Avançado</GradientText>
                </h1>
                <p className="text-gray-600 mt-1">
                  Análise completa do seu progresso na escrita
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            {analyticsData && (
              <div className="hidden md:flex items-center gap-6">
                {analyticsData.performanceMetrics && (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {analyticsData.performanceMetrics.averageScore.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">Pontuação Média</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cyan-600">
                        {analyticsData.performanceMetrics.totalEssays}
                      </p>
                      <p className="text-sm text-gray-600">Redações</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {analyticsData.performanceMetrics.improvementRate > 0 ? '+' : ''}
                        {analyticsData.performanceMetrics.improvementRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Melhoria</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg max-w-2xl">
            {viewOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setActiveView(option.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all flex-1 ${
                    activeView === option.id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div>{option.label}</div>
                    <div className="text-xs opacity-75">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeView}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {activeView === 'dashboard' && (
            <AnalyticsDashboard className="mb-8" />
          )}

          {activeView === 'insights' && (
            <div className="space-y-8">
              <InsightsEngine 
                analyticsData={analyticsData}
                showFilters={true}
              />
              
              {/* Additional Insights Section */}
              {analyticsData?.insights && analyticsData.insights.length > 5 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Insights Adicionais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.insights.slice(5, 10).map((insight, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'comparisons' && (
            <div className="space-y-8">
              <ComparisonBenchmarks 
                analyticsData={analyticsData}
                showPeerComparison={true}
                showBenchmarks={true}
              />
              
              {/* Performance Tips */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dicas para Melhorar sua Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Consistência é Chave
                    </h4>
                    <p className="text-sm text-blue-700">
                      Pratique regularmente para manter e melhorar sua performance.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">
                      Foque nas Competências Fracas
                    </h4>
                    <p className="text-sm text-green-700">
                      Identifique e trabalhe especificamente nas áreas que precisam de melhoria.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">
                      Use Feedback Construtivo
                    </h4>
                    <p className="text-sm text-purple-700">
                      Analise as correções e aplique as sugestões nas próximas redações.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'export' && (
            <div className="space-y-8">
              <DataExporter 
                analyticsData={analyticsData}
                onExportComplete={(exports) => {
                  console.log('Export completed:', exports);
                }}
                onExportError={(error) => {
                  console.error('Export error:', error);
                }}
              />
              
              {/* Export History */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Histórico de Exportações
                </h3>
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Suas exportações aparecerão aqui após serem realizadas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Carregando Analytics</h3>
                <p className="text-sm text-gray-600">Processando seus dados...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div>
              <h4 className="font-medium text-red-900">Erro ao Carregar</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsPage;