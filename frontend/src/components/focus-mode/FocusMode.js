// Advanced Focus Mode Component
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { toast } from 'react-hot-toast';
import { X, Settings, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

import { useFocusMode } from '../../hooks/useFocusMode';
import useGamification from '../../hooks/useGamification';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import FocusSettings from './FocusSettings';
import FocusTimer from './FocusTimer';
import FocusStats from './FocusStats';
import AmbientSounds from './AmbientSounds';

/**
 * Advanced Focus Mode Component
 * Provides a distraction-free writing environment with customizable settings
 */
const FocusMode = memo(({
  isOpen = false,
  onClose = () => {},
  initialContent = '',
  onContentChange = () => {},
  onSave = () => {},
  theme = null,
}) => {
  const {
    focusSession,
    config,
    updateConfig,
    startSession,
    pauseSession,
    endSession,
    isActive,
    timeElapsed,
    wordsWritten,
    productivity,
  } = useFocusMode();

  const { addXP, recordEssay } = useGamification();
  
  const [content, setContent] = useState(initialContent);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(config.enableAmbientSounds);
  
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Keyboard shortcuts for focus mode
  useKeyboardShortcuts({
    'Escape': () => {
      if (showSettings) {
        setShowSettings(false);
      } else if (showStats) {
        setShowStats(false);
      } else {
        handleClose();
      }
    },
    'F11': (e) => {
      e.preventDefault();
      toggleFullscreen();
    },
    'Ctrl+Space': (e) => {
      e.preventDefault();
      toggleSession();
    },
    'Ctrl+Shift+S': (e) => {
      e.preventDefault();
      setShowSettings(!showSettings);
    },
    'Ctrl+Shift+T': (e) => {
      e.preventDefault();
      setShowStats(!showStats);
    },
  }, isOpen);

  /**
   * Handle content changes and track writing metrics
   */
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    onContentChange(newContent);
    
    // Update words written in session
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    // This would be handled by the useFocusMode hook
  }, [onContentChange]);

  /**
   * Toggle focus session (start/pause)
   */
  const toggleSession = useCallback(() => {
    if (isActive) {
      pauseSession();
      toast.success('Sessão pausada');
    } else {
      startSession();
      toast.success('Sessão iniciada');
    }
  }, [isActive, startSession, pauseSession]);

  /**
   * Handle closing focus mode
   */
  const handleClose = useCallback(() => {
    if (isActive) {
      const shouldEnd = window.confirm(
        'Você tem uma sessão ativa. Deseja finalizar e salvar o progresso?'
      );
      
      if (shouldEnd) {
        endSession();
        handleSave();
        
        // Award XP for focus session
        const sessionXP = Math.floor(timeElapsed / 60) * 5; // 5 XP per minute
        addXP('FOCUS_SESSION', sessionXP);
        
        toast.success(`Sessão finalizada! +${sessionXP} XP`);
      } else {
        return; // Don't close if user cancels
      }
    }
    
    onClose();
  }, [isActive, endSession, timeElapsed, addXP, onClose]);

  /**
   * Handle saving content
   */
  const handleSave = useCallback(() => {
    onSave(content);
    toast.success('Conteúdo salvo!');
  }, [content, onSave]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  /**
   * Reset session
   */
  const resetSession = useCallback(() => {
    if (window.confirm('Deseja reiniciar a sessão? O progresso atual será perdido.')) {
      endSession();
      toast.info('Sessão reiniciada');
    }
  }, [endSession]);

  /**
   * Toggle ambient sounds
   */
  const toggleAmbientSounds = useCallback(() => {
    const newState = !ambientSoundEnabled;
    setAmbientSoundEnabled(newState);
    updateConfig({ enableAmbientSounds: newState });
  }, [ambientSoundEnabled, updateConfig]);

  // Focus textarea when entering focus mode
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto-save content periodically
  useEffect(() => {
    if (isOpen && content !== initialContent) {
      const autoSaveTimer = setTimeout(() => {
        handleSave();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [content, initialContent, isOpen, handleSave]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col ${config.customTheme?.backgroundColor || 'bg-gray-50 dark:bg-gray-900'} transition-all duration-300`}
      style={{
        backgroundColor: config.customTheme?.backgroundColor,
        color: config.customTheme?.textColor,
      }}
    >
      {/* Header - Hidden in minimized mode */}
      {!isMinimized && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold">
              Modo Foco
            </h1>
            
            {theme && (
              <span className="px-3 py-1 text-sm bg-pastel-purple-100 dark:bg-pastel-purple-900 text-pastel-purple-800 dark:text-pastel-purple-200 rounded-full">
                {theme.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Timer Display */}
            <FocusTimer 
              timeElapsed={timeElapsed}
              isActive={isActive}
              productivity={productivity}
            />

            {/* Control Buttons */}
            <button
              onClick={toggleSession}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isActive ? 'Pausar (Ctrl+Space)' : 'Iniciar (Ctrl+Space)'}
            >
              {isActive ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={resetSession}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Reiniciar sessão"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={toggleAmbientSounds}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Sons ambiente"
            >
              {ambientSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Estatísticas (Ctrl+Shift+T)"
            >
              📊
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Configurações (Ctrl+Shift+S)"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Minimizar interface"
            >
              {isMinimized ? '🔼' : '🔽'}
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
              title="Fechar (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`
              flex-1 w-full p-6 bg-transparent border-none outline-none resize-none
              font-body text-lg leading-relaxed
              ${config.customTheme?.fontSize ? `text-${config.customTheme.fontSize}` : 'text-lg'}
              ${config.customTheme?.lineHeight ? `leading-${config.customTheme.lineHeight}` : 'leading-relaxed'}
            `}
            style={{
              fontSize: config.customTheme?.fontSize,
              lineHeight: config.customTheme?.lineHeight,
              color: config.customTheme?.textColor,
            }}
            placeholder="Comece a escrever sua redação aqui...

Use Ctrl+Space para iniciar/pausar o timer
Use F11 para tela cheia
Use Esc para sair do modo foco"
            spellCheck={true}
          />

          {/* Word Count - Always visible */}
          {config.showWordCount && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {content.trim().split(/\s+/).filter(word => word.length > 0).length} palavras
            </div>
          )}
        </div>

        {/* Side Panels */}
        {showSettings && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700">
            <FocusSettings
              config={config}
              onConfigChange={updateConfig}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}

        {showStats && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700">
            <FocusStats
              session={focusSession}
              timeElapsed={timeElapsed}
              wordsWritten={wordsWritten}
              productivity={productivity}
              onClose={() => setShowStats(false)}
            />
          </div>
        )}
      </div>

      {/* Ambient Sounds */}
      {ambientSoundEnabled && (
        <AmbientSounds
          enabled={ambientSoundEnabled}
          volume={config.ambientVolume || 0.3}
          soundType={config.ambientSoundType || 'rain'}
        />
      )}

      {/* Minimized Mode Indicator */}
      {isMinimized && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FocusTimer 
            timeElapsed={timeElapsed}
            isActive={isActive}
            productivity={productivity}
            compact={true}
          />
          <button
            onClick={() => setIsMinimized(false)}
            className="text-white hover:text-gray-300"
          >
            🔼
          </button>
        </div>
      )}
    </div>
  );
});

FocusMode.displayName = 'FocusMode';

export default FocusMode;