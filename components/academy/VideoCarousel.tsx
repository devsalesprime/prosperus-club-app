import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export function VideoCarousel({ children, title, subtitle, onSeeAll }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse Drag Logic
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const updateButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setCanPrev(!atStart);
    setCanNext(!atEnd);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const timeout = setTimeout(updateButtons, 100);
    el.addEventListener('scroll', updateButtons, { passive: true });
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateButtons);
      ro.observe(el);
    }

    return () => {
      clearTimeout(timeout);
      el.removeEventListener('scroll', updateButtons);
      if (ro) ro.disconnect();
    };
  }, [updateButtons]);

  const scrollByPage = (dir: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85 * (dir === 'next' ? 1 : -1);
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Removendo interceptadores Pointer para não quebrar o clique nativo do Player


  const totalChildren = React.Children.count(children);
  if (totalChildren === 0) return null;

  return (
    <div
      style={{ position: 'relative', marginBottom: 40, width: '100%', minWidth: 0, maxWidth: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header opcional */}
      {title && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, paddingLeft: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FCF7F0', letterSpacing: '0.03em', display: 'flex', alignItems: 'center' }}>
            {title}
          </h2>
          {subtitle && (
            <span style={{ fontSize: 12, color: '#95A4B4', fontWeight: 500 }}>{subtitle}</span>
          )}
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#CA9A43', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
            >
              Ver todos &rarr;
            </button>
          )}
        </div>
      )}

      {/* Fade esquerda */}
      {canPrev && (
        <div style={{
          position: 'absolute', top: title ? 56 : 0, left: 0, bottom: 0,
          width: 80, zIndex: 15, pointerEvents: 'none',
          background: 'linear-gradient(to right, #031726, transparent)',
        }} />
      )}

      {/* Fade direita */}
      {canNext && (
        <div style={{
          position: 'absolute', top: title ? 56 : 0, right: 0, bottom: 0,
          width: 80, zIndex: 15, pointerEvents: 'none',
          background: 'linear-gradient(to left, #031726, transparent)',
        }} />
      )}

      {/* Seta PREV */}
      {canPrev && isHovered && (
        <button
          onClick={() => scrollByPage('prev')}
          aria-label="Anterior"
          style={{
            position: 'absolute', top: '50%',
            left: 20, transform: 'translateY(-50%)',
            zIndex: 20, width: 44, height: 44,
            borderRadius: '50%', background: 'rgba(3, 23, 38, 0.85)',
            border: '1px solid #052B48', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FCF7F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Seta NEXT */}
      {canNext && isHovered && (
        <button
          onClick={() => scrollByPage('next')}
          aria-label="Próximo"
          style={{
            position: 'absolute', top: '50%',
            right: 20, transform: 'translateY(-50%)',
            zIndex: 20, width: 44, height: 44,
            borderRadius: '50%', background: 'rgba(3, 23, 38, 0.85)',
            border: '1px solid #052B48', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FCF7F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Track com eventos padrão */}
      <div
        ref={trackRef}
        style={{
          display:                  'flex',
          gap:                      14,
          overflowX:                'auto',
          scrollSnapType:           'x mandatory',
          WebkitOverflowScrolling:  'touch',
          msOverflowStyle:          'none',
          scrollbarWidth:           'none',
          paddingBottom:            8,
          paddingLeft:              4,
          paddingRight:             4,
          minWidth:                 0, // Flex limite
          width:                    '100%',
        }}
      >
        <style>{`.video-track::-webkit-scrollbar{display:none} .video-track-item { flex-shrink: 0; scroll-snap-align: start; }`}</style>
        {React.Children.map(children, (child, i) => (
          <div key={i} className="video-track-item">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
