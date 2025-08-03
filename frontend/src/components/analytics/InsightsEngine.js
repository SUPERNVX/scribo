// Personalized Insights Engine Component
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Clock,
  Zap,
  Filter,
} from 'lucide-react';

import ModernButton from '../ModernButton';
import GradientText from '../GradientText';

/**
 * Insights Engine Component
 * Generates and displays personalized insights based on user data
 */
export const InsightsEngine = ({ 
  analyticsData, 
  className = '',
  showFilters = true,
  maxInsights = null 
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedInsight, setExpandedInsight] = useState(null);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Todos', icon: Lightbulb },
    { value: 'strength', label: 'Pontos Fortes', icon: Award },
    { value: 'improvement', label: 'Melhorias', icon: TrendingUp },
    { value: 'recommendation', label: 'Recomendações', icon: Target },
  ];

  // Generate comprehensive insights
  const generateComprehensiveInsights = useMemo(() => {
    if (!analyticsData) return [];

    const insights = [];
    const { performanceMetrics, competencyAnalysis, writingPatterns } = analyticsData;

    // Performance-based insights
    if (performanceMetrics) {
      const pm = performanceMetrics;

      // Score improvement insights
      if (pm.improvementRate > 15) {
        insights.push({
          id: 'excellent-progress',
          type: 'strength',
          title: 'Progresso Excepcional!',
          description: `Sua pontuação melhorou impressionantes ${pm.improvementRate.toFixed(1)}% ao longo do tempo. Continue assim!`,
          priority: 'high',
          actionable: false,
          category: 'performance',
          impact: 'high',
          timeToImplement: null,
          relatedMetrics: ['score_improvement'],
          suggestions: [
            'Mantenha a consistência na prática',
            'Documente suas estratégias de sucesso',
            'Compartilhe suas técnicas com outros estudantes'
          ]
        });
      } else if (pm.improvementRate > 5) {
        insights.push({
          id: 'good-progress',
          type: 'strength',
          title: 'Bom Progresso',
          description: `Você está melhorando consistentemente com ${pm.improvementRate.toFixed(1)}% de melhoria.`,
          priority: 'medium',
          actionable: true,
          category: 'performance',
          impact: 'medium',
          timeToImplement: '1-2 semanas',
          relatedMetrics: ['score_improvement'],
          suggestions: [
            'Identifique padrões nas suas melhores redações',
            'Foque em manter a qualidade consistente',
            'Estabeleça metas de pontuação específicas'
          ]
        });
      } else if (pm.improvementRate < -5) {
        insights.push({
          id: 'declining-performance',
          type: 'improvement',
          title: 'Atenção: Queda na Performance',
          description: `Suas pontuações recentes estão ${Math.abs(pm.improvementRate).toFixed(1)}% abaixo da média. Vamos identificar o que pode estar acontecendo.`,
          priority: 'high',
          actionable: true,
          category: 'performance',
          impact: 'high',
          timeToImplement: 'imediato',
          relatedMetrics: ['score_decline'],
          suggestions: [
            'Revise os fundamentos da redação ENEM',
            'Analise suas últimas redações em detalhes',
            'Considere buscar feedback adicional',
            'Pratique com temas similares aos que teve dificuldade'
          ]
        });
      }

      // Word count insights
      if (pm.averageWords < 250) {
        insights.push({
          id: 'low-word-count',
          type: 'improvement',
          title: 'Desenvolva Mais Suas Ideias',
          description: `Sua média de ${Math.round(pm.averageWords)} palavras está abaixo do ideal (300-400 palavras). Redações mais desenvolvidas tendem a ter pontuações maiores.`,
          priority: 'medium',
          actionable: true,
          category: 'writing_style',
          impact: 'medium',
          timeToImplement: '2-3 semanas',
          relatedMetrics: ['word_count'],
          suggestions: [
            'Expanda cada argumento com exemplos concretos',
            'Adicione mais detalhes na contextualização',
            'Desenvolva melhor a proposta de intervenção',
            'Use conectivos para criar parágrafos mais fluidos'
          ]
        });
      } else if (pm.averageWords > 450) {
        insights.push({
          id: 'high-word-count',
          type: 'recommendation',
          title: 'Otimize a Concisão',
          description: `Sua média de ${Math.round(pm.averageWords)} palavras está acima do ideal. Foque na qualidade e objetividade.`,
          priority: 'low',
          actionable: true,
          category: 'writing_style',
          impact: 'low',
          timeToImplement: '1-2 semanas',
          relatedMetrics: ['word_count'],
          suggestions: [
            'Elimine repetições desnecessárias',
            'Seja mais direto nos argumentos',
            'Revise para remover palavras redundantes',
            'Foque na precisão das ideias'
          ]
        });
      }

      // Consistency insights
      if (pm.totalEssays >= 5) {
        const scoreVariation = pm.highestScore - pm.lowestScore;
        if (scoreVariation > 300) {
          insights.push({
            id: 'inconsistent-performance',
            type: 'improvement',
            title: 'Melhore a Consistência',
            description: `Há uma grande variação entre sua maior (${pm.highestScore}) e menor (${pm.lowestScore}) pontuação. Trabalhe na estabilidade.`,
            priority: 'medium',
            actionable: true,
            category: 'consistency',
            impact: 'medium',
            timeToImplement: '3-4 semanas',
            relatedMetrics: ['score_variation'],
            suggestions: [
              'Crie um checklist de revisão',
              'Pratique com cronômetro para simular a prova',
              'Identifique seus erros mais comuns',
              'Desenvolva uma estrutura padrão de redação'
            ]
          });
        }
      }
    }

    // Competency-based insights
    if (competencyAnalysis && competencyAnalysis.competencyAverages) {
      const competencies = competencyAnalysis.competencyAverages;
      const competencyNames = {
        competency1: 'Domínio da Norma Padrão',
        competency2: 'Compreensão da Proposta',
        competency3: 'Seleção de Informações',
        competency4: 'Coesão e Coerência',
        competency5: 'Proposta de Intervenção',
      };

      // Find strongest and weakest competencies
      const sortedCompetencies = Object.entries(competencies)
        .sort(([,a], [,b]) => b - a);
      
      if (sortedCompetencies.length === 0) return insights;
      
      const strongest = sortedCompetencies[0];
      const weakest = sortedCompetencies[sortedCompetencies.length - 1];

      // Strongest competency insight
      if (strongest && strongest[1] >= 160) {
        insights.push({
          id: 'strong-competency',
          type: 'strength',
          title: `Excelente ${competencyNames[strongest[0]]}`,
          description: `Sua competência em "${competencyNames[strongest[0]]}" está muito boa (${strongest[1].toFixed(0)} pontos). Use isso como base para as outras.`,
          priority: 'medium',
          actionable: true,
          category: 'competency',
          impact: 'medium',
          timeToImplement: '1 semana',
          relatedMetrics: [strongest[0]],
          suggestions: [
            'Use essa força para compensar outras competências',
            'Ajude colegas nesta área para reforçar seu conhecimento',
            'Mantenha o padrão de qualidade nesta competência'
          ]
        });
      }

      // Weakest competency insight
      if (weakest && weakest[1] < 140) {
        const competencyTips = {
          competency1: [
            'Revise regras de concordância e regência',
            'Pratique pontuação e acentuação',
            'Leia textos formais para absorver a norma padrão',
            'Use corretor ortográfico durante a prática'
          ],
          competency2: [
            'Leia a proposta pelo menos 3 vezes',
            'Sublinhe palavras-chave do tema',
            'Identifique o tipo de texto solicitado',
            'Pratique interpretação de textos motivadores'
          ],
          competency3: [
            'Amplie seu repertório sociocultural',
            'Conecte informações de diferentes áreas',
            'Use dados e estatísticas quando apropriado',
            'Relacione o tema com conhecimentos históricos/atuais'
          ],
          competency4: [
            'Estude conectivos e suas funções',
            'Pratique a estrutura dissertativa',
            'Trabalhe a progressão de ideias',
            'Revise a coesão entre parágrafos'
          ],
          competency5: [
            'Detalhe mais sua proposta de intervenção',
            'Inclua agente, ação, meio, finalidade e detalhamento',
            'Conecte a proposta com o problema apresentado',
            'Torne a proposta mais específica e viável'
          ]
        };

        insights.push({
          id: 'weak-competency',
          type: 'improvement',
          title: `Foque na ${competencyNames[weakest[0]]}`,
          description: `Esta é sua competência com menor pontuação (${weakest[1].toFixed(0)} pontos). Melhorar aqui pode aumentar significativamente sua nota.`,
          priority: 'high',
          actionable: true,
          category: 'competency',
          impact: 'high',
          timeToImplement: '2-4 semanas',
          relatedMetrics: [weakest[0]],
          suggestions: competencyTips[weakest[0]] || []
        });
      }

      // Competency improvement insights
      if (competencyAnalysis.competencyImprovements) {
        const improvements = competencyAnalysis.competencyImprovements;
        const bestImprovement = Object.entries(improvements)
          .sort(([,a], [,b]) => b - a)[0];

        if (bestImprovement && bestImprovement[1] > 20) {
          insights.push({
            id: 'competency-improvement',
            type: 'strength',
            title: `Melhoria Notável em ${competencyNames[bestImprovement[0]]}`,
            description: `Você melhorou ${bestImprovement[1].toFixed(1)} pontos nesta competência. Identifique o que funcionou e aplique nas outras.`,
            priority: 'medium',
            actionable: true,
            category: 'competency',
            impact: 'medium',
            timeToImplement: '1-2 semanas',
            relatedMetrics: [bestImprovement[0]],
            suggestions: [
              'Analise suas redações mais recentes desta competência',
              'Identifique as técnicas que funcionaram',
              'Aplique estratégias similares em outras competências',
              'Mantenha o foco nesta área de melhoria'
            ]
          });
        }
      }
    }

    // Writing pattern insights
    if (writingPatterns) {
      const wp = writingPatterns;

      // Streak insights
      if (wp.currentStreak >= 7) {
        insights.push({
          id: 'great-streak',
          type: 'strength',
          title: 'Consistência Impressionante!',
          description: `Você está em uma sequência de ${wp.currentStreak} dias escrevendo. A prática regular é fundamental para o sucesso.`,
          priority: 'medium',
          actionable: false,
          category: 'habits',
          impact: 'high',
          timeToImplement: null,
          relatedMetrics: ['writing_streak'],
          suggestions: [
            'Continue mantendo essa rotina',
            'Varie os temas para não ficar monótono',
            'Celebre essa conquista!',
            'Inspire outros com sua dedicação'
          ]
        });
      } else if (wp.currentStreak === 0 && wp.maxStreak > 0) {
        insights.push({
          id: 'broken-streak',
          type: 'recommendation',
          title: 'Retome o Ritmo de Escrita',
          description: `Você já teve uma sequência de ${wp.maxStreak} dias. A prática regular é crucial - que tal escrever uma redação hoje?`,
          priority: 'medium',
          actionable: true,
          category: 'habits',
          impact: 'medium',
          timeToImplement: 'hoje',
          relatedMetrics: ['writing_streak'],
          suggestions: [
            'Escolha um tema que te interesse',
            'Comece com um rascunho de 15 minutos',
            'Estabeleça um horário fixo para escrever',
            'Use lembretes para manter a rotina'
          ]
        });
      }

      // Productivity pattern insights
      if (wp.mostProductiveHour !== undefined) {
        const hourName = wp.mostProductiveHour < 12 ? 'manhã' : 
                        wp.mostProductiveHour < 18 ? 'tarde' : 'noite';
        
        insights.push({
          id: 'productive-time',
          type: 'recommendation',
          title: `Aproveite Seu Horário Mais Produtivo`,
          description: `Você escreve mais às ${wp.mostProductiveHour}h (${hourName}). Tente reservar esse horário para suas práticas mais importantes.`,
          priority: 'low',
          actionable: true,
          category: 'habits',
          impact: 'low',
          timeToImplement: '1 semana',
          relatedMetrics: ['productivity_pattern'],
          suggestions: [
            `Reserve ${hourName} para redações mais desafiadoras`,
            'Evite distrações neste horário',
            'Use esse período para temas que tem dificuldade',
            'Mantenha esse horário livre na sua agenda'
          ]
        });
      }

      // Writing frequency insights
      const totalDays = wp.totalWritingDays || 0;
      const timeRange = analyticsData.timeRange || 'month';
      const expectedDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const frequency = totalDays / expectedDays;

      if (frequency < 0.3) {
        insights.push({
          id: 'low-frequency',
          type: 'improvement',
          title: 'Aumente a Frequência de Prática',
          description: `Você escreveu em apenas ${totalDays} dias no período. Aumentar a frequência pode acelerar seu progresso.`,
          priority: 'medium',
          actionable: true,
          category: 'habits',
          impact: 'high',
          timeToImplement: '2-3 semanas',
          relatedMetrics: ['writing_frequency'],
          suggestions: [
            'Estabeleça uma meta de escrever 3x por semana',
            'Comece com redações menores (200 palavras)',
            'Use temas do seu interesse para motivar',
            'Crie lembretes no celular'
          ]
        });
      }
    }

    // General motivational insights
    if (performanceMetrics && performanceMetrics.totalEssays >= 10) {
      insights.push({
        id: 'milestone-achievement',
        type: 'strength',
        title: 'Marco Importante Alcançado!',
        description: `Parabéns! Você já escreveu ${performanceMetrics.totalEssays} redações. Essa dedicação certamente trará resultados.`,
        priority: 'low',
        actionable: false,
        category: 'motivation',
        impact: 'medium',
        timeToImplement: null,
        relatedMetrics: ['total_essays'],
        suggestions: [
          'Celebre essa conquista',
          'Revise suas primeiras redações para ver o progresso',
          'Estabeleça uma nova meta de redações',
          'Compartilhe sua jornada com outros estudantes'
        ]
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [analyticsData]);

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = generateComprehensiveInsights;
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(insight => insight.type === selectedFilter);
    }
    
    if (maxInsights) {
      filtered = filtered.slice(0, maxInsights);
    }
    
    return filtered;
  }, [generateComprehensiveInsights, selectedFilter, maxInsights]);

  // Get insight icon
  const getInsightIcon = (type) => {
    switch (type) {
      case 'strength':
        return Award;
      case 'improvement':
        return TrendingUp;
      case 'recommendation':
        return Target;
      default:
        return Lightbulb;
    }
  };

  // Get insight color classes
  const getInsightColors = (type) => {
    switch (type) {
      case 'strength':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          icon: 'bg-green-100 text-green-600',
          badge: 'bg-green-100 text-green-800'
        };
      case 'improvement':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: 'bg-red-100 text-red-600',
          badge: 'bg-red-100 text-red-800'
        };
      case 'recommendation':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: 'bg-blue-100 text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          icon: 'bg-gray-100 text-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  if (!analyticsData) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Insights Não Disponíveis
          </h3>
          <p className="text-gray-600">
            Escreva algumas redações para receber insights personalizados.
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
              <GradientText>Insights Personalizados</GradientText>
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Análises inteligentes baseadas no seu progresso
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {filteredInsights.length} insights
            </span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedFilter(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFilter === option.value
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="p-6">
        {filteredInsights.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredInsights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                const colors = getInsightColors(insight.type);
                const isExpanded = expandedInsight === insight.id;

                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${colors.bg} ${colors.border} border-l-4 rounded-xl p-6 cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${colors.icon} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {insight.title}
                            </h4>
                            <p className="text-gray-700 mb-3">
                              {insight.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mb-3">
                              {insight.priority === 'high' && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.badge}`}>
                                  Alta Prioridade
                                </span>
                              )}
                              {insight.timeToImplement && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {insight.timeToImplement}
                                </span>
                              )}
                              {insight.impact && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                  Impacto {insight.impact}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <ArrowRight 
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              {insight.suggestions && insight.suggestions.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Sugestões de Ação:
                                  </h5>
                                  <ul className="space-y-2">
                                    {insight.suggestions.map((suggestion, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {insight.actionable && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                  <ModernButton
                                    variant="outline"
                                    size="sm"
                                    className="text-sm"
                                  >
                                    Aplicar Sugestão
                                  </ModernButton>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum Insight Encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou continue escrevendo para gerar mais insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsEngine;