// Enhanced optimized state management hooks
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useStableCallback, useDeepMemo } from './useMemoizedCallback';

/**
 * useOptimizedState Hook
 * Enhanced state management with memoization and performance optimizations
 */
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const previousStateRef = useRef(initialState);

  // Memoized state setter that prevents unnecessary re-renders
  const setOptimizedState = useCallback((newState) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' ? newState(prevState) : newState;
      
      // Shallow comparison to prevent unnecessary updates
      if (JSON.stringify(nextState) === JSON.stringify(prevState)) {
        return prevState;
      }
      
      previousStateRef.current = prevState;
      return nextState;
    });
  }, []);

  // Get previous state value
  const getPreviousState = useCallback(() => {
    return previousStateRef.current;
  }, []);

  // Reset to initial state
  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  return [state, setOptimizedState, { getPreviousState, resetState }];
};

/**
 * useOptimizedArray Hook
 * Optimized array state management with memoized operations
 */
export const useOptimizedArray = (initialArray = []) => {
  const [array, setArray] = useState(initialArray);

  // Memoized array operations
  const operations = useMemo(() => ({
    add: (item) => {
      setArray(prev => [...prev, item]);
    },
    
    remove: (index) => {
      setArray(prev => prev.filter((_, i) => i !== index));
    },
    
    removeById: (id, idKey = 'id') => {
      setArray(prev => prev.filter(item => item[idKey] !== id));
    },
    
    update: (index, newItem) => {
      setArray(prev => prev.map((item, i) => i === index ? newItem : item));
    },
    
    updateById: (id, newItem, idKey = 'id') => {
      setArray(prev => prev.map(item => 
        item[idKey] === id ? { ...item, ...newItem } : item
      ));
    },
    
    clear: () => {
      setArray([]);
    },
    
    reset: () => {
      setArray(initialArray);
    },
    
    move: (fromIndex, toIndex) => {
      setArray(prev => {
        const newArray = [...prev];
        const [removed] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, removed);
        return newArray;
      });
    },
    
    sort: (compareFn) => {
      setArray(prev => [...prev].sort(compareFn));
    },
    
    filter: (predicate) => {
      setArray(prev => prev.filter(predicate));
    }
  }), [initialArray]);

  // Memoized computed values
  const computed = useMemo(() => ({
    length: array.length,
    isEmpty: array.length === 0,
    first: array[0],
    last: array[array.length - 1],
    ids: array.map(item => item.id).filter(Boolean)
  }), [array]);

  return [array, operations, computed];
};

/**
 * useOptimizedObject Hook
 * Optimized object state management with memoized operations
 */
export const useOptimizedObject = (initialObject = {}) => {
  const [object, setObject] = useState(initialObject);

  // Memoized object operations
  const operations = useMemo(() => ({
    set: (key, value) => {
      setObject(prev => ({ ...prev, [key]: value }));
    },
    
    setMultiple: (updates) => {
      setObject(prev => ({ ...prev, ...updates }));
    },
    
    remove: (key) => {
      setObject(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    },
    
    removeMultiple: (keys) => {
      setObject(prev => {
        const newObject = { ...prev };
        keys.forEach(key => delete newObject[key]);
        return newObject;
      });
    },
    
    toggle: (key) => {
      setObject(prev => ({ ...prev, [key]: !prev[key] }));
    },
    
    increment: (key, amount = 1) => {
      setObject(prev => ({ 
        ...prev, 
        [key]: (prev[key] || 0) + amount 
      }));
    },
    
    decrement: (key, amount = 1) => {
      setObject(prev => ({ 
        ...prev, 
        [key]: (prev[key] || 0) - amount 
      }));
    },
    
    clear: () => {
      setObject({});
    },
    
    reset: () => {
      setObject(initialObject);
    }
  }), [initialObject]);

  // Memoized computed values
  const computed = useMemo(() => ({
    keys: Object.keys(object),
    values: Object.values(object),
    entries: Object.entries(object),
    isEmpty: Object.keys(object).length === 0,
    size: Object.keys(object).length
  }), [object]);

  return [object, operations, computed];
};

/**
 * useOptimizedSet Hook
 * Optimized Set state management with memoized operations
 */
export const useOptimizedSet = (initialSet = new Set()) => {
  const [set, setSet] = useState(initialSet);

  // Memoized set operations
  const operations = useMemo(() => ({
    add: (value) => {
      setSet(prev => new Set([...prev, value]));
    },
    
    remove: (value) => {
      setSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
      });
    },
    
    toggle: (value) => {
      setSet(prev => {
        const newSet = new Set(prev);
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }
        return newSet;
      });
    },
    
    clear: () => {
      setSet(new Set());
    },
    
    reset: () => {
      setSet(initialSet);
    },
    
    has: (value) => {
      return set.has(value);
    }
  }), [initialSet, set]);

  // Memoized computed values
  const computed = useMemo(() => ({
    size: set.size,
    isEmpty: set.size === 0,
    values: Array.from(set)
  }), [set]);

  return [set, operations, computed];
};

/**
 * useOptimizedMap Hook
 * Optimized Map state management with memoized operations
 */
export const useOptimizedMap = (initialMap = new Map()) => {
  const [map, setMap] = useState(initialMap);

  // Memoized map operations
  const operations = useMemo(() => ({
    set: (key, value) => {
      setMap(prev => new Map([...prev, [key, value]]));
    },
    
    remove: (key) => {
      setMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    },
    
    clear: () => {
      setMap(new Map());
    },
    
    reset: () => {
      setMap(initialMap);
    },
    
    has: (key) => {
      return map.has(key);
    },
    
    get: (key) => {
      return map.get(key);
    }
  }), [initialMap, map]);

  // Memoized computed values
  const computed = useMemo(() => ({
    size: map.size,
    isEmpty: map.size === 0,
    keys: Array.from(map.keys()),
    values: Array.from(map.values()),
    entries: Array.from(map.entries())
  }), [map]);

  return [map, operations, computed];
};

/**
 * useOptimizedReducer Hook
 * Enhanced useReducer with memoization and performance optimizations
 */
export const useOptimizedReducer = (reducer, initialState, init) => {
  const memoizedReducer = useCallback(reducer, []);
  const [state, dispatch] = useState(() => 
    init ? init(initialState) : initialState
  );
  
  const optimizedDispatch = useCallback((action) => {
    setState(prevState => {
      const nextState = memoizedReducer(prevState, action);
      
      // Prevent unnecessary updates
      if (JSON.stringify(nextState) === JSON.stringify(prevState)) {
        return prevState;
      }
      
      return nextState;
    });
  }, [memoizedReducer]);

  return [state, optimizedDispatch];
};

/**
 * useOptimizedLocalStorage Hook
 * Optimized localStorage integration with memoization
 */
export const useOptimizedLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Memoized setter function
  const setValue = useStableCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  });

  // Remove from localStorage
  const removeValue = useStableCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  });

  return [storedValue, setValue, removeValue];
};

/**
 * useOptimizedSessionStorage Hook
 * Optimized sessionStorage integration with memoization
 */
export const useOptimizedSessionStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useStableCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  });

  const removeValue = useStableCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  });

  return [storedValue, setValue, removeValue];
};

/**
 * useOptimizedToggle Hook
 * Optimized boolean toggle with memoization
 */
export const useOptimizedToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return [value, { toggle, setTrue, setFalse, reset }];
};

export default {
  useOptimizedState,
  useOptimizedArray,
  useOptimizedObject,
  useOptimizedSet,
  useOptimizedMap,
  useOptimizedReducer,
  useOptimizedLocalStorage,
  useOptimizedSessionStorage,
  useOptimizedToggle,
};