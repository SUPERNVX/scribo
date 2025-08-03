// Enhanced Error Boundary Component with recovery strategies
import React, { Component } from 'react';

import { SmartIcon } from '../ModernIcons';
import { logError } from '../../utils/errorLogger';
import { getErrorRecoveryStrategy } from '../../utils/errorRecovery';

/**
 * Enhanced ErrorBoundary Component
 * Captura erros JavaScript e implementa estratégias de recuperação
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      recoveryStrategy: null,
      isRecovering: false,
    };
    
    this.retryTimeouts = [];
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const recoveryStrategy = getErrorRecoveryStrategy(error, this.props);
    
    this.setState({
      error,
      errorInfo,
      recoveryStrategy,
    });


    // Log error with structured logging
    logError(error, {
      ...errorInfo,
      component: this.props.name || 'ErrorBoundary',
      retryCount: this.state.retryCount,
      recoveryStrategy: recoveryStrategy?.type,
      props: this.props,
      timestamp: new Date().toISOString(),
    });

    // Auto-retry for certain error types
    if (recoveryStrategy?.autoRetry && this.state.retryCount < recoveryStrategy.maxRetries) {
      this.scheduleAutoRetry(recoveryStrategy.retryDelay);
    }
  }

  scheduleAutoRetry = (delay = 1000) => {
    this.setState({ isRecovering: true });
    
    const timeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
    
    this.retryTimeouts.push(timeout);
  };

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    const { recoveryStrategy } = this.state;
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
    }));

    // Execute custom retry logic if provided
    if (this.props.onRetry) {
      this.props.onRetry(this.state.retryCount + 1);
    }

    // Log retry attempt
    logError(new Error('Error boundary retry'), {
      component: this.props.name || 'ErrorBoundary',
      retryCount: this.state.retryCount + 1,
      recoveryStrategy: recoveryStrategy?.type,
    });
  };

  handleReload = () => {
    logError(new Error('Error boundary reload'), {
      component: this.props.name || 'ErrorBoundary',
      action: 'reload',
    });
    window.location.reload();
  };

  handleRecoveryAction = (action) => {
    const { recoveryStrategy } = this.state;
    
    switch (action) {
      case 'retry':
        this.handleRetry();
        break;
      case 'reload':
        this.handleReload();
        break;
      case 'redirect':
        if (recoveryStrategy?.redirectPath) {
          window.location.href = recoveryStrategy.redirectPath;
        }
        break;
      case 'fallback':
        if (this.props.onFallback) {
          this.props.onFallback(recoveryStrategy?.fallbackComponent);
        }
        break;
      default:
        this.handleRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      const { error, recoveryStrategy, isRecovering, retryCount } = this.state;

      // Custom fallback component
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={this.state.errorInfo}
            retry={this.handleRetry}
            reload={this.handleReload}
            recoveryStrategy={recoveryStrategy}
            isRecovering={isRecovering}
            retryCount={retryCount}
          />
        );
      }

      // Enhanced error UI with recovery strategies
      return (
        <div className='min-h-[50vh] flex items-center justify-center p-6'>
          <div className='max-w-md w-full text-center'>
            <div className='mb-6'>
              <div className='mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4'>
                {isRecovering ? (
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-red-500'></div>
                ) : (
                  <SmartIcon type='alert-triangle' size={32} color='#ef4444' />
                )}
              </div>

              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                {isRecovering ? 'Recuperando...' : 'Oops! Algo deu errado'}
              </h2>

              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                {isRecovering 
                  ? (recoveryStrategy?.userMessage || 'Tentando recuperar automaticamente...')
                  : (recoveryStrategy?.userMessage || 'Ocorreu um erro inesperado. Nossa equipe foi notificada.')
                }
              </p>
            </div>

            {/* Recovery Actions */}
            {!isRecovering && (
              <div className='space-y-3'>
                {/* Primary recovery action */}
                {recoveryStrategy?.type === 'retry' && (
                  <button
                    onClick={() => this.handleRecoveryAction('retry')}
                    disabled={retryCount >= (recoveryStrategy.maxRetries || 3)}
                    className='w-full px-4 py-2 bg-pastel-purple-500 hover:bg-pastel-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
                  >
                    Tentar Novamente {retryCount > 0 && `(${retryCount}/${recoveryStrategy.maxRetries || 3})`}
                  </button>
                )}

                {recoveryStrategy?.type === 'refresh' && (
                  <button
                    onClick={() => this.handleRecoveryAction('reload')}
                    className='w-full px-4 py-2 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
                  >
                    Recarregar Aplicação
                  </button>
                )}

                {recoveryStrategy?.type === 'redirect' && (
                  <button
                    onClick={() => this.handleRecoveryAction('redirect')}
                    className='w-full px-4 py-2 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
                  >
                    Ir para {recoveryStrategy.redirectPath === '/login' ? 'Login' : 'Página Inicial'}
                  </button>
                )}

                {recoveryStrategy?.type === 'fallback' && (
                  <button
                    onClick={() => this.handleRecoveryAction('fallback')}
                    className='w-full px-4 py-2 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
                  >
                    Usar Versão Simplificada
                  </button>
                )}

                {/* Secondary actions */}
                {recoveryStrategy?.type !== 'refresh' && (
                  <button
                    onClick={this.handleReload}
                    className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
                  >
                    Recarregar Página
                  </button>
                )}

                {/* Report issue button for critical errors */}
                {retryCount >= (recoveryStrategy?.maxRetries || 3) && (
                  <button
                    onClick={() => {
                      // In a real app, this would open a bug report form
                      const subject = encodeURIComponent(`Erro na aplicação: ${error?.message || 'Erro desconhecido'}`);
                      const body = encodeURIComponent(`Detalhes do erro:\n\nComponente: ${this.props.name || 'Desconhecido'}\nTentativas: ${retryCount}\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}`);
                      window.open(`mailto:suporte@scribo.com?subject=${subject}&body=${body}`);
                    }}
                    className='w-full px-4 py-2 border border-orange-300 text-orange-700 hover:bg-orange-50 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
                  >
                    Reportar Problema
                  </button>
                )}
              </div>
            )}

            {/* Auto-retry indicator */}
            {recoveryStrategy?.autoRetry && retryCount < (recoveryStrategy.maxRetries || 3) && (
              <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <p className='text-sm text-blue-700 dark:text-blue-300'>
                  Tentativa automática em {Math.ceil((recoveryStrategy.retryDelay || 1000) / 1000)}s...
                </p>
              </div>
            )}

            {/* Error details */}
            {showDetails && error && (
              <details className='mt-6 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'>
                  Detalhes técnicos
                </summary>
                <div className='mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-32'>
                  <div className='mb-2'>
                    <strong>Erro:</strong> {error.toString()}
                  </div>
                  <div className='mb-2'>
                    <strong>Categoria:</strong> {recoveryStrategy?.type || 'unknown'}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className='whitespace-pre-wrap'>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Retry count indicator */}
            {retryCount > 0 && (
              <p className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
                Tentativas: {retryCount}{recoveryStrategy?.maxRetries && `/${recoveryStrategy.maxRetries}`}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
