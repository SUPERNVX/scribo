// Advanced memoization hooks for performance
import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * useMemoizedCallback Hook
 * Memoiza callbacks complexos com dependências otimizadas
 */
export const useMemoizedCallback = (callback, deps) => {
  const ref = useRef();

  return useCallback((...args) => {
    if (!ref.current) {
      ref.current = callback;
    }
    return ref.current(...args);
  }, deps);
};

/**
 * useDeepMemo Hook
 * Memoização profunda para objetos complexos
 */
export const useDeepMemo = (factory, deps) => {
  const ref = useRef();
  const signalRef = useRef(0);

  const depString = JSON.stringify(deps);

  if (ref.current?.depString !== depString) {
    ref.current = {
      depString,
      value: factory(),
    };
    signalRef.current += 1;
  }

  return useMemo(() => ref.current.value, [signalRef.current]);
};

/**
 * useStableCallback Hook
 * Callback que nunca muda referência mas sempre tem valores atuais
 */
export const useStableCallback = callback => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
};

/**
 * useMemoizedSelector Hook
 * Seletor memoizado para extrair dados específicos
 */
export const useMemoizedSelector = (data, selector, deps = []) => {
  return useMemo(() => {
    if (!data) return null;
    return selector(data);
  }, [data, ...deps]);
};

/**
 * useShallowMemo Hook
 * Memoização com comparação shallow para objetos
 */
export const useShallowMemo = (factory, deps) => {
  const ref = useRef();
  
  return useMemo(() => {
    const newValue = factory();
    
    // Shallow comparison
    if (ref.current && typeof newValue === 'object' && newValue !== null) {
      const keys = Object.keys(newValue);
      const prevKeys = Object.keys(ref.current);
      
      if (keys.length === prevKeys.length) {
        const isEqual = keys.every(key => newValue[key] === ref.current[key]);
        if (isEqual) {
          return ref.current;
        }
      }
    }
    
    ref.current = newValue;
    return newValue;
  }, deps);
};

/**
 * useEventCallback Hook
 * Callback otimizado para eventos que não muda referência
 */
export const useEventCallback = (callback) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = callback;
  });
  
  return useCallback((...args) => {
    return ref.current?.(...args);
  }, []);
};

/**
 * useMemoizedProps Hook
 * Memoiza props de componentes para evitar re-renders desnecessários
 */
export const useMemoizedProps = (props, deps = []) => {
  return useMemo(() => props, deps);
};

/**
 * useConstant Hook
 * Garante que um valor seja constante durante toda a vida do componente
 */
export const useConstant = (factory) => {
  const ref = useRef();
  
  if (ref.current === undefined) {
    ref.current = factory();
  }
  
  return ref.current;
};

/**
 * usePrevious Hook
 * Retorna o valor anterior de uma variável
 */
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

/**
 * useCompare Hook
 * Compara valores e retorna true se mudaram
 */
export const useCompare = (value, compare = (a, b) => a !== b) => {
  const ref = useRef(value);
  const hasChanged = compare(value, ref.current);
  
  useEffect(() => {
    if (hasChanged) {
      ref.current = value;
    }
  });
  
  return hasChanged;
};

/**
 * useMemoizedArray Hook
 * Memoiza arrays baseado em comparação de conteúdo
 */
export const useMemoizedArray = (array, deps = []) => {
  return useMemo(() => {
    if (!Array.isArray(array)) return array;
    return [...array];
  }, [JSON.stringify(array), ...deps]);
};

/**
 * useMemoizedObject Hook
 * Memoiza objetos baseado em comparação de conteúdo
 */
export const useMemoizedObject = (object, deps = []) => {
  return useMemo(() => {
    if (typeof object !== 'object' || object === null) return object;
    return { ...object };
  }, [JSON.stringify(object), ...deps]);
};

/**
 * useOptimizedCallback Hook
 * Callback otimizado que só muda quando dependências realmente mudam
 */
export const useOptimizedCallback = (callback, deps) => {
  const depsRef = useRef(deps);
  const callbackRef = useRef(callback);
  
  // Check if dependencies actually changed
  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => dep !== depsRef.current[index]);
  }, deps);
  
  if (depsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }
  
  return useCallback(callbackRef.current, deps);
};

export default {
  useMemoizedCallback,
  useDeepMemo,
  useStableCallback,
  useMemoizedSelector,
  useShallowMemo,
  useEventCallback,
  useMemoizedProps,
  useConstant,
  usePrevious,
  useCompare,
  useMemoizedArray,
  useMemoizedObject,
  useOptimizedCallback,
};
