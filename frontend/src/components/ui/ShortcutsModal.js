// Modal de Atalhos do Sistema - Versão Simplificada
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { X, Keyboard, Edit3, Search, Save, Target, Settings } from 'lucide-react';

/**
 * Modal que exibe todos os atalhos disponíveis no sistema
 */
const ShortcutsModal = memo(({ isOpen = false, onClose = () => { } }) => {
  if (!isOpen) return null;

  const shortcutCategories = [
    {
      title: 'Editor de Redação',
      icon: <Edit3 size={18} />,
      shortcuts: [
        { key: 'Ctrl + S', description: 'Salvar redação' },
        { key: 'Ctrl + Z', description: 'Desfazer última ação' },
        { key: 'Ctrl + Shift + Z', description: 'Refazer ação desfeita' },
        { key: 'Ctrl + Enter', description: 'Enviar redação para correção' },
        { key: 'Ctrl + /', description: 'Abrir este menu de atalhos' },
        { key: 'F1', description: 'Mostrar ajuda do editor' },
      ]
    },
    {
      title: 'Busca e Dicionário',
      icon: <Search size={18} />,
      shortcuts: [
        { key: 'Duplo clique', description: 'Consultar palavra no dicionário' },
        { key: 'Ctrl + Shift + D', description: 'Abrir dicionário' },
        { key: 'F3', description: 'Buscar próxima ocorrência' },
        { key: 'Shift + F3', description: 'Buscar ocorrência anterior' },
      ]
    },
    {
      title: 'Produtividade',
      icon: <Save size={18} />,
      shortcuts: [
        { key: 'Ctrl + Shift + A', description: 'Auto-salvar agora' },
        { key: 'Ctrl + Shift + R', description: 'Restaurar rascunho salvo' },
        { key: 'Ctrl + Shift + C', description: 'Limpar rascunhos' },
        { key: 'Ctrl + P', description: 'Imprimir redação' },
      ]
    },
    {
      title: 'Acessibilidade',
      icon: <Settings size={18} />,
      shortcuts: [
        { key: 'Alt + 1', description: 'Pular para conteúdo principal' },
        { key: 'Alt + 2', description: 'Pular para navegação' },
        { key: 'Tab', description: 'Navegar entre elementos' },
        { key: 'Shift + Tab', description: 'Navegar para elemento anterior' },
        { key: 'Enter', description: 'Ativar elemento focado' },
        { key: 'Space', description: 'Ativar botão ou checkbox' },
      ]
    }
  ];

  // Função para fechar ao clicar no overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <Keyboard size={24} className="text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Atalhos do Teclado
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Domine o Scribo com estes atalhos úteis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Fechar (Esc)"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="flex flex-col space-y-4">
            {shortcutCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-800 rounded">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 ml-4">
                        {shortcut.key.split(' + ').map((key, keyIndex, array) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < array.length - 1 && (
                              <span className="text-gray-400 text-xs mx-1">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer com dicas */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Dicas para Máxima Produtividade
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Pressione <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl + /</kbd> a qualquer momento para ver estes atalhos</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl + S</kbd> para salvar seu rascunho automaticamente</li>
                  <li>• Duplo clique em qualquer palavra para consultar o dicionário</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl + Enter</kbd> para enviar rapidamente sua redação</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

ShortcutsModal.displayName = 'ShortcutsModal';

export default ShortcutsModal;