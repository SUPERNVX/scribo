// Enhanced Writing Section with Deep Analysis
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import temasService from '../../services/temasService';
import {
  useEssayAutoSave,
  useTextUndoRedo,
  useEditorShortcuts,
  useGlobalShortcuts,
} from '../../hooks';
import ShortcutIndicator from '../ui/ShortcutIndicator';
import ShortcutsModal from '../ui/ShortcutsModal';
import StructuredParagraphEditor from '../features/StructuredParagraphEditor';
import { EnhancedAISuggestions } from '../ai-suggestions';
import DeepAnalysisModal from '../ai-suggestions/DeepAnalysisModal';
import { RateLimitIndicator } from '../ui';
import ThemeSelector from '../ThemeSelector';
import '../WritingSection.css';

// Estilos para a análise profunda
const deepAnalysisStyles = `
  .deep-analysis-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 2rem;
    margin: 2rem 0;
    color: white;
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .deep-analysis-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .deep-analysis-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .deep-analysis-subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 1rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .analysis-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .analysis-stat-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .stat-number {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .analysis-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .primary-analysis-button {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.75rem;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 250px;
    justify-content: center;
  }
  
  .primary-analysis-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
  }
  
  .primary-analysis-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .secondary-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .secondary-button {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .secondary-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .analysis-requirements {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-top: 1.5rem;
    border-left: 4px solid #ffd700;
  }
  
  .requirements-title {
    font-weight: 700;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .requirements-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .requirements-list li {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.9;
  }
  
  .requirement-check {
    color: #10b981;
    font-weight: bold;
  }
  
  .requirement-warning {
    color: #f59e0b;
    font-weight: bold;
  }
  
  .requirement-error {
    color: #ef4444;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    .deep-analysis-section {
      padding: 1.5rem;
      margin: 1rem 0;
    }
    
    .deep-analysis-title {
      font-size: 1.5rem;
    }
    
    .analysis-stats-grid {
      grid-template-columns: 1fr;
    }
    
    .primary-analysis-button {
      min-width: 100%;
    }
    
    .secondary-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

// Injetar estilos
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = deepAnalysisStyles;
  document.head.appendChild(styleElement);
}

const EnhancedWritingSection = ({
  themes,
  selectedTheme,
  onThemeSelect,
  essayContent,
  onEssayChange,
  onSubmitEssay,
  loading,
  onWordDoubleClick,
  aiModel,
  onAiModelChange,
  models,
  onRefreshThemes, // Nova prop para atualizar temas
  themesRefreshing = false, // Estado de carregamento dos temas
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [selectedFacultyTheme, setSelectedFacultyTheme] = useState(null);
  
  const [structuredContent, setStructuredContent] = useState({
    introdução: '',
    desenvolvimento1: '',
    desenvolvimento2: '',
    conclusão: '',
  });

  const textareaRef = useRef(null);

  // Auto-save para redação
  const autoSave = useEssayAutoSave(
    essayContent,
    selectedTheme?.id || 'draft',
    {
      onSave: data => {
        setLastSaveTime(new Date());
        console.log('Redacao salva automaticamente');
      },
      onError: error => {
        toast.error('Erro ao salvar automaticamente');
        console.error('Auto-save error:', error);
      },
    }
  );

  // Undo/Redo para texto
  const {
    state: textState,
    pushTextState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTextUndoRedo(essayContent);

  // Atualizar contadores
  useEffect(() => {
    const words = essayContent
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(essayContent.length);
  }, [essayContent]);

  // Função para lidar com mudanças no texto
  const handleTextChange = useCallback(
    newText => {
      onEssayChange(newText);
    },
    [onEssayChange]
  );

  // Debounce para o histórico de undo/redo
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (essayContent) {
        pushTextState(essayContent);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [essayContent, pushTextState]);

  // Funcoes de acao
  const handleSave = useCallback(() => {
    autoSave.save();
    toast.success('Redacao salva!');
  }, [autoSave]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const previousText = undo();
      if (previousText !== undefined) {
        onEssayChange(previousText);
        toast.success('Acao desfeita');
      }
    }
  }, [undo, canUndo, onEssayChange]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const nextText = redo();
      if (nextText !== undefined) {
        onEssayChange(nextText);
        toast.success('Acao refeita');
      }
    }
  }, [redo, canRedo, onEssayChange]);

  const handleSubmit = useCallback(() => {
    if (!selectedTheme || !essayContent.trim()) {
      toast.error('Por favor, selecione um tema e escreva sua redação.');
      return;
    }

    autoSave.save();
    onSubmitEssay();
  }, [selectedTheme, essayContent, autoSave, onSubmitEssay]);

  const handleFocusModeSave = useCallback((content) => {
    onEssayChange(content);
    autoSave.save();
  }, [onEssayChange, autoSave]);

  // Deep Analysis handlers
  const handleOpenDeepAnalysis = useCallback(() => {
    if (!selectedTheme) {
      toast.error('Por favor, selecione um tema antes da análise profunda.');
      return;
    }
    if (!essayContent || essayContent.trim().length < 1000) {
      toast.error('Escreva pelo menos 1000 caracteres para análise profunda.');
      return;
    }
    setShowDeepAnalysis(true);
  }, [selectedTheme, essayContent]);

  const handleCloseDeepAnalysis = useCallback(() => {
    setShowDeepAnalysis(false);
  }, []);

  // Faculty Theme Selector handlers
  const handleFacultyThemeSelect = useCallback((theme) => {
    setSelectedFacultyTheme(theme);
    onThemeSelect({
      id: theme.id,
      title: theme.titulo,
      description: theme.descricao,
      tags: [theme.faculdade, theme.estilo, theme.area],
      faculty: theme.faculdade,
      year: theme.ano,
      style: theme.estilo,
      area: theme.area,
      difficulty: theme.dificuldade,
      estilo: theme.estilo,
      faculdade: theme.faculdade
    });
    setIsThemeSelectorOpen(false);
  }, [onThemeSelect]);

  // Funções auxiliares para informações do tema
  const getEstiloDescricao = estilo => {
    const estiloInfo = temasService.getEstiloDefinicao(estilo);
    return estiloInfo ? estiloInfo.descricao : 'Descrição não disponível';
  };

  const getCaracteristicas = tema => {
    if (tema.caracteristicas && Array.isArray(tema.caracteristicas)) {
      return tema.caracteristicas.join(' • ');
    }

    const estiloInfo = temasService.getEstiloDefinicao(tema.estilo);
    return estiloInfo && estiloInfo.caracteristicas
      ? estiloInfo.caracteristicas.join(' • ')
      : 'Características não disponíveis';
  };

  // Atalhos globais
  useGlobalShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onHelp: () => setShowShortcutsModal(true),
    onEscape: () => {
      if (showShortcutsModal) {
        setShowShortcutsModal(false);
      }
    },
    'ctrl+/': () => setShowShortcutsModal(true),
  });

  // Atalhos do editor
  const editorShortcuts = useEditorShortcuts(textareaRef, {
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  // Restaurar rascunho salvo
  const handleRestoreDraft = useCallback(() => {
    const savedContent = autoSave.restoreSaved();
    if (savedContent && savedContent !== essayContent) {
      onEssayChange(savedContent);
      toast.success('Rascunho restaurado!');
    }
  }, [autoSave, essayContent, onEssayChange]);

  // Limpar rascunho
  const handleClearDraft = useCallback(() => {
    autoSave.clearSaved();
    toast.success('Rascunho removido');
  }, [autoSave]);

  // Handle structured content changes
  const handleStructuredContentChange = useCallback((newStructuredContent) => {
    setStructuredContent(newStructuredContent);
    
    const combinedText = [
      newStructuredContent.introdução,
      newStructuredContent.desenvolvimento1,
      newStructuredContent.desenvolvimento2,
      newStructuredContent.conclusão,
    ].filter(text => text.trim()).join('\n\n');
    
    onEssayChange(combinedText);
  }, [onEssayChange]);

  // Update structured content when essay content changes externally
  useEffect(() => {
    if (essayContent && essayContent.trim()) {
      const paragraphs = essayContent.split('\n\n').filter(p => p.trim());
      setStructuredContent({
        introdução: paragraphs[0] || '',
        desenvolvimento1: paragraphs[1] || '',
        desenvolvimento2: paragraphs[2] || '',
        conclusão: paragraphs[3] || '',
      });
    }
  }, [essayContent]);


  // Função para determinar o status da redação
  const getEssayStatus = () => {
    if (charCount < 500) {
      return {
        status: 'too_short',
        message: 'Muito curta para análise',
        color: 'requirement-error',
        icon: '❌'
      };
    } else if (charCount < 1000) {
      return {
        status: 'short',
        message: 'Pode ser analisada, mas recomendamos mais conteúdo',
        color: 'requirement-warning',
        icon: '⚠️'
      };
    } else if (charCount < 2500) {
      return {
        status: 'good',
        message: 'Pronta para análise profunda',
        color: 'requirement-check',
        icon: '✅'
      };
    } else {
      return {
        status: 'excellent',
        message: 'Tamanho ideal para análise completa',
        color: 'requirement-check',
        icon: '🎯'
      };
    }
  };

  const essayStatus = getEssayStatus();

  return (
    <div className='writing-section'>
      <div className='writing-container'>
        {/* Header */}
        <div className='writing-header'>
          <div className='text-center mb-8'>
            <h1 className='writing-title-enhanced'>
              ✍️ Escreva sua <span className='gradient-text'>Redação</span>
            </h1>
            <p className='writing-subtitle-enhanced'>
              Escolha um tema e comece a escrever. Nossa IA irá analisar e dar
              feedback detalhado.
            </p>
          </div>

          {/* Status indicators */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-4'>
              {lastSaveTime && (
                <div className='flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-sm text-green-700 dark:text-green-300 font-medium'>
                    Salvo: {lastSaveTime.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <div className='flex items-center gap-3'>
              {autoSave.hasSavedData && (
                <button
                  onClick={handleRestoreDraft}
                  className='flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md'
                >
                  <span className='text-lg'>📄</span>
                  <span>Restaurar Rascunho</span>
                </button>
              )}

              <button
                onClick={() => setShowShortcutsModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-pastel-blue-100 hover:bg-pastel-blue-200 text-pastel-blue-800 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md'
                title='Ver todos os atalhos (Ctrl+/)'
              >
                <span className='text-lg'>⌨️</span>
                <span>Atalhos</span>
              </button>
            </div>
          </div>

        </div>

        {/* Theme Selection */}
        <div className='theme-selection-section'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='section-title'>📚 Escolha um Tema</h2>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão Novos Temas clicado!');
                console.log('onRefreshThemes disponível:', !!onRefreshThemes);
                if (onRefreshThemes) {
                  console.log('Chamando onRefreshThemes...');
                  toast.loading('Carregando novos temas...', { id: 'refresh-themes' });
                  onRefreshThemes();
                  setTimeout(() => {
                    toast.success('Novos temas carregados!', { id: 'refresh-themes' });
                  }, 500);
                } else {
                  console.error('onRefreshThemes não está disponível!');
                  toast.error('Erro: função de atualização não disponível');
                }
              }}
              disabled={loading}
              className='flex items-center gap-2 px-3 py-2 bg-pastel-green-100 hover:bg-pastel-green-200 text-pastel-green-800 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
              title='Atualizar temas para novas opções aleatórias'
            >
              <span className={`text-lg ${themesRefreshing ? 'animate-spin' : ''}`}>🔄</span>
              <span className='text-sm'>{themesRefreshing ? 'Carregando...' : 'Novos Temas'}</span>
            </button>
          </div>
          <div className='themes-grid'>
            {themes.map(theme => (
              <div
                key={theme.id}
                className={`theme-card ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                onClick={() => onThemeSelect(theme)}
              >
                <div className='theme-header'>
                  <div className='theme-icon'>📝</div>
                  <div className='theme-meta'>
                    <span className='theme-year'>{theme.year}</span>
                    <span className='theme-type'>{theme.faculdade}</span>
                  </div>
                </div>
                <h3 className='theme-title'>{theme.title}</h3>
                <p className='theme-description'>{theme.description}</p>
                <div className='theme-tags'>
                  <span className='theme-tag theme-style'>{theme.estilo}</span>
                  {theme.tags?.map((tag, index) => (
                    <span key={index} className='theme-tag'>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Faculty Theme Selector Card */}
            <div
              className={`theme-card faculty-theme-card ${selectedFacultyTheme ? 'selected' : ''}`}
              onClick={() => setIsThemeSelectorOpen(true)}
            >
              {selectedFacultyTheme ? (
                <>
                  <div className='theme-header'>
                    <div className='theme-icon'>🏛️</div>
                    <div className='theme-meta'>
                      <span className='theme-year'>{selectedFacultyTheme.ano}</span>
                      <span className='theme-type'>{selectedFacultyTheme.faculdade}</span>
                    </div>
                  </div>
                  <h3 className='theme-title'>{selectedFacultyTheme.titulo}</h3>
                  <p className='theme-description'>{selectedFacultyTheme.descricao}</p>
                  <div className='theme-tags'>
                    <span className='theme-tag theme-style'>{selectedFacultyTheme.estilo}</span>
                    <span className='theme-tag'>{selectedFacultyTheme.area}</span>
                    <span className='theme-tag'>{selectedFacultyTheme.dificuldade}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className='theme-header'>
                    <div className='theme-icon'>🏛️</div>
                    <div className='theme-meta'>
                      <span className='theme-year'>Múltiplos</span>
                      <span className='theme-type'>Faculdades</span>
                    </div>
                  </div>
                  <h3 className='theme-title'>Temas por Faculdade</h3>
                  <p className='theme-description'>
                    Escolha entre centenas de temas reais de vestibulares das principais universidades brasileiras
                  </p>
                  <div className='theme-tags'>
                    <span className='theme-tag'>ENEM</span>
                    <span className='theme-tag'>FUVEST</span>
                    <span className='theme-tag'>UNICAMP</span>
                    <span className='theme-tag'>+2 mais</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Writing Editor */}
        {selectedTheme && (
          <div className='editor-section'>
            <div className='editor-header'>
              <h2 className='section-title'>✍️ Editor de Redação</h2>
              <div className='selected-theme-info'>
                <span className='info-label'>Tema selecionado:</span>
                <span className='info-value'>{selectedTheme.title}</span>
              </div>
            </div>

            <div className='editor-container'>
              <div className='editor-toolbar'>
                <div className='toolbar-left'>
                  <div className='word-count'>
                    <span className='count-number'>{wordCount}</span>
                    <span className='count-label'>palavras</span>
                  </div>
                  <div className='char-count'>
                    <span className='count-number'>{charCount}</span>
                    <span className='count-label'>/ 3000 caracteres</span>
                  </div>

                  <div className='flex items-center gap-1 ml-4'>
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className='p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      title='Desfazer (Ctrl+Z)'
                    >
                      ↶
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className='p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      title='Refazer (Ctrl+Shift+Z)'
                    >
                      ↷
                    </button>
                  </div>
                </div>

                <div className='toolbar-right'>
                  <div className='flex items-center gap-3'>
                    {/* Rate Limit Indicator */}
                    <RateLimitIndicator variant="compact" showLabel={true} />
                  </div>
                </div>
              </div>

              <div className='editor-wrapper'>
                <StructuredParagraphEditor
                  content={structuredContent}
                  onContentChange={handleStructuredContentChange}
                  theme={selectedTheme}
                  disabled={loading}
                  className="structured-editor-integration"
                />
              </div>

              <div className='editor-footer'>
                <div className='footer-left'>
                  <div className='progress-bar'>
                    <div className='progress-label'>Progresso da redação</div>
                    <div className='progress-track'>
                      <div
                        className='progress-fill'
                        style={{
                          width: `${Math.min((charCount / 2500) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className='progress-text'>
                      {charCount < 1000
                        ? 'Continue escrevendo...'
                        : charCount < 2000
                          ? 'Boa! Continue desenvolvendo...'
                          : charCount < 2500
                            ? 'Excelente! Quase la...'
                            : 'Perfeito! Tamanho ideal alcancado!'}
                    </div>
                  </div>
                </div>

                <div className='footer-right'>
                  <div className='flex items-center gap-3'>
                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja limpar o rascunho?')) {
                          onEssayChange('');
                          toast.success('Rascunho limpo!');
                        }
                      }}
                      className='flex items-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md'
                      title='Limpar rascunho'
                      disabled={!essayContent.trim()}
                    >
                      <span className='text-base'>🗑️</span>
                      <span>Limpar</span>
                    </button>

                    <button
                      onClick={handleSave}
                      className='flex items-center gap-2 px-4 py-2 text-sm bg-pastel-blue-100 hover:bg-pastel-blue-200 text-pastel-blue-800 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md'
                      title='Salvar (Ctrl+S)'
                    >
                      <span className='text-base'>💾</span>
                      <span>Salvar</span>
                    </button>

                    <button
                      className='flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pastel-purple-500 to-pastel-purple-600 hover:from-pastel-purple-600 hover:to-pastel-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                      onClick={handleSubmit}
                      disabled={
                        loading || !essayContent.trim() || !selectedTheme
                      }
                    >
                      {loading ? (
                        <>
                          <span className='loading-spinner'></span>
                          <span>Analisando...</span>
                        </>
                      ) : (
                        <>
                          <span className='text-lg'>🚀</span>
                          <span>Enviar para Correção</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deep Analysis Section - Nova seção visual */}
        {selectedTheme && (
          <div className='deep-analysis-section'>
            <div className='deep-analysis-header'>
              <h2 className='deep-analysis-title'>
                🧠 Análise Profunda com IA
              </h2>
              <p className='deep-analysis-subtitle'>
                Obtenha feedback detalhado usando múltiplos modelos de IA para máxima precisão e confiabilidade
              </p>
            </div>


            {/* Main Actions */}
            <div className='analysis-actions'>
              <button
                onClick={handleOpenDeepAnalysis}
                disabled={!essayContent?.trim() || charCount < 1000}
                className='primary-analysis-button'
              >
                <span className='text-2xl'>🧠</span>
                <span>Iniciar Análise Profunda</span>
                {charCount < 1000 && (
                  <span className='text-xs bg-white/20 px-2 py-1 rounded'>
                    Mín. 1000 chars
                  </span>
                )}
              </button>

              <div className='secondary-actions'>
                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || !essayContent.trim()}
                  className='secondary-button'
                >
                  <span>⚡</span>
                  <span>Correção Rápida</span>
                </button>
                
                
              </div>
            </div>

            {/* Requirements */}
            <div className='analysis-requirements'>
              <div className='requirements-title'>
                <span>📋</span>
                <span>Requisitos para Análise Profunda:</span>
              </div>
              <ul className='requirements-list'>
                <li>
                  <span className={essayStatus.color}>{essayStatus.icon}</span>
                  <span>{essayStatus.message}</span>
                </li>
                <li>
                  <span className={selectedTheme ? 'requirement-check' : 'requirement-error'}>
                    {selectedTheme ? '✅' : '❌'}
                  </span>
                  <span>Tema selecionado</span>
                </li>
                <li>
                  <span className='requirement-check'>✅</span>
                  <span>Múltiplos modelos de IA (DeepSeek, Llama, GPT-4)</span>
                </li>
                <li>
                  <span className='requirement-check'>✅</span>
                  <span>Análise de confiabilidade e consenso</span>
                </li>
                <li>
                  <span className='requirement-check'>✅</span>
                  <span>Feedback específico por competência ENEM</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Enhanced AI Suggestions */}
        {selectedTheme && essayContent && (
          <EnhancedAISuggestions
            essayContent={essayContent}
            theme={selectedTheme}
            onAnalysisComplete={(result) => {
              console.log('Deep analysis completed:', result);
              toast.success('Análise profunda concluída! Verifique os resultados.');
            }}
            className="mb-8"
          />
        )}

        {/* Writing Tips */}
        <div className='writing-tips-section'>
          <h2 className='section-title'>💡 Dicas para uma Boa Redação</h2>
          <div className='tips-grid'>
            <div className='tip-card'>
              <div className='tip-icon'>📖</div>
              <h3 className='tip-title'>Leia com Atenção</h3>
              <p className='tip-description'>
                Analise bem o tema proposto e os textos motivadores antes de
                comecar a escrever.
              </p>
            </div>
            <div className='tip-card'>
              <div className='tip-icon'>🎯</div>
              <h3 className='tip-title'>Mantenha o Foco</h3>
              <p className='tip-description'>
                Não fuja do tema. Mantenha seus argumentos sempre relacionados à
                proposta.
              </p>
            </div>
            <div className='tip-card'>
              <div className='tip-icon'>🔗</div>
              <h3 className='tip-title'>Use Conectivos</h3>
              <p className='tip-description'>
                Conecte suas ideias com palavras de transicao para dar fluidez
                ao texto.
              </p>
            </div>
            <div className='tip-card'>
              <div className='tip-icon'>💡</div>
              <h3 className='tip-title'>Proponha Soluções</h3>
              <p className='tip-description'>
                Na conclusão, apresente uma proposta de intervenção viável e
                detalhada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Deep Analysis Modal */}
      <DeepAnalysisModal
        isOpen={showDeepAnalysis}
        onClose={handleCloseDeepAnalysis}
        essayContent={essayContent}
        theme={selectedTheme}
        onAnalysisComplete={(result) => {
          console.log('Deep analysis completed:', result);
          toast.success('Análise profunda concluída! Verifique os resultados.');
        }}
      />


      {/* Theme Selector Modal */}
      <ThemeSelector
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        onThemeSelect={handleFacultyThemeSelect}
      />
    </div>
  );
};

export default EnhancedWritingSection;