import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, CheckCircle, XCircle, Loader2, User } from 'lucide-react';
import { validateTicket, confirmCheckIn, TicketValidationResult } from '../../../services/rsvpService';
import toast from 'react-hot-toast';

interface EventScannerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EventScanner: React.FC<EventScannerProps> = ({ isOpen, onClose }) => {
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanDelay, setScanDelay] = useState(2000);

    const handleScan = useCallback(async (detectedCodes: any[]) => {
        if (!detectedCodes || detectedCodes.length === 0 || isProcessing || scannedCode) return;
        
        const code = detectedCodes[0].rawValue;
        if (!code) return;

        setIsProcessing(true);
        setScannedCode(code);

        try {
            const result = await validateTicket(code);
            setValidationResult(result);
            
            if (result.valid) {
                // Auto-confirm check-in if valid
                const confirmed = await confirmCheckIn(code);
                if (confirmed) {
                    toast.success('Check-in realizado com sucesso!');
                } else {
                    toast.error('Erro ao registrar check-in no banco.');
                }
            } else if (result.alreadyUsed) {
                toast.error('Este ingresso já foi lido antes!');
            } else {
                toast.error(result.error || 'Ingresso Inválido');
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Erro ao validar o ticket.');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, scannedCode]);

    const resetScanner = () => {
        setScannedCode(null);
        setValidationResult(null);
    };

    const handleError = (error: any) => {
        console.error('Camera error:', error);
        if (error?.name === 'NotAllowedError') {
            toast.error('Permissão de câmera negada pelo navegador.');
        } else if (error?.name === 'NotFoundError') {
            toast.error('Nenhuma câmera encontrada no dispositivo.');
        } else {
            toast.error('Erro ao acessar a câmera. Verifique se está usando HTTPS.');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 absolute top-0 w-full z-10 shadow-lg">
                <h2 className="text-white font-bold text-lg">Scanner de Recepção</h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 relative flex flex-col items-center justify-center pt-16 pb-[120px]">
                {!scannedCode ? (
                    <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl relative bg-black">
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            scanDelay={scanDelay}
                            components={{
                                finder: true,
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' },
                            }}
                        />
                        <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm bg-black/50 py-2">
                            Aponte a câmera para o QR Code do sócio
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-md p-6">
                        {isProcessing ? (
                            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center">
                                <Loader2 size={48} className="text-yellow-500 animate-spin mb-4" />
                                <p className="text-slate-300 font-medium">Validando Ingresso...</p>
                            </div>
                        ) : validationResult ? (
                            <div className={`rounded-3xl p-6 border-2 shadow-2xl transition-all scale-100 ${
                                validationResult.valid 
                                    ? 'bg-emerald-900/30 border-emerald-500/50 shadow-emerald-900/20' 
                                    : validationResult.alreadyUsed 
                                        ? 'bg-orange-900/30 border-orange-500/50 shadow-orange-900/20'
                                        : 'bg-red-900/30 border-red-500/50 shadow-red-900/20'
                            }`}>
                                <div className="flex flex-col items-center text-center">
                                    {validationResult.valid ? (
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle size={40} className="text-emerald-500" />
                                        </div>
                                    ) : (
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                                            validationResult.alreadyUsed ? 'bg-orange-500/20' : 'bg-red-500/20'
                                        }`}>
                                            <XCircle size={40} className={validationResult.alreadyUsed ? 'text-orange-500' : 'text-red-500'} />
                                        </div>
                                    )}

                                    <h3 className={`text-2xl font-bold mb-2 ${
                                        validationResult.valid ? 'text-emerald-400' : validationResult.alreadyUsed ? 'text-orange-400' : 'text-red-400'
                                    }`}>
                                        {validationResult.valid ? 'Acesso Liberado' : validationResult.alreadyUsed ? 'Já Utilizado' : 'Acesso Negado'}
                                    </h3>

                                    <p className="text-slate-300 mb-6">
                                        {validationResult.error && !validationResult.valid ? validationResult.error : 'O check-in foi registrado com sucesso.'}
                                    </p>

                                    {validationResult.rsvp && validationResult.rsvp.profile && (
                                        <div className="w-full bg-slate-950/50 rounded-2xl p-4 flex items-center gap-4 text-left border border-slate-800">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {validationResult.rsvp.profile.image_url ? (
                                                    <img src={validationResult.rsvp.profile.image_url} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={24} className="text-slate-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-white font-bold truncate">{(validationResult.rsvp.profile as any).name || 'Sem nome'}</p>
                                                <p className="text-slate-400 text-sm truncate">{(validationResult.rsvp.profile as any).company || ''}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={resetScanner}
                                        className="mt-6 w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition border border-slate-700 active:scale-95"
                                    >
                                        Ler Outro QR Code
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default EventScanner;
