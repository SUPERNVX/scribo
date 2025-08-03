// Dashboard Page Component
import React, { memo, Suspense } from 'react';

import { LazyEssaysDashboard } from '../utils/lazyImports';

// Loading component for heavy dashboard components
const DashboardLoader = () => (
  <div className='flex items-center justify-center min-h-[50vh]'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500 mx-auto mb-4'></div>
      <p className='text-gray-600 dark:text-gray-300'>
        Carregando dashboard...
      </p>
    </div>
  </div>
);

/**
 * Dashboard Page Component
 * Main dashboard with essays and statistics
 */
const DashboardPage = memo(() => {
  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-800 dark:text-white mb-2'>
          Meu Dashboard
        </h1>
        <p className='text-gray-600 dark:text-gray-300'>
          Acompanhe seu progresso, visualize suas redações e analise suas
          estatísticas.
        </p>
      </div>

      <Suspense fallback={<DashboardLoader />}>
        <LazyEssaysDashboard />
      </Suspense>
    </div>
  );
});

DashboardPage.displayName = 'DashboardPage';

export default DashboardPage;
