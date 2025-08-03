import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import ModernButton from '../ModernButton';

// Mock framer-motion to prevent animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: React.forwardRef(({ children, whileHover, whileTap, transition, ...props }, ref) => 
        React.createElement('button', { ...props, ref }, children)
      ),
    },
  };
});

describe('ModernButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with text', () => {
    act(() => {
      render(<ModernButton>Click me</ModernButton>);
    });
    
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    
    act(() => {
      render(<ModernButton onClick={handleClick}>Click me</ModernButton>);
    });

    act(() => {
      fireEvent.click(screen.getByRole('button'));
    });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    act(() => {
      render(<ModernButton className='custom-class'>Button</ModernButton>);
    });
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    act(() => {
      render(<ModernButton disabled>Button</ModernButton>);
    });
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with different variants', () => {
    let rerender;
    
    act(() => {
      const result = render(<ModernButton variant='primary'>Primary</ModernButton>);
      rerender = result.rerender;
    });
    
    expect(screen.getByRole('button')).toBeInTheDocument();

    act(() => {
      rerender(<ModernButton variant='secondary'>Secondary</ModernButton>);
    });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
