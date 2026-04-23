import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { X, CheckCircle, XCircle, Loader2, User, CalendarDays, Users2, ShieldCheck, ShieldX, Briefcase } from 'lucide-react';
import { validateTicketV2, confirmCheckInV2, TicketValidationResultV2 } from '../../../services/ticketService';
import toast from 'react-hot-toast';

interface EventScannerProps {
    isOpen: boolean;
    onClose: () => void;
}

type ScannerState = 'SCANNING' | 'VALIDATING' | 'AWAITING_APPROVAL' | 'APPROVED' | 'DENIED';

export const EventScanner: React.FC<EventScannerProps> = ({ isOpen, onClose }) => {
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [validationResult, setValidationResult] = useState<TicketValidationResultV2 | null>(null);
    const [scannerState, setScannerState] = useState<ScannerState>('SCANNING');
    const [isApproving, setIsApproving] = useState(false);
    const [scanDelay] = useState(2000);

    // Step 1: Scan and VALIDATE ONLY (do NOT auto-confirm)
    const handleScan = useCallback(async (detectedCodes: IDetectedBarcode[]) => {
        if (!detectedCodes || detectedCodes.length === 0 || scannerState !== 'SCANNING') return;
        
        const code = detectedCodes[0].rawValue;
        if (!code) return;

        setScannerState('VALIDATING');
        setScannedCode(code);

        try {
            const result = await validateTicketV2(code);
            setValidationResult(result);

            if (result.valid) {
                // Show data and WAIT for admin approval
                setScannerState('AWAITING_APPROVAL');
            } else if (result.alreadyUsed) {
                setScannerState('DENIED');
                toast.error('Este ingresso já foi lido antes!');
            } else {
                setScannerState('DENIED');
                toast.error(result.error || 'Ingresso Inválido');
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Erro ao validar o ticket.');
            setScannerState('DENIED');
        }
    }, [scannerState]);

    // Step 2: Admin clicks APPROVE → confirm check-in
    const handleApprove = async () => {
        if (!scannedCode) return;
        setIsApproving(true);
        try {
            const confirmed = await confirmCheckInV2(scannedCode);
            if (confirmed) {
                setScannerState('APPROVED');
                toast.success('Check-in aprovado com sucesso! ✅');
            } else {
                toast.error('Erro ao registrar check-in no banco.');
            }
        } catch (error) {
            toast.error('Erro ao confirmar check-in.');
        } finally {
            setIsApproving(false);
        }
    };

    // Admin clicks DENY → reject entry
    const handleDeny = () => {
        setScannerState('DENIED');
        toast('Entrada negada pelo administrador.', { icon: '🚫' });
    };

    const resetScanner = () => {
        setScannedCode(null);
        setValidationResult(null);
        setScannerState('SCANNING');
    };

    const handleError = (error: unknown) => {
        console.error('Camera error:', error);
        const err = error as { name?: string };
        if (err?.name === 'NotAllowedError') {
            toast.error('Permissão de câmera negada pelo navegador.');
        } else if (err?.name === 'NotFoundError') {
            toast.error('Nenhuma câmera encontrada no dispositivo.');
        } else {
            toast.error('Erro ao acessar a câmera. Verifique se está usando HTTPS.');
        }
    };

    // Extract profile from the V2 nested structure
    const getProfile = () => {
        const rsvp = validationResult?.ticket?.rsvp as { profile?: { image_url?: string; name?: string; company?: string; job_title?: string; } } | undefined;
        return rsvp?.profile || null;
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 pb-4 border-b border-slate-800 bg-slate-900 absolute top-0 w-full z-10 shadow-lg"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
            >
                <h2 className="text-white font-bold text-lg">Scanner de Recepção</h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Scanner Area */}
            <div
                className="flex-1 relative flex flex-col items-center justify-center px-4"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            >
                
                {/* STATE: SCANNING — Camera active */}
                {scannerState === 'SCANNING' && (
                    <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl relative bg-black">
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            scanDelay={scanDelay}
                            components={{ finder: true }}
                            styles={{ container: { width: '100%', height: '100%' } }}
                        />
                        <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm bg-black/50 py-2">
                            Aponte a câmera para o QR Code
                        </div>
                    </div>
                )}

                {/* STATE: VALIDATING — Loading */}
                {scannerState === 'VALIDATING' && (
                    <div className="w-full max-w-md p-6">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center">
                            <Loader2 size={48} className="text-yellow-500 animate-spin mb-4" />
                            <p className="text-slate-300 font-medium">Validando Ingresso...</p>
                        </div>
                    </div>
                )}

                {/* STATE: AWAITING_APPROVAL — Show data, admin decides */}
                {scannerState === 'AWAITING_APPROVAL' && validationResult?.ticket && (
                    <div className="w-full max-w-md p-4">
                        <div className="rounded-3xl border-2 border-yellow-500/50 bg-yellow-900/10 shadow-2xl shadow-yellow-900/10 overflow-hidden">
                            
                            {/* Approval Header */}
                            <div className="bg-yellow-600/20 px-6 py-4 border-b border-yellow-500/20 text-center">
                                <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest mb-1">Verificação de Entrada</p>
                                <p className="text-white text-lg font-bold">Confirmar Check-in?</p>
                            </div>

                            {/* Person Data Card */}
                            <div className="p-6 flex flex-col gap-4">
                                
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-slate-700">
                                        {getProfile()?.image_url ? (
                                            <img src={getProfile().image_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={28} className="text-slate-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-white font-bold text-xl truncate">
                                            {validationResult.ticket.owner_name || getProfile()?.name || 'Sem nome'}
                                        </p>
                                        {getProfile()?.company && (
                                            <p className="text-slate-400 text-sm truncate">{getProfile().company}</p>
                                        )}
                                        {getProfile()?.job_title && (
                                            <p className="text-slate-500 text-xs truncate">{getProfile().job_title}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Type Badge */}
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                        validationResult.ticket.owner_type === 'GUEST'
                                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                                    }`}>
                                        <Users2 size={13} />
                                        {validationResult.ticket.owner_type === 'GUEST' ? 'Convidado' : 'Sócio'}
                                    </span>

                                    {/* Guest Role Badge */}
                                    {validationResult.ticket.owner_type === 'GUEST' && validationResult.ticket.owner_role && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full text-xs font-bold">
                                            <Briefcase size={13} />
                                            {validationResult.ticket.owner_role}
                                        </span>
                                    )}

                                    {/* Date Badge */}
                                    {validationResult.ticket.event_date && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold">
                                            <CalendarDays size={13} />
                                            {new Date(validationResult.ticket.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    )}
                                </div>

                                {/* ── ACTION BUTTONS ── */}
                                <div className="flex gap-3 mt-2">
                                    <button
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition shadow-lg shadow-emerald-900/30 active:scale-[0.97] disabled:opacity-50"
                                    >
                                        {isApproving ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <ShieldCheck size={20} />
                                        )}
                                        {isApproving ? 'Aprovando...' : 'Aprovar'}
                                    </button>
                                    <button
                                        onClick={handleDeny}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-base transition border border-red-500/30 active:scale-[0.97]"
                                    >
                                        <ShieldX size={20} />
                                        Negar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Scan another */}
                        <button
                            onClick={resetScanner}
                            className="mt-4 w-full py-3 rounded-xl bg-slate-800/50 text-slate-400 text-sm font-medium border border-slate-700 hover:bg-slate-800 transition"
                        >
                            ← Voltar ao Scanner
                        </button>
                    </div>
                )}

                {/* STATE: APPROVED — Success confirmation */}
                {scannerState === 'APPROVED' && (
                    <div className="w-full max-w-md p-6">
                        <div className="rounded-3xl p-8 border-2 bg-emerald-900/30 border-emerald-500/50 shadow-2xl shadow-emerald-900/20">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={40} className="text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Acesso Liberado ✅</h3>
                                <p className="text-slate-300 mb-2">Check-in registrado com sucesso.</p>
                                
                                {validationResult?.ticket && (
                                    <div className="w-full bg-slate-950/50 rounded-2xl p-4 mt-2 text-left border border-slate-800">
                                        <p className="text-white font-bold truncate text-lg">
                                            {validationResult.ticket.owner_name || getProfile()?.name}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                validationResult.ticket.owner_type === 'GUEST'
                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {validationResult.ticket.owner_type === 'GUEST' ? '👤 Convidado' : '🏅 Sócio'}
                                            </span>
                                            {validationResult.ticket.owner_role && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold">
                                                    {validationResult.ticket.owner_role}
                                                </span>
                                            )}
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
                    </div>
                )}

                {/* STATE: DENIED — Rejected/Invalid */}
                {scannerState === 'DENIED' && (
                    <div className="w-full max-w-md p-6">
                        <div className={`rounded-3xl p-8 border-2 shadow-2xl ${
                            validationResult?.alreadyUsed
                                ? 'bg-orange-900/30 border-orange-500/50 shadow-orange-900/20'
                                : 'bg-red-900/30 border-red-500/50 shadow-red-900/20'
                        }`}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                                    validationResult?.alreadyUsed ? 'bg-orange-500/20' : 'bg-red-500/20'
                                }`}>
                                    <XCircle size={40} className={validationResult?.alreadyUsed ? 'text-orange-500' : 'text-red-500'} />
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${
                                    validationResult?.alreadyUsed ? 'text-orange-400' : 'text-red-400'
                                }`}>
                                    {validationResult?.alreadyUsed ? 'Já Utilizado' : 'Acesso Negado'}
                                </h3>
                                <p className="text-slate-300 mb-4">
                                    {validationResult?.error || 'Entrada negada pelo administrador.'}
                                </p>

                                {/* Show person info even on denial */}
                                {validationResult?.ticket && (
                                    <div className="w-full bg-slate-950/50 rounded-2xl p-3 text-left border border-slate-800 mb-4">
                                        <p className="text-white font-bold truncate">
                                            {validationResult.ticket.owner_name || getProfile()?.name || 'Sem nome'}
                                        </p>
                                        <div className="flex gap-2 mt-1.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                validationResult.ticket.owner_type === 'GUEST'
                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {validationResult.ticket.owner_type === 'GUEST' ? '👤 Convidado' : '🏅 Sócio'}
                                            </span>
                                            {validationResult.ticket.owner_role && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                                                    {validationResult.ticket.owner_role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={resetScanner}
                                    className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition border border-slate-700 active:scale-95"
                                >
                                    Ler Outro QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default EventScanner;
