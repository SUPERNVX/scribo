// Advanced Analytics Dashboard Component
import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Award,
  BookOpen,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useWritingAnalytics } from '../../hooks/useWritingAnalytics';
import ModernButton from '../ModernButton';
import GradientText from '../GradientText';
import InsightsEngine from './InsightsEngine';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

/**
 * Analytics Dashboard Component
 */
export const AnalyticsDashboard = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const { analyticsData, loading, error, exportData, refetch } = useWritingAnalytics(timeRange);

  // Chart color scheme
  const colors = {
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    gradient: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
  };

  // Time range options
  const timeRangeOptions = [
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mês' },
    { value: 'quarter', label: 'Últimos 3 Meses' },
    { value: 'year', label: 'Último Ano' },
    { value: 'all', label: 'Todo Período' },
  ];

  // Tab options
  const tabOptions = [
    { value: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { value: 'performance', label: 'Performance', icon: TrendingUp },
    { value: 'competencies', label: 'Competências', icon: Target },
    { value: 'patterns', label: 'Padrões', icon: Activity },
    { value: 'insights', label: 'Insights', icon: Award },
  ];

  // Performance metrics cards data
  const performanceCards = useMemo(() => {
    if (!analyticsData?.performanceMetrics) return [];

    const pm = analyticsData.performanceMetrics;
    return [
      {
        title: 'Pontuação Média',
        value: pm.averageScore.toFixed(1),
        change: pm.improvementRate,
        icon: Target,
        color: 'primary',
      },
      {
        title: 'Redações Escritas',
        value: pm.totalEssays,
        change: null,
        icon: BookOpen,
        color: 'secondary',
      },
      {
        title: 'Palavras Totais',
        value: pm.totalWords.toLocaleString(),
        change: null,
        icon: PieChart,
        color: 'success',
      },
      {
        title: 'Média de Palavras',
        value: Math.round(pm.averageWords),
        change: null,
        icon: BarChart3,
        color: 'warning',
      },
    ];
  }, [analyticsData]);

  // Progress chart data
  const progressChartData = useMemo(() => {
    if (!analyticsData?.performanceMetrics?.progressTrend) return null;

    const trend = analyticsData.performanceMetrics.progressTrend;

    return {
      labels: trend.map((_, index) => `Redação ${index + 1}`),
      datasets: [
        {
          label: 'Pontuação',
          data: trend.map(point => point.y),
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}20`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [analyticsData, colors]);

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
        borderColor: colors.primary,
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

  // Handle PDF export
  const handleExportPDF = () => {
    if (!analyticsData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text('Relatório de Evolução - Scribo', margin, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${timeRangeOptions.find(opt => opt.value === timeRange)?.label || timeRange}`, margin, 45);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 55);

    let yPosition = 75;

    // Performance Metrics
    if (analyticsData.performanceMetrics) {
      const pm = analyticsData.performanceMetrics;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('📊 Métricas de Performance', margin, yPosition);
      yPosition += 15;

      const performanceData = [
        ['Pontuação Média', pm.averageScore.toFixed(1)],
        ['Redações Escritas', pm.totalEssays.toString()],
        ['Palavras Totais', pm.totalWords.toLocaleString()],
        ['Média de Palavras', Math.round(pm.averageWords).toString()],
        ['Taxa de Melhoria', `${pm.improvementRate.toFixed(1)}%`],
        ['Maior Pontuação', pm.highestScore.toString()],
        ['Menor Pontuação', pm.lowestScore.toString()]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: performanceData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [139, 92, 246] }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Progress Summary
    if (analyticsData.performanceMetrics?.progressTrend?.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('📈 Evolução das Pontuações', margin, yPosition);
      yPosition += 15;

      const progressData = analyticsData.performanceMetrics.progressTrend.map((point, index) => [
        `Redação ${index + 1}`,
        point.y.toString(),
        new Date(point.date).toLocaleDateString('pt-BR')
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Redação', 'Pontuação', 'Data']],
        body: progressData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [6, 182, 212] }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Insights
    if (analyticsData.insights?.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('💡 Insights Personalizados', margin, yPosition);
      yPosition += 15;

      analyticsData.insights.forEach((insight, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        const typeEmoji = insight.type === 'strength' ? '✅' : insight.type === 'improvement' ? '⚠️' : '💡';
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${typeEmoji} ${insight.title}`, margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const splitDescription = doc.splitTextToSize(insight.description, pageWidth - 2 * margin);
        doc.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 5 + 10;
      });
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages} - Scribo Analytics`, pageWidth - margin - 50, doc.internal.pageSize.height - 10);
    }

    // Save the PDF
    doc.save(`relatorio-evolucao-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-gray-600">Carregando analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao Carregar Analytics
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <ModernButton onClick={refetch} variant="primary">
            Tentar Novamente
          </ModernButton>
        </div>
      </div>
    );
  }

  if (!analyticsData || analyticsData.totalEssays === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <BookOpen className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum Dado Disponível
          </h3>
          <p className="text-gray-600">
            Escreva algumas redações para ver suas estatísticas aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              <GradientText>Analytics Avançado</GradientText>
            </h2>
            <p className="text-gray-600 mt-1">
              Análise detalhada do seu progresso na escrita
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Export Button */}
            <div className="flex gap-2">
              <ModernButton
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </ModernButton>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          {tabOptions.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.value
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                performanceCards={performanceCards}
                progressChartData={progressChartData}
                chartOptions={chartOptions}
                colors={colors}
              />
            )}

            {activeTab === 'performance' && (
              <PerformanceTab
                progressChartData={progressChartData}
                chartOptions={chartOptions}
                performanceMetrics={analyticsData.performanceMetrics}
              />
            )}

            {activeTab === 'competencies' && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Competências em Desenvolvimento
                </h3>
                <p className="text-gray-600">
                  Esta funcionalidade será implementada em breve.
                </p>
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Padrões em Desenvolvimento
                </h3>
                <p className="text-gray-600">
                  Esta funcionalidade será implementada em breve.
                </p>
              </div>
            )}

            {activeTab === 'insights' && (
              <InsightsEngine 
                analyticsData={analyticsData}
                timeRange={timeRange}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Trend Projection Component
const TrendProjectionChart = ({ progressChartData, colors }) => {
  const projectionData = useMemo(() => {
    if (!progressChartData?.datasets?.[0]?.data) return null;

    const actualData = progressChartData.datasets[0].data;
    const labels = progressChartData.labels;

    // Calculate trend projection using linear regression
    const n = actualData.length;
    if (n < 2) return null;

    // Calculate slope and intercept for trend line
    const xValues = actualData.map((_, i) => i);
    const yValues = actualData;

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate projection for next 3 points
    const projectionPoints = [];
    for (let i = 0; i < 3; i++) {
      const x = n + i;
      const y = slope * x + intercept;
      projectionPoints.push(Math.max(0, Math.min(1000, y))); // Clamp between 0-1000
    }

    // Combine actual and projected data
    const combinedLabels = [...labels, 'Próxima', 'Seguinte', 'Futura'];

    return {
      labels: combinedLabels,
      datasets: [
        {
          label: 'Pontuação Real',
          data: [...actualData, ...Array(3).fill(null)],
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}20`,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'Projeção de Tendência',
          data: [...Array(actualData.length - 1).fill(null), actualData[actualData.length - 1], ...projectionPoints],
          borderColor: colors.success,
          backgroundColor: `${colors.success}20`,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointBackgroundColor: colors.success,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ],
    };
  }, [progressChartData, colors]);

  const projectionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 10 },
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const actualLength = progressChartData?.datasets?.[0]?.data?.length || 0;
            return index >= actualLength ? 'Projeção' : 'Real';
          },
          label: (context) => {
            return `Pontuação: ${context.parsed.y?.toFixed(1) || 'N/A'}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 0,
        max: 1000,
      },
    },
    elements: {
      point: {
        hoverRadius: 4,
      },
    },
  };

  if (!projectionData) {
    return (
      <div className="h-16 flex items-center justify-center text-gray-400 text-xs">
        Dados insuficientes para projeção
      </div>
    );
  }

  return (
    <div className="h-16">
      <Line data={projectionData} options={projectionOptions} />
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ performanceCards, progressChartData, chartOptions, colors }) => (
  <div className="space-y-6">
    {/* Performance Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {performanceCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${card.color === 'primary' ? 'purple' : card.color === 'secondary' ? 'cyan' : card.color === 'success' ? 'green' : 'yellow'}-100`}>
                <Icon className={`w-5 h-5 text-${card.color === 'primary' ? 'purple' : card.color === 'secondary' ? 'cyan' : card.color === 'success' ? 'green' : 'yellow'}-600`} />
              </div>
              {card.change !== null && (
                <div className={`flex items-center text-sm ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="ml-1">{Math.abs(card.change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>
          </motion.div>
        );
      })}
    </div>

    {/* Progress Chart */}
    {progressChartData && (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Evolução das Pontuações
        </h3>
        <div className="h-64">
          <Line data={progressChartData} options={chartOptions} />
        </div>
      </div>
    )}

    {/* Trend Analysis Section */}
    {progressChartData && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Projection Pill */}
        <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Projeção de Crescimento
              </h4>
              <p className="text-sm text-gray-600">
                Baseada na sua tendência atual de melhoria
              </p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Tendência Positiva</span>
            </div>
          </div>

          {/* Real Trend Chart */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <TrendProjectionChart
              progressChartData={progressChartData}
              colors={colors}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Próxima Projeção</p>
              <p className="text-lg font-bold text-green-600">
                {progressChartData?.datasets?.[0]?.data?.length > 1 ?
                  Math.round(
                    progressChartData.datasets[0].data[progressChartData.datasets[0].data.length - 1] +
                    (progressChartData.datasets[0].data.reduce((acc, val, i, arr) =>
                      i > 0 ? acc + (val - arr[i - 1]) : acc, 0) / Math.max(1, progressChartData.datasets[0].data.length - 1))
                  ) : '---'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Meta Sugerida</p>
              <p className="text-lg font-bold text-blue-600">
                {progressChartData?.datasets?.[0]?.data?.length > 0 ?
                  Math.min(1000, Math.round(Math.max(...progressChartData.datasets[0].data) + 50)) : '---'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <h5 className="font-semibold text-gray-900">Consistência</h5>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {progressChartData?.datasets?.[0]?.data?.length > 2 ?
                Math.round(
                  (1 - (progressChartData.datasets[0].data.reduce((acc, val, i, arr) =>
                    i > 0 ? acc + Math.abs(val - arr[i - 1]) : acc, 0) /
                    (progressChartData.datasets[0].data.length * 100))) * 100
                ) : 0
              }%
            </p>
            <p className="text-xs text-gray-600">Estabilidade nas notas</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <h5 className="font-semibold text-gray-900">Velocidade</h5>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {progressChartData?.datasets?.[0]?.data?.length > 1 ?
                Math.abs(Math.round(
                  (progressChartData.datasets[0].data.reduce((acc, val, i, arr) =>
                    i > 0 ? acc + (val - arr[i - 1]) : acc, 0) /
                    Math.max(1, progressChartData.datasets[0].data.length - 1)) * 10
                )) : 0
              } pts/redação
            </p>
            <p className="text-xs text-gray-600">Melhoria média</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Performance Tab Component
const PerformanceTab = ({ progressChartData, chartOptions, performanceMetrics }) => (
  <div className="space-y-6">
    {progressChartData && (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Progresso Detalhado
        </h3>
        <div className="h-80">
          <Line data={progressChartData} options={chartOptions} />
        </div>
      </div>
    )}

    {performanceMetrics && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Estatísticas de Pontuação</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Maior Pontuação:</span>
              <span className="font-semibold">{performanceMetrics.highestScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Menor Pontuação:</span>
              <span className="font-semibold">{performanceMetrics.lowestScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pontuação Média:</span>
              <span className="font-semibold">{performanceMetrics.averageScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Estatísticas de Escrita</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de Redações:</span>
              <span className="font-semibold">{performanceMetrics.totalEssays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Redações Avaliadas:</span>
              <span className="font-semibold">{performanceMetrics.scoredEssays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Média de Palavras:</span>
              <span className="font-semibold">{Math.round(performanceMetrics.averageWords)}</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default AnalyticsDashboard;