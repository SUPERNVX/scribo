import React, { useState, useEffect } from 'react';

/**
 * Componente para simular usuários Premium durante desenvolvimento
 * REMOVER EM PRODUÇÃO
 */
const PremiumToggle = () => {
  const [isPremiumMode, setIsPremiumMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('dev_premium_mode');
    if (savedMode === 'true') {
      setIsPremiumMode(true);
    }
  }, []);

  const togglePremiumMode = () => {
    const newMode = !isPremiumMode;
    setIsPremiumMode(newMode);
    localStorage.setItem('dev_premium_mode', newMode.toString());
    
    // Recarregar a página para aplicar as mudanças
    window.location.reload();
  };

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={togglePremiumMode}
        className={`px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition-all ${
          isPremiumMode
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
      >
        {isPremiumMode ? '⭐ Premium Mode' : '🆓 Free Mode'}
      </button>
    </div>
  );
};

export default PremiumToggle;