// Paragraph Analysis Tooltip Component
import React, { useEffect, useRef } from 'react';
import './ParagraphAnalysisTooltip.css';

/**
 * Tooltip component for displaying paragraph analysis suggestions
 * Similar to Google Docs suggestion tooltips
 */
const ParagraphAnalysisTooltip = ({
  position,
  suggestions = [],
  onApplySuggestion,
  onClose,
}) => {
  const tooltipRef = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close tooltip on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'improvement':
        return '💡';
      case 'repetition':
        return '🔄';
      case 'grammar':
        return '📝';
      case 'vocabulary':
        return '📚';
      default:
        return '💡';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'error':
        return 'Erro';
      case 'warning':
        return 'Atenção';
      case 'improvement':
        return 'Melhoria';
      case 'repetition':
        return 'Repetição';
      case 'grammar':
        return 'Gramática';
      case 'vocabulary':
        return 'Vocabulário';
      default:
        return 'Sugestão';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'improvement':
        return '#3b82f6';
      case 'repetition':
        return '#8b5cf6';
      case 'grammar':
        return '#10b981';
      case 'vocabulary':
        return '#f97316';
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      ref={tooltipRef}
      className="paragraph-analysis-tooltip"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="tooltip-arrow" />
      
      <div className="tooltip-header">
        <h4>Sugestões de Melhoria</h4>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div className="suggestions-container">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id || index}
            className={`suggestion-tooltip-item suggestion-${suggestion.type}`}
          >
            <div className="suggestion-header">
              <div className="suggestion-type">
                <span className="type-icon">{getTypeIcon(suggestion.type)}</span>
                <span 
                  className="type-label"
                  style={{ color: getTypeColor(suggestion.type) }}
                >
                  {getTypeLabel(suggestion.type)}
                </span>
              </div>
              {suggestion.confidence && (
                <div className="confidence-indicator">
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ 
                        width: `${suggestion.confidence}%`,
                        backgroundColor: getTypeColor(suggestion.type)
                      }}
                    />
                  </div>
                  <span className="confidence-text">
                    {suggestion.confidence}%
                  </span>
                </div>
              )}
            </div>

            <div className="suggestion-content">
              <p className="suggestion-message">
                {suggestion.message}
              </p>

              {suggestion.originalText && (
                <div className="original-text">
                  <span className="label">Texto original:</span>
                  <span className="text">"{suggestion.originalText}"</span>
                </div>
              )}

              {suggestion.replacement && (
                <div className="replacement-text">
                  <span className="label">Sugestão:</span>
                  <span className="text">"{suggestion.replacement}"</span>
                </div>
              )}

              {suggestion.explanation && (
                <div className="explanation">
                  <span className="label">Explicação:</span>
                  <span className="text">{suggestion.explanation}</span>
                </div>
              )}
            </div>

            <div className="suggestion-actions">
              {suggestion.replacement && (
                <button
                  onClick={() => onApplySuggestion(suggestion)}
                  className="apply-button"
                  style={{ backgroundColor: getTypeColor(suggestion.type) }}
                >
                  Aplicar Sugestão
                </button>
              )}
              
              <button
                onClick={onClose}
                className="dismiss-button"
              >
                Ignorar
              </button>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 1 && (
        <div className="tooltip-footer">
          <span className="suggestions-count">
            {suggestions.length} sugestão{suggestions.length > 1 ? 'ões' : ''} encontrada{suggestions.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default ParagraphAnalysisTooltip;