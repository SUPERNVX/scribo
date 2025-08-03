// Home Page Component
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth, useQuotes } from '../hooks';
import { ROUTES } from '../constants';
import TiltedCard from '../components/TiltedCard';
import CurvedLoop from '../components/CurvedLoop';
import { SmartIcon } from '../components/ModernIcons';

/**
 * Home Page Component
 * Landing page with features overview and call-to-action
 */
const HomePage = memo(() => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { quote, loading: quoteLoading } = useQuotes();

  // Fallback quote para exibição imediata
  const fallbackQuote = {
    content:
      'A educação é a arma mais poderosa que você pode usar para mudar o mundo.',
    author: 'Nelson Mandela',
  };

  // Usar fallback se estiver carregando ou não houver quote
  const displayQuote = quote || fallbackQuote;

  const handleNavigateToWrite = () => {
    if (isAuthenticated) {
      navigate(ROUTES.WRITE);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleNavigateToDashboard = () => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className='home-page-refined relative min-h-screen'>
      {/* Animated Background Element */}
      <CurvedLoop
        marqueeText='Bem-vindo ao Scribo'
        speed={2}
        curveAmount={80}
        direction='right'
        interactive={true}
        className='fill-purple-400'
      />

      {/* Hero Section */}
      <div className='hero-section-refined text-center mb-20 relative z-10'>
        <h1 className='hero-title-refined text-2xl md:text-3xl lg:text-4xl font-bold mb-8 font-display text-gray-800 dark:text-white'>
          Sua jornada para a{' '}
          <span className='gradient-text-refined'>redação perfeita</span> começa
          aqui
        </h1>

        {!isAuthenticated && (
          <div className='flex justify-center'>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className='px-8 py-3 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg'
            >
              Começar Agora
            </button>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div
        className='features-grid-refined grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16 relative z-20'
        style={{ marginTop: '200px' }}
      >
        <TiltedCard
          containerHeight='320px'
          containerWidth='100%'
          imageHeight='320px'
          imageWidth='100%'
          scaleOnHover={1.05}
          rotateAmplitude={8}
          showTooltip={false}
          onClick={handleNavigateToWrite}
          overlayContent={
            <div className='card-content p-6 text-center'>
              <div className='card-icon mb-4'>
                <SmartIcon type='pen' size={40} color='#a855f7' />
              </div>
              <h3 className='card-title text-xl font-bold mb-3 text-gray-800 dark:text-white'>
                Escrever Redação
              </h3>
              <p className='card-description text-gray-600 dark:text-gray-300 mb-4'>
                Comece uma nova redação com nossos temas atualizados e feedback
                inteligente
              </p>
              <div className='card-badge inline-block px-4 py-2 bg-pastel-purple-500 text-white rounded-lg font-medium'>
                Começar
              </div>
            </div>
          }
          displayOverlayContent={false}
        />

        <TiltedCard
          containerHeight='320px'
          containerWidth='100%'
          imageHeight='320px'
          imageWidth='100%'
          scaleOnHover={1.05}
          rotateAmplitude={8}
          showTooltip={false}
          onClick={handleNavigateToDashboard}
          overlayContent={
            <div className='card-content p-6 text-center'>
              <div className='card-icon mb-4'>
                <SmartIcon type='chart' size={40} color='#3b82f6' />
              </div>
              <h3 className='card-title text-xl font-bold mb-3 text-gray-800 dark:text-white'>
                Meu Dashboard
              </h3>
              <p className='card-description text-gray-600 dark:text-gray-300 mb-4'>
                Acompanhe sua evolução com gráficos detalhados e estatísticas
                personalizadas
              </p>
              <div className='card-badge inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-medium'>
                Ver Dados
              </div>
            </div>
          }
          displayOverlayContent={false}
        />

        <TiltedCard
          containerHeight='320px'
          containerWidth='100%'
          imageHeight='320px'
          imageWidth='100%'
          scaleOnHover={1.05}
          rotateAmplitude={8}
          showTooltip={false}
          overlayContent={
            <div className='card-content p-6 text-center'>
              <div className='card-icon mb-4'>
                <SmartIcon type='brain' size={40} color='#10b981' />
              </div>
              <h3 className='card-title text-xl font-bold mb-3 text-gray-800 dark:text-white'>
                IA Avançada
              </h3>
              <p className='card-description text-gray-600 dark:text-gray-300 mb-4'>
                Três modelos de inteligência artificial para análise completa e
                precisa
              </p>
              <div className='card-badge inline-block px-4 py-2 bg-green-500 text-white rounded-lg font-medium'>
                Saiba Mais
              </div>
            </div>
          }
          displayOverlayContent={false}
        />

        <TiltedCard
          containerHeight='320px'
          containerWidth='100%'
          imageHeight='320px'
          imageWidth='100%'
          scaleOnHover={1.05}
          rotateAmplitude={8}
          showTooltip={false}
          onClick={() => navigate(ROUTES.RANKING)}
          overlayContent={
            <div className='card-content p-6 text-center'>
              <div className='card-icon mb-4'>
                <SmartIcon type='trophy' size={40} color='#f59e0b' />
              </div>
              <h3 className='card-title text-xl font-bold mb-3 text-gray-800 dark:text-white'>
                Ranking
              </h3>
              <p className='card-description text-gray-600 dark:text-gray-300 mb-4'>
                Sistema de classificação para motivar seu progresso e competir
                de forma saudável
              </p>
              <div className='card-badge inline-block px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium'>
                Ver Ranking
              </div>
            </div>
          }
          displayOverlayContent={false}
        />
      </div>

      {/* Daily Quote Section */}
      <div className='quote-section-refined text-center relative z-10'>
        <blockquote className='daily-quote-refined bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-pastel-purple-200 dark:border-gray-600 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto text-center shadow-lg'>
          <p className='text-lg md:text-xl italic text-gray-700 dark:text-gray-200 mb-4'>
            "{displayQuote.content}"
          </p>
          <cite className='text-sm font-semibold text-pastel-purple-600 dark:text-pastel-purple-400'>
            — {displayQuote.author}
          </cite>
        </blockquote>

        {!isAuthenticated && (
          <div className='mt-8'>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className='px-8 py-4 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 hover:from-pastel-purple-600 hover:to-pastel-blue-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-xl'
            >
              Começar Gratuitamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;
