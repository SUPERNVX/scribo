// Login Page Component
import React, { memo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks';
import { ROUTES } from '../constants';
import LoginPage from '../components/LoginPage';

/**
 * Login Page Wrapper Component
 * Handles authentication flow and redirects
 */
const LoginPageWrapper = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || ROUTES.HOME;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLoginSuccess = user => {
    console.log('Login successful:', user.name);

    // Redirect to intended page or home
    const from = location.state?.from?.pathname || ROUTES.HOME;
    navigate(from, { replace: true });
  };

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className='min-h-[80vh] flex items-center justify-center'>
      <LoginPage onLoginSuccess={handleLoginSuccess} />
    </div>
  );
});

LoginPageWrapper.displayName = 'LoginPageWrapper';

export default LoginPageWrapper;
