import React, { useState, memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';

import GoogleLogin from './GoogleLogin';
import { SmartIcon } from './ModernIcons';

// Componente otimizado para benefícios
const BenefitItem = memo(
  ({ icon, iconColor, title, description, delay = 0 }) => (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className='flex items-start space-x-4 p-5 rounded-2xl hover:bg-white/40 dark:hover:bg-soft-gray-700/30 transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-sm'
    >
      <div className='flex-shrink-0 p-3 bg-gradient-to-br from-white/80 to-white/60 rounded-xl shadow-soft'>
        <SmartIcon type={icon} size={24} color={iconColor} />
      </div>
      <div className='flex-1'>
        <h4
          className='font-display font-bold text-lg dark:text-pastel-purple-200 mb-2'
          style={{ color: '#2d3748' }}
        >
          {title}
        </h4>
        <p
          className='text-sm font-body dark:text-soft-gray-300 leading-relaxed'
          style={{ color: '#4a5568' }}
        >
          {description}
        </p>
      </div>
    </motion.li>
  )
);

// Componente otimizado para steps do demo
const DemoStep = memo(({ number, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className='flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-white/30 to-white/20 dark:bg-soft-gray-800/20 backdrop-blur-sm border border-white/30 hover:border-white/50 transition-all duration-300'
  >
    <div className='flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pastel-purple-500 to-pastel-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg'>
      {number}
    </div>
    <div className='flex-1'>
      <h4
        className='font-display font-bold text-base dark:text-pastel-purple-200 mb-2'
        style={{ color: '#2d3748' }}
      >
        {title}
      </h4>
      <p
        className='text-sm font-body dark:text-soft-gray-300 leading-relaxed'
        style={{ color: '#4a5568' }}
      >
        {description}
      </p>
    </div>
  </motion.div>
));

const LoginPage = memo(({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const { loading } = useAuth();

  // Memoizar dados estáticos
  const benefits = useMemo(
    () => [
      {
        icon: 'bot',
        iconColor: '#8b5cf6',
        title: 'Correção Inteligente',
        description:
          'Três modelos de IA trabalham juntos para análise completa e detalhada das suas redações',
      },
      {
        icon: 'bar-chart',
        iconColor: '#3b82f6',
        title: 'Acompanhamento de Progresso',
        description:
          'Visualize sua evolução com gráficos interativos e estatísticas personalizadas',
      },
      {
        icon: 'trophy',
        iconColor: '#f59e0b',
        title: 'Sistema de Ranking',
        description:
          'Compare seu desempenho com outros estudantes e participe de desafios',
      },
      {
        icon: 'book-open',
        iconColor: '#10b981',
        title: 'Recursos Educacionais',
        description:
          'Acesse dicas exclusivas, tutoriais e redações modelo para aprimorar suas habilidades',
      },
    ],
    []
  );

  const demoSteps = useMemo(
    () => [
      {
        title: 'Escolha um tema',
        description: 'Selecione entre temas do ENEM ou crie o seu próprio',
      },
      {
        title: 'Escreva sua redação',
        description: 'Use nosso editor com recursos integrados',
      },
      {
        title: 'Receba feedback',
        description: 'Análise detalhada com nota e sugestões',
      },
      {
        title: 'Acompanhe progresso',
        description: 'Veja sua evolução com gráficos e estatísticas',
      },
    ],
    []
  );

  // Callbacks otimizados
  const handleLoginSuccess = useCallback(
    user => {
      console.log('Login realizado com sucesso:', user);
      setError('');

      // Múltiplas tentativas de redirecionamento
      console.log('LoginPage: Iniciando redirecionamento...');

      // Tentativa imediata
      setTimeout(() => {
        console.log('LoginPage: Redirecionamento imediato');
        window.location.href = '/';
      }, 100);

      // Tentativa com replace
      setTimeout(() => {
        console.log('LoginPage: Redirecionamento com replace');
        window.location.replace('/');
      }, 500);

      // Callback para o componente pai
      onLoginSuccess && onLoginSuccess(user);
    },
    [onLoginSuccess]
  );

  const handleLoginError = useCallback(errorMessage => {
    console.error('Erro no login:', errorMessage);
    setError(errorMessage);
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='loading-spinner'>
          <div className='spinner'></div>
          <p className='text-soft-gray-600 dark:text-soft-gray-300 mt-4'>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen py-12 px-4'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='text-center mb-12'
        >
          <h1 className='text-4xl lg:text-5xl font-display font-bold text-soft-gray-900 dark:text-soft-gray-100 mb-4 flex items-center justify-center gap-4'>
            <SmartIcon type='edit' size={48} color='#8b5cf6' />
            Bem-vindo ao <span className='gradient-text'>Scribo</span>
          </h1>
          <p
            className='text-xl font-body dark:text-soft-gray-200 max-w-2xl mx-auto'
            style={{ color: '#171717' }}
          >
            Melhore suas redações para o ENEM com Inteligência Artificial
          </p>
        </motion.div>

        <div className='grid lg:grid-cols-2 gap-12 items-start'>
          {/* Seção de benefícios */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='space-y-8'
          >
            <div className='card bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-lg border border-white/40 shadow-xl'>
              <h3 className='text-2xl font-bold text-soft-gray-dark mb-8 text-center'>
                Por que usar o Scribo?
              </h3>
              <ul className='space-y-3'>
                {benefits.map((benefit, index) => (
                  <BenefitItem
                    key={index}
                    icon={benefit.icon}
                    iconColor={benefit.iconColor}
                    title={benefit.title}
                    description={benefit.description}
                    delay={index * 0.1}
                  />
                ))}
              </ul>
            </div>

            {/* Demo section */}
            <div className='card bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-lg border border-white/40 shadow-xl'>
              <h3 className='text-xl font-bold text-soft-gray-dark mb-6 flex items-center gap-3'>
                <SmartIcon type='target' size={24} color='#f59e0b' />
                Como funciona?
              </h3>
              <div className='space-y-4'>
                {demoSteps.map((step, index) => (
                  <DemoStep
                    key={index}
                    number={index + 1}
                    title={step.title}
                    description={step.description}
                    delay={0.3 + index * 0.1}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Seção de login */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='sticky top-8'
          >
            <div className='card bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border border-white/50 shadow-2xl p-8 text-center space-y-8'>
              <div className='space-y-4'>
                <div className='mx-auto w-16 h-16 bg-gradient-to-br from-pastel-purple-500 to-pastel-purple-600 rounded-2xl flex items-center justify-center shadow-lg'>
                  <SmartIcon type='user' size={32} color='white' />
                </div>
                <h2 className='text-3xl font-display font-bold text-soft-gray-dark'>
                  Faça seu login
                </h2>
                <p
                  className='font-body dark:text-soft-gray-300 text-lg'
                  style={{ color: '#4a5568' }}
                >
                  Entre com sua conta Google para começar sua jornada
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl'
                >
                  <div className='flex items-center justify-center space-x-2 text-red-700 dark:text-red-300'>
                    <SmartIcon type='alert-circle' size={20} color='#ef4444' />
                    <span className='text-sm'>{error}</span>
                  </div>
                </motion.div>
              )}

              <div className='space-y-6'>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                />

                <div className='flex items-center justify-center space-x-4 text-sm text-soft-gray-500'>
                  <div className='flex items-center space-x-2'>
                    <SmartIcon type='shield' size={16} color='#10b981' />
                    <span>Seguro</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <SmartIcon type='zap' size={16} color='#f59e0b' />
                    <span>Rápido</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <SmartIcon type='gift' size={16} color='#8b5cf6' />
                    <span>Gratuito</span>
                  </div>
                </div>
              </div>

              <div className='pt-4 border-t border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                <p
                  className='text-xs font-body dark:text-soft-gray-400 leading-relaxed'
                  style={{ color: '#171717' }}
                >
                  Ao fazer login, você concorda com nossos{' '}
                  <a
                    href='#terms'
                    className='text-pastel-purple-600 dark:text-pastel-purple-400 hover:underline'
                  >
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a
                    href='#privacy'
                    className='text-pastel-purple-600 dark:text-pastel-purple-400 hover:underline'
                  >
                    Política de Privacidade
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
