// components/profile/ProfilePhotoEditor.tsx
// Editor de foto com crop circular, zoom e pan
// Zero dependências externas — Canvas API nativa
// Fluxo: bottom sheet → editor fullscreen → crop → blob

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
    currentImageUrl?: string | null;
    onConfirm: (croppedBlob: Blob) => void;
    onRemove?: () => void;
    onClose: () => void;
}

interface Position { x: number; y: number }

// ─── Design tokens ─────────────────────────────────────────────────────────
const CIRCLE_SIZE = 260;
const OUTPUT_SIZE = 400;
// Zoom min/max são calculados dinamicamente a partir do coverZoom
const ZOOM_MAX_MULTIPLIER = 12; // 12× o zoom de cover = zoom muito detalhado
const NAVY        = '#031A2B';
const CARD        = '#031726';
const BORDER      = '#1A4A6B';
const GOLD        = '#FFDA71';
const WHITE       = '#FCF7F0';
const GREY        = '#8BA3B4';

// ─── SVG câmera ─────────────────────────────────────────────────────────────
const IconCamera = ({ size = 18, color = GOLD }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/>
        <circle cx="12" cy="13" r="3"/>
    </svg>
);

// ─── SVG lixeira ─────────────────────────────────────────────────────────────
const IconTrash = ({ size = 16, color = '#EF4444' }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
        <path d="M3 6h18"/>
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

export function ProfilePhotoEditor({ currentImageUrl, onConfirm, onRemove, onClose }: Props) {
    const [step, setStep]         = useState<'select' | 'edit'>('select');
    const [imageEl, setImageEl]   = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom]         = useState(1);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [coverZoom, setCoverZoom] = useState(1); // zoom mínimo dinâmico (fit image)

    // min/max zoom calculados pela imagem carregada
    const minZoom = coverZoom;
    const maxZoom = Math.max(coverZoom * ZOOM_MAX_MULTIPLIER, 4);

    const isDragging    = useRef(false);
    const dragStart     = useRef<Position>({ x: 0, y: 0 });
    const posStart      = useRef<Position>({ x: 0, y: 0 });
    const lastTouchDist = useRef<number | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileRef   = useRef<HTMLInputElement>(null);

    // ─── Carregar arquivo ──────────────────────────────────────────────────
    const handleFileSelect = useCallback((file: File) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            // Zoom que cobre o círculo completamente sem bordas brancas
            const cover = Math.max(CIRCLE_SIZE / img.width, CIRCLE_SIZE / img.height);
            setCoverZoom(cover);
            setZoom(cover);
            setPosition({ x: 0, y: 0 });
            setImageEl(img);
            setStep('edit');
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    // ─── Render canvas ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!imageEl || !canvasRef.current || step !== 'edit') return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const r  = CIRCLE_SIZE / 2;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(3, 26, 43, 0.78)';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        const sw = imageEl.width  * zoom;
        const sh = imageEl.height * zoom;
        ctx.drawImage(imageEl, cx - sw / 2 + position.x, cy - sh / 2 + position.y, sw, sh);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth   = 2.5;
        ctx.stroke();
    }, [imageEl, zoom, position, step]);

    // ─── Pan Mouse ──────────────────────────────────────────────────────────
    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragStart.current  = { x: e.clientX, y: e.clientY };
        posStart.current   = { ...position };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        setPosition({
            x: posStart.current.x + (e.clientX - dragStart.current.x),
            y: posStart.current.y + (e.clientY - dragStart.current.y),
        });
    };
    const onMouseUp = () => { isDragging.current = false; };

    // ─── Pan + Pinch Touch ──────────────────────────────────────────────────
    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            isDragging.current = true;
            dragStart.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            posStart.current   = { ...position };
        }
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
        }
    };
    const onTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging.current) {
            setPosition({
                x: posStart.current.x + (e.touches[0].clientX - dragStart.current.x),
                y: posStart.current.y + (e.touches[0].clientY - dragStart.current.y),
            });
        }
        if (e.touches.length === 2 && lastTouchDist.current !== null) {
            const dx   = e.touches[0].clientX - e.touches[1].clientX;
            const dy   = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            setZoom(z => Math.min(maxZoom, Math.max(minZoom, z * (dist / lastTouchDist.current!))));
            lastTouchDist.current = dist;
        }
    };
    const onTouchEnd = () => {
        isDragging.current    = false;
        lastTouchDist.current = null;
    };

    // ─── Reset ─────────────────────────────────────────────────────────────
    const handleReset = () => {
        setZoom(coverZoom); // volta ao fit inicial, não ao MIN_ZOOM fixo
        setPosition({ x: 0, y: 0 });
    };

    // ─── Gerar JPEG 400×400 ─────────────────────────────────────────────────
    const handleConfirm = useCallback(async () => {
        if (!imageEl) return;
        setIsProcessing(true);
        try {
            const out = document.createElement('canvas');
            out.width  = OUTPUT_SIZE;
            out.height = OUTPUT_SIZE;
            const ctx   = out.getContext('2d')!;
            const cx    = OUTPUT_SIZE / 2;
            const scale = OUTPUT_SIZE / CIRCLE_SIZE;

            ctx.beginPath();
            ctx.arc(cx, cx, OUTPUT_SIZE / 2, 0, Math.PI * 2);
            ctx.clip();

            const sw = imageEl.width  * zoom * scale;
            const sh = imageEl.height * zoom * scale;
            ctx.drawImage(
                imageEl,
                cx - sw / 2 + position.x * scale,
                cx - sh / 2 + position.y * scale,
                sw, sh
            );

            out.toBlob(blob => {
                if (blob) onConfirm(blob);
                setIsProcessing(false);
            }, 'image/jpeg', 0.92);
        } catch {
            setIsProcessing(false);
        }
    }, [imageEl, zoom, position, onConfirm]);

    // ══════════════════════════════════════════════════════════════════════════
    // TELA 1 — Bottom sheet estilo iOS/Apple com cores Prosperus
    // ══════════════════════════════════════════════════════════════════════════
    if (step === 'select') {
        return (
            <>
                {/* Backdrop com blur */}
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9998,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                    }}
                />

                {/* Sheet wrapper */}
                <div style={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: 440,
                        background: '#0F3249',
                        borderRadius: '28px 28px 0 0',
                        paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
                        animation: 'sheetUp 0.3s cubic-bezier(0.32,0.72,0,1)',
                        position: 'relative',
                        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
                    }}>
                        {/* Handle pill */}
                        <div style={{
                            width: 36, height: 4,
                            background: BORDER,
                            borderRadius: 2,
                            margin: '12px auto 0',
                        }} />

                        {/* Avatar flutuante com borda dourada */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: 20,
                            marginBottom: 18,
                        }}>
                            <img
                                src={currentImageUrl || ''}
                                alt="Foto de perfil"
                                style={{
                                    width: 88, height: 88,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: `3px solid ${GOLD}`,
                                    background: BORDER,
                                    boxShadow: `0 0 0 4px #0F3249, 0 8px 32px rgba(0,0,0,0.5)`,
                                    display: 'block',
                                }}
                                onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                            />
                        </div>

                        {/* Título */}
                        <p style={{
                            textAlign: 'center',
                            color: WHITE,
                            fontSize: 17,
                            fontWeight: 600,
                            margin: '0 0 24px',
                            letterSpacing: '-0.01em',
                        }}>
                            Alterar foto de perfil
                        </p>

                        {/* Botões */}
                        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* Trocar foto — pill dourado */}
                            <button
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 10,
                                    width: '100%', padding: '15px 20px',
                                    borderRadius: 50,
                                    border: `1.5px solid ${GOLD}`,
                                    background: 'rgba(255,218,113,0.06)',
                                    color: GOLD,
                                    fontSize: 16, fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,218,113,0.12)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,218,113,0.06)')}
                            >
                                <IconCamera size={18} color={GOLD} />
                                {currentImageUrl ? 'Trocar foto' : 'Adicionar foto'}
                            </button>

                            {/* Remover foto — pill vermelho */}
                            {currentImageUrl && onRemove && (
                                <button
                                    onClick={() => { onRemove(); onClose(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: 10,
                                        width: '100%', padding: '15px 20px',
                                        borderRadius: 50,
                                        border: '1.5px solid rgba(239,68,68,0.45)',
                                        background: 'rgba(239,68,68,0.05)',
                                        color: '#EF4444',
                                        fontSize: 16, fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.05)')}
                                >
                                    <IconTrash size={16} color="#EF4444" />
                                    Remover foto
                                </button>
                            )}

                            {/* Cancelar — sem borda */}
                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%', padding: '15px 20px',
                                    borderRadius: 50,
                                    border: 'none',
                                    background: 'transparent',
                                    color: GREY,
                                    fontSize: 16, fontWeight: 500,
                                    cursor: 'pointer',
                                    marginTop: 2,
                                }}
                            >
                                Cancelar
                            </button>
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/heic,image/webp,image/*"
                            style={{ display: 'none' }}
                            onChange={onFileChange}
                        />
                    </div>
                </div>

                <style>{`
                    @keyframes sheetUp {
                        from { transform: translateY(100%); opacity: 0; }
                        to   { transform: translateY(0);    opacity: 1; }
                    }
                `}</style>
            </>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TELA 2 — Editor fullscreen com canvas (crop circular)
    // ══════════════════════════════════════════════════════════════════════════
    const canvasW = Math.min(typeof window !== 'undefined' ? window.innerWidth : 480, 480);
    const canvasH = Math.round(canvasW * 1.1);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: NAVY,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '52px 20px 12px',
                flexShrink: 0,
            }}>
                <button
                    onClick={() => setStep('select')}
                    style={{ background: 'none', border: 'none', color: GREY, fontSize: 15, cursor: 'pointer', padding: '4px 0' }}
                >
                    Cancelar
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: WHITE }}>Mover e ajustar</span>
                <div style={{ width: 64 }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: GREY, margin: '0 0 8px', flexShrink: 0 }}>
                Arraste para reposicionar · Pinça para zoom
            </p>

            {/* Canvas */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasW}
                    height={canvasH}
                    style={{ cursor: 'grab', touchAction: 'none', display: 'block', maxWidth: '100%' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                />
            </div>

            {/* Slider de zoom — range dinâmico baseado na imagem */}
            <div style={{ padding: '8px 28px 4px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{ color: GREY, fontSize: 20, lineHeight: 1, userSelect: 'none' }}>−</span>
                <input
                    type="range"
                    min={minZoom}
                    max={maxZoom}
                    step={minZoom / 100} // step proporcional ao range
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    style={{ flex: 1, accentColor: GOLD, cursor: 'pointer', height: 4 }}
                />
                <span style={{ color: GREY, fontSize: 22, lineHeight: 1, userSelect: 'none' }}>+</span>
                <button
                    onClick={handleReset}
                    style={{ background: BORDER, border: 'none', color: GREY, fontSize: 12, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}
                >
                    Reset
                </button>
            </div>

            {/* Botões de ação */}
            <div style={{
                padding: '8px 20px',
                paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
                display: 'flex', flexDirection: 'column', gap: 10,
                flexShrink: 0,
            }}>
                <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                        background: CARD, border: `1px solid ${BORDER}`,
                        borderRadius: 14, padding: '13px 20px',
                        color: WHITE, fontSize: 15, cursor: 'pointer', fontWeight: 500,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                >
                    <IconCamera size={16} color={GREY} />
                    Selecionar outra foto
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    style={{
                        background: isProcessing ? BORDER : GOLD,
                        border: 'none', borderRadius: 14,
                        padding: '15px 20px',
                        color: NAVY, fontSize: 16, fontWeight: 700,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.7 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    {isProcessing ? 'Processando...' : 'Confirmar'}
                </button>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/webp,image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
            />
        </div>
    );
}
