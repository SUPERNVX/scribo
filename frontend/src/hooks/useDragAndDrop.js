// Drag and Drop Hook for reordering and interactions
import { useState, useCallback, useRef } from 'react';

/**
 * useDragAndDrop Hook
 * Gerencia operações de drag & drop para reordenação
 */
export const useDragAndDrop = (items, onReorder, options = {}) => {
  const {
    draggedItemClass = 'dragging',
    dropZoneClass = 'drop-zone-active',
    ghostClass = 'drag-ghost',
    disabled = false,
  } = options;

  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  const draggedElement = useRef(null);

  // Iniciar drag
  const handleDragStart = useCallback(
    (event, item, index) => {
      if (disabled) return;

      setDraggedItem({ item, index });
      draggedElement.current = event.target;

      // Adicionar classe visual
      event.target.classList.add(draggedItemClass);

      // Configurar dados do drag
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', event.target.outerHTML);

      // Criar ghost image personalizada se necessário
      if (ghostClass) {
        const ghost = event.target.cloneNode(true);
        ghost.classList.add(ghostClass);
        ghost.style.opacity = '0.5';
        document.body.appendChild(ghost);
        event.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
      }
    },
    [disabled, draggedItemClass, ghostClass]
  );

  // Drag over
  const handleDragOver = useCallback(
    (event, item, index) => {
      if (disabled || !draggedItem) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      if (draggedItem.index !== index) {
        setDraggedOverItem({ item, index });
        event.target.classList.add(dropZoneClass);
      }
    },
    [disabled, draggedItem, dropZoneClass]
  );

  // Drag enter
  const handleDragEnter = useCallback(
    (event, item, index) => {
      if (disabled || !draggedItem) return;

      event.preventDefault();
      if (draggedItem.index !== index) {
        event.target.classList.add(dropZoneClass);
      }
    },
    [disabled, draggedItem, dropZoneClass]
  );

  // Drag leave
  const handleDragLeave = useCallback(
    event => {
      if (disabled) return;

      event.target.classList.remove(dropZoneClass);
    },
    [disabled, dropZoneClass]
  );

  // Drop
  const handleDrop = useCallback(
    (event, targetItem, targetIndex) => {
      if (disabled || !draggedItem) return;

      event.preventDefault();

      // Remover classes visuais
      event.target.classList.remove(dropZoneClass);
      if (draggedElement.current) {
        draggedElement.current.classList.remove(draggedItemClass);
      }

      // Reordenar apenas se for posição diferente
      if (draggedItem.index !== targetIndex) {
        const newItems = [...items];
        const [removed] = newItems.splice(draggedItem.index, 1);
        newItems.splice(targetIndex, 0, removed);

        if (onReorder) {
          onReorder(newItems, {
            from: draggedItem.index,
            to: targetIndex,
            item: draggedItem.item,
          });
        }
      }

      // Reset state
      setDraggedItem(null);
      setDraggedOverItem(null);
      draggedElement.current = null;
    },
    [disabled, draggedItem, items, onReorder, dropZoneClass, draggedItemClass]
  );

  // Drag end
  const handleDragEnd = useCallback(
    event => {
      if (disabled) return;

      // Limpar classes visuais
      event.target.classList.remove(draggedItemClass);
      document.querySelectorAll(`.${dropZoneClass}`).forEach(el => {
        el.classList.remove(dropZoneClass);
      });

      // Reset state
      setDraggedItem(null);
      setDraggedOverItem(null);
      draggedElement.current = null;
    },
    [disabled, draggedItemClass, dropZoneClass]
  );

  // Propriedades para elementos draggable
  const getDragProps = useCallback(
    (item, index) => ({
      draggable: !disabled,
      onDragStart: e => handleDragStart(e, item, index),
      onDragEnd: handleDragEnd,
    }),
    [disabled, handleDragStart, handleDragEnd]
  );

  // Propriedades para drop zones
  const getDropProps = useCallback(
    (item, index) => ({
      onDragOver: e => handleDragOver(e, item, index),
      onDragEnter: e => handleDragEnter(e, item, index),
      onDragLeave: handleDragLeave,
      onDrop: e => handleDrop(e, item, index),
    }),
    [handleDragOver, handleDragEnter, handleDragLeave, handleDrop]
  );

  return {
    draggedItem,
    draggedOverItem,
    isDragging: !!draggedItem,
    getDragProps,
    getDropProps,
  };
};

/**
 * useFileDrop Hook
 * Drag & drop específico para arquivos
 */
export const useFileDrop = (onFileDrop, options = {}) => {
  const {
    accept = '*',
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB
    disabled = false,
  } = options;

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dragCounter = useRef(0);

  // Validar arquivo
  const validateFile = useCallback(
    file => {
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
        };
      }

      if (accept !== '*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(type);
        });

        if (!isAccepted) {
          return {
            valid: false,
            error: `Tipo de arquivo não aceito. Aceitos: ${accept}`,
          };
        }
      }

      return { valid: true };
    },
    [accept, maxSize]
  );

  // Processar arquivos
  const processFiles = useCallback(
    async files => {
      if (disabled) return;

      setIsProcessing(true);
      const fileList = Array.from(files);

      if (!multiple && fileList.length > 1) {
        setIsProcessing(false);
        return;
      }

      const validFiles = [];
      const errors = [];

      for (const file of fileList) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push({ file: file.name, error: validation.error });
        }
      }

      if (onFileDrop) {
        await onFileDrop(validFiles, errors);
      }

      setIsProcessing(false);
    },
    [disabled, multiple, validateFile, onFileDrop]
  );

  // Drag enter
  const handleDragEnter = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  // Drag leave
  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  // Drag over
  const handleDragOver = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Drop
  const handleDrop = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // Propriedades para drop zone
  const getDropZoneProps = useCallback(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  );

  return {
    isDragOver,
    isProcessing,
    getDropZoneProps,
    processFiles,
  };
};

/**
 * useSortable Hook
 * Drag & drop para listas ordenáveis
 */
export const useSortable = (items, onSort, options = {}) => {
  const {
    direction = 'vertical', // 'vertical' | 'horizontal'
    animation = true,
    disabled = false,
  } = options;

  const dragAndDrop = useDragAndDrop(items, onSort, {
    disabled,
    ...options,
  });

  // Calcular posição de inserção baseada na direção
  const getInsertPosition = useCallback(
    (event, element) => {
      const rect = element.getBoundingClientRect();

      if (direction === 'horizontal') {
        const middle = rect.left + rect.width / 2;
        return event.clientX < middle ? 'before' : 'after';
      } else {
        const middle = rect.top + rect.height / 2;
        return event.clientY < middle ? 'before' : 'after';
      }
    },
    [direction]
  );

  return {
    ...dragAndDrop,
    getInsertPosition,
    direction,
  };
};

export default {
  useDragAndDrop,
  useFileDrop,
  useSortable,
};
