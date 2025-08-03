// Focus Mode Settings Component
import React, { useState, useCallback } from 'react';
import { X, Palette, Volume2, Clock, Eye } from 'lucide-react';

/**
 * Focus Mode Settings Panel
 * Allows users to customize their focus mode experience
 */
const FocusSettings = ({ 
  config = {}, 
  onConfigChange = () => {}, 
  onClose = () => {} 
}) => {
  const [localConfig, setLocalConfig] = useState({
    hideUI: false,
    enableAmbientSounds: true,
    showWordCount: true,
    enableBreakReminders: true,
    breakInterval: 25, // minutes
    customTheme: {
      backgroundColor: '#f9fafb',
      textColor: '#1f2937',
      fontSize: '18px',
      lineHeight: '1.7',
    },
    ambientSoundType: 'rain',
    ambientVolume: 0.3,
    ...config,
  });

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  }, [localConfig, onConfigChange]);

  /**
   * Update theme settings
   */
  const updateTheme = useCallback((themeUpdates) => {
    const newTheme = { ...localConfig.customTheme, ...themeUpdates };
    updateConfig({ customTheme: newTheme });
  }, [localConfig.customTheme, updateConfig]);

  /**
   * Preset themes
   */
  const presetThemes = [
    {
      name: 'Claro',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
    },
    {
      name: 'Escuro',
      backgroundColor: '#1f2937',
      textColor: '#f9fafb',
    },
    {
      name: 'Sépia',
      backgroundColor: '#f7f3e9',
      textColor: '#5d4e37',
    },
    {
      name: 'Verde Suave',
      backgroundColor: '#f0fdf4',
      textColor: '#166534',
    },
    {
      name: 'Azul Noturno',
      backgroundColor: '#0f172a',
      textColor: '#cbd5e1',
    },
  ];

  /**
   * Ambient sound options
   */
  const ambientSounds = [
    { value: 'rain', label: '🌧️ Chuva' },
    { value: 'forest', label: '🌲 Floresta' },
    { value: 'ocean', label: '🌊 Oceano' },
    { value: 'cafe', label: '☕ Café' },
    { value: 'fireplace', label: '🔥 Lareira' },
    { value: 'white-noise', label: '📻 Ruído Branco' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold font-display">Configurações</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Interface Settings */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-md font-medium">
            <Eye size={18} />
            Interface
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Ocultar interface</span>
              <input
                type="checkbox"
                checked={localConfig.hideUI}
                onChange={(e) => updateConfig({ hideUI: e.target.checked })}
                className="rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm">Mostrar contador de palavras</span>
              <input
                type="checkbox"
                checked={localConfig.showWordCount}
                onChange={(e) => updateConfig({ showWordCount: e.target.checked })}
                className="rounded"
              />
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-md font-medium">
            <Palette size={18} />
            Tema
          </h3>

          {/* Preset Themes */}
          <div className="grid grid-cols-1 gap-2">
            {presetThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => updateTheme(theme)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${localConfig.customTheme?.backgroundColor === theme.backgroundColor
                    ? 'border-pastel-purple-500 bg-pastel-purple-50 dark:bg-pastel-purple-900'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }
                `}
                style={{
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                }}
              >
                <div className="text-sm font-medium">{theme.name}</div>
                <div className="text-xs opacity-70">Aa Exemplo de texto</div>
              </button>
            ))}
          </div>

          {/* Custom Theme Controls */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium mb-1">
                Cor de fundo
              </label>
              <input
                type="color"
                value={localConfig.customTheme?.backgroundColor || '#ffffff'}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cor do texto
              </label>
              <input
                type="color"
                value={localConfig.customTheme?.textColor || '#1f2937'}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tamanho da fonte
              </label>
              <select
                value={localConfig.customTheme?.fontSize || '18px'}
                onChange={(e) => updateTheme({ fontSize: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="14px">Pequena (14px)</option>
                <option value="16px">Normal (16px)</option>
                <option value="18px">Média (18px)</option>
                <option value="20px">Grande (20px)</option>
                <option value="24px">Muito Grande (24px)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Espaçamento entre linhas
              </label>
              <select
                value={localConfig.customTheme?.lineHeight || '1.7'}
                onChange={(e) => updateTheme({ lineHeight: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="1.4">Compacto (1.4)</option>
                <option value="1.6">Normal (1.6)</option>
                <option value="1.7">Confortável (1.7)</option>
                <option value="2.0">Espaçoso (2.0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-md font-medium">
            <Volume2 size={18} />
            Sons Ambiente
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Ativar sons ambiente</span>
              <input
                type="checkbox"
                checked={localConfig.enableAmbientSounds}
                onChange={(e) => updateConfig({ enableAmbientSounds: e.target.checked })}
                className="rounded"
              />
            </label>

            {localConfig.enableAmbientSounds && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de som
                  </label>
                  <div className="grid grid-cols-1 gap-1">
                    {ambientSounds.map((sound) => (
                      <label key={sound.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="ambientSound"
                          value={sound.value}
                          checked={localConfig.ambientSoundType === sound.value}
                          onChange={(e) => updateConfig({ ambientSoundType: e.target.value })}
                          className="rounded"
                        />
                        <span className="text-sm">{sound.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Volume: {Math.round((localConfig.ambientVolume || 0.3) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localConfig.ambientVolume || 0.3}
                    onChange={(e) => updateConfig({ ambientVolume: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Productivity Settings */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-md font-medium">
            <Clock size={18} />
            Produtividade
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Lembretes de pausa</span>
              <input
                type="checkbox"
                checked={localConfig.enableBreakReminders}
                onChange={(e) => updateConfig({ enableBreakReminders: e.target.checked })}
                className="rounded"
              />
            </label>

            {localConfig.enableBreakReminders && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Intervalo de pausa (minutos)
                </label>
                <select
                  value={localConfig.breakInterval || 25}
                  onChange={(e) => updateConfig({ breakInterval: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value={15}>15 minutos</option>
                  <option value={25}>25 minutos (Pomodoro)</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">Atalhos do Teclado</h3>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> - Fechar</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">F11</kbd> - Tela cheia</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Space</kbd> - Iniciar/Pausar</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+S</kbd> - Configurações</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+T</kbd> - Estatísticas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusSettings;