// Smart Defaults for Forms - Micro-UX improvements
import React, { memo, useState, useEffect, useCallback } from 'react';

import { useLocalStorage } from '../../hooks';

/**
 * SmartInput Component
 * Input com valores padrão inteligentes e sugestões
 */
const SmartInput = memo(
  ({
    name,
    label,
    type = 'text',
    placeholder,
    suggestions = [],
    rememberValue = false,
    autoComplete = true,
    smartPlaceholder = true,
    className = '',
    onChange,
    value,
    ...props
  }) => {
    const [savedValue, setSavedValue] = useLocalStorage(
      rememberValue ? `smart_input_${name}` : null,
      ''
    );
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholder);

    // Gerar placeholder inteligente baseado em sugestões
    useEffect(() => {
      if (smartPlaceholder && suggestions.length > 0 && !value) {
        const randomSuggestion =
          suggestions[Math.floor(Math.random() * suggestions.length)];
        setCurrentPlaceholder(`Ex: ${randomSuggestion}`);
      }
    }, [suggestions, smartPlaceholder, value]);

    // Filtrar sugestões baseado no valor atual
    useEffect(() => {
      if (value && suggestions.length > 0) {
        const filtered = suggestions
          .filter(suggestion =>
            suggestion.toLowerCase().includes(value.toLowerCase())
          )
          .slice(0, 5);
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0 && value.length > 1);
      } else {
        setShowSuggestions(false);
      }
    }, [value, suggestions]);

    const handleChange = useCallback(
      e => {
        const newValue = e.target.value;

        if (rememberValue && newValue) {
          setSavedValue(newValue);
        }

        if (onChange) {
          onChange(e);
        }
      },
      [onChange, rememberValue, setSavedValue]
    );

    const handleSuggestionClick = useCallback(
      suggestion => {
        const syntheticEvent = {
          target: { value: suggestion, name },
        };
        handleChange(syntheticEvent);
        setShowSuggestions(false);
      },
      [handleChange, name]
    );

    const handleKeyDown = useCallback(e => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }, []);

    // Usar valor salvo como padrão se não houver valor
    const defaultValue = value || (rememberValue ? savedValue : '');

    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            {label}
          </label>
        )}

        <input
          type={type}
          name={name}
          value={defaultValue}
          placeholder={currentPlaceholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete={autoComplete ? 'on' : 'off'}
          className='
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          transition-colors duration-200
        '
          {...props}
        />

        {/* Sugestões */}
        {showSuggestions && (
          <div className='absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg'>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type='button'
                onClick={() => handleSuggestionClick(suggestion)}
                className='
                w-full px-3 py-2 text-left text-sm
                hover:bg-gray-100 dark:hover:bg-gray-700
                focus:bg-gray-100 dark:focus:bg-gray-700
                first:rounded-t-md last:rounded-b-md
                transition-colors duration-150
              '
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Indicador de valor salvo */}
        {rememberValue && savedValue && savedValue !== value && (
          <div className='mt-1 text-xs text-gray-500'>
            💡 Valor anterior: "{savedValue}"
          </div>
        )}
      </div>
    );
  }
);

SmartInput.displayName = 'SmartInput';

/**
 * SmartTextarea Component
 * Textarea com auto-resize e sugestões
 */
export const SmartTextarea = memo(
  ({
    name,
    label,
    placeholder,
    autoResize = true,
    minRows = 3,
    maxRows = 10,
    suggestions = [],
    rememberValue = false,
    className = '',
    onChange,
    value,
    ...props
  }) => {
    const [savedValue, setSavedValue] = useLocalStorage(
      rememberValue ? `smart_textarea_${name}` : null,
      ''
    );

    const handleChange = useCallback(
      e => {
        const newValue = e.target.value;

        // Auto-resize
        if (autoResize) {
          const textarea = e.target;
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          const lineHeight = 20; // Aproximado
          const rows = Math.min(
            Math.max(Math.ceil(scrollHeight / lineHeight), minRows),
            maxRows
          );
          textarea.rows = rows;
        }

        if (rememberValue && newValue) {
          setSavedValue(newValue);
        }

        if (onChange) {
          onChange(e);
        }
      },
      [onChange, autoResize, minRows, maxRows, rememberValue, setSavedValue]
    );

    const defaultValue = value || (rememberValue ? savedValue : '');

    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            {label}
          </label>
        )}

        <textarea
          name={name}
          value={defaultValue}
          placeholder={placeholder}
          onChange={handleChange}
          rows={minRows}
          className='
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          transition-colors duration-200 resize-none
        '
          {...props}
        />

        {/* Sugestões de escrita */}
        {suggestions.length > 0 && (
          <div className='mt-2 text-xs text-gray-500'>
            💡 Sugestões: {suggestions.slice(0, 3).join(', ')}
          </div>
        )}
      </div>
    );
  }
);

SmartTextarea.displayName = 'SmartTextarea';

/**
 * SmartSelect Component
 * Select com opções inteligentes baseadas no uso
 */
export const SmartSelect = memo(
  ({
    name,
    label,
    options = [],
    rememberValue = false,
    showFrequent = true,
    className = '',
    onChange,
    value,
    ...props
  }) => {
    const [usageStats, setUsageStats] = useLocalStorage(
      `smart_select_stats_${name}`,
      {}
    );
    const [savedValue, setSavedValue] = useLocalStorage(
      rememberValue ? `smart_select_${name}` : null,
      ''
    );

    const handleChange = useCallback(
      e => {
        const newValue = e.target.value;

        // Atualizar estatísticas de uso
        if (showFrequent && newValue) {
          setUsageStats(prev => ({
            ...prev,
            [newValue]: (prev[newValue] || 0) + 1,
          }));
        }

        if (rememberValue && newValue) {
          setSavedValue(newValue);
        }

        if (onChange) {
          onChange(e);
        }
      },
      [onChange, showFrequent, rememberValue, setUsageStats, setSavedValue]
    );

    // Ordenar opções por frequência de uso
    const sortedOptions = showFrequent
      ? [...options].sort((a, b) => {
          const usageA = usageStats[a.value] || 0;
          const usageB = usageStats[b.value] || 0;
          return usageB - usageA;
        })
      : options;

    const defaultValue = value || (rememberValue ? savedValue : '');

    return (
      <div className={className}>
        {label && (
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            {label}
          </label>
        )}

        <select
          name={name}
          value={defaultValue}
          onChange={handleChange}
          className='
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          transition-colors duration-200
        '
          {...props}
        >
          <option value=''>Selecione uma opção</option>
          {sortedOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
              {showFrequent &&
                usageStats[option.value] &&
                ` (${usageStats[option.value]}x)`}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

SmartSelect.displayName = 'SmartSelect';

/**
 * FormDefaults Component
 * Container que aplica defaults inteligentes a formulários
 */
export const FormDefaults = memo(
  ({ children, autoSave = false, formId, className = '' }) => {
    const [formData, setFormData] = useLocalStorage(
      autoSave ? `form_defaults_${formId}` : null,
      {}
    );

    const handleFormChange = useCallback(
      e => {
        if (autoSave) {
          setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
          }));
        }
      },
      [autoSave, setFormData]
    );

    return (
      <div className={className} onChange={handleFormChange}>
        {children}
      </div>
    );
  }
);

FormDefaults.displayName = 'FormDefaults';

export default SmartInput;
