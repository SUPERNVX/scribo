import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const AnimatedItem = ({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={
        inView
          ? { scale: 1, opacity: 1, y: 0 }
          : { scale: 0.8, opacity: 0, y: 20 }
      }
      transition={{
        duration: 0.4,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 },
      }}
      className='mb-2 cursor-pointer'
    >
      {children}
    </motion.div>
  );
};

const AnimatedList = ({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
}) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleScroll = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = e => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (
        itemBottom >
        containerScrollTop + containerHeight - extraMargin
      ) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={listRef}
        className={`max-h-[300px] overflow-y-auto p-2 ${
          displayScrollbar
            ? '[&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-purple-400/30 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:hover:bg-purple-400/50'
            : '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        }`}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
          scrollbarColor: displayScrollbar
            ? 'rgba(139, 126, 216, 0.3) rgba(255, 255, 255, 0.1)'
            : 'transparent',
        }}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={index * 0.05}
            index={index}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => {
              setSelectedIndex(index);
              if (onItemSelect) {
                onItemSelect(item, index);
              }
            }}
          >
            <div
              className={`
              p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-[10px] relative overflow-hidden
              ${
                selectedIndex === index
                  ? 'bg-gradient-to-br from-purple-400/40 to-white/40 border-purple-400 shadow-lg shadow-purple-400/25 transform -translate-y-0.5'
                  : 'bg-white/30 border-purple-400/20 hover:border-purple-400/40 hover:bg-gradient-to-br hover:from-purple-400/10 hover:to-orange-300/10'
              } 
              ${itemClassName}
            `}
            >
              <div className='flex flex-col gap-1 relative z-10'>
                <span className='font-semibold text-gray-800 text-sm leading-tight line-clamp-2'>
                  {item.title}
                </span>
                <span className='text-gray-600 text-xs leading-relaxed line-clamp-2'>
                  {item.description}
                </span>
              </div>
              {/* Subtle background gradient overlay */}
              <div
                className={`
                absolute inset-0 opacity-0 transition-opacity duration-300
                ${selectedIndex === index ? 'opacity-100' : 'hover:opacity-100'}
                bg-gradient-to-br from-purple-400/5 to-orange-300/5
              `}
              />
            </div>
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className='absolute top-0 left-0 right-0 h-[30px] bg-gradient-to-b from-white/40 to-transparent pointer-events-none transition-opacity duration-300 ease rounded-t-3xl'
            style={{ opacity: topGradientOpacity }}
          />
          <div
            className='absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-white/40 to-transparent pointer-events-none transition-opacity duration-300 ease rounded-b-3xl'
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      )}
    </div>
  );
};

export default AnimatedList;
