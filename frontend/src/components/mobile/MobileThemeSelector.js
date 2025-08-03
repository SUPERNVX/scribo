// Mobile-optimized theme selector with swipe gestures
import React, { memo, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import { useSwipeNavigation, useHapticFeedback } from '../../hooks/useTouchGestures';
import { useDeviceDetection } from '../../hooks/useResponsive';
import { MobileCarousel, MobileBottomSheet } from '../responsive/MobileOptimized';

/**
 * MobileThemeSelector Component
 * Touch-optimized theme selection with swipe navigation
 */
const MobileThemeSelector = memo(({
  themes = [],
  selectedTheme = null,
  onThemeSelect,
  onCustomTheme,
  className = '',
  showCustomOption = true,
}) => {
  const device = useDeviceDetection();
  const haptics = useHapticFeedback();
  
  const [isCustomSheetOpen, setIsCustomSheetOpen] = useState(false);
  const [customThemeText, setCustomThemeText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default themes if none provided
  const defaultThemes = [
    {
      id: 1,
      title: 'Democratização do acesso ao cinema no Brasil',
      description: 'Analise os desafios e possíveis soluções relacionados ao acesso ao cinema no Brasil',
      tags: ['cinema', 'cultura', 'democratização'],
      color: 'bg-gradient-to-br from-pastel-blue-100 to-pastel-blue-200',
    },
    {
      id: 2,
      title: 'Educação financeira como instrumento de transformação social',
      description: 'Analise a importância da educação financeira na formação social',
      tags: ['educação financeira', 'transformação social', 'cidadania'],
      color: 'bg-gradient-to-br from-pastel-green-100 to-pastel-green-200',
    },
    {
      id: 3,
      title: 'O impacto das redes sociais na saúde mental dos jovens',
      description: 'Discuta os efeitos das redes sociais no bem-estar psicológico da juventude',
      tags: ['redes sociais', 'saúde mental', 'juventude'],
      color: 'bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-200',
    },
    {
      id: 4,
      title: 'Sustentabilidade urbana e qualidade de vida',
      description: 'Analise como práticas sustentáveis podem melhorar a vida nas cidades',
      tags: ['sustentabilidade', 'urbanismo', 'qualidade de vida'],
      color: 'bg-gradient-to-br from-pastel-yellow-100 to-pastel-yellow-200',
    },
  ];

  const allThemes = themes.length > 0 ? themes : defaultThemes;

  const handleThemeSelect = (theme) => {
    haptics.mediumTap();
    onThemeSelect?.(theme);
  };

  const handleCustomThemeSubmit = () => {
    if (customThemeText.trim()) {
      const customTheme = {
        id: 'custom',
        title: customThemeText.trim(),
        description: 'Tema personalizado',
        tags: ['personalizado'],
        custom: true,
        color: 'bg-gradient-to-br from-pastel-pink-100 to-pastel-pink-200',
      };
      
      haptics.success();
      onCustomTheme?.(customTheme);
      onThemeSelect?.(customTheme);
      setCustomThemeText('');
      setIsCustomSheetOpen(false);
    }
  };

  // Theme card component
  const ThemeCard = memo(({ theme, isSelected, onClick }) => (
    <div
      onClick={() => onClick(theme)}
      className={`
        relative p-4 rounded-xl shadow-sm border-2 transition-all duration-200
        ${theme.color || 'bg-gradient-to-br from-gray-50 to-gray-100'}
        ${isSelected 
          ? 'border-pastel-purple-400 shadow-lg scale-105' 
          : 'border-gray-200 dark:border-gray-700'
        }
        ${device.isTouchDevice ? 'touch-manipulation' : ''}
        cursor-pointer hover:shadow-md
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-pastel-purple-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm leading-tight">
          {theme.title}
        </h3>
        
        <p className="font-body text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {theme.description}
        </p>
        
        {theme.tags && theme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {theme.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded-full text-xs font-body text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {theme.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded-full text-xs font-body text-gray-500">
                +{theme.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  ));

  return (
    <div className={`mobile-theme-selector ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
          Escolha um Tema
        </h2>
        
        {showCustomOption && (
          <button
            onClick={() => {
              setIsCustomSheetOpen(true);
              haptics.lightTap();
            }}
            className={`
              flex items-center gap-2 px-3 py-2 bg-pastel-purple-100 dark:bg-pastel-purple-900/30
              rounded-lg text-sm font-body text-pastel-purple-700 dark:text-pastel-purple-300
              ${device.isTouchDevice ? 'touch-manipulation' : ''}
              hover:bg-pastel-purple-200 dark:hover:bg-pastel-purple-900/50
              transition-colors duration-200
            `}
          >
            <Plus size={16} />
            Personalizar
          </button>
        )}
      </div>

      {/* Mobile carousel for themes */}
      <MobileCarousel
        items={allThemes}
        renderItem={(theme, index) => (
          <div className="px-2">
            <ThemeCard
              theme={theme}
              isSelected={selectedTheme?.id === theme.id}
              onClick={handleThemeSelect}
            />
          </div>
        )}
        showDots={true}
        autoPlay={false}
        className="mb-4"
      />

      {/* Grid view for larger screens */}
      {!device.isMobile && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {allThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme?.id === theme.id}
              onClick={handleThemeSelect}
            />
          ))}
        </div>
      )}

      {/* Selected theme info */}
      {selectedTheme && (
        <div className="mt-4 p-3 bg-pastel-purple-50 dark:bg-pastel-purple-900/20 rounded-lg border border-pastel-purple-200 dark:border-pastel-purple-800">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-pastel-purple-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <p className="font-body text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Tema selecionado:</span> {selectedTheme.title}
              </p>
              {selectedTheme.custom && (
                <p className="font-body text-xs text-pastel-purple-600 dark:text-pastel-purple-400 mt-1">
                  Tema personalizado
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom theme bottom sheet */}
      <MobileBottomSheet
        isOpen={isCustomSheetOpen}
        onClose={() => setIsCustomSheetOpen(false)}
        snapPoints={['40%', '60%', '80%']}
        initialSnap={1}
      >
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            Criar Tema Personalizado
          </h3>
          
          <div className="space-y-3">
            <label className="block">
              <span className="font-body text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Digite seu tema personalizado:
              </span>
              <textarea
                value={customThemeText}
                onChange={(e) => setCustomThemeText(e.target.value)}
                placeholder="Ex: A importância da leitura na formação do cidadão crítico..."
                className={`
                  w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  font-body text-base leading-relaxed resize-none
                  ${device.isTouchDevice ? 'touch-manipulation' : ''}
                  focus:ring-2 focus:ring-pastel-purple-300 focus:border-pastel-purple-400
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                `}
                rows={4}
                maxLength={200}
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {customThemeText.length}/200 caracteres
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsCustomSheetOpen(false)}
              className={`
                flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600
                rounded-lg font-body text-gray-700 dark:text-gray-300
                ${device.isTouchDevice ? 'touch-manipulation' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200
              `}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleCustomThemeSubmit}
              disabled={!customThemeText.trim()}
              className={`
                flex-1 py-3 px-4 bg-pastel-purple-500 text-white rounded-lg
                font-body font-medium transition-all duration-200
                ${device.isTouchDevice ? 'touch-manipulation' : ''}
                ${customThemeText.trim() 
                  ? 'hover:bg-pastel-purple-600 active:scale-95' 
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              Usar Este Tema
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </div>
  );
});

MobileThemeSelector.displayName = 'MobileThemeSelector';

export default MobileThemeSelector;