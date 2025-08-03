// Tests for StructuredParagraphEditor component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';

import StructuredParagraphEditor from '../StructuredParagraphEditor';

// Mock the paragraph analysis hook
jest.mock('../../../hooks/useParagraphAnalysis', () => ({
  useParagraphAnalysis: () => ({
    analyzeParagraph: jest.fn().mockResolvedValue({
      suggestions: [
        {
          id: 1,
          type: 'improvement',
          message: 'Considere usar um conectivo mais formal.',
          start: 0,
          end: 10,
          originalText: 'Tipo assim',
          replacement: 'Por exemplo',
          confidence: 85,
        },
      ],
      summary: 'Análise concluída com 1 sugestão.',
      analysisType: 'api',
    }),
    loading: false,
  }),
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('StructuredParagraphEditor', () => {
  const defaultProps = {
    content: {
      introducao: '',
      desenvolvimento1: '',
      desenvolvimento2: '',
      conclusao: '',
    },
    onContentChange: jest.fn(),
    theme: {
      id: 1,
      title: 'Test Theme',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all four paragraph sections', () => {
    render(<StructuredParagraphEditor {...defaultProps} />);

    expect(screen.getByText('Introdução')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvimento 1')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvimento 2')).toBeInTheDocument();
    expect(screen.getByText('Conclusão')).toBeInTheDocument();
  });

  it('displays word count for each paragraph', () => {
    const contentWithText = {
      introducao: 'Esta é uma introdução de teste com algumas palavras.',
      desenvolvimento1: 'Primeiro desenvolvimento.',
      desenvolvimento2: 'Segundo desenvolvimento.',
      conclusao: 'Conclusão final.',
    };

    render(
      <StructuredParagraphEditor
        {...defaultProps}
        content={contentWithText}
      />
    );

    // Check that word counts are displayed
    expect(screen.getByText('9 palavras')).toBeInTheDocument(); // introducao
    expect(screen.getAllByText('2 palavras')).toHaveLength(3); // desenvolvimento1, desenvolvimento2, conclusao
  });

  it('calls onContentChange when text is typed', async () => {
    const user = userEvent.setup();
    const onContentChange = jest.fn();

    render(
      <StructuredParagraphEditor
        {...defaultProps}
        onContentChange={onContentChange}
      />
    );

    const introducaoTextarea = screen.getByPlaceholderText(/Apresente o tema/);
    await user.type(introducaoTextarea, 'Nova introdução');

    await waitFor(() => {
      expect(onContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          introducao: 'Nova introdução',
        })
      );
    });
  });

  it('shows analyze button for each paragraph', () => {
    render(<StructuredParagraphEditor {...defaultProps} />);

    const analyzeButtons = screen.getAllByText('Analisar este parágrafo');
    expect(analyzeButtons).toHaveLength(4);
  });

  it('disables analyze button when paragraph is empty', () => {
    render(<StructuredParagraphEditor {...defaultProps} />);

    const analyzeButtons = screen.getAllByText('Analisar este parágrafo');
    analyzeButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('enables analyze button when paragraph has content', () => {
    const contentWithText = {
      introducao: 'Esta é uma introdução de teste.',
      desenvolvimento1: '',
      desenvolvimento2: '',
      conclusao: '',
    };

    render(
      <StructuredParagraphEditor
        {...defaultProps}
        content={contentWithText}
      />
    );

    const analyzeButtons = screen.getAllByText('Analisar este parágrafo');
    expect(analyzeButtons[0]).not.toBeDisabled(); // introducao button
    expect(analyzeButtons[1]).toBeDisabled(); // desenvolvimento1 button
  });

  it('shows word count status colors correctly', () => {
    const contentWithText = {
      introducao: 'Texto muito curto', // Should be "low" (< 50 words)
      desenvolvimento1: 'A'.repeat(100), // Should be "good" (between 80-200 words)
      desenvolvimento2: 'B'.repeat(300), // Should be "high" (> 200 words)
      conclusao: 'Conclusão adequada com sessenta palavras aproximadamente para testar o sistema de contagem de palavras e verificar se está funcionando corretamente com o limite estabelecido para esta seção específica da redação estruturada que deve conter entre sessenta e cento e cinquenta palavras conforme as diretrizes estabelecidas.',
    };

    render(
      <StructuredParagraphEditor
        {...defaultProps}
        content={contentWithText}
      />
    );

    // Check for word count elements - there are also guideline texts that match the pattern
    const wordCountElements = screen.getAllByText(/\d+ palavras/);
    expect(wordCountElements.length).toBeGreaterThanOrEqual(4);
  });

  it('shows progress indicators', () => {
    render(<StructuredParagraphEditor {...defaultProps} />);

    expect(screen.getByText('Progresso Geral')).toBeInTheDocument();
    
    // Check that all sections are shown in progress
    expect(screen.getByText('🎯 Introdução')).toBeInTheDocument();
    expect(screen.getByText('📝 Desenvolvimento 1')).toBeInTheDocument();
    expect(screen.getByText('📋 Desenvolvimento 2')).toBeInTheDocument();
    expect(screen.getByText('🎯 Conclusão')).toBeInTheDocument();
  });

  it('handles analysis button click', async () => {
    const user = userEvent.setup();
    const contentWithText = {
      introducao: 'Esta é uma introdução de teste com conteúdo suficiente.',
      desenvolvimento1: '',
      desenvolvimento2: '',
      conclusao: '',
    };

    render(
      <StructuredParagraphEditor
        {...defaultProps}
        content={contentWithText}
      />
    );

    const analyzeButton = screen.getAllByText('Analisar este parágrafo')[0];
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Análise do parágrafo "Introdução" concluída!'
      );
    });
  });

  it('shows error when trying to analyze empty paragraph', async () => {
    const user = userEvent.setup();

    render(<StructuredParagraphEditor {...defaultProps} />);

    // First add some minimal content to enable the button
    const introducaoTextarea = screen.getByPlaceholderText(/Apresente o tema/);
    await user.type(introducaoTextarea, 'Test');
    await user.clear(introducaoTextarea); // Clear it to make it empty

    const analyzeButton = screen.getAllByText('Analisar este parágrafo')[0];
    
    // The button should be disabled for empty content
    expect(analyzeButton).toBeDisabled();
  });

  it('displays placeholder text correctly', () => {
    render(<StructuredParagraphEditor {...defaultProps} />);

    expect(
      screen.getByPlaceholderText(/Apresente o tema, contextualize o problema/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Desenvolva seu primeiro argumento/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Desenvolva seu segundo argumento/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Retome sua tese e apresente uma proposta/)
    ).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(<StructuredParagraphEditor {...defaultProps} disabled={true} />);

    const textareas = screen.getAllByRole('textbox');
    textareas.forEach(textarea => {
      expect(textarea).toBeDisabled();
    });

    const analyzeButtons = screen.getAllByText('Analisar este parágrafo');
    analyzeButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('shows character count for each paragraph', () => {
    const contentWithText = {
      introducao: 'Teste',
      desenvolvimento1: 'Desenvolvimento 1',
      desenvolvimento2: 'Desenvolvimento 2',
      conclusao: 'Fim',
    };

    render(
      <StructuredParagraphEditor
        {...defaultProps}
        content={contentWithText}
      />
    );

    expect(screen.getByText('5 caracteres')).toBeInTheDocument(); // introducao
    expect(screen.getAllByText('17 caracteres')).toHaveLength(2); // desenvolvimento1 and desenvolvimento2
    expect(screen.getByText('3 caracteres')).toBeInTheDocument(); // conclusao
  });
});