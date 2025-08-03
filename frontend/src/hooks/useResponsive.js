// Responsive hooks for advanced device detection
import { useState, useEffect, useCallback } from 'react';

/**
 * useBreakpoint Hook
 * Detecta breakpoints do Tailwind em tempo real
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop:
      breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
    isSmall: breakpoint === 'xs' || breakpoint === 'sm',
    isMedium: breakpoint === 'md' || breakpoint === 'lg',
    isLarge: breakpoint === 'xl' || breakpoint === '2xl',
  };
};

/**
 * useDeviceDetection Hook
 * Detecta tipo de dispositivo e capacidades
 */
export const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    hasHover: false,
    orientation: 'portrait',
    pixelRatio: 1,
  });

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasHover = window.matchMedia('(hover: hover)').matches;
      const pixelRatio = window.devicePixelRatio || 1;

      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice,
        hasHover,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio,
      });
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    window.addEventListener('orientationchange', updateDevice);

    return () => {
      window.removeEventListener('resize', updateDevice);
      window.removeEventListener('orientationchange', updateDevice);
    };
  }, []);

  return device;
};

/**
 * useViewport Hook
 * Informações detalhadas do viewport
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    scrollY: 0,
    scrollX: 0,
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY,
        scrollX: window.scrollX,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('scroll', updateViewport);
    };
  }, []);

  return viewport;
};

/**
 * useMediaQuery Hook
 * Hook para media queries customizadas
 */
export const useMediaQuery = query => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = event => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * useOrientation Hook
 * Detecta mudanças de orientação
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    angle: 0,
    type: 'portrait-primary',
  });

  useEffect(() => {
    const updateOrientation = () => {
      if (screen.orientation) {
        setOrientation({
          angle: screen.orientation.angle,
          type: screen.orientation.type,
        });
      } else {
        // Fallback para browsers mais antigos
        setOrientation({
          angle: window.orientation || 0,
          type: Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait',
        });
      }
    };

    updateOrientation();
    window.addEventListener('orientationchange', updateOrientation);

    return () =>
      window.removeEventListener('orientationchange', updateOrientation);
  }, []);

  return {
    ...orientation,
    isPortrait:
      orientation.type.includes('portrait') ||
      Math.abs(orientation.angle) !== 90,
    isLandscape:
      orientation.type.includes('landscape') ||
      Math.abs(orientation.angle) === 90,
  };
};

/**
 * useResponsiveValue Hook
 * Retorna valores diferentes baseados no breakpoint
 */
export const useResponsiveValue = values => {
  const { breakpoint } = useBreakpoint();

  const getValue = useCallback(() => {
    // Valores podem ser: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 }
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(breakpoint);

    // Procura o valor mais próximo disponível
    for (let i = currentIndex; i >= 0; i--) {
      if (values[breakpoints[i]] !== undefined) {
        return values[breakpoints[i]];
      }
    }

    // Se não encontrar, retorna o primeiro valor disponível
    return Object.values(values)[0];
  }, [breakpoint, values]);

  return getValue();
};

export default {
  useBreakpoint,
  useDeviceDetection,
  useViewport,
  useMediaQuery,
  useOrientation,
  useResponsiveValue,
};
