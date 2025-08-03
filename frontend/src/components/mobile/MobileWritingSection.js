// Mobile-optimized writing section with all mobile enhancements
import React, { memo, useState, useEffect } from 'react';
import { Sparkles, Keyboard, RotateCcw } from 'lucide-react';

import { useVirtualKeyboard, useOrientationOptimization, useSafeArea } from '../../hooks/useMobileOptimizations';
import { useDeviceDetection } from '../../hooks/useResponsive';
import { useHapticFeedback } from '../../hooks/useTouchGestures';
import MobileWritingEditor from './MobileWritingEditor';
import MobileThemeSelector from './MobileThemeSelector';
import { MobileBottomSheet } from '../responsive/MobileOptimized';

/**
 * MobileWritingSection Component
 * Complete mobile-optimized writing experience
 */
const MobileWritingSection = memo(({
  themes = [],
  selectedTheme = null,
  onThemeSelect = () => {},
  essayContent = '',
  onEssayChange = () => {},
  onSubmitEssay = () => {},
  loading = false,
  aiModel = '',
  onAiModelChange = () => {},
  models = {},
}) => {
  const device = useDeviceDetection();
  const haptics = useHapticFeedback();
  const safeArea = useSafeArea();
  
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [showWritingTips, setShowWritingTips] = useState(false);

  // Virtual keyboard handling
  const keyboard = useVirtualKeyboard({
    adjustViewport: true,
    preventZoom: true,
    onKeyboardShow: () => {
      // Hide theme selector when keyboard appears
      setIsThemeSelectorOpen(false);
    },
  });

  // Orientation handling
  const orientation = useOrientationOptimization({
    onOrientationChange: (newOrientation) => {
      // Provide haptic feedback on orientation change
      haptics.lightTap();
      
      // Adjust layout based on orientation
      if (newOrientation.isLandscape) {
        // In landscape, prioritize writing area
        setIsThemeSelectorOpen(false);
      }
    },
    enableHapticFeedback: true,
  });

  const handleThemeSelect = (theme) => {
    onThemeSelect(theme);
    setIsThemeSelectorOpen(false);
    haptics.success();
  };

  const handleSubmit = () => {
    if (!selectedTheme || !essayContent || !essayContent.trim()) {
      haptics.error();
      // Show error message
      return;
    }
    
    haptics.success();
    onSubmitEssay();
  };

  const handleModelChange = (modelKey) => {
    onAiModelChange(modelKey);
    setIsModelSelectorOpen(false);
    haptics.mediumTap();
  };

  // Writing tips for mobile users
  const writingTips = [
    'Use dois dedos para selecionar texto rapidamente',
    'Toque duas vezes em uma palavra para selecioná-la',
    'Mantenha pressionado para acessar o menu de contexto',
    'Gire o dispositivo para modo paisagem para mais espaço',
    'Use o botão "Concluir" para fechar o teclado',
  ];

  return (
    <div 
      className={`
        mobile-writing-section min-h-screen bg-gradient-to-br from-pastel-blue-50 to-pastel-purple-50
        dark:from-gray-900 dark:to-gray-800 transition-colors duration-300
        ${orientation.isLandscape ? 'landscape' : 'portrait'}
        ${keyboard.isVisible ? 'keyboard-visible' : ''}
      `}
      style={safeArea.paddingStyle}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-semibold text-gray-900 dark:text-white">
              Escrever Redação
            </h1>
            
            <div className="flex items-center gap-2">
              {/* Writing tips button */}
              <button
                onClick={() => {
                  setShowWritingTips(true);
                  haptics.lightTap();
                }}
                className={`
                  p-2 rounded-full bg-pastel-blue-100 dark:bg-pastel-blue-900/30
                  text-pastel-blue-600 dark:text-pastel-blue-400
                  ${device.isTouchDevice ? 'touch-manipulation' : ''}
                  hover:bg-pastel-blue-200 dark:hover:bg-pastel-blue-900/50
                  transition-colors duration-200
                `}
              >
                <Sparkles size={18} />
              </button>

              {/* AI Model selector */}
              <button
                onClick={() => {
                  setIsModelSelectorOpen(true);
                  haptics.lightTap();
                }}
                className={`
                  px-3 py-2 bg-pastel-purple-100 dark:bg-pastel-purple-900/30 rounded-lg
                  text-sm font-body text-pastel-purple-700 dark:text-pastel-purple-300
                  ${device.isTouchDevice ? 'touch-manipulation' : ''}
                  hover:bg-pastel-purple-200 dark:hover:bg-pastel-purple-900/50
                  transition-colors duration-200
                `}
              >
                {models[aiModel]?.name || 'Selecionar IA'}
              </button>
            </div>
          </div>

          {/* Selected theme indicator */}
          {selectedTheme && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-pastel-purple-500 rounded-full" />
              <span className="text-sm font-body text-gray-600 dark:text-gray-400">
                {selectedTheme.title}
              </span>
              <button
                onClick={() => {
                  setIsThemeSelectorOpen(true);
                  haptics.lightTap();
                }}
                className="text-xs text-pastel-purple-600 dark:text-pastel-purple-400 hover:underline"
              >
                Alterar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Theme selection */}
        {!selectedTheme && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <MobileThemeSelector
              themes={themes}
              selectedTheme={selectedTheme}
              onThemeSelect={handleThemeSelect}
              onCustomTheme={handleThemeSelect}
              showCustomOption={true}
            />
          </div>
        )}

        {/* Writing area */}
        {selectedTheme && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                Sua Redação
              </h2>
              <p className="text-sm font-body text-gray-600 dark:text-gray-400 mt-1">
                {selectedTheme.title}
              </p>
            </div>

            <MobileWritingEditor
              value={essayContent}
              onChange={onEssayChange}
              placeholder={`Comece a escrever sua redação sobre "${selectedTheme.title}"...

Estrutura sugerida:
• Introdução (apresente o tema e sua tese)
• Desenvolvimento 1 (primeiro argumento)
• Desenvolvimento 2 (segundo argumento)
• Conclusão (retome a tese e proponha uma solução)

Dicas para mobile:
• Toque duas vezes para selecionar palavras
• Use gestos de pinça para zoom (se necessário)
• Gire o dispositivo para mais espaço de escrita`}
              className="min-h-[300px]"
              autoFocus={true}
            />
          </div>
        )}

        {/* Submit button */}
        {selectedTheme && essayContent && (
          <div className="sticky bottom-4 z-30">
            <button
              onClick={handleSubmit}
              disabled={loading || !essayContent.trim()}
              className={`
                w-full py-4 px-6 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500
                text-white font-body font-medium rounded-xl shadow-lg
                ${device.isTouchDevice ? 'touch-manipulation haptic-feedback' : ''}
                ${loading || !essayContent.trim() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-xl active:scale-95'
                }
                transition-all duration-200
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando para Correção...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={20} />
                  Enviar para Correção
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Theme selector bottom sheet */}
      <MobileBottomSheet
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        snapPoints={['50%', '80%', '95%']}
        initialSnap={1}
      >
        <MobileThemeSelector
          themes={themes}
          selectedTheme={selectedTheme}
          onThemeSelect={handleThemeSelect}
          onCustomTheme={handleThemeSelect}
          showCustomOption={true}
        />
      </MobileBottomSheet>

      {/* AI Model selector bottom sheet */}
      <MobileBottomSheet
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        snapPoints={['40%', '60%']}
        initialSnap={0}
      >
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            Selecionar Modelo de IA
          </h3>
          
          <div className="space-y-2">
            {Object.entries(models || {}).map(([key, model]) => (
              <button
                key={key}
                onClick={() => handleModelChange(key)}
                className={`
                  w-full p-4 text-left rounded-lg border-2 transition-all duration-200
                  ${device.isTouchDevice ? 'touch-manipulation' : ''}
                  ${aiModel === key
                    ? 'border-pastel-purple-400 bg-pastel-purple-50 dark:bg-pastel-purple-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-body font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </h4>
                    {model.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {model.description}
                      </p>
                    )}
                  </div>
                  {aiModel === key && (
                    <div className="w-2 h-2 bg-pastel-purple-500 rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </MobileBottomSheet>

      {/* Writing tips bottom sheet */}
      <MobileBottomSheet
        isOpen={showWritingTips}
        onClose={() => setShowWritingTips(false)}
        snapPoints={['50%', '70%']}
        initialSnap={0}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Keyboard size={20} className="text-pastel-blue-500" />
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Dicas para Escrita Mobile
            </h3>
          </div>
          
          <div className="space-y-3">
            {writingTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-6 h-6 bg-pastel-blue-100 dark:bg-pastel-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-pastel-blue-600 dark:text-pastel-blue-400">
                    {index + 1}
                  </span>
                </div>
                <p className="font-body text-sm text-gray-700 dark:text-gray-300">
                  {tip}
                </p>
              </div>
            ))}
          </div>

          {orientation.isPortrait && (
            <div className="mt-4 p-3 bg-pastel-yellow-50 dark:bg-pastel-yellow-900/20 rounded-lg border border-pastel-yellow-200 dark:border-pastel-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw size={16} className="text-pastel-yellow-600 dark:text-pastel-yellow-400" />
                <span className="font-body font-medium text-pastel-yellow-800 dark:text-pastel-yellow-300">
                  Dica Especial
                </span>
              </div>
              <p className="font-body text-sm text-pastel-yellow-700 dark:text-pastel-yellow-400">
                Gire seu dispositivo para o modo paisagem para ter mais espaço de escrita!
              </p>
            </div>
          )}
        </div>
      </MobileBottomSheet>
    </div>
  );
});

MobileWritingSection.displayName = 'MobileWritingSection';

export default MobileWritingSection;