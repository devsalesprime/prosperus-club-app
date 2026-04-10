import React, { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  title?: string
  subtitle?: string   // ex: "12 aulas"
  onSeeAll?: () => void
}

export function VideoCarousel({ children, title, subtitle, onSeeAll }: Props) {
  const trackRef     = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const updateButtons = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const atStart = el.scrollLeft <= 4
    const atEnd   = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    setCanPrev(!atStart)
    setCanNext(!atEnd)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    // Dar tempo para os filhos renderizarem antes de medir
    const timeout = setTimeout(updateButtons, 100)

    el.addEventListener('scroll', updateButtons, { passive: true })
    const ro = new ResizeObserver(updateButtons)
    ro.observe(el)

    return () => {
      clearTimeout(timeout)
      el.removeEventListener('scroll', updateButtons)
      ro.disconnect()
    }
  }, [updateButtons])

  const scrollByPage = (dir: 'prev' | 'next') => {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85 * (dir === 'next' ? 1 : -1)
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const totalChildren = React.Children.count(children)
  if (totalChildren === 0) return null

  return (
    <div
      style={{ position: 'relative', marginBottom: 40, overflow: 'visible' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Header da seção */}
      {title && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
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
          width: 80, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to right, #031A2B, transparent)',
        }} />
      )}

      {/* Fade direita */}
      {canNext && (
        <div style={{
          position: 'absolute', top: title ? 56 : 0, right: 0, bottom: 0,
          width: 80, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to left, #031A2B, transparent)',
        }} />
      )}

      {/* Seta PREV */}
      {canPrev && isHovered && (
        <button
          onClick={() => scrollByPage('prev')}
          aria-label="Anterior"
          style={{
            position: 'absolute', top: '50%',
            left: -18, transform: 'translateY(-50%)',
            zIndex: 10, width: 36, height: 36,
            borderRadius: '50%', background: '#031726',
            border: '1px solid #052B48', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCF7F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            right: -18, transform: 'translateY(-50%)',
            zIndex: 10, width: 36, height: 36,
            borderRadius: '50%', background: '#031726',
            border: '1px solid #052B48', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCF7F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Track — o único elemento com overflow:auto */}
      <div
        ref={trackRef}
        style={{
          display:                  'flex',
          gap:                      14,
          overflowX:                'auto',
          overflowY:                'visible',
          scrollSnapType:           'x mandatory',
          WebkitOverflowScrolling:  'touch',
          msOverflowStyle:          'none',
          scrollbarWidth:           'none',
          paddingBottom:            8,
          paddingLeft:              2,
          paddingRight:             2,
        }}
      >
        <style>{`.video-track::-webkit-scrollbar{display:none}`}</style>
        {React.Children.map(children, (child, i) => (
          <div key={i} className="video-track" style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
