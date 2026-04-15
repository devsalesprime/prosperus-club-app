// components/banners/NotificationBannerInterstitial.tsx
// Exibição fullscreen do banner com countdown de skip

import React, { useState, useEffect, useCallback } from 'react'
import { NotificationBanner } from '../../services/notificationBannerService'

interface Props {
  banner: NotificationBanner
  onSkip: (deepLink: string) => void
  onDismiss: () => void
}

export function NotificationBannerInterstitial({ banner, onSkip, onDismiss }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(banner.skip_delay ?? 5)
  const [canSkip, setCanSkip] = useState(false)

  // ─── Countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanSkip(true)
      return
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  const handleSkip = useCallback(() => {
    if (!canSkip) return
    onSkip(banner.deep_link)
  }, [canSkip, banner.deep_link, onSkip])

  // Progresso do countdown (0 → 1)
  const progress = 1 - secondsLeft / (banner.skip_delay ?? 5)
  const radius = 14
  const circ = 2 * Math.PI * radius
  const dashOffset = circ * (1 - progress)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Imagem fullscreen — aspecto 9:16 */}
      <img
        src={banner.image_url}
        alt={banner.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
        }}
        draggable={false}
      />

      {/* Overlay superior — gradient para o badge de skip ficar legível */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 120,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Badge de skip — canto superior direito */}
      <div style={{
        position: 'absolute',
        top: 48,   // abaixo da notch iOS
        right: 16,
      }}>
        {!canSkip ? (
          /* Countdown circular */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 24,
            padding: '6px 12px 6px 8px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            {/* SVG countdown ring */}
            <svg width={36} height={36} viewBox="0 0 36 36">
              {/* Track */}
              <circle cx={18} cy={18} r={radius}
                fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />
              {/* Progress */}
              <circle cx={18} cy={18} r={radius}
                fill="none" stroke="#FFDA71" strokeWidth={2.5}
                strokeDasharray={circ}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
              {/* Número */}
              <text x={18} y={18}
                dominantBaseline="central" textAnchor="middle"
                fontSize={12} fontWeight={700} fill="#FCF7F0">
                {secondsLeft}
              </text>
            </svg>
            <span style={{ fontSize: 13, color: '#FCF7F0', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Aguarde para pular
            </span>
          </div>
        ) : (
          /* Botão pular */
          <button
            onClick={handleSkip}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,218,113,0.6)',
              borderRadius: 24,
              padding: '8px 16px',
              color: '#FFDA71',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'transform 0.15s, opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Pular
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="#FFDA71" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Label do link (opcional — Double Pill High Ticket CTA) */}
      {banner.link_label && (
        <div className="absolute bottom-[135px] left-1/2 -translate-x-1/2 z-30 flex">
          {/* A CASCA EXTERNA (Glass Halo) */}
          <div
            className="inline-flex p-[5px] md:p-[6px] rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
            onClick={handleSkip}
          >
            {/* O MIOLO DOURADO (Gold Pill) */}
            <button
              className="px-8 py-2 md:px-10 md:py-3.5 rounded-full bg-gradient-to-r from-[#C89B3C] via-[#E2B75A] to-[#FDF0A6] text-[#031726] font-semibold text-lg md:text-xl tracking-wide shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center whitespace-nowrap border border-[#FCE79A]/50 outline-none"
            >
              {banner.link_label}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
