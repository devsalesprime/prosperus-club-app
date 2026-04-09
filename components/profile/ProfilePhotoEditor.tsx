// components/profile/ProfilePhotoEditor.tsx
// Engenharia Nativa: Editor de foto com crop circular, pan & zoom (Pointer Events) + Canvas WebP
// Zero dependências externas — WPO App
// Fluxo: Bottom sheet -> Fullscreen Editor -> Blob (WebP)

import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Camera, Trash2 } from 'lucide-react';

interface Props {
    currentImageUrl?: string | null;
    onConfirm: (croppedBlob: Blob) => void;
    onRemove?: () => void;
    onClose: () => void;
}

interface Position { x: number; y: number }
interface PointerData { id: number; x: number; y: number }

export function ProfilePhotoEditor({ currentImageUrl, onConfirm, onRemove, onClose }: Props) {
    const [step, setStep] = useState<'select' | 'edit'>('select');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
    const [nativeSize, setNativeSize] = useState({ w: 0, h: 0 });

    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    // Gestures state
    const pointers = useRef<PointerData[]>([]);
    const isDragging = useRef(false);
    const dragStart = useRef<Position>({ x: 0, y: 0 });
    const posStart = useRef<Position>({ x: 0, y: 0 });
    const lastTouchDist = useRef<number | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    // Responsive mask size (sm: 320px, mobile: 256px)
    const [maskSize, setMaskSize] = useState(256);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMaskSize(window.innerWidth >= 640 ? 320 : 256);
            const handleResize = () => setMaskSize(window.innerWidth >= 640 ? 320 : 256);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // ─── LER ARQUIVO ─────────────────────────────────────────────────────────
    const handleFileSelect = useCallback((file: File) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            setNativeSize({ w: img.width, h: img.height });
            setImageUrl(url);
            setImageEl(img);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setStep('edit');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            toast.error('Erro ao ler a imagem.');
        };
        img.src = url;
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        if (fileRef.current) fileRef.current.value = '';
    };

    // ─── POINTER EVENTS MATH (PAN & ZOOM) ────────────────────────────────────
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.push({ id: e.pointerId, x: e.clientX, y: e.clientY });

        if (pointers.current.length === 1) {
            isDragging.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            posStart.current = { ...position };
        } else if (pointers.current.length === 2) {
            const dx = pointers.current[0].x - pointers.current[1].x;
            const dy = pointers.current[0].y - pointers.current[1].y;
            lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
        }
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const pIndex = pointers.current.findIndex(p => p.id === e.pointerId);
        if (pIndex !== -1) {
            pointers.current[pIndex] = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }

        if (pointers.current.length === 1 && isDragging.current) {
            setPosition({
                x: posStart.current.x + (e.clientX - dragStart.current.x),
                y: posStart.current.y + (e.clientY - dragStart.current.y)
            });
        } else if (pointers.current.length === 2 && lastTouchDist.current !== null) {
            const dx = pointers.current[0].x - pointers.current[1].x;
            const dy = pointers.current[0].y - pointers.current[1].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ratio = dist / lastTouchDist.current;
            setZoom(z => Math.max(1, Math.min(3, z * ratio)));
            lastTouchDist.current = dist;
        }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        pointers.current = pointers.current.filter(p => p.id !== e.pointerId);
        if (pointers.current.length < 2) {
            lastTouchDist.current = null;
        }
        if (pointers.current.length === 0) {
            isDragging.current = false;
        } else if (pointers.current.length === 1) {
            isDragging.current = true;
            dragStart.current = { x: pointers.current[0].x, y: pointers.current[0].y };
            posStart.current = { ...position };
        }
    };

    // ─── CROP HTML5 CANVAS (LÂMINA) ──────────────────────────────────────────
    const handleCrop = async () => {
        if (!imageEl || nativeSize.w === 0) return;
        setIsProcessing(true);

        // A escala base (cover)
        const coverScale = Math.max(maskSize / nativeSize.w, maskSize / nativeSize.h);
        
        // Vamos renderizar em 500x500 (alta definição, leve)
        const canvasSize = 500;
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d')!;

        // Fundo preto (prevenção PNG)
        ctx.fillStyle = '#031726';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Recorte circular
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, 2 * Math.PI);
        ctx.clip();

        // Escala matemática do UI para o Canvas (500 / maskSize)
        const uiScale = canvasSize / maskSize;
        const finalScale = coverScale * zoom * uiScale;

        const renderW = nativeSize.w * finalScale;
        const renderH = nativeSize.h * finalScale;

        // O centro da imagem na UI cai exatamente no centro do viewport ANTES do translate.
        // position.x e y deslocam esse centro.
        const cCenter = canvasSize / 2;
        const dx = cCenter - (renderW / 2) + (position.x * uiScale);
        const dy = cCenter - (renderH / 2) + (position.y * uiScale);

        ctx.drawImage(imageEl, dx, dy, renderW, renderH);

        canvas.toBlob((blob) => {
            if (blob) {
                // Instantly optimistic update is triggered by the parent via onConfirm
                onConfirm(blob);
            } else {
                toast.error('Erro ao gerar recorte.');
                setIsProcessing(false);
            }
        }, 'image/webp', 0.85); // Compressão WebP nativa
    };

    // ══════════════════════════════════════════════════════════════════════════
    // TELA 1: BOTTOM SHEET (Seleção / Remoção)
    // ══════════════════════════════════════════════════════════════════════════
    if (step === 'select') {
        return (
            <>
                <div onClick={onClose} className="fixed inset-0 z-[9998] bg-black/55 backdrop-blur-sm" />
                <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center">
                    <div className="w-full max-w-[440px] bg-[#0F3249] rounded-t-[28px] pb-[max(28px,env(safe-area-inset-bottom,28px))] animate-in slide-in-from-bottom shadow-2xl relative">
                        <div className="w-9 h-1 bg-[#1A4A6B] rounded-full mx-auto mt-3" />
                        
                        <div className="flex justify-center mt-5 mb-4">
                            <img
                                src={currentImageUrl || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                alt="Foto do Sócio"
                                className="w-[88px] h-[88px] rounded-full object-cover border-[3px] border-[#FFDA71] bg-[#1A4A6B] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                            />
                        </div>

                        <p className="text-center text-[#FCF7F0] text-[17px] font-semibold mb-6 tracking-tight">Alterar foto de perfil</p>

                        <div className="px-5 flex flex-col gap-3">
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center justify-center gap-2.5 w-full py-4 rounded-full border-[1.5px] border-[#FFDA71] bg-[#FFDA71]/5 text-[#FFDA71] text-base font-semibold hover:bg-[#FFDA71]/10 transition-colors"
                            >
                                <Camera size={18} className="text-[#FFDA71]" />
                                {currentImageUrl ? 'Trocar foto' : 'Adicionar foto'}
                            </button>

                            {currentImageUrl && onRemove && (
                                <button
                                    onClick={() => { onRemove(); onClose(); }}
                                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-full border-[1.5px] border-red-500/40 bg-red-500/5 text-red-500 text-base font-semibold hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Remover foto
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-full text-[#8BA3B4] text-base font-medium mt-1 hover:text-[#FCF7F0] transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>

                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/heic,image/webp,image/*" className="hidden" onChange={onFileChange} />
                    </div>
                </div>
            </>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TELA 2: FULLSCREEN EDITOR (UI Cinematográfica)
    // ══════════════════════════════════════════════════════════════════════════
    const coverScale = Math.max(maskSize / nativeSize.w, maskSize / nativeSize.h);

    return (
        <div className="fixed inset-0 z-[100] bg-[#031726]/95 backdrop-blur-md flex flex-col overflow-hidden touch-none text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,44px)] pb-3 flex-shrink-0 z-50">
                <button onClick={() => setStep('select')} className="text-[#8BA3B4] py-2 text-base font-medium active:opacity-70">
                    Cancelar
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-[#FCF7F0] tracking-tight">Estúdio</span>
                </div>
                <button 
                    onClick={handleCrop} 
                    disabled={isProcessing}
                    className="text-[#CA9A43] py-2 text-base font-bold active:opacity-70 disabled:opacity-50"
                >
                    {isProcessing ? 'Cortando...' : 'Salvar'}
                </button>
            </div>

            {/* Hint */}
            <p className="text-center text-[13px] text-[#8BA3B4] mt-2 mb-4 z-50 flex-shrink-0 relative pointer-events-none">
                Movimente para centrar e aplique zoom
            </p>

            {/* Gesture Engine Area */}
            <div 
                className="flex-1 w-full relative flex items-center justify-center overflow-hidden z-20 cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                {/* Imagem Pura com CSS Transform (GPU Accelerated) */}
                {imageUrl && (
                    <img 
                        src={imageUrl} 
                        alt="Crop source"
                        width={nativeSize.w} 
                        height={nativeSize.h}
                        className="max-w-none origin-center pointer-events-none select-none drop-shadow-2xl"
                        style={{ 
                            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${coverScale * zoom})`,
                            willChange: 'transform'
                        }}
                    />
                )}

                {/* Máscara Circular Cinematográfica (Pointer Events None) */}
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_9999px_rgba(3,23,38,0.85)] border-2 border-[#CA9A43] pointer-events-none z-10"
                    style={{ width: maskSize, height: maskSize }}
                />
            </div>

            {/* Slider de Zoom no Rodapé */}
            <div className="flex flex-col items-center px-6 pb-[max(32px,env(safe-area-inset-bottom,32px))] pt-6 flex-shrink-0 z-50 bg-gradient-to-t from-[#031726] to-transparent">
                <div className="flex items-center gap-4 w-full max-w-xs">
                    <span className="text-[#8BA3B4] text-xl font-light">−</span>
                    <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.05" 
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        className="w-full flex-1 accent-[#CA9A43] h-1 bg-[#1A4A6B] rounded-full appearance-none outline-none" 
                    />
                    <span className="text-[#8BA3B4] text-2xl font-light">+</span>
                </div>
            </div>

        </div>
    );
}

export default ProfilePhotoEditor;
