// Main App Component with React Router
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ROUTES } from './constants';
import { GamificationNotificationContainer } from './components/gamification/GamificationNotification';
import SettingsModalContainer from './components/profile/SettingsModalContainer';
import { preloadCriticalRoutes } from './utils/routePreloader';
import { initializePreloading } from './utils/resourcePreloader';
import { ErrorProvider, ErrorBoundary } from './components/error';
import './App.css';

// Strategic code splitting for main pages with preloading
const HomePage = lazy(
  () => import(/* webpackChunkName: "home" */ './pages/HomePage')
);
const LoginPage = lazy(
  () => import(/* webpackChunkName: "auth" */ './pages/LoginPage')
);
const WritePage = lazy(
  () => import(/* webpackChunkName: "write" */ './pages/WritePage')
);
const DashboardPage = lazy(
  () => import(/* webpackChunkName: "dashboard" */ './pages/DashboardPage')
);
const AnalyticsPage = lazy(
  () => import(/* webpackChunkName: "analytics" */ './pages/AnalyticsPage')
);
const PricingPage = lazy(
  () => import(/* webpackChunkName: "pricing" */ './pages/PricingPage')
);

// Loading component
const PageLoader = () => (
  <div className='flex items-center justify-center min-h-[50vh]'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500 mx-auto mb-4'></div>
      <p className='text-gray-600 dark:text-gray-300'>Carregando...</p>
    </div>
  </div>
);

/**
 * Main App Component
 * Handles routing and global providers
 */
function App() {
  // Preload critical routes and resources after initial render
  useEffect(() => {
    preloadCriticalRoutes();
    initializePreloading();
  }, []);

  return (
    <ErrorProvider>
      <ErrorBoundary name="App" showDetails={process.env.NODE_ENV === 'development'}>
        <AuthProvider>
          <BrowserRouter>
            <div className='app min-h-screen'>
              <ErrorBoundary name="Router" showDetails={false}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path='/' element={<Layout />}>
                      {/* Public Routes */}
                      <Route index element={
                        <ErrorBoundary name="HomePage">
                          <HomePage />
                        </ErrorBoundary>
                      } />
                      <Route path={ROUTES.LOGIN} element={
                        <ErrorBoundary name="LoginPage">
                          <LoginPage />
                        </ErrorBoundary>
                      } />
                      <Route path={ROUTES.PRICING} element={
                        <ErrorBoundary name="PricingPage">
                          <PricingPage />
                        </ErrorBoundary>
                      } />

                      {/* Protected Routes */}
                      <Route
                        path={ROUTES.WRITE}
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary name="WritePage">
                              <WritePage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.DASHBOARD}
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary name="DashboardPage">
                              <DashboardPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      
                      {/* Analytics Page */}
                      <Route 
                        path='/analytics' 
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary name="AnalyticsPage">
                              <AnalyticsPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } 
                      />

                      {/* 404 Route */}
                      <Route
                        path='*'
                        element={
                          <ErrorBoundary name="NotFoundPage">
                            <div className='text-center py-12'>
                              <h1 className='text-4xl font-bold text-gray-800 dark:text-white mb-4'>
                                404
                              </h1>
                              <p className='text-gray-600 dark:text-gray-300 mb-8'>
                                Página não encontrada
                              </p>
                              <a
                                href={ROUTES.HOME}
                                className='px-6 py-3 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-semibold rounded-lg transition-all duration-200'
                              >
                                Voltar ao Início
                              </a>
                            </div>
                          </ErrorBoundary>
                        }
                      />
                    </Route>
                  </Routes>
                </Suspense>
              </ErrorBoundary>

              {/* Critical UI Components with Error Boundaries */}
              <ErrorBoundary name="GamificationNotifications" showDetails={false}>
                <GamificationNotificationContainer />
              </ErrorBoundary>

              <ErrorBoundary name="SettingsModal" showDetails={false}>
                <SettingsModalContainer />
              </ErrorBoundary>

            </div>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

export default App;
