// Header Component with Navigation - FIXED
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import useGamification from '../../hooks/useGamification';
import useUserTier from '../../hooks/useUserTier';
import { SmartIcon } from '../ModernIcons';
import UserProfileDropdownSimple from '../profile/UserProfileDropdown_SIMPLE';
import ModernGamificationPanel from '../gamification/ModernGamificationPanel';
import ProfileAvatar from '../profile/ProfileAvatar';
import Tooltip from '../Tooltip';
import SmartTooltip from '../ui/SmartTooltip';
import ShortcutsModal from '../ui/ShortcutsModal';

// Definir rotas diretamente para evitar problemas de importação
const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  WRITE: '/write',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  PRICING: '/planos',
};

/**
 * Header Component with Modern Navigation - FIXED
 */
const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isPremium } = useUserTier();
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const { userStats, LEVELS } = useGamification();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const isActivePath = path => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, icon, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${
          isActivePath(to)
            ? 'bg-pastel-purple-100 text-pastel-purple-700 dark:bg-pastel-purple-900 dark:text-pastel-purple-300'
            : 'text-gray-600 hover:text-pastel-purple-600 hover:bg-pastel-purple-50 dark:text-gray-300 dark:hover:text-pastel-purple-400 dark:hover:bg-gray-700'
        }
      `}
    >
      {icon && <SmartIcon type={icon} size={18} />}
      {children}
    </Link>
  );

  const handleProfileClick = e => {
    e.preventDefault();
    e.stopPropagation();
    setProfileModalOpen(!profileModalOpen);
  };

  return (
    <header className='bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50'>
      <div className='container mx-auto px-4 max-w-7xl'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className='flex items-center gap-2 text-xl font-bold text-pastel-purple-600 dark:text-pastel-purple-400 hover:text-pastel-purple-700 dark:hover:text-pastel-purple-300 transition-colors'
          >
            <span className='text-2xl'>✍️</span>
            <span className='font-display'>Scribo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-2'>
            <NavLink to={ROUTES.HOME} icon='home'>
              Início
            </NavLink>
            
            <NavLink to={ROUTES.PRICING} icon='star'>
              Planos
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink to={ROUTES.WRITE} icon='pen'>
                  Escrever
                </NavLink>
                <NavLink to={ROUTES.DASHBOARD} icon='chart'>
                  Dashboard
                </NavLink>
                {isPremium && (
                  <NavLink to={ROUTES.ANALYTICS} icon='bar-chart'>
                    Analytics
                    <span className="ml-1 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-1.5 py-0.5 rounded-full">
                      PRO
                    </span>
                  </NavLink>
                )}
              </>
            )}

            {!isAuthenticated && (
              <NavLink to={ROUTES.LOGIN} icon='login'>
                Entrar
              </NavLink>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className='flex items-center gap-3'>
            {/* Shortcuts Button */}
            <SmartTooltip text='Ver atalhos do teclado (Ctrl+/)' preferredPosition='bottom'>
              <button
                onClick={() => setShortcutsModalOpen(true)}
                className='p-2 rounded-lg text-gray-600 hover:text-pastel-blue-600 hover:bg-pastel-blue-50 dark:text-gray-300 dark:hover:text-pastel-blue-400 dark:hover:bg-gray-700 transition-all'
                title='Atalhos do Teclado'
              >
                <span className='text-lg'>⌨️</span>
              </button>
            </SmartTooltip>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className='p-2 rounded-lg text-gray-600 hover:text-pastel-purple-600 hover:bg-pastel-purple-50 dark:text-gray-300 dark:hover:text-pastel-purple-400 dark:hover:bg-gray-700 transition-all'
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              <SmartIcon type={darkMode ? 'sun' : 'moon'} size={20} />
            </button>

            {/* User Menu */}
            {isAuthenticated && user && (
              <div className='hidden md:flex items-center gap-3'>
                {/* Painel de Gamificação Compacto */}
                <div className='gamification-header-container'>
                  <ModernGamificationPanel compact={true} />
                </div>

                {/* BOTÃO DO PERFIL - TOGGLE */}
                <button
                  onClick={handleProfileClick}
                  className='flex items-center gap-2 px-3 py-2 bg-pastel-purple-50 dark:bg-gray-700 rounded-lg hover:bg-pastel-purple-100 dark:hover:bg-gray-600 transition-all cursor-pointer'
                  title='Ver perfil'
                  data-profile-button="true"
                  style={{
                    zIndex: 100,
                    position: 'relative',
                  }}
                >
                  <div className='w-8 h-8 bg-pastel-purple-200 dark:bg-pastel-purple-600 rounded-full flex items-center justify-center overflow-hidden'>
                    <ProfileAvatar user={user} size='small' />
                  </div>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                    {user.name}
                  </span>
                  <SmartIcon type='chevron-down' size={14} />
                </button>

                <button
                  onClick={handleLogout}
                  className='p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all'
                  title='Sair'
                >
                  <SmartIcon type='logout' size={20} />
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden p-2 rounded-lg text-gray-600 hover:text-pastel-purple-600 hover:bg-pastel-purple-50 dark:text-gray-300 dark:hover:text-pastel-purple-400 dark:hover:bg-gray-700 transition-all'
            >
              <SmartIcon type={mobileMenuOpen ? 'x' : 'menu'} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden py-4 border-t border-gray-200 dark:border-gray-700'>
            <nav className='flex flex-col gap-2'>
              <NavLink
                to={ROUTES.HOME}
                icon='home'
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </NavLink>
              
              <NavLink
                to={ROUTES.PRICING}
                icon='star'
                onClick={() => setMobileMenuOpen(false)}
              >
                Planos
              </NavLink>

              {isAuthenticated && (
                <>
                  <NavLink
                    to={ROUTES.WRITE}
                    icon='pen'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Escrever
                  </NavLink>
                  <NavLink
                    to={ROUTES.DASHBOARD}
                    icon='chart'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                  {isPremium && (
                    <NavLink
                      to={ROUTES.ANALYTICS}
                      icon='bar-chart'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Analytics
                      <span className="ml-1 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-1.5 py-0.5 rounded-full">
                        PRO
                      </span>
                    </NavLink>
                  )}
                </>
              )}

              {!isAuthenticated && (
                <NavLink
                  to={ROUTES.LOGIN}
                  icon='login'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Entrar
                </NavLink>
              )}

              {/* Mobile Shortcuts Button */}
              <button
                onClick={() => {
                  setShortcutsModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className='flex items-center gap-2 w-full px-4 py-2 text-pastel-blue-600 hover:text-pastel-blue-700 hover:bg-pastel-blue-50 dark:text-pastel-blue-400 dark:hover:bg-gray-700 rounded-lg transition-all'
              >
                <span className='text-lg'>⌨️</span>
                <span className='text-sm font-medium'>Atalhos do Teclado</span>
              </button>

              {/* Mobile User Actions */}
              {isAuthenticated && user && (
                <div className='pt-4 mt-4 border-t border-gray-200 dark:border-gray-700'>
                  <button
                    onClick={() => {
                      setProfileModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className='flex items-center gap-2 w-full px-4 py-2 mb-2 hover:bg-pastel-purple-50 dark:hover:bg-gray-700 rounded-lg transition-all'
                  >
                    <div className='w-8 h-8 bg-pastel-purple-200 dark:bg-pastel-purple-600 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-medium text-pastel-purple-700 dark:text-white'>
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                      {user.name}
                    </span>
                    <SmartIcon type='user' size={16} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className='flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all'
                  >
                    <SmartIcon type='logout' size={18} />
                    Sair
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Dropdown de Perfil - FIXED */}
      {user && (
        <UserProfileDropdownSimple
          user={user}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Modal de Atalhos */}
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </header>
  );
};

export default Header;
