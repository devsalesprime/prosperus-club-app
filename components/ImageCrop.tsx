// ImageCrop.tsx
// Component for cropping images before upload

import React, { useState, useRef, useEffect } from 'react';
import { Crop, RotateCw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface ImageCropProps {
    imageUrl: string;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
}

export const ImageCrop: React.FC<ImageCropProps> = ({ imageUrl, onCropComplete, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImage(img);
            drawCanvas(img, zoom, rotation, position);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    useEffect(() => {
        if (image) {
            drawCanvas(image, zoom, rotation, position);
        }
    }, [zoom, rotation, position]);

    const drawCanvas = (
        img: HTMLImageElement,
        currentZoom: number,
        currentRotation: number,
        currentPosition: { x: number; y: number }
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 300; // Canvas size
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Save context
        ctx.save();

        // Move to center
        ctx.translate(size / 2, size / 2);

        // Apply rotation
        ctx.rotate((currentRotation * Math.PI) / 180);

        // Apply zoom and position
        const scaledWidth = img.width * currentZoom;
        const scaledHeight = img.height * currentZoom;

        ctx.drawImage(
            img,
            -scaledWidth / 2 + currentPosition.x,
            -scaledHeight / 2 + currentPosition.y,
            scaledWidth,
            scaledHeight
        );

        // Restore context
        ctx.restore();

        // Draw circular mask
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Draw border
        ctx.strokeStyle = '#ca8a04'; // yellow-600
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.5));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleCrop = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (!blob) return;

            // Create file from blob
            const file = new File([blob], 'avatar.png', { type: 'image/png' });
            onCropComplete(file);
        }, 'image/png', 0.95);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Crop size={20} />
                        Ajustar Imagem
                    </h3>
                    <button
                        onClick={onCancel}
                        className="btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Canvas */}
                <div className="p-6">
                    <div className="bg-slate-950 rounded-xl p-4 flex items-center justify-center">
                        <canvas
                            ref={canvasRef}
                            className="cursor-move"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    </div>

                    {/* Controls */}
                    <div className="mt-4 space-y-3">
                        {/* Zoom */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                Zoom
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-white"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="flex-1"
                                />
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-white"
                                >
                                    <ZoomIn size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Rotation */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                Rotação
                            </label>
                            <button
                                onClick={handleRotate}
                                className="w-full p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-white flex items-center justify-center gap-2"
                            >
                                <RotateCw size={18} />
                                Girar 90°
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 text-center mt-4">
                        Arraste a imagem para posicionar
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCrop}
                        className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};
