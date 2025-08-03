// Main Layout Component with Header and Navigation
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import NotificationCenter from '../ui/NotificationCenter';
import CelebrationNotification, {
  useCelebrationNotifications,
} from '../ui/CelebrationNotification';
import ShortcutsModal from '../ui/ShortcutsModal';
import { useAuth } from '../../contexts/AuthContext';
import useGlobalKeyboardShortcuts from '../../hooks/useGlobalKeyboardShortcuts';

import Header from './Header_FIXED';
import './Layout.css';

/**
 * Main Layout Component
 * Wraps all pages with consistent header and structure
 */
const Layout = () => {
  const { celebrations } = useCelebrationNotifications();
  const { isAuthenticated } = useAuth();
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Implementar atalhos globais
  useGlobalKeyboardShortcuts({
    onOpenShortcuts: () => setShortcutsModalOpen(true),
    onOpenFocusMode: () => {
      // Disparar evento customizado para o modo foco
      window.dispatchEvent(new CustomEvent('openFocusMode'));
    },
    isAuthenticated,
  });

  return (
    <div className='layout-container'>
      <Header />

      <main className='main-content container mx-auto px-4 max-w-7xl'>
        <Outlet />
      </main>

      {/* Enhanced Toast notifications */}
      <Toaster
        position='top-right'
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Notification Center */}
      <NotificationCenter />

      {/* Celebration Notifications */}
      {celebrations.map(celebration => (
        <CelebrationNotification key={celebration.id} {...celebration} />
      ))}

      {/* Modal de Atalhos Global */}
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

    </div>
  );
};

export default Layout;
