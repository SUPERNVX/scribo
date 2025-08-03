// ARIA Helpers for accessibility
import React, { memo, useState, useEffect } from 'react';

import ScreenReaderOnly, { LiveRegion } from './ScreenReaderOnly';

/**
 * AriaStatus Component
 * Anuncia mudanças de status para screen readers
 */
export const AriaStatus = memo(({ message, clearAfter = 3000 }) => {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return <LiveRegion politeness='polite'>{currentMessage}</LiveRegion>;
});

/**
 * AriaAlert Component
 * Alertas importantes para screen readers
 */
export const AriaAlert = memo(({ message, clearAfter = 5000 }) => {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <LiveRegion politeness='assertive' role='alert'>
      {currentMessage}
    </LiveRegion>
  );
});

/**
 * ExpandableSection Component
 * Seção expansível com ARIA apropriado
 */
export const ExpandableSection = memo(
  ({
    title,
    children,
    isExpanded = false,
    onToggle,
    className = '',
    buttonClassName = '',
  }) => {
    const sectionId = `expandable-${Math.random().toString(36).substr(2, 9)}`;
    const buttonId = `button-${sectionId}`;

    return (
      <div className={className}>
        <button
          id={buttonId}
          aria-expanded={isExpanded}
          aria-controls={sectionId}
          onClick={onToggle}
          className={`
          focus:outline-none 
          focus:ring-2 
          focus:ring-pastel-purple-500 
          focus:ring-offset-2
          transition-all
          duration-200
          ${buttonClassName}
        `}
        >
          {title}
          <ScreenReaderOnly>
            {isExpanded ? 'Clique para recolher' : 'Clique para expandir'}
          </ScreenReaderOnly>
        </button>

        <div
          id={sectionId}
          role='region'
          aria-labelledby={buttonId}
          hidden={!isExpanded}
        >
          {isExpanded && children}
        </div>
      </div>
    );
  }
);

/**
 * ProgressAnnouncer Component
 * Anuncia progresso para screen readers
 */
export const ProgressAnnouncer = memo(
  ({
    value,
    max = 100,
    label = 'Progresso',
    announceEvery = 10, // Anuncia a cada 10%
  }) => {
    const [lastAnnounced, setLastAnnounced] = useState(0);
    const percentage = Math.round((value / max) * 100);

    useEffect(() => {
      const shouldAnnounce =
        percentage >= lastAnnounced + announceEvery || percentage === 100;

      if (shouldAnnounce && percentage !== lastAnnounced) {
        setLastAnnounced(percentage);
      }
    }, [percentage, lastAnnounced, announceEvery]);

    return (
      <>
        <div
          role='progressbar'
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          aria-describedby={`progress-desc-${label.replace(/\s+/g, '-')}`}
        />

        <ScreenReaderOnly id={`progress-desc-${label.replace(/\s+/g, '-')}`}>
          {label}: {percentage}% concluído
        </ScreenReaderOnly>

        {percentage === lastAnnounced && (
          <AriaStatus message={`${label}: ${percentage}% concluído`} />
        )}
      </>
    );
  }
);

/**
 * FormFieldGroup Component
 * Grupo de campos de formulário com ARIA
 */
export const FormFieldGroup = memo(
  ({ legend, children, required = false, error, className = '' }) => {
    const groupId = `fieldgroup-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `error-${groupId}` : undefined;

    return (
      <fieldset className={className} aria-describedby={errorId}>
        <legend className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
          {legend}
          {required && (
            <span aria-label='obrigatório' className='text-red-500 ml-1'>
              *
            </span>
          )}
        </legend>

        {children}

        {error && (
          <div
            id={errorId}
            role='alert'
            className='mt-1 text-sm text-red-600 dark:text-red-400'
          >
            {error}
          </div>
        )}
      </fieldset>
    );
  }
);

/**
 * TabList Component
 * Lista de abas com navegação por teclado
 */
export const TabList = memo(
  ({ tabs, activeTab, onTabChange, className = '' }) => {
    const handleKeyDown = (event, index) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
          onTabChange(tabs[prevIndex].id);
          break;

        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
          onTabChange(tabs[nextIndex].id);
          break;

        case 'Home':
          event.preventDefault();
          onTabChange(tabs[0].id);
          break;

        case 'End':
          event.preventDefault();
          onTabChange(tabs[tabs.length - 1].id);
          break;
      }
    };

    return (
      <div className={className}>
        <div
          role='tablist'
          className='flex border-b border-gray-200 dark:border-gray-600'
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role='tab'
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={e => handleKeyDown(e, index)}
              className={`
              px-4 py-2 font-medium text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-pastel-purple-500
              ${
                activeTab === tab.id
                  ? 'text-pastel-purple-600 border-b-2 border-pastel-purple-600'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabs.map(tab => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role='tabpanel'
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            className='mt-4'
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    );
  }
);

AriaStatus.displayName = 'AriaStatus';
AriaAlert.displayName = 'AriaAlert';
ExpandableSection.displayName = 'ExpandableSection';
ProgressAnnouncer.displayName = 'ProgressAnnouncer';
FormFieldGroup.displayName = 'FormFieldGroup';
TabList.displayName = 'TabList';

export default {
  AriaStatus,
  AriaAlert,
  ExpandableSection,
  ProgressAnnouncer,
  FormFieldGroup,
  TabList,
};
