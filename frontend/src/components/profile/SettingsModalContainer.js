import React, { useState, useEffect } from 'react';

import SettingsModal from './SettingsModal';

/**
 * Container para o Modal de Configurações
 * Gerencia o estado global do modal
 */
const SettingsModalContainer = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => {
      setIsOpen(true);
    };

    // Escutar evento global para abrir configurações
    window.addEventListener('openSettingsModal', handleOpenSettings);

    return () => {
      window.removeEventListener('openSettingsModal', handleOpenSettings);
    };
  }, []);

  return <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

export default SettingsModalContainer;
