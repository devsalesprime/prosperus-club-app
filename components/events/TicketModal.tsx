import React from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ClubEvent } from '../../types';

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketCode: string;
    event: ClubEvent;
    memberName: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
    isOpen,
    onClose,
    ticketCode,
    event,
    memberName,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-yellow-600/30 flex flex-col">
                
                {/* Header Pattern */}
                <div className="h-32 bg-gradient-to-br from-yellow-600 to-yellow-800 relative flex items-center justify-center p-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex flex-col items-center justify-center transition"
                    >
                        <X size={18} className="text-white" />
                    </button>
                    <div>
                        <h2 className="text-slate-100 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Ingresso Exclusivo</h2>
                        <h1 className="text-white text-xl font-bold line-clamp-2 leading-tight">{event.title}</h1>
                    </div>
                </div>

                {/* Ticket Body */}
                <div className="p-8 flex flex-col items-center bg-slate-900 relative">
                    {/* Cutout circles for ticket effect */}
                    <div className="absolute top-0 left-0 w-6 h-6 bg-black rounded-full -translate-x-3 -translate-y-3"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 bg-black rounded-full translate-x-3 -translate-y-3"></div>
                    
                    {/* Dotted line */}
                    <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-slate-700/50"></div>

                    <div className="mb-6 mt-2 text-center w-full">
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Membro Confirmado</p>
                        <p className="text-white font-bold text-lg">{memberName}</p>
                    </div>

                    {/* QR Code Wrapper */}
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-6 relative">
                        <div className="absolute -top-3 -right-3 bg-yellow-500 text-yellow-900 p-1.5 rounded-full shadow border-2 border-slate-900">
                            <QrCode size={16} />
                        </div>
                        <QRCodeSVG
                            value={ticketCode}
                            size={180}
                            bgColor={"#ffffff"}
                            fgColor={"#0f172a"}
                            level={"Q"}
                            includeMargin={false}
                        />
                    </div>

                    <div className="w-full text-center">
                        <p className="text-yellow-500 font-bold tracking-widest text-sm mb-2">{ticketCode.split('-')[0].toUpperCase()}</p>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-[250px] mx-auto">
                            Tire um print (screenshot) desta tela para facilitar a entrada, caso falte internet no local.
                        </p>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default TicketModal;
