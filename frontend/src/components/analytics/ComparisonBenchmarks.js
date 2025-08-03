// Comparison and Benchmarks Component
import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3,
  Trophy,
  Medal,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  Calendar,
  BookOpen,
  RefreshCw,
  Search,
} from 'lucide-react';

import GradientText from '../GradientText';
import ModernButton from '../ModernButton';

// Helper functions for comparison icons and colors
const getComparisonIcon = (difference) => {
  if (difference > 0) return ArrowUp;
  if (difference < 0) return ArrowDown;
  return Minus;
};

const getComparisonColor = (difference) => {
  if (difference > 0) return 'text-green-600';
  if (difference < 0) return 'text-red-600';
  return 'text-gray-600';
};

/**
 * Comparison and Benchmarks Component
 * Shows user performance compared to benchmarks and peer averages
 */
export const ComparisonBenchmarks = ({ 
  analyticsData, 
  className = '',
  showPeerComparison = true,
  showBenchmarks = true 
}) => {
  const [activeComparison, setActiveComparison] = useState('overall');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [themeComparisonData, setThemeComparisonData] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [availableThemes, setAvailableThemes] = useState([]);

  // Benchmark data (typical ENEM performance ranges)
  const benchmarks = {
    excellent: { min: 800, max: 1000, label: 'Excelente', color: '#10B981' },
    good: { min: 600, max: 799, label: 'Bom', color: '#3B82F6' },
    average: { min: 400, max: 599, label: 'Médio', color: '#F59E0B' },
    needsImprovement: { min: 0, max: 399, label: 'Precisa Melhorar', color: '#EF4444' },
  };

  // Simulated peer data (in a real app, this would come from the backend)
  const peerData = {
    averageScore: 520,
    averageWords: 320,
    averageEssays: 8,
    competencyAverages: {
      competency1: 140,
      competency2: 135,
      competency3: 125,
      competency4: 130,
      competency5: 120,
    },
    percentiles: {
      score: {
        p25: 380,
        p50: 520,
        p75: 680,
        p90: 780,
      },
      words: {
        p25: 280,
        p50: 320,
        p75: 380,
        p90: 420,
      },
    },
  };

  // Comparison options
  const comparisonOptions = [
    { value: 'overall', label: 'Geral', icon: BarChart3 },
    { value: 'competencies', label: 'Competências', icon: Target },
    { value: 'progress', label: 'Progresso', icon: TrendingUp },
    { value: 'benchmarks', label: 'Benchmarks', icon: Award },
    { value: 'theme', label: 'Por Tema', icon: BookOpen },
  ];

  // Calculate user's benchmark level
  const getUserBenchmarkLevel = (score) => {
    for (const [level, range] of Object.entries(benchmarks)) {
      if (score >= range.min && score <= range.max) {
        return { level, ...range };
      }
    }
    return { level: 'needsImprovement', ...benchmarks.needsImprovement };
  };

  // Calculate percentile position
  const calculatePercentile = (userValue, percentiles) => {
    if (userValue >= percentiles.p90) return 90;
    if (userValue >= percentiles.p75) return 75;
    if (userValue >= percentiles.p50) return 50;
    if (userValue >= percentiles.p25) return 25;
    return 10;
  };

  // Performance comparison data
  const performanceComparison = useMemo(() => {
    if (!analyticsData?.performanceMetrics) return null;

    const pm = analyticsData.performanceMetrics;
    const userBenchmark = getUserBenchmarkLevel(pm.averageScore);
    const scorePercentile = calculatePercentile(pm.averageScore, peerData.percentiles.score);
    const wordsPercentile = calculatePercentile(pm.averageWords, peerData.percentiles.words);

    return {
      userScore: pm.averageScore,
      peerAverage: peerData.averageScore,
      scoreDifference: pm.averageScore - peerData.averageScore,
      scorePercentile,
      userWords: pm.averageWords,
      peerAverageWords: peerData.averageWords,
      wordsDifference: pm.averageWords - peerData.averageWords,
      wordsPercentile,
      userEssays: pm.totalEssays,
      peerAverageEssays: peerData.averageEssays,
      essaysDifference: pm.totalEssays - peerData.averageEssays,
      benchmarkLevel: userBenchmark,
    };
  }, [analyticsData]);

  // Competency comparison data
  const competencyComparison = useMemo(() => {
    if (!analyticsData?.competencyAnalysis?.competencyAverages) return null;

    const userCompetencies = analyticsData.competencyAnalysis.competencyAverages;
    const peerCompetencies = peerData.competencyAverages;

    const competencyNames = {
      competency1: 'Norma Padrão',
      competency2: 'Compreensão',
      competency3: 'Informações',
      competency4: 'Coesão',
      competency5: 'Intervenção',
    };

    return Object.keys(userCompetencies).map(comp => ({
      name: competencyNames[comp],
      user: userCompetencies[comp],
      peer: peerCompetencies[comp],
      difference: userCompetencies[comp] - peerCompetencies[comp],
      percentage: ((userCompetencies[comp] - peerCompetencies[comp]) / peerCompetencies[comp]) * 100,
    }));
  }, [analyticsData]);

  // Benchmark chart data
  const benchmarkChartData = useMemo(() => {
    if (!performanceComparison) return null;

    return {
      labels: ['Sua Pontuação', 'Média dos Pares', 'Benchmark Bom', 'Benchmark Excelente'],
      datasets: [
        {
          label: 'Pontuação',
          data: [
            performanceComparison.userScore,
            performanceComparison.peerAverage,
            benchmarks.good.min,
            benchmarks.excellent.min,
          ],
          backgroundColor: [
            performanceComparison.benchmarkLevel.color,
            '#94A3B8',
            benchmarks.good.color,
            benchmarks.excellent.color,
          ],
          borderColor: [
            performanceComparison.benchmarkLevel.color,
            '#64748B',
            benchmarks.good.color,
            benchmarks.excellent.color,
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [performanceComparison]);

  // Competency comparison chart data
  const competencyChartData = useMemo(() => {
    if (!competencyComparison) return null;

    return {
      labels: competencyComparison.map(comp => comp.name),
      datasets: [
        {
          label: 'Sua Performance',
          data: competencyComparison.map(comp => comp.user),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: '#8B5CF6',
          borderWidth: 2,
        },
        {
          label: 'Média dos Pares',
          data: competencyComparison.map(comp => comp.peer),
          backgroundColor: 'rgba(148, 163, 184, 0.8)',
          borderColor: '#94A3B8',
          borderWidth: 2,
        },
      ],
    };
  }, [competencyComparison]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
    },
  };

  // Fetch available themes when component mounts
  useEffect(() => {
    const fetchAvailableThemes = async () => {
      try {
        const response = await fetch('/api/essays', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const essays = await response.json();
          const themes = [...new Set(essays.map(essay => essay.theme).filter(Boolean))];
          setAvailableThemes(themes);
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };

    if (analyticsData) {
      fetchAvailableThemes();
    }
  }, [analyticsData]);

  // Fetch theme comparison data
  const fetchThemeComparison = async (theme) => {
    if (!theme) return;
    
    setThemeLoading(true);
    try {
      const encodedTheme = encodeURIComponent(theme);
      const response = await fetch(`/api/analytics/theme-comparison/${encodedTheme}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setThemeComparisonData(data);
      } else {
        const error = await response.json();
        console.error('Error fetching theme comparison:', error.detail);
        setThemeComparisonData(null);
      }
    } catch (error) {
      console.error('Error fetching theme comparison:', error);
      setThemeComparisonData(null);
    } finally {
      setThemeLoading(false);
    }
  };

  // Handle theme selection
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    fetchThemeComparison(theme);
  };

  if (!analyticsData) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Comparações Não Disponíveis
          </h3>
          <p className="text-gray-600">
            Escreva algumas redações para ver comparações com outros usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              <GradientText>Comparações e Benchmarks</GradientText>
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Compare sua performance com outros usuários e benchmarks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {performanceComparison && (
              <span className="text-sm font-medium text-gray-700">
                Top {100 - performanceComparison.scorePercentile}%
              </span>
            )}
          </div>
        </div>

        {/* Comparison Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {comparisonOptions.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setActiveComparison(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeComparison === option.value
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeComparison}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeComparison === 'overall' && performanceComparison && (
              <OverallComparison comparison={performanceComparison} />
            )}

            {activeComparison === 'competencies' && competencyComparison && (
              <CompetenciesComparison 
                comparison={competencyComparison}
                chartData={competencyChartData}
                chartOptions={chartOptions}
              />
            )}

            {activeComparison === 'progress' && analyticsData.performanceMetrics && (
              <ProgressComparison 
                performanceMetrics={analyticsData.performanceMetrics}
                peerData={peerData}
              />
            )}

            {activeComparison === 'benchmarks' && (
              <BenchmarksComparison 
                benchmarkChartData={benchmarkChartData}
                chartOptions={chartOptions}
                benchmarks={benchmarks}
                userScore={performanceComparison?.userScore}
              />
            )}

            {activeComparison === 'theme' && (
              <ThemeComparison 
                availableThemes={availableThemes}
                selectedTheme={selectedTheme}
                onThemeSelect={handleThemeSelect}
                themeComparisonData={themeComparisonData}
                themeLoading={themeLoading}
                chartOptions={chartOptions}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Overall Comparison Component
const OverallComparison = ({ comparison }) => (
  <div className="space-y-6">
    {/* Performance Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ComparisonCard
        title="Pontuação Média"
        userValue={comparison.userScore.toFixed(1)}
        peerValue={comparison.peerAverage}
        difference={comparison.scoreDifference}
        percentile={comparison.scorePercentile}
        icon={Target}
      />
      <ComparisonCard
        title="Palavras por Redação"
        userValue={Math.round(comparison.userWords)}
        peerValue={comparison.peerAverageWords}
        difference={comparison.wordsDifference}
        percentile={comparison.wordsPercentile}
        icon={BookOpen}
      />
      <ComparisonCard
        title="Redações Escritas"
        userValue={comparison.userEssays}
        peerValue={comparison.peerAverageEssays}
        difference={comparison.essaysDifference}
        icon={Calendar}
      />
    </div>

    {/* Benchmark Level */}
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${comparison.benchmarkLevel.color}20` }}
        >
          <Medal 
            className="w-6 h-6" 
            style={{ color: comparison.benchmarkLevel.color }}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Nível: {comparison.benchmarkLevel.label}
          </h3>
          <p className="text-gray-600">
            Sua pontuação média de {comparison.userScore.toFixed(1)} está no nível{' '}
            <span 
              className="font-semibold"
              style={{ color: comparison.benchmarkLevel.color }}
            >
              {comparison.benchmarkLevel.label}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Comparison Card Component
const ComparisonCard = ({ title, userValue, peerValue, difference, percentile, icon: Icon }) => {
  const ComparisonIcon = getComparisonIcon(difference);
  const colorClass = getComparisonColor(difference);

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Você:</span>
          <span className="text-xl font-bold text-gray-900">{userValue}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Média:</span>
          <span className="font-semibold text-gray-700">{peerValue}</span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-gray-600">Diferença:</span>
          <div className={`flex items-center gap-1 font-semibold ${colorClass}`}>
            <ComparisonIcon className="w-4 h-4" />
            {Math.abs(difference).toFixed(1)}
          </div>
        </div>
        
        {percentile && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Percentil:</span>
            <span className="font-semibold text-purple-600">{percentile}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Competencies Comparison Component
const CompetenciesComparison = ({ comparison, chartData, chartOptions }) => (
  <div className="space-y-6">
    {/* Chart */}
    {chartData && (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparação por Competência
        </h3>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    )}

    {/* Detailed Comparison */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {comparison.map((comp, index) => (
        <div key={comp.name} className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{comp.name}</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Você:</span>
              <span className="font-semibold">{comp.user.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Média:</span>
              <span className="font-semibold">{comp.peer.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-600">Performance:</span>
              <div className={`flex items-center gap-1 font-semibold ${getComparisonColor(comp.difference)}`}>
                {React.createElement(getComparisonIcon(comp.difference), { className: "w-4 h-4" })}
                {comp.percentage > 0 ? '+' : ''}{comp.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Progress Comparison Component
const ProgressComparison = ({ performanceMetrics, peerData }) => (
  <div className="space-y-6">
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Comparação de Progresso
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Sua Evolução</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de Melhoria:</span>
              <span className={`font-semibold ${getComparisonColor(performanceMetrics.improvementRate)}`}>
                {performanceMetrics.improvementRate > 0 ? '+' : ''}{performanceMetrics.improvementRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maior Pontuação:</span>
              <span className="font-semibold">{performanceMetrics.highestScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Menor Pontuação:</span>
              <span className="font-semibold">{performanceMetrics.lowestScore}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Benchmarks Típicos</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Melhoria Esperada:</span>
              <span className="font-semibold text-gray-700">+8-15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Meta Pontuação:</span>
              <span className="font-semibold text-gray-700">600+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consistência:</span>
              <span className="font-semibold text-gray-700">±100 pontos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Benchmarks Comparison Component
const BenchmarksComparison = ({ benchmarkChartData, chartOptions, benchmarks, userScore }) => (
  <div className="space-y-6">
    {/* Chart */}
    {benchmarkChartData && (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparação com Benchmarks
        </h3>
        <div className="h-64">
          <Bar data={benchmarkChartData} options={chartOptions} />
        </div>
      </div>
    )}

    {/* Benchmark Levels */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(benchmarks).map(([level, data]) => {
        const isUserLevel = userScore >= data.min && userScore <= data.max;
        
        return (
          <div 
            key={level}
            className={`p-4 rounded-xl border-2 ${
              isUserLevel 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${data.color}20` }}
              >
                <Star className="w-4 h-4" style={{ color: data.color }} />
              </div>
              <h4 className="font-semibold text-gray-900">{data.label}</h4>
              {isUserLevel && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                  Seu Nível
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {data.min} - {data.max} pontos
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

// Theme Comparison Component
const ThemeComparison = ({ 
  availableThemes, 
  selectedTheme, 
  onThemeSelect, 
  themeComparisonData, 
  themeLoading, 
  chartOptions 
}) => {
  if (availableThemes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum Tema Disponível
        </h3>
        <p className="text-gray-600">
          Escreva algumas redações para ver comparações por tema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Selector */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Selecione um Tema para Comparar
          </h3>
        </div>
        
        <select
          value={selectedTheme}
          onChange={(e) => onThemeSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">Escolha um tema...</option>
          {availableThemes.map(theme => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {themeLoading && (
        <div className="bg-gray-50 rounded-xl p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mr-3" />
            <span className="text-gray-600">Carregando dados de comparação...</span>
          </div>
        </div>
      )}

      {/* Theme Comparison Results */}
      {!themeLoading && themeComparisonData && (
        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sua Performance em "{themeComparisonData.theme_title}"
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Sua Pontuação</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {themeComparisonData.user_data.avg_score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Média do tema:</span>
                  <span className="font-medium">
                    {themeComparisonData.theme_data.avg_score.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Seu Percentil</span>
                  <span className="text-2xl font-bold text-green-600">
                    {themeComparisonData.user_data.percentile}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Top {100 - themeComparisonData.user_data.percentile}% neste tema
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Redações</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {themeComparisonData.user_data.essay_count}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {themeComparisonData.theme_data.total_essays} total no tema
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Suas Estatísticas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Melhor Pontuação:</span>
                  <span className="font-semibold">{themeComparisonData.user_data.best_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pior Pontuação:</span>
                  <span className="font-semibold">{themeComparisonData.user_data.worst_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Média de Palavras:</span>
                  <span className="font-semibold">{themeComparisonData.user_data.avg_words}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Estatísticas do Tema</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuários Participantes:</span>
                  <span className="font-semibold">{themeComparisonData.theme_data.total_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Melhor Pontuação:</span>
                  <span className="font-semibold">{themeComparisonData.theme_data.best_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Média de Palavras:</span>
                  <span className="font-semibold">{themeComparisonData.theme_data.avg_words}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {themeComparisonData.insights && themeComparisonData.insights.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Insights Personalizados
                </h3>
              </div>
              
              <div className="space-y-4">
                {themeComparisonData.insights.map((insight, index) => {
                  const getInsightIcon = (type) => {
                    switch (type) {
                      case 'strength': return '✅';
                      case 'improvement': return '⚡';
                      case 'info': return '💡';
                      default: return '📊';
                    }
                  };
                  
                  const getInsightColor = (type) => {
                    switch (type) {
                      case 'strength': return 'bg-green-100 border-green-200 text-green-800';
                      case 'improvement': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
                      case 'info': return 'bg-blue-100 border-blue-200 text-blue-800';
                      default: return 'bg-gray-100 border-gray-200 text-gray-800';
                    }
                  };
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getInsightIcon(insight.type)}</span>
                        <div>
                          <h5 className="font-semibold mb-1">{insight.title}</h5>
                          <p className="text-sm opacity-90">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Theme Selected */}
      {!selectedTheme && !themeLoading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Selecione um Tema
          </h3>
          <p className="text-gray-600">
            Escolha um tema acima para ver como você se compara com outros usuários.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonBenchmarks;