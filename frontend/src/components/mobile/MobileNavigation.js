// Mobile-optimized navigation with touch gestures
import React, { memo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PenTool, BarChart3, Trophy, User, Menu, X } from 'lucide-react';

import { useTouchGestures, useHapticFeedback } from '../../hooks/useTouchGestures';
import { useDeviceDetection } from '../../hooks/useResponsive';
import { useSafeArea } from '../../hooks/useMobileOptimizations';
import { MobileDrawer } from '../responsive/MobileOptimized';

/**
 * MobileNavigation Component
 * Touch-optimized navigation for mobile devices
 */
const MobileNavigation = memo(({
  className = '',
  showLabels = true,
  variant = 'bottom', // 'bottom', 'drawer', 'top'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const device = useDeviceDetection();
  const haptics = useHapticFeedback();
  const safeArea = useSafeArea();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location.pathname);

  // Navigation items
  const navigationItems = [
    {
      id: 'home',
      path: '/',
      icon: Home,
      label: 'Início',
      color: 'text-pastel-blue-600',
    },
    {
      id: 'write',
      path: '/write',
      icon: PenTool,
      label: 'Escrever',
      color: 'text-pastel-purple-600',
    },
    {
      id: 'analytics',
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      color: 'text-pastel-green-600',
    },
    {
      id: 'ranking',
      path: '/ranking',
      icon: Trophy,
      label: 'Ranking',
      color: 'text-pastel-yellow-600',
    },
    {
      id: 'profile',
      path: '/dashboard',
      icon: User,
      label: 'Perfil',
      color: 'text-pastel-pink-600',
    },
  ];

  // Touch gestures for swipe navigation
  const { touchRef } = useTouchGestures({
    onSwipeLeft: () => {
      // Navigate to next tab
      const currentIndex = navigationItems.findIndex(item => item.path === activeTab);
      const nextIndex = (currentIndex + 1) % navigationItems.length;
      handleNavigation(navigationItems[nextIndex]);
    },
    onSwipeRight: () => {
      // Navigate to previous tab
      const currentIndex = navigationItems.findIndex(item => item.path === activeTab);
      const prevIndex = currentIndex === 0 ? navigationItems.length - 1 : currentIndex - 1;
      handleNavigation(navigationItems[prevIndex]);
    },
    enableHaptics: true,
    threshold: 80,
  });

  const handleNavigation = (item) => {
    setActiveTab(item.path);
    navigate(item.path);
    haptics.mediumTap();
    
    if (variant === 'drawer') {
      setIsDrawerOpen(false);
    }
  };

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  // Bottom navigation variant
  if (variant === 'bottom') {
    return (
      <nav
        ref={touchRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
          border-t border-gray-200 dark:border-gray-700
          ${className}
        `}
        style={{
          paddingBottom: `${safeArea.bottom}px`,
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`
                  flex flex-col items-center justify-center
                  min-h-[48px] min-w-[48px] px-2 py-1
                  rounded-lg transition-all duration-200
                  ${device.isTouchDevice ? 'touch-manipulation' : ''}
                  ${isActive 
                    ? 'bg-pastel-purple-100 dark:bg-pastel-purple-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    transition-colors duration-200
                    ${isActive ? item.color : 'text-gray-500 dark:text-gray-400'}
                  `}
                />
                {showLabels && (
                  <span
                    className={`
                      text-xs mt-1 font-body transition-colors duration-200
                      ${isActive 
                        ? 'text-gray-900 dark:text-white font-medium' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Drawer navigation variant
  if (variant === 'drawer') {
    return (
      <>
        {/* Menu button */}
        <button
          onClick={() => {
            setIsDrawerOpen(true);
            haptics.lightTap();
          }}
          className={`
            fixed top-4 left-4 z-40
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
            rounded-full p-3 shadow-lg
            ${device.isTouchDevice ? 'touch-manipulation' : ''}
            ${className}
          `}
          style={{
            top: `${safeArea.top + 16}px`,
          }}
        >
          <Menu size={20} className="text-gray-700 dark:text-gray-300" />
        </button>

        {/* Drawer */}
        <MobileDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          position="left"
          className="w-80"
        >
          <div className="p-6" style={{ paddingTop: `${safeArea.top + 24}px` }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Navigation items */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.path;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-lg
                      transition-all duration-200 text-left
                      ${device.isTouchDevice ? 'touch-manipulation' : ''}
                      ${isActive 
                        ? 'bg-pastel-purple-100 dark:bg-pastel-purple-900/30' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon
                      size={24}
                      className={`
                        transition-colors duration-200
                        ${isActive ? item.color : 'text-gray-500 dark:text-gray-400'}
                      `}
                    />
                    <span
                      className={`
                        font-body transition-colors duration-200
                        ${isActive 
                          ? 'text-gray-900 dark:text-white font-medium' 
                          : 'text-gray-600 dark:text-gray-300'
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </MobileDrawer>
      </>
    );
  }

  // Top navigation variant
  if (variant === 'top') {
    return (
      <nav
        ref={touchRef}
        className={`
          fixed top-0 left-0 right-0 z-50
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
          border-b border-gray-200 dark:border-gray-700
          ${className}
        `}
        style={{
          paddingTop: `${safeArea.top}px`,
        }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${device.isTouchDevice ? 'touch-manipulation' : ''}
                  ${isActive 
                    ? 'bg-pastel-purple-100 dark:bg-pastel-purple-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`
                    transition-colors duration-200
                    ${isActive ? item.color : 'text-gray-500 dark:text-gray-400'}
                  `}
                />
                {showLabels && (
                  <span
                    className={`
                      text-sm font-body transition-colors duration-200
                      ${isActive 
                        ? 'text-gray-900 dark:text-white font-medium' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return null;
});

MobileNavigation.displayName = 'MobileNavigation';

export default MobileNavigation;