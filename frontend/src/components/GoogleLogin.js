import React, { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const GoogleLogin = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const { loginWithGoogle } = useAuth();

  const initializeGoogle = useCallback(() => {
    if (!window.google || !googleLoaded) return;
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id') {
      console.error('Google Client ID não configurado');
      onError?.('Google Client ID não configurado');
      return;
    }

    try {
      const handleCredentialResponse = async response => {
        setLoading(true);
        try {
          const result = await loginWithGoogle(response.credential);
          if (result.success) {
            onSuccess?.(result.user);
          } else {
            onError?.(result.error);
          }
        } catch (error) {
          onError?.('Erro ao processar login: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
    } catch (error) {
      console.error('Erro ao inicializar Google Login:', error);
      onError?.('Erro ao inicializar Google Login: ' + error.message);
    }
  }, [googleLoaded, loginWithGoogle, onSuccess, onError]);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        setGoogleLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  useEffect(() => {
    if (googleLoaded) {
      initializeGoogle();
    }
  }, [googleLoaded, initializeGoogle]);

  return (
    <div className='google-login-container'>
      <div id='google-signin-button' className='google-button-area'></div>
      {!googleLoaded && (
        <button disabled={true} className='google-login-btn'>
          <div className='loading-spinner'>
            <div className='spinner'></div>
            Carregando Google...
          </div>
        </button>
      )}
      {loading && (
        <div className='loading-overlay'>
          <div className='loading-spinner'>
            <div className='spinner'></div>
            Conectando com Google...
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleLogin;
