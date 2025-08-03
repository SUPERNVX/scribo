// Structured Paragraph Editor with On-Demand Analysis
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

import useParagraphAnalysis from '../../hooks/useParagraphAnalysis';
import ParagraphAnalysisTooltip from './ParagraphAnalysisTooltip';
import './StructuredParagraphEditor.css';

/**
 * Structured Paragraph Editor Component
 * Provides 4 separate fields for essay structure with individual analysis
 */
const StructuredParagraphEditor = ({
  content = {},
  onContentChange,
  theme,
  disabled = false,
  className = '',
}) => {
  // Structure for the 4 essay parts
  const essayStructure = [
    {
      id: 'introdução',
      title: 'Introdução',
      placeholder: 'Apresente o tema, contextualize o problema e apresente sua tese...\n\nDica: Comece com uma contextualização histórica, dados estatísticos ou uma pergunta retórica.',
      icon: '🎯',
      minWords: 50,
      maxWords: 150,
    },
    {
      id: 'desenvolvimento1',
      title: 'Desenvolvimento 1',
      placeholder: 'Desenvolva seu primeiro argumento com exemplos e dados...\n\nDica: Use conectivos como "Em primeiro lugar", "Primeiramente", "Inicialmente".',
      icon: '📝',
      minWords: 80,
      maxWords: 200,
    },
    {
      id: 'desenvolvimento2',
      title: 'Desenvolvimento 2',
      placeholder: 'Desenvolva seu segundo argumento complementando o primeiro...\n\nDica: Use conectivos como "Além disso", "Outrossim", "Ademais".',
      icon: '📋',
      minWords: 80,
      maxWords: 200,
    },
    {
      id: 'conclusão',
      title: 'Conclusão',
      placeholder: 'Retome sua tese e apresente uma proposta de intervenção detalhada...\n\nDica: Sua proposta deve ter agente, ação, meio, finalidade e detalhamento.',
      icon: '🎯',
      minWords: 60,
      maxWords: 150,
    },
  ];

  // State for each paragraph content
  const [paragraphContents, setParagraphContents] = useState({
    introdução: content.introdução || '',
    desenvolvimento1: content.desenvolvimento1 || '',
    desenvolvimento2: content.desenvolvimento2 || '',
    conclusão: content.conclusão || '',
  });

  // Analysis states
  const [analysisResults, setAnalysisResults] = useState({});
  const [analyzingParagraphs, setAnalyzingParagraphs] = useState({});
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Refs for textareas
  const textareaRefs = useRef({});

  // Custom hook for paragraph analysis
  const { analyzeParagraph, loading: analysisLoading } = useParagraphAnalysis();

  // Update parent component when content changes
  useEffect(() => {
    if (onContentChange) {
      onContentChange(paragraphContents);
    }
  }, [paragraphContents, onContentChange]);

  // Handle content change for specific paragraph
  const handleParagraphChange = useCallback((paragraphId, newContent) => {
    setParagraphContents(prev => ({
      ...prev,
      [paragraphId]: newContent,
    }));

    // Clear analysis results when content changes significantly
    if (analysisResults[paragraphId]) {
      const oldWordCount = (analysisResults[paragraphId].originalText || '').split(/\s+/).length;
      const newWordCount = newContent.split(/\s+/).length;
      
      // Clear if word count changed by more than 10%
      if (Math.abs(oldWordCount - newWordCount) / oldWordCount > 0.1) {
        setAnalysisResults(prev => ({
          ...prev,
          [paragraphId]: null,
        }));
      }
    }
  }, [analysisResults]);

  // Analyze specific paragraph
  const handleAnalyzeParagraph = useCallback(async (paragraphId) => {
    const content = paragraphContents[paragraphId];
    
    if (!content || content.trim().length < 10) {
      toast.error('Escreva pelo menos algumas palavras antes de analisar.');
      return;
    }

    setAnalyzingParagraphs(prev => ({ ...prev, [paragraphId]: true }));

    try {
      const result = await analyzeParagraph(content, paragraphId);
      
      setAnalysisResults(prev => ({
        ...prev,
        [paragraphId]: {
          ...result,
          originalText: content,
          analyzedAt: new Date(),
        },
      }));

      toast.success(`Análise do parágrafo "${essayStructure.find(s => s.id === paragraphId)?.title}" concluída!`);
    } catch (error) {
      console.error('Error analyzing paragraph:', error);
      toast.error('Erro ao analisar parágrafo. Tente novamente.');
    } finally {
      setAnalyzingParagraphs(prev => ({ ...prev, [paragraphId]: false }));
    }
  }, [paragraphContents, analyzeParagraph, essayStructure]);

  // Apply suggestion to text
  const applySuggestion = useCallback((paragraphId, suggestion) => {
    const currentContent = paragraphContents[paragraphId];
    const { start, end, replacement } = suggestion;
    
    const newContent = 
      currentContent.substring(0, start) + 
      replacement + 
      currentContent.substring(end);
    
    handleParagraphChange(paragraphId, newContent);
    
    // Update analysis results to mark suggestion as applied
    setAnalysisResults(prev => ({
      ...prev,
      [paragraphId]: {
        ...prev[paragraphId],
        suggestions: prev[paragraphId].suggestions.map(s => 
          s.id === suggestion.id ? { ...s, applied: true } : s
        ),
      },
    }));

    toast.success('Sugestão aplicada!');
    setSelectedSuggestion(null);
  }, [paragraphContents, handleParagraphChange]);

  // Handle text selection for showing suggestions
  const handleTextSelection = useCallback((paragraphId, event) => {
    const textarea = event.target;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    if (selectionStart === selectionEnd) {
      setSelectedSuggestion(null);
      return;
    }

    const analysis = analysisResults[paragraphId];
    if (!analysis || !analysis.suggestions) return;

    // Find suggestions that overlap with selection
    const relevantSuggestions = analysis.suggestions.filter(suggestion => 
      !suggestion.applied &&
      ((suggestion.start >= selectionStart && suggestion.start < selectionEnd) ||
       (suggestion.end > selectionStart && suggestion.end <= selectionEnd) ||
       (suggestion.start <= selectionStart && suggestion.end >= selectionEnd))
    );

    if (relevantSuggestions.length > 0) {
      const rect = textarea.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX,
        y: rect.top - 10,
      });
      setSelectedSuggestion({
        paragraphId,
        suggestions: relevantSuggestions,
      });
    } else {
      setSelectedSuggestion(null);
    }
  }, [analysisResults]);

  // Get word count for paragraph
  const getWordCount = useCallback((content) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Get character count for paragraph
  const getCharCount = useCallback((content) => {
    return content.length;
  }, []);

  // Render highlighted text with suggestions
  const renderHighlightedText = useCallback((paragraphId, content) => {
    const analysis = analysisResults[paragraphId];
    if (!analysis || !analysis.suggestions) return content;

    let highlightedContent = content;
    const suggestions = analysis.suggestions.filter(s => !s.applied);
    
    // Sort suggestions by start position (reverse order for proper replacement)
    suggestions.sort((a, b) => b.start - a.start);

    suggestions.forEach(suggestion => {
      const { start, end, type } = suggestion;
      const originalText = content.substring(start, end);
      
      const className = `suggestion-highlight suggestion-${type}`;
      const highlightedText = `<span class="${className}" data-suggestion-id="${suggestion.id}">${originalText}</span>`;
      
      highlightedContent = 
        highlightedContent.substring(0, start) + 
        highlightedText + 
        highlightedContent.substring(end);
    });

    return highlightedContent;
  }, [analysisResults]);

  // Get status color for paragraph
  const getStatusColor = useCallback((paragraphId) => {
    const analysis = analysisResults[paragraphId];
    if (!analysis) return 'gray';
    
    const errorCount = analysis.suggestions?.filter(s => !s.applied && s.type === 'error').length || 0;
    const warningCount = analysis.suggestions?.filter(s => !s.applied && s.type === 'warning').length || 0;
    
    if (errorCount > 0) return 'red';
    if (warningCount > 0) return 'yellow';
    return 'green';
  }, [analysisResults]);

  return (
    <div className={`structured-paragraph-editor ${className}`}>
      <div className="editor-header">
        <h2 className="editor-title">
          📝 Editor Estruturado de Redação
        </h2>
        <p className="editor-subtitle">
          Escreva cada parte da sua redação separadamente e analise individualmente para obter feedback específico.
        </p>
      </div>

      <div className="paragraphs-container">
        {essayStructure.map((section, index) => {
          const content = paragraphContents[section.id] || '';
          const wordCount = getWordCount(content);
          const charCount = getCharCount(content);
          const isAnalyzing = analyzingParagraphs[section.id];
          const analysis = analysisResults[section.id];
          const statusColor = getStatusColor(section.id);
          
          return (
            <div key={section.id} className="paragraph-section">
              {/* Section Header */}
              <div className="section-header">
                <div className="section-title">
                  <span className="section-icon">{section.icon}</span>
                  <h3>{section.title}</h3>
                  <div className={`status-indicator status-${statusColor}`} />
                </div>
                
                <div className="section-actions">
                  <button
                    onClick={() => handleAnalyzeParagraph(section.id)}
                    disabled={disabled || isAnalyzing || !content.trim()}
                    className={`analyze-button ${isAnalyzing ? 'analyzing' : ''}`}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="loading-spinner" />
                        Analisando... (pode levar até 2 minutos)
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Analisar este parágrafo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Word Count and Guidelines */}
              <div className="section-info">
                <div className="word-count-info">
                  <span className={`word-count ${wordCount < section.minWords ? 'low' : wordCount > section.maxWords ? 'high' : 'good'}`}>
                    {wordCount} palavras
                  </span>
                  <span className="word-guideline">
                    (recomendado: {section.minWords}-{section.maxWords} palavras)
                  </span>
                  <span className="char-count">
                    {charCount} caracteres
                  </span>
                </div>
                
                {analysis && (
                  <div className="analysis-summary">
                    <span className="analysis-time">
                      Analisado: {analysis.analyzedAt.toLocaleTimeString()}
                    </span>
                    {analysis.suggestions && (
                      <span className="suggestions-count">
                        {analysis.suggestions.filter(s => !s.applied).length} sugestões
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Text Editor */}
              <div className="editor-container">
                <textarea
                  ref={el => textareaRefs.current[section.id] = el}
                  value={content}
                  onChange={(e) => handleParagraphChange(section.id, e.target.value)}
                  onSelect={(e) => handleTextSelection(section.id, e)}
                  placeholder={section.placeholder}
                  disabled={disabled}
                  className={`paragraph-textarea ${analysis ? 'analyzed' : ''}`}
                  rows={6}
                />
                
                {/* Overlay for highlighting suggestions */}
                {analysis && analysis.suggestions && (
                  <div 
                    className="suggestions-overlay"
                    dangerouslySetInnerHTML={{
                      __html: renderHighlightedText(section.id, content)
                    }}
                  />
                )}
              </div>

              {/* Analysis Results */}
              {analysis && (
                <div className="analysis-results">
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="suggestions-list">
                      <h4>Sugestões de Melhoria:</h4>
                      {analysis.suggestions
                        .filter(s => !s.applied)
                        .slice(0, 3) // Show only first 3 suggestions
                        .map(suggestion => (
                          <div key={suggestion.id} className={`suggestion-item suggestion-${suggestion.type}`}>
                            <div className="suggestion-content">
                              <span className="suggestion-type-icon">
                                {suggestion.type === 'error' ? '❌' : 
                                 suggestion.type === 'warning' ? '⚠️' : '💡'}
                              </span>
                              <div className="suggestion-text">
                                <p className="suggestion-message">{suggestion.message}</p>
                                {suggestion.replacement && (
                                  <p className="suggestion-replacement">
                                    Sugestão: "{suggestion.replacement}"
                                  </p>
                                )}
                              </div>
                            </div>
                            {suggestion.replacement && (
                              <button
                                onClick={() => applySuggestion(section.id, suggestion)}
                                className="apply-suggestion-button"
                              >
                                Aplicar
                              </button>
                            )}
                          </div>
                        ))}
                      
                      {analysis.suggestions.filter(s => !s.applied).length > 3 && (
                        <p className="more-suggestions">
                          +{analysis.suggestions.filter(s => !s.applied).length - 3} sugestões adicionais
                        </p>
                      )}
                    </div>
                  )}
                  
                  {(analysis.summary || analysis.feedback) && (
                    <div className="analysis-summary-text">
                      <h4>Resumo da Análise:</h4>
                      <div 
                        className="formatted-feedback"
                        dangerouslySetInnerHTML={{
                          __html: analysis.summary || analysis.feedback
                        }}
                      />
                      {analysis.score && (
                        <div className="analysis-score">
                          <strong>Nota do Parágrafo: {analysis.score}/1000</strong>
                        </div>
                      )}
                      {analysis.thoughtsRemoved && (
                        <div className="processing-info">
                          <small>✨ Resposta processada (pensamentos da IA removidos)</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip for suggestions */}
      {selectedSuggestion && (
        <ParagraphAnalysisTooltip
          position={tooltipPosition}
          suggestions={selectedSuggestion.suggestions}
          onApplySuggestion={(suggestion) => 
            applySuggestion(selectedSuggestion.paragraphId, suggestion)
          }
          onClose={() => setSelectedSuggestion(null)}
        />
      )}

      {/* Overall Progress */}
      <div className="overall-progress">
        <h3>Progresso Geral</h3>
        <div className="progress-grid">
          {essayStructure.map(section => {
            const content = paragraphContents[section.id] || '';
            const wordCount = getWordCount(content);
            const progress = Math.min((wordCount / section.minWords) * 100, 100);
            const statusColor = getStatusColor(section.id);
            
            return (
              <div key={section.id} className="progress-item">
                <div className="progress-header">
                  <span>{section.icon} {section.title}</span>
                  <span className={`progress-status status-${statusColor}`}>
                    {wordCount}/{section.minWords}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill progress-${statusColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StructuredParagraphEditor;