import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import useUserTier from '../hooks/useUserTier';
import { useNavigate } from 'react-router-dom';

import './EssaysDashboard.css';
import EssayDetailsModal from './EssayDetailsModal';

import { Line, Bar } from 'react-chartjs-2';

import { SmartIcon } from './ModernIcons';
import ModernGamificationPanel from './gamification/ModernGamificationPanel';
import AnalyticsCTA from './ui/AnalyticsCTA';

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
  Filler,
} from 'chart.js';

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
  Filler
);

const EssaysDashboard = () => {
  const { token, refreshToken, logout } = useAuth();
  const { isPremium } = useUserTier();
  const navigate = useNavigate();
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEssays, setExpandedEssays] = useState(new Set());
  const [deletingEssays, setDeletingEssays] = useState(new Set());
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [chartType, setChartType] = useState('evolucao'); // 'evolucao', 'competencias', 'tendencia', 'metas'
  const [selectedEssay, setSelectedEssay] = useState(null);

  console.log('DEBUG Dashboard: Token disponível:', token ? 'Sim' : 'Não');
  console.log('DEBUG Dashboard: Número de redações:', essays.length);
  console.log('DEBUG Dashboard: Loading:', loading);
  console.log('DEBUG Dashboard: Error:', error);

  useEffect(() => {
    if (token) {
      loadUserEssays();
      loadUserStats();
    }
  }, [token]);

  const loadUserStats = async (retryCount = 0) => {
    if (!token) {
      console.log('DEBUG: Token não disponível para carregar stats');
      return;
    }

    try {
      setLoadingStats(true);
      
      // Usar apiService em vez de fetch direto
      const { apiService } = await import('../services/api');
      const data = await apiService.getMyStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);

      // Retry automático apenas uma vez
      if (
        retryCount === 0 &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('body stream') ||
          error.message.includes('clone'))
      ) {
        console.log('DEBUG: Tentando carregar stats novamente...');
        setTimeout(() => loadUserStats(1), 500);
        return;
      }

      // Se falhar, definir stats vazio para evitar erros
      setStats({});
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUserEssays = async (retryCount = 0) => {
    console.log('DEBUG: Iniciando carregamento de redações...');
    console.log('DEBUG: Token disponível:', token ? 'Sim' : 'Não');

    if (!token) {
      console.log('DEBUG: Token não disponível, pulando carregamento');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(''); // Limpar erro anterior

      // Usar apiService em vez de fetch direto para evitar problemas com clone
      const { apiService } = await import('../services/api');
      const data = await apiService.getMyEssays();
      
      console.log('DEBUG: Dados recebidos:', data);

      if (Array.isArray(data)) {
        setEssays(data);
      } else {
        setEssays([]);
      }
    } catch (error) {
      console.error('DEBUG: Erro na requisição:', error);

      // Se for erro 401 (token inválido), tentar renovar token
      if (error.response?.status === 401) {
        console.log('DEBUG: Token inválido (401), tentando renovar...');

        // Tentar renovar token apenas uma vez
        if (retryCount === 0) {
          try {
            console.log('DEBUG: Chamando refreshToken()...');
            const renewed = await refreshToken();
            console.log('DEBUG: Resultado da renovação:', renewed);

            if (renewed) {
              console.log(
                'DEBUG: Token renovado com sucesso, tentando novamente...'
              );
              setTimeout(() => loadUserEssays(1), 1000);
              return;
            } else {
              console.log('DEBUG: Falha ao renovar token, fazendo logout...');
              setError(
                'Sessão expirada. Clique em "Tentar novamente" ou faça login novamente.'
              );
              setEssays([]);
              return;
            }
          } catch (refreshError) {
            console.log('DEBUG: Erro ao renovar token:', refreshError);
            setError(
              'Sessão expirada. Clique em "Tentar novamente" ou faça login novamente.'
            );
            setEssays([]);
            return;
          }
        } else {
          // Se já tentou renovar e ainda deu 401
          setError('Sessão expirada. Faça login novamente.');
          setTimeout(() => logout(), 3000);
          return;
        }
      }

      // Retry automático para erros específicos
      if (
        retryCount === 0 &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('body stream') ||
          error.message.includes('NetworkError') ||
          error.message.includes('TypeError') ||
          error.message.includes('clone'))
      ) {
        console.log(
          'DEBUG: Tentando novamente automaticamente em 2 segundos...'
        );
        setTimeout(() => loadUserEssays(1), 2000);
        return;
      }

      setError(`Erro de conexão: ${error.message}`);
      setEssays([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEssayExpansion = essayId => {
    const newExpanded = new Set(expandedEssays);
    if (newExpanded.has(essayId)) {
      newExpanded.delete(essayId);
    } else {
      newExpanded.add(essayId);
    }
    setExpandedEssays(newExpanded);
  };

  const deleteEssay = async essayId => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir esta redação? Esta ação não pode ser desfeita.'
      )
    ) {
      return;
    }

    try {
      setDeletingEssays(prev => new Set([...prev, essayId]));

      if (!token) {
        alert('Token de acesso não disponível. Faça login novamente.');
        return;
      }

      // Usar apiService em vez de fetch direto
      const { apiService } = await import('../services/api');
      await apiService.deleteEssay(essayId);

      setEssays(prev => prev.filter(essay => essay.id !== essayId));
      setExpandedEssays(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(essayId);
        return newExpanded;
      });
      alert('Redação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir redação:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido';
      alert(`Erro ao excluir redação: ${errorMessage}`);
    } finally {
      setDeletingEssays(prev => {
        const newDeleting = new Set(prev);
        newDeleting.delete(essayId);
        return newDeleting;
      });
    }
  };

  const formatScore = (score, essay = null) => {
    if (!score) return 'Não avaliada';
    
    // Detectar escala baseada na faculdade/tema
    let maxScore = 1000; // ENEM padrão
    
    if (essay && essay.theme_id) {
      const themeId = parseInt(essay.theme_id);
      if (32 <= themeId && themeId <= 47) { // ITA
        maxScore = 100;
      } else if (48 <= themeId && themeId <= 70) { // FUVEST
        maxScore = 50;
      } else if (71 <= themeId && themeId <= 90) { // UNESP
        maxScore = 100;
      } else if (91 <= themeId && themeId <= 110) { // UNIFESP
        maxScore = 100;
      } else if (111 <= themeId && themeId <= 130) { // PUC-RJ
        maxScore = 100;
      }
    }
    
    return `${Math.round(score)}/${maxScore}`;
  };

  const getScoreColor = score => {
    if (!score) return '#6b7280';
    if (score >= 800) return '#10b981';
    if (score >= 600) return '#f59e0b';
    return '#ef4444';
  };

  // Função para gerar dados do gráfico de tendência
  const getTrendChartData = () => {
    if (!stats.progress || stats.progress.length === 0) return { labels: [], datasets: [] };

    const scores = stats.progress.map(p => p.score);
    const labels = stats.progress.map(p => new Date(p.date).toLocaleDateString('pt-BR'));
    
    // Calcular linha de tendência usando regressão linear simples
    const n = scores.length;
    const sumX = scores.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + i * score, 0);
    const sumXX = scores.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Gerar pontos da linha de tendência
    const trendLine = scores.map((_, i) => slope * i + intercept);
    
    // Projeção futura (próximas 3 redações)
    const futureLabels = ['Próxima', 'Seguinte', 'Futura'];
    const futureProjection = [];
    for (let i = n; i < n + 3; i++) {
      futureProjection.push(slope * i + intercept);
    }

    return {
      labels: [...labels, ...futureLabels],
      datasets: [
        {
          label: 'Pontuações Reais',
          data: [...scores, ...Array(3).fill(null)],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'Linha de Tendência',
          data: [...trendLine, ...futureProjection],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
          fill: false,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Projeção',
          data: [...Array(n).fill(null), ...futureProjection],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderDash: [10, 5],
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  };

  // Função para configurar opções do gráfico de tendência
  const getTrendChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              family: 'Inter, sans-serif',
              size: 11,
            },
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#374151',
          bodyColor: '#374151',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          font: {
            family: 'Inter, sans-serif',
          },
          callbacks: {
            label: function(context) {
              const value = Math.round(context.parsed.y);
              if (context.datasetIndex === 2) {
                return `Projeção: ${value} pts`;
              } else if (context.datasetIndex === 1) {
                return `Tendência: ${value} pts`;
              }
              return `Pontuação: ${value} pts`;
            }
          }
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1000,
          grid: {
            color: 'rgba(156, 163, 175, 0.2)',
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 10,
            },
            callback: function(value) {
              return value + ' pts';
            }
          },
        },
        x: {
          grid: {
            color: 'rgba(156, 163, 175, 0.2)',
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 10,
            },
            maxRotation: 45,
          },
        },
      },
      elements: {
        point: {
          hoverBorderWidth: 3,
        },
        line: {
          borderWidth: 2,
        },
      },
    };
  };

  const renderChart = () => {
    if (!stats.progress || stats.progress.length === 0) {
      return (
        <div className='no-data'>
          <p className='font-body'>
            <SmartIcon
              type='bar-chart'
              size={20}
              className='inline mr-2'
              color='#718096'
            />
            Dados insuficientes para gerar gráficos
          </p>
          <p>Escreva mais redações para ver sua evolução!</p>
        </div>
      );
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              family: 'Inter, sans-serif',
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#374151',
          bodyColor: '#374151',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1000,
          grid: {
            color: 'rgba(156, 163, 175, 0.2)',
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 11,
            },
          },
        },
        x: {
          grid: {
            color: 'rgba(156, 163, 175, 0.2)',
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 11,
            },
          },
        },
      },
    };

    const progressData = {
      labels: stats.progress.map(p =>
        new Date(p.date).toLocaleDateString('pt-BR')
      ),
      datasets: [
        {
          label: 'Pontuação',
          data: stats.progress.map(p => p.score),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };

    const barData = {
      labels: stats.progress.map(p =>
        new Date(p.date).toLocaleDateString('pt-BR')
      ),
      datasets: [
        {
          label: 'Pontuação',
          data: stats.progress.map(p => p.score),
          backgroundColor: stats.progress.map(
            p => getScoreColor(p.score) + '80'
          ),
          borderColor: stats.progress.map(p => getScoreColor(p.score)),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    if (chartType === 'evolucao') {
      const scores = stats.progress.map(p => p.score);
      const maxScore = Math.max(...scores);
      const avgScore = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
      const lastScore = scores[scores.length - 1];
      const trend =
        scores.length > 1 ? lastScore - scores[scores.length - 2] : 0;

      return (
        <div className='evolucao-section'>
          {/* Subtítulo da Seção */}
          <div className='section-subtitle-evolucao'>
            <h2 className='text-lg font-extrabold text-gray-900'>
              Evolução das Notas
            </h2>
            <p className='text-gray-700 text-sm max-w-md mx-auto'>
              Acompanhe o progresso das suas redações ao longo do tempo
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className='stats-grid-evolucao'>
            <div className='stat-card-evolucao green'>
              <div>
                <p className='text-xs font-semibold'>Maior Nota</p>
                <p className='font-extrabold text-xl'>{maxScore}</p>
              </div>
              <SmartIcon type='trophy' size={24} />
            </div>
            <div className='stat-card-evolucao blue'>
              <div>
                <p className='text-xs font-semibold'>Média</p>
                <p className='font-extrabold text-xl'>{avgScore}</p>
              </div>
              <SmartIcon type='bar-chart' size={24} />
            </div>
            <div className='stat-card-evolucao purple'>
              <div>
                <p className='text-xs font-semibold'>Última</p>
                <p className='font-extrabold text-xl'>{lastScore}</p>
              </div>
              <SmartIcon type='star' size={24} />
            </div>
            <div className='stat-card-evolucao green'>
              <div>
                <p className='text-xs font-semibold'>Tendência</p>
                <p className='font-extrabold text-xl'>
                  {trend >= 0 ? '+' : ''}
                  {trend}
                </p>
              </div>
              <SmartIcon
                type={trend >= 0 ? 'trending-up' : 'trending-down'}
                size={24}
              />
            </div>
          </div>

          {/* Gráfico */}
          <div className='chart-wrapper-evolucao'>
            <h3 className='text-gray-900 font-extrabold flex items-center gap-2 mb-6 text-base'>
              <SmartIcon type='bar-chart' size={20} color='#8b5cf6' />
              Evolução das Suas Notas
            </h3>
            <Line data={progressData} options={chartOptions} />
          </div>
        </div>
      );
    }

    if (chartType === 'tendencia') {
      const scores = stats.progress.map(p => p.score);
      const trend =
        scores.length > 1
          ? scores[scores.length - 1] - scores[scores.length - 2]
          : 0;
      const consistency =
        scores.length > 2
          ? Math.max(...scores) - Math.min(...scores) < 100
            ? 'Alta'
            : 'Média'
          : 'Baixa';
      const nextGoal = Math.ceil((Math.max(...scores) + 30) / 50) * 50;

      return (
        <div className='tendencia-section'>
          <div className='tendencia-summary'>
            <div>
              <h2 className='font-merri font-bold text-sm sm:text-base mb-1'>
                Análise de Tendência
              </h2>
              <p className='text-xs sm:text-sm text-[#6b6f9c] mb-0.5'>
                Variação por <span className='font-semibold'>Redação</span>
              </p>
              <p className='font-merri font-bold text-lg sm:text-xl'>
                {trend} <span className='font-normal'>pts</span>
              </p>
            </div>
            <div>
              <p className='text-xs sm:text-sm text-[#6b6f9c] mb-0.5'>
                Consistência
              </p>
              <p className='font-merri font-bold text-lg sm:text-xl'>
                {consistency}
              </p>
            </div>
            <div>
              <p className='text-xs sm:text-sm text-[#6b6f9c] mb-0.5'>
                Próxima Meta
              </p>
              <p className='font-merri font-bold text-lg sm:text-xl'>
                {nextGoal}
              </p>
            </div>
            <div className='flex items-center gap-1 text-[#f59e0b] font-semibold text-sm sm:text-base'>
              <span className='w-5 h-[2px] bg-[#f59e0b] inline-block rounded'></span>
              {trend >= 50
                ? 'Crescendo'
                : trend > -50
                  ? 'Estável'
                  : 'Oscilando'}
            </div>
          </div>

          <div className='chart-wrapper-tendencia'>
            <h3 className='font-merri font-bold text-sm sm:text-base mb-4 flex items-center gap-2 text-[#1a1a1a]'>
              <SmartIcon type='rocket' size={16} color='#7c7cff' />
              Projeção de Crescimento
            </h3>
            <div className='w-full h-48 relative'>
              <Line data={getTrendChartData()} options={getTrendChartOptions()} />
            </div>
          </div>
        </div>
      );
    }

    if (chartType === 'metas') {
      const currentAvg = Math.round(
        stats.progress.reduce((a, b) => a + b.score, 0) / stats.progress.length
      );
      const metas = [
        {
          name: 'Aprovação Básica',
          score: 500,
          color: '#d94a3d',
          achieved: currentAvg >= 500,
        },
        {
          name: 'Boa Universidade',
          score: 700,
          color: '#f5a623',
          achieved: currentAvg >= 700,
        },
        {
          name: 'Universidade Top',
          score: 850,
          color: '#2a7de1',
          achieved: currentAvg >= 850,
        },
        {
          name: 'Nota Máxima',
          score: 1000,
          color: '#00a85a',
          achieved: currentAvg >= 1000,
        },
      ];

      return (
        <div className='metas-section'>
          <section className='current-average-meta'>
            <h2 className='text-[#3f006f] font-semibold text-base sm:text-lg'>
              Sua Média Atual
            </h2>
            <p className='text-[#00a85a] font-extrabold text-4xl sm:text-5xl leading-none'>
              {currentAvg}
            </p>
            <p className='text-[#5c5bff] text-sm font-medium flex justify-center items-center gap-1'>
              <SmartIcon type='trophy' size={16} color='#d18b00' /> Excelente!
            </p>
          </section>

          <div className='metas-grid'>
            {metas.map((meta, index) => {
              const progress = Math.min(
                100,
                Math.round((currentAvg / meta.score) * 100)
              );
              return (
                <article
                  key={index}
                  className='meta-card'
                  style={{
                    borderColor: meta.achieved ? '#00a85a' : meta.color,
                  }}
                >
                  <header className='flex justify-between items-start mb-2'>
                    <h3 className='font-semibold text-sm text-black max-w-[70%]'>
                      {meta.name}
                    </h3>
                    {meta.achieved ? (
                      <SmartIcon type='check' size={16} color='#00a85a' />
                    ) : (
                      <p className='text-[#f97316] text-xs font-semibold'>
                        Faltam {meta.score - currentAvg} pts
                      </p>
                    )}
                  </header>
                  <div className='flex justify-between items-center mb-1'>
                    <div className='flex flex-col'>
                      <p
                        className='font-semibold text-lg'
                        style={{ color: meta.color }}
                      >
                        {meta.score}
                      </p>
                      <p className='text-xs text-gray-600 font-medium'>
                        pontua��o
                      </p>
                    </div>
                    {meta.achieved && (
                      <p className='text-[#00a85a] text-xs font-semibold'>
                        Atingida!
                      </p>
                    )}
                  </div>
                  <div className='w-full h-2 rounded-full bg-[#d9d6f6] relative overflow-hidden'>
                    <div
                      className='absolute top-0 left-0 h-2 rounded-full bg-[#00a85a]'
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p
                    className='text-[9px] mt-1 font-semibold'
                    style={{ color: meta.color }}
                  >
                    {progress}% concluído
                  </p>
                  {meta.name === 'Nota Máxima' && !meta.achieved && (
                    <div className='mt-3 rounded border border-[#f5dcb0] bg-[#fff7e6] p-2 text-[10px] text-[#a66a00] flex items-center gap-1'>
                      <SmartIcon type='alert-circle' size={16} />
                      <span>
                        Você está próximo! Mais 2 redações bem feitas podem te
                        levar lá.
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      );
    }

    if (chartType === 'competencias') {
      const competenciasData = [
        {
          id: 'C1',
          name: 'Domínio da Escrita',
          description: 'Modalidade escrita formal da língua portuguesa',
          score: 191,
          color: '#10a56a',
        },
        {
          id: 'C2',
          name: 'Compreensão',
          description: 'Compreender a proposta e aplicar conhecimentos',
          score: 200,
          color: '#10a56a',
        },
        {
          id: 'C3',
          name: 'Organização',
          description: 'Selecionar e organizar informações e argumentos',
          score: 190,
          color: '#10a56a',
        },
        {
          id: 'C4',
          name: 'Linguística',
          description: 'Mecanismos linguísticos para argumentação',
          score: 174,
          color: '#3a64ff',
        },
        {
          id: 'C5',
          name: 'Intervenção',
          description: 'Proposta de intervenção respeitando direitos humanos',
          score: 184,
          color: '#10a56a',
        },
      ];

      // Calcular média geral das competências
      const mediaGeral = Math.round(
        competenciasData.reduce((sum, comp) => sum + comp.score, 0) / competenciasData.length
      );

      // Adicionar card de média geral
      const mediaGeralCard = {
        id: 'MG',
        name: 'Média Geral',
        description: 'Média de todas as competências',
        score: mediaGeral,
        color: '#8b5cf6',
        isMediaGeral: true,
      };

      return (
        <div className='competencias-section'>
          <div className='section-subtitle-competencias'>
            <h2 className='font-merri font-bold text-base sm:text-lg text-[#1a1a1a] mb-1'>
              Análise por Competências
            </h2>
            <p className='text-xs sm:text-sm text-[#4a4a4a] font-inter'>
              Veja seu desempenho em cada competência do ENEM
            </p>
          </div>
          <div className='competencias-grid'>
            {/* Primeira linha: C1 e C2 */}
            {competenciasData.slice(0, 2).map(comp => {
              const percentage = Math.round((comp.score / 200) * 100);
              const circumference = 2 * Math.PI * 45;
              const strokeDashoffset =
                circumference - (percentage / 100) * circumference;

              return (
                <article key={comp.id} className='competencia-card'>
                  <div className='competencia-card-header'>
                    <span
                      className='competencia-id'
                      style={{ color: comp.color }}
                    >
                      {comp.id}
                    </span>
                    <span
                      className='competencia-score-value'
                      style={{ color: comp.color }}
                    >
                      {comp.score}
                    </span>
                    <span className='competencia-name'>{comp.name}</span>
                    <p className='competencia-desc'>{comp.description}</p>
                  </div>
                  <div className='competencia-chart-container'>
                    <div className='competencia-chart-circle'>
                      <svg className='chart-svg' viewBox='0 0 100 100'>
                        <circle
                          className='chart-bg-circle'
                          cx='50'
                          cy='50'
                          r='45'
                        ></circle>
                        <circle
                          className='chart-progress-circle'
                          cx='50'
                          cy='50'
                          r='45'
                          stroke={comp.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        ></circle>
                      </svg>
                      <span
                        className='chart-percentage'
                        style={{ color: comp.color }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className='competencia-score-text'>
                    {comp.score}/200 pontos
                  </p>
                  <p className='competencia-status'>
                    <SmartIcon type='trophy' size={16} color='#f59e0b' />
                    <span style={{ color: comp.color, fontWeight: '600' }}>
                      Excelente!
                    </span>
                  </p>
                </article>
              );
            })}

            {/* Primeira linha continua��o: C3 */}
            {competenciasData.slice(2, 3).map(comp => {
              const percentage = Math.round((comp.score / 200) * 100);
              const circumference = 2 * Math.PI * 45;
              const strokeDashoffset =
                circumference - (percentage / 100) * circumference;

              return (
                <article key={comp.id} className='competencia-card'>
                  <div className='competencia-card-header'>
                    <span
                      className='competencia-id'
                      style={{ color: comp.color }}
                    >
                      {comp.id}
                    </span>
                    <span
                      className='competencia-score-value'
                      style={{ color: comp.color }}
                    >
                      {comp.score}
                    </span>
                    <span className='competencia-name'>{comp.name}</span>
                    <p className='competencia-desc'>{comp.description}</p>
                  </div>
                  <div className='competencia-chart-container'>
                    <div className='competencia-chart-circle'>
                      <svg className='chart-svg' viewBox='0 0 100 100'>
                        <circle
                          className='chart-bg-circle'
                          cx='50'
                          cy='50'
                          r='45'
                        ></circle>
                        <circle
                          className='chart-progress-circle'
                          cx='50'
                          cy='50'
                          r='45'
                          stroke={comp.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        ></circle>
                      </svg>
                      <span
                        className='chart-percentage'
                        style={{ color: comp.color }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className='competencia-score-text'>
                    {comp.score}/200 pontos
                  </p>
                  <p className='competencia-status'>
                    <SmartIcon type='trophy' size={16} color='#f59e0b' />
                    <span style={{ color: comp.color, fontWeight: '600' }}>
                      Excelente!
                    </span>
                  </p>
                </article>
              );
            })}

            {/* Card da Média Geral */}
            {(() => {
              const percentage = Math.round((mediaGeralCard.score / 200) * 100);
              const circumference = 2 * Math.PI * 45;
              const strokeDashoffset =
                circumference - (percentage / 100) * circumference;

              return (
                <article key={mediaGeralCard.id} className='competencia-card media-geral-card'>
                  <div className='competencia-card-header'>
                    <span
                      className='competencia-id'
                      style={{ color: mediaGeralCard.color }}
                    >
                      {mediaGeralCard.id}
                    </span>
                    <span
                      className='competencia-score-value'
                      style={{ color: mediaGeralCard.color }}
                    >
                      {mediaGeralCard.score}
                    </span>
                    <span className='competencia-name'>{mediaGeralCard.name}</span>
                    <p className='competencia-desc'>{mediaGeralCard.description}</p>
                  </div>
                  <div className='competencia-chart-container'>
                    <div className='competencia-chart-circle'>
                      <svg className='chart-svg' viewBox='0 0 100 100'>
                        <circle
                          className='chart-bg-circle'
                          cx='50'
                          cy='50'
                          r='45'
                        ></circle>
                        <circle
                          className='chart-progress-circle'
                          cx='50'
                          cy='50'
                          r='45'
                          stroke={mediaGeralCard.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        ></circle>
                      </svg>
                      <span
                        className='chart-percentage'
                        style={{ color: mediaGeralCard.color }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className='competencia-score-text'>
                    {mediaGeralCard.score}/200 pontos
                  </p>
                  <p className='competencia-status'>
                    <SmartIcon type='star' size={16} color='#f59e0b' />
                    <span style={{ color: mediaGeralCard.color, fontWeight: '600' }}>
                      Média Geral
                    </span>
                  </p>
                </article>
              );
            })()}

            {/* Segunda linha: C4 */}
            {competenciasData.slice(3, 4).map(comp => {
              const percentage = Math.round((comp.score / 200) * 100);
              const circumference = 2 * Math.PI * 45;
              const strokeDashoffset =
                circumference - (percentage / 100) * circumference;

              return (
                <article key={comp.id} className='competencia-card'>
                  <div className='competencia-card-header'>
                    <span
                      className='competencia-id'
                      style={{ color: comp.color }}
                    >
                      {comp.id}
                    </span>
                    <span
                      className='competencia-score-value'
                      style={{ color: comp.color }}
                    >
                      {comp.score}
                    </span>
                    <span className='competencia-name'>{comp.name}</span>
                    <p className='competencia-desc'>{comp.description}</p>
                  </div>
                  <div className='competencia-chart-container'>
                    <div className='competencia-chart-circle'>
                      <svg className='chart-svg' viewBox='0 0 100 100'>
                        <circle
                          className='chart-bg-circle'
                          cx='50'
                          cy='50'
                          r='45'
                        ></circle>
                        <circle
                          className='chart-progress-circle'
                          cx='50'
                          cy='50'
                          r='45'
                          stroke={comp.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        ></circle>
                      </svg>
                      <span
                        className='chart-percentage'
                        style={{ color: comp.color }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className='competencia-score-text'>
                    {comp.score}/200 pontos
                  </p>
                  <p className='competencia-status'>
                    <SmartIcon type='trophy' size={16} color='#f59e0b' />
                    <span style={{ color: comp.color, fontWeight: '600' }}>
                      Excelente!
                    </span>
                  </p>
                </article>
              );
            })}

            {/* Segunda linha continua��o: C5 */}
            {competenciasData.slice(4, 5).map(comp => {
              const percentage = Math.round((comp.score / 200) * 100);
              const circumference = 2 * Math.PI * 45;
              const strokeDashoffset =
                circumference - (percentage / 100) * circumference;

              return (
                <article key={comp.id} className='competencia-card'>
                  <div className='competencia-card-header'>
                    <span
                      className='competencia-id'
                      style={{ color: comp.color }}
                    >
                      {comp.id}
                    </span>
                    <span
                      className='competencia-score-value'
                      style={{ color: comp.color }}
                    >
                      {comp.score}
                    </span>
                    <span className='competencia-name'>{comp.name}</span>
                    <p className='competencia-desc'>{comp.description}</p>
                  </div>
                  <div className='competencia-chart-container'>
                    <div className='competencia-chart-circle'>
                      <svg className='chart-svg' viewBox='0 0 100 100'>
                        <circle
                          className='chart-bg-circle'
                          cx='50'
                          cy='50'
                          r='45'
                        ></circle>
                        <circle
                          className='chart-progress-circle'
                          cx='50'
                          cy='50'
                          r='45'
                          stroke={comp.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        ></circle>
                      </svg>
                      <span
                        className='chart-percentage'
                        style={{ color: comp.color }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className='competencia-score-text'>
                    {comp.score}/200 pontos
                  </p>
                  <p className='competencia-status'>
                    <SmartIcon type='trophy' size={16} color='#f59e0b' />
                    <span style={{ color: comp.color, fontWeight: '600' }}>
                      Excelente!
                    </span>
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const getCompetenciaDescription = comp => {
    const descriptions = {
      C1: 'Domínio da modalidade escrita formal',
      C2: 'Compreender a proposta de redação',
      C3: 'Selecionar e organizar informações',
      C4: 'Demonstrar conhecimento dos mecanismos linguísticos',
      C5: 'Elaborar proposta de intervenção',
    };
    return descriptions[comp] || '';
  };

  return (
    <div className='essays-dashboard'>
      <div className='dashboard-header'>
        <h2 className='dashboard-title font-display'>
          <SmartIcon
            type='book-open'
            size={32}
            color='#1a202c'
            className='inline-block mr-3'
          />
          Minhas Redações
        </h2>
        <p className='dashboard-subtitle font-body'>
          Gerencie suas redações, veja feedbacks e acompanhe seu progresso
        </p>
      </div>

      {/* Painel de Gamificação */}
      <div className='gamification-section mb-8'>
        <ModernGamificationPanel compact={false} />
      </div>

      {/* CTA Analytics Premium - só para usuários não premium */}
      {!isPremium && (
        <div className="mb-8">
          <AnalyticsCTA />
        </div>
      )}

      {loading && (
        <div className='loading-state'>
          <div className='loading-spinner'></div>
          <p>Carregando suas redações...</p>
        </div>
      )}

      {error && (
        <div className='error-state'>
          <div className='error-icon'>
            <SmartIcon type='x-circle' size={48} color='#f56565' />
          </div>
          <p>{error}</p>
          <button onClick={loadUserEssays} className='retry-button'>
            <SmartIcon
              type='rotate-ccw'
              size={16}
              className='inline-block mr-2'
            />
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && essays.length === 0 && (
        <div className='empty-state'>
          <div className='empty-icon'>
            <SmartIcon type='file-text' size={64} color='#a0aec0' />
          </div>
          <h3 className='font-display'>Nenhuma redação encontrada</h3>
          <p className='font-body'>Você ainda não escreveu nenhuma redação.</p>
          <p className='font-body'>Comece escrevendo sua primeira redação!</p>
        </div>
      )}

      {!loading && !error && essays.length > 0 && (
        <div className='essays-list'>
          {essays.map(essay => (
            <div key={essay.id} className='essay-card'>
              <div className='essay-header'>
                <div className='essay-info'>
                  <h3 className='essay-theme'>{essay.theme_title}</h3>
                  <div className='essay-meta'>
                    <span className='essay-date'>
                      📅{' '}
                      {new Date(essay.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className='essay-score'
                      style={{ color: getScoreColor(essay.score) }}
                    >
                      📊 {formatScore(essay.score, essay)}
                    </span>
                  </div>
                </div>

                <div className='essay-actions'>
                  <button
                    className={`expand-button ${expandedEssays.has(essay.id) ? 'expanded' : ''}`}
                    onClick={() => toggleEssayExpansion(essay.id)}
                    title={
                      expandedEssays.has(essay.id)
                        ? 'Ocultar redação'
                        : 'Ver redação completa'
                    }
                  >
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='expand-icon'
                    >
                      <polyline points='6,9 12,15 18,9'></polyline>
                    </svg>
                  </button>

                  <button
                    className='details-button'
                    onClick={() => setSelectedEssay(essay)}
                    title='Ver detalhes completos'
                  >
                    <SmartIcon type='eye' size={18} />
                  </button>
                  <button
                    className='delete-button'
                    onClick={() => deleteEssay(essay.id)}
                    disabled={deletingEssays.has(essay.id)}
                    title='Excluir redação'
                  >
                    {deletingEssays.has(essay.id) ? (
                      <div className='delete-spinner'></div>
                    ) : (
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                      >
                        <polyline points='3,6 5,6 21,6'></polyline>
                        <path d='m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2'></path>
                        <line x1='10' y1='11' x2='10' y2='17'></line>
                        <line x1='14' y1='11' x2='14' y2='17'></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`essay-content ${expandedEssays.has(essay.id) ? 'expanded' : ''}`}
              >
                <div className='essay-text'>
                  <div className='content-section'>
                    <h4 className='font-display'>
                      <SmartIcon
                        type='file-text'
                        size={18}
                        className='inline mr-2'
                        color='#667eea'
                      />
                      Redação:
                    </h4>
                    <div className='essay-body'>
                      {essay.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  {essay.feedback && (
                    <div className='content-section'>
                      <h4 className='font-display'>
                        <SmartIcon
                          type='bot'
                          size={18}
                          className='inline mr-2'
                          color='#10b981'
                        />
                        Feedback da IA:
                      </h4>
                      <div className='feedback-content'>
                        {essay.feedback.split('\n').map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {essay.grammar_errors && essay.grammar_errors.length > 0 && (
                    <div className='content-section'>
                      <h4 className='font-display'>
                        <SmartIcon
                          type='book'
                          size={18}
                          className='inline mr-2'
                          color='#f59e0b'
                        />
                        Sugestões Gramaticais:
                      </h4>
                      <div className='grammar-suggestions'>
                        {essay.grammar_errors
                          .slice(0, 3)
                          .map((error, index) => (
                            <div key={index} className='grammar-item'>
                              <span className='grammar-message'>
                                {error.message}
                              </span>
                              {error.replacements &&
                                error.replacements.length > 0 && (
                                  <span className='grammar-suggestion'>
                                    → {error.replacements[0].value}
                                  </span>
                                )}
                            </div>
                          ))}
                        {essay.grammar_errors.length > 3 && (
                          <p className='grammar-more'>
                            +{essay.grammar_errors.length - 3} outras
                            sugestões...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      {!loading && !error && essays.length > 0 && (
        <div className='analysis-section'>
          {/* Header with Title and Nav */}
          <div className='analysis-header'>
            <h2 className='analysis-title'>
              <SmartIcon type='bar-chart' size={24} /> Análise de Desempenho
            </h2>
            <nav className='analysis-nav'>
              <button
                className={`nav-button ${chartType === 'evolucao' ? 'active' : ''}`}
                onClick={() => setChartType('evolucao')}
              >
                <SmartIcon type='line-chart' size={16} /> Evolução
              </button>
              <button
                className={`nav-button ${chartType === 'competencias' ? 'active' : ''}`}
                onClick={() => setChartType('competencias')}
              >
                <SmartIcon type='target' size={16} /> Competências
              </button>
              <button
                className={`nav-button ${chartType === 'tendencia' ? 'active' : ''}`}
                onClick={() => setChartType('tendencia')}
              >
                <SmartIcon type='rocket' size={16} /> Tendência
              </button>
              <button
                className={`nav-button ${chartType === 'metas' ? 'active' : ''}`}
                onClick={() => setChartType('metas')}
              >
                <SmartIcon type='award' size={16} /> Metas
              </button>
            </nav>
          </div>

          {/* Chart Content */}
          {loadingStats ? (
            <div className='charts-loading'>
              <div className='loading-spinner'></div>
              <p>Carregando estatísticas...</p>
            </div>
          ) : (
            <div className='charts-content'>{renderChart()}</div>
          )}
        </div>
      )}

      {/* Modal de Detalhes com Layout Personalizado */}
      <EssayDetailsModal
        selectedEssay={selectedEssay}
        onClose={() => setSelectedEssay(null)}
      />
    </div>
  );
};

export default EssaysDashboard;
