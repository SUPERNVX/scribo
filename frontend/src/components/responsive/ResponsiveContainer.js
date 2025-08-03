// Responsive Container Component - mantendo estilos existentes
import React, { memo } from 'react';

import { useBreakpoint, useDeviceDetection } from '../../hooks/useResponsive';

/**
 * ResponsiveContainer Component
 * Container que adapta layout baseado no dispositivo
 */
const ResponsiveContainer = memo(
  ({
    children,
    mobileLayout,
    tabletLayout,
    desktopLayout,
    className = '',
    ...props
  }) => {
    const { isMobile, isTablet, isDesktop } = useBreakpoint();
    const device = useDeviceDetection();

    // Renderiza layout específico se fornecido
    if (mobileLayout && isMobile) {
      return (
        <div className={className} {...props}>
          {mobileLayout}
        </div>
      );
    }

    if (tabletLayout && isTablet) {
      return (
        <div className={className} {...props}>
          {tabletLayout}
        </div>
      );
    }

    if (desktopLayout && isDesktop) {
      return (
        <div className={className} {...props}>
          {desktopLayout}
        </div>
      );
    }

    // Layout padrão com classes responsivas automáticas
    const responsiveClasses = `
    ${device.isTouchDevice ? 'touch-device' : 'no-touch'}
    ${device.hasHover ? 'has-hover' : 'no-hover'}
    ${device.orientation === 'landscape' ? 'landscape' : 'portrait'}
  `;

    return (
      <div className={`${className} ${responsiveClasses}`} {...props}>
        {children}
      </div>
    );
  }
);

/**
 * ResponsiveGrid Component
 * Grid que adapta colunas baseado no breakpoint
 */
export const ResponsiveGrid = memo(
  ({
    children,
    columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
    gap = 4,
    className = '',
    ...props
  }) => {
    const { breakpoint } = useBreakpoint();

    const getColumns = () => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints.indexOf(breakpoint);

      for (let i = currentIndex; i >= 0; i--) {
        if (columns[breakpoints[i]] !== undefined) {
          return columns[breakpoints[i]];
        }
      }

      return columns.xs || 1;
    };

    const cols = getColumns();
    const gridClasses = `grid grid-cols-${cols} gap-${gap}`;

    return (
      <div className={`${gridClasses} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

/**
 * ResponsiveText Component
 * Texto que adapta tamanho baseado no dispositivo
 */
export const ResponsiveText = memo(
  ({
    children,
    sizes = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl' },
    className = '',
    ...props
  }) => {
    const { breakpoint } = useBreakpoint();

    const getSize = () => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints.indexOf(breakpoint);

      for (let i = currentIndex; i >= 0; i--) {
        if (sizes[breakpoints[i]]) {
          return sizes[breakpoints[i]];
        }
      }

      return sizes.xs || 'text-base';
    };

    const sizeClass = getSize();

    return (
      <span className={`${sizeClass} ${className}`} {...props}>
        {children}
      </span>
    );
  }
);

/**
 * ResponsiveImage Component
 * Imagem que adapta tamanho e qualidade baseado no dispositivo
 */
export const ResponsiveImage = memo(
  ({
    src,
    alt,
    sizes = { xs: '100vw', sm: '50vw', md: '33vw', lg: '25vw' },
    className = '',
    loading = 'lazy',
    ...props
  }) => {
    const device = useDeviceDetection();
    const { breakpoint } = useBreakpoint();

    // Ajusta qualidade baseado no pixel ratio
    const getOptimizedSrc = () => {
      if (device.pixelRatio > 1.5) {
        // High DPI display - pode usar imagem de maior qualidade
        return src;
      }
      return src;
    };

    const getSizes = () => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints.indexOf(breakpoint);

      for (let i = currentIndex; i >= 0; i--) {
        if (sizes[breakpoints[i]]) {
          return sizes[breakpoints[i]];
        }
      }

      return sizes.xs || '100vw';
    };

    return (
      <img
        src={getOptimizedSrc()}
        alt={alt}
        sizes={getSizes()}
        loading={loading}
        className={`${className} max-w-full h-auto`}
        {...props}
      />
    );
  }
);

/**
 * MobileOnly Component
 * Renderiza apenas em dispositivos móveis
 */
export const MobileOnly = memo(({ children, fallback = null }) => {
  const { isMobile } = useBreakpoint();
  return isMobile ? children : fallback;
});

/**
 * TabletOnly Component
 * Renderiza apenas em tablets
 */
export const TabletOnly = memo(({ children, fallback = null }) => {
  const { isTablet } = useBreakpoint();
  return isTablet ? children : fallback;
});

/**
 * DesktopOnly Component
 * Renderiza apenas em desktop
 */
export const DesktopOnly = memo(({ children, fallback = null }) => {
  const { isDesktop } = useBreakpoint();
  return isDesktop ? children : fallback;
});

/**
 * TouchOnly Component
 * Renderiza apenas em dispositivos touch
 */
export const TouchOnly = memo(({ children, fallback = null }) => {
  const { isTouchDevice } = useDeviceDetection();
  return isTouchDevice ? children : fallback;
});

/**
 * HoverOnly Component
 * Renderiza apenas em dispositivos com hover
 */
export const HoverOnly = memo(({ children, fallback = null }) => {
  const { hasHover } = useDeviceDetection();
  return hasHover ? children : fallback;
});

ResponsiveContainer.displayName = 'ResponsiveContainer';
ResponsiveGrid.displayName = 'ResponsiveGrid';
ResponsiveText.displayName = 'ResponsiveText';
ResponsiveImage.displayName = 'ResponsiveImage';
MobileOnly.displayName = 'MobileOnly';
TabletOnly.displayName = 'TabletOnly';
DesktopOnly.displayName = 'DesktopOnly';
TouchOnly.displayName = 'TouchOnly';
HoverOnly.displayName = 'HoverOnly';

export default ResponsiveContainer;
