// Integration tests for EnhancedWritingSection with StructuredParagraphEditor
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';

// Mock axios before any imports that might use it
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return {
    default: {
      create: jest.fn(() => mockAxiosInstance),
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    },
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  };
});

import EnhancedWritingSection from '../EnhancedWritingSection';

// Mock dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../hooks', () => ({
  useEssayAutoSave: () => ({
    save: jest.fn(),
    restoreSaved: jest.fn(),
    clearSaved: jest.fn(),
    hasSavedData: false,
  }),
  useTextUndoRedo: () => ({
    state: '',
    pushTextState: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: false,
    canRedo: false,
  }),
  useEditorShortcuts: () => ({}),
  useGlobalShortcuts: () => ({}),
}));

jest.mock('../../../hooks/useParagraphAnalysis', () => ({
  useParagraphAnalysis: () => ({
    analyzeParagraph: jest.fn().mockResolvedValue({
      suggestions: [],
      summary: 'Análise concluída.',
      analysisType: 'api',
    }),
    loading: false,
  }),
}));

jest.mock('../../../services/temasService', () => ({
  getEstiloDefinicao: () => ({
    descricao: 'Descrição do estilo',
    caracteristicas: ['Característica 1', 'Característica 2'],
  }),
}));

jest.mock('../../../utils/lazyImports', () => ({
  LazyFocusMode: ({ children }) => <div data-testid="focus-mode">{children}</div>,
}));

jest.mock('../../ui/ShortcutIndicator', () => ({ shortcut }) => (
  <span data-testid="shortcut-indicator">{shortcut}</span>
));

jest.mock('../../ui/ShortcutsModal', () => ({ isOpen, onClose }) => 
  isOpen ? <div data-testid="shortcuts-modal" onClick={onClose}>Shortcuts Modal</div> : null
);

describe('EnhancedWritingSection with StructuredParagraphEditor Integration', () => {
  const defaultProps = {
    themes: [
      {
        id: 1,
        title: 'Test Theme',
        description: 'Test description',
        estilo: 'dissertativo-argumentativo',
        tags: ['test'],
      },
    ],
    selectedTheme: {
      id: 1,
      title: 'Test Theme',
      description: 'Test description',
      estilo: 'dissertativo-argumentativo',
      tags: ['test'],
    },
    onThemeSelect: jest.fn(),
    essayContent: '',
    onEssayChange: jest.fn(),
    onSubmitEssay: jest.fn(),
    loading: false,
    onWordDoubleClick: jest.fn(),
    aiModel: 'gpt-4',
    onAiModelChange: jest.fn(),
    models: {
      'gpt-4': { name: 'GPT-4' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with traditional editor by default', () => {
    render(<EnhancedWritingSection {...defaultProps} />);

    // Should show traditional editor
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Editor Estruturado')).toBeInTheDocument();
  });

  it('toggles to structured editor when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<EnhancedWritingSection {...defaultProps} />);

    // Click toggle button
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Should show structured editor
    await waitFor(() => {
      expect(screen.getByText('Introdução')).toBeInTheDocument();
      expect(screen.getByText('Desenvolvimento 1')).toBeInTheDocument();
      expect(screen.getByText('Desenvolvimento 2')).toBeInTheDocument();
      expect(screen.getByText('Conclusão')).toBeInTheDocument();
    });

    // Button text should change
    expect(screen.getByText('Editor Tradicional')).toBeInTheDocument();
  });

  it('converts content when switching between editors', async () => {
    const user = userEvent.setup();
    const onEssayChange = jest.fn();
    
    const propsWithContent = {
      ...defaultProps,
      essayContent: 'Introdução\n\nDesenvolvimento 1\n\nDesenvolvimento 2\n\nConclusão',
      onEssayChange,
    };

    render(<EnhancedWritingSection {...propsWithContent} />);

    // Switch to structured editor
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Should show success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Mudou para editor estruturado');
    });

    // Switch back to traditional editor
    const backToggleButton = screen.getByText('Editor Tradicional');
    await user.click(backToggleButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Mudou para editor tradicional');
    });
  });

  it('shows analyze buttons in structured editor mode', async () => {
    const user = userEvent.setup();
    
    render(<EnhancedWritingSection {...defaultProps} />);

    // Switch to structured editor
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Should show analyze buttons for each paragraph
    await waitFor(() => {
      const analyzeButtons = screen.getAllByText('Analisar este parágrafo');
      expect(analyzeButtons).toHaveLength(4);
    });
  });

  it('hides undo/redo buttons in structured editor mode', async () => {
    const user = userEvent.setup();
    
    render(<EnhancedWritingSection {...defaultProps} />);

    // Initially should show undo/redo buttons
    expect(screen.getByTitle('Desfazer (Ctrl+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Refazer (Ctrl+Shift+Z)')).toBeInTheDocument();

    // Switch to structured editor
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Should hide undo/redo buttons
    await waitFor(() => {
      expect(screen.queryByTitle('Desfazer (Ctrl+Z)')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Refazer (Ctrl+Shift+Z)')).not.toBeInTheDocument();
    });
  });

  it('maintains word count display in both modes', async () => {
    const user = userEvent.setup();
    
    const propsWithContent = {
      ...defaultProps,
      essayContent: 'Esta é uma redação de teste com várias palavras para verificar a contagem.',
    };

    render(<EnhancedWritingSection {...propsWithContent} />);

    // Should show word count in traditional mode
    expect(screen.getByText(/\d+ palavras/)).toBeInTheDocument();

    // Switch to structured editor
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Should still show word counts (multiple in structured mode)
    await waitFor(() => {
      const wordCounts = screen.getAllByText(/\d+ palavras/);
      expect(wordCounts.length).toBeGreaterThan(0);
    });
  });

  it('preserves focus mode functionality in both editor modes', async () => {
    const user = userEvent.setup();
    
    render(<EnhancedWritingSection {...defaultProps} />);

    // Focus mode button should be available in traditional mode
    expect(screen.getByText('Modo Foco')).toBeInTheDocument();

    // Switch to structured editor
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Focus mode button should still be available
    await waitFor(() => {
      expect(screen.getByText('Modo Foco')).toBeInTheDocument();
    });
  });

  it('handles submit functionality in both editor modes', async () => {
    const user = userEvent.setup();
    const onSubmitEssay = jest.fn();
    
    const propsWithContent = {
      ...defaultProps,
      essayContent: 'Test content',
      onSubmitEssay,
    };

    render(<EnhancedWritingSection {...propsWithContent} />);

    // Submit should work in traditional mode
    const submitButton = screen.getByText('Enviar para Correção');
    await user.click(submitButton);
    expect(onSubmitEssay).toHaveBeenCalled();

    // Reset mock
    onSubmitEssay.mockClear();

    // Switch to structured editor
    const toggleButton = screen.getByText('Editor Estruturado');
    await user.click(toggleButton);

    // Submit should still work in structured mode
    await waitFor(() => {
      const structuredSubmitButton = screen.getByText('Enviar para Correção');
      return user.click(structuredSubmitButton);
    });

    expect(onSubmitEssay).toHaveBeenCalled();
  });
});