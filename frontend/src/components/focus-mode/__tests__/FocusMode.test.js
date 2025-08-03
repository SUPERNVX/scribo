// Focus Mode Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import FocusMode from '../FocusMode';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('../../../hooks/useFocusMode', () => ({
  useFocusMode: () => ({
    focusSession: null,
    config: {
      hideUI: false,
      enableAmbientSounds: true,
      showWordCount: true,
      enableBreakReminders: true,
      breakInterval: 25,
      customTheme: {
        backgroundColor: '#f9fafb',
        textColor: '#1f2937',
        fontSize: '18px',
        lineHeight: '1.7',
      },
      ambientSoundType: 'rain',
      ambientVolume: 0.3,
    },
    updateConfig: jest.fn(),
    startSession: jest.fn(),
    pauseSession: jest.fn(),
    endSession: jest.fn(),
    isActive: false,
    timeElapsed: 0,
    wordsWritten: 0,
    productivity: 0,
  }),
}));

jest.mock('../../../hooks/useGamification', () => ({
  __esModule: true,
  default: () => ({
    addXP: jest.fn(),
    recordEssay: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

// Mock child components
jest.mock('../FocusSettings', () => {
  return function MockFocusSettings({ onClose }) {
    return (
      <div data-testid="focus-settings">
        <button onClick={onClose}>Close Settings</button>
      </div>
    );
  };
});

jest.mock('../FocusTimer', () => {
  return function MockFocusTimer({ timeElapsed, isActive, productivity }) {
    return (
      <div data-testid="focus-timer">
        Timer: {timeElapsed}s, Active: {isActive ? 'Yes' : 'No'}, Productivity: {productivity}%
      </div>
    );
  };
});

jest.mock('../FocusStats', () => {
  return function MockFocusStats({ onClose }) {
    return (
      <div data-testid="focus-stats">
        <button onClick={onClose}>Close Stats</button>
      </div>
    );
  };
});

jest.mock('../AmbientSounds', () => {
  return function MockAmbientSounds({ enabled, soundType }) {
    return enabled ? <div data-testid="ambient-sounds">Playing: {soundType}</div> : null;
  };
});

describe('FocusMode Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    initialContent: 'Test content',
    onContentChange: jest.fn(),
    onSave: jest.fn(),
    theme: {
      id: 1,
      title: 'Test Theme',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders focus mode when open', () => {
    render(<FocusMode {...defaultProps} />);
    
    expect(screen.getByText('Modo Foco')).toBeInTheDocument();
    expect(screen.getByText('Test Theme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<FocusMode {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Modo Foco')).not.toBeInTheDocument();
  });

  test('handles content changes', () => {
    render(<FocusMode {...defaultProps} />);
    
    const textarea = screen.getByDisplayValue('Test content');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    expect(defaultProps.onContentChange).toHaveBeenCalledWith('New content');
  });

  test('shows settings panel when settings button is clicked', () => {
    render(<FocusMode {...defaultProps} />);
    
    const settingsButton = screen.getByTitle('Configurações (Ctrl+Shift+S)');
    fireEvent.click(settingsButton);
    
    expect(screen.getByTestId('focus-settings')).toBeInTheDocument();
  });

  test('shows stats panel when stats button is clicked', () => {
    render(<FocusMode {...defaultProps} />);
    
    const statsButton = screen.getByTitle('Estatísticas (Ctrl+Shift+T)');
    fireEvent.click(statsButton);
    
    expect(screen.getByTestId('focus-stats')).toBeInTheDocument();
  });

  test('shows word count when enabled', () => {
    render(<FocusMode {...defaultProps} initialContent="Hello world test" />);
    
    expect(screen.getByText('3 palavras')).toBeInTheDocument();
  });

  test('handles close with confirmation when session is active', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    
    render(<FocusMode {...defaultProps} />);
    
    const closeButton = screen.getByTitle('Fechar (Esc)');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
    
    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('renders ambient sounds when enabled', () => {
    render(<FocusMode {...defaultProps} />);
    
    expect(screen.getByTestId('ambient-sounds')).toBeInTheDocument();
    expect(screen.getByText('Playing: rain')).toBeInTheDocument();
  });

  test('displays focus timer', () => {
    render(<FocusMode {...defaultProps} />);
    
    expect(screen.getByTestId('focus-timer')).toBeInTheDocument();
    expect(screen.getByText(/Timer: 0s, Active: No, Productivity: 0%/)).toBeInTheDocument();
  });
});