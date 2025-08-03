// Protected Route Component for authenticated users
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks';
import { ROUTES } from '../constants';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500'></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
