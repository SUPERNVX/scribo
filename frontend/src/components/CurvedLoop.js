import React, { useRef, useEffect, useState, useMemo, useId } from 'react';

const CurvedLoop = ({
  marqueeText = '',
  speed = 2,
  className,
  curveAmount = 400,
  direction = 'left',
  interactive = true,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    return (
      (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0'
    );
  }, [marqueeText]);

  const measureRef = useRef(null);
  const tspansRef = useRef([]);
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [spacing, setSpacing] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M0,40 Q720,${40 + curveAmount} 1440,40`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);

  useEffect(() => {
    if (measureRef.current)
      setSpacing(measureRef.current.getComputedTextLength());
  }, [text, className]);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [curveAmount]);

  useEffect(() => {
    if (!spacing) return;
    let frame = 0;
    const step = () => {
      tspansRef.current.forEach(t => {
        if (!t) return;
        let x = parseFloat(t.getAttribute('x') || '0');
        if (!dragRef.current) {
          const delta =
            dirRef.current === 'right' ? Math.abs(speed) : -Math.abs(speed);
          x += delta;
        }
        const maxX = (tspansRef.current.length - 1) * spacing;
        if (x < -spacing) x = maxX;
        if (x > maxX) x = -spacing;
        t.setAttribute('x', x.toString());
      });
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed]);

  const repeats =
    pathLength && spacing ? Math.ceil(pathLength / spacing) + 2 : 0;
  const ready = pathLength > 0 && spacing > 0;

  const onPointerDown = e => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    e.target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = e => {
    if (!interactive || !dragRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;
    tspansRef.current.forEach(t => {
      if (!t) return;
      let x = parseFloat(t.getAttribute('x') || '0');
      x += dx;
      const maxX = (tspansRef.current.length - 1) * spacing;
      if (x < -spacing) x = maxX;
      if (x > maxX) x = -spacing;
      t.setAttribute('x', x.toString());
    });
  };

  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? 'right' : 'left';
  };

  const cursorStyle = interactive
    ? dragRef.current
      ? 'grabbing'
      : 'grab'
    : 'auto';

  return (
    <div
      className='fixed top-20 left-0 w-screen h-screen pointer-events-auto z-10'
      style={{ visibility: ready ? 'visible' : 'hidden', cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg
        className='select-none w-screen overflow-visible block text-[2rem] md:text-[2.5rem] font-bold tracking-[1px] md:tracking-[2px] uppercase leading-none'
        viewBox='0 0 1440 300'
        style={{ height: '100vh' }}
        preserveAspectRatio='none'
      >
        <text
          ref={measureRef}
          xmlSpace='preserve'
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          {text}
        </text>
        <defs>
          <path
            ref={pathRef}
            id={pathId}
            d={pathD}
            fill='none'
            stroke='transparent'
          />
          <linearGradient id='gradient-fill' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#8B7ED8'>
              <animate
                attributeName='stop-color'
                values='#8B7ED8;#FFB088;#8B7ED8'
                dur='2s'
                repeatCount='indefinite'
              />
            </stop>
            <stop offset='50%' stopColor='#FFB088'>
              <animate
                attributeName='stop-color'
                values='#FFB088;#8B7ED8;#FFB088'
                dur='2s'
                repeatCount='indefinite'
              />
            </stop>
            <stop offset='100%' stopColor='#8B7ED8'>
              <animate
                attributeName='stop-color'
                values='#8B7ED8;#FFB088;#8B7ED8'
                dur='2s'
                repeatCount='indefinite'
              />
            </stop>
          </linearGradient>
        </defs>
        {ready && (
          <text
            xmlSpace='preserve'
            className={`fill-purple-400 ${className ?? ''}`}
          >
            <textPath href={`#${pathId}`} xmlSpace='preserve'>
              {Array.from({ length: repeats }).map((_, i) => (
                <tspan
                  key={i}
                  x={i * spacing}
                  ref={el => {
                    if (el) tspansRef.current[i] = el;
                  }}
                >
                  {text.split('Scribo').map((part, index, array) => {
                    if (index === array.length - 1) return part;
                    return (
                      <React.Fragment key={index}>
                        <tspan fill='#8B7ED8'>{part}</tspan>
                        <tspan
                          style={{
                            fill: 'url(#gradient-fill)',
                          }}
                        >
                          Scribo
                        </tspan>
                      </React.Fragment>
                    );
                  })}
                </tspan>
              ))}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};

export default CurvedLoop;
