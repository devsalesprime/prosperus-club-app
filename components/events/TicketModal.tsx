import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, ChevronLeft, ChevronRight, UserPlus, Loader2, Trash2, Users2, CalendarDays, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ClubEvent, EventTicket } from '../../types';
import { getTicketsForRsvp, addGuestToRsvp, removeGuestFromRsvp, generateTicketsForRsvp } from '../../services/ticketService';
import { toPng } from 'html-to-image';
import { useDrag } from '@use-gesture/react';
import toast from 'react-hot-toast';

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    rsvpId: string;
    eventId: string;
    event: ClubEvent;
    memberName: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
    isOpen,
    onClose,
    rsvpId,
    eventId,
    event,
    memberName,
}) => {
    const [tickets, setTickets] = useState<EventTicket[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    // Guest form state
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestRole, setGuestRole] = useState('Social Media');
    const [guestLoading, setGuestLoading] = useState(false);

    // Ref for image capture
    const ticketRef = useRef<HTMLDivElement>(null);

    // Fetch tickets
    const fetchTickets = useCallback(async () => {
        try {
            // Ensure tickets exist for all event days (idempotent — safe to call every time)
            await generateTicketsForRsvp(rsvpId, eventId, memberName);
            // Then fetch all tickets
            const data = await getTicketsForRsvp(rsvpId);
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    }, [rsvpId, eventId, memberName]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchTickets();
        }
    }, [isOpen, fetchTickets]);

    const hasGuest = tickets.some(t => t.owner_type === 'GUEST');
    const activeTicket = tickets[activeIndex];

    const handlePrev = () => setActiveIndex(i => Math.max(0, i - 1));
    const handleNext = () => setActiveIndex(i => Math.min(tickets.length - 1, i + 1));

    // ── Swipe gesture ──
    const [dragX, setDragX] = useState(0);
    const bindSwipe = useDrag(({ movement: [mx], last, cancel }) => {
        if (tickets.length <= 1) return;
        if (!last) {
            setDragX(mx);
            return;
        }
        // Swipe threshold: 50px
        if (mx < -50 && activeIndex < tickets.length - 1) {
            setActiveIndex(i => i + 1);
        } else if (mx > 50 && activeIndex > 0) {
            setActiveIndex(i => i - 1);
        }
        setDragX(0);
    }, { axis: 'x', filterTaps: true });

    // ── Download ticket as image ──
    const handleDownloadTicket = async () => {
        if (!ticketRef.current || !activeTicket) return;
        setDownloading(true);
        const loadingToast = toast.loading('Gerando ingresso...');

        try {
            const dataUrl = await toPng(ticketRef.current, {
                cacheBust: true,
                pixelRatio: 3, // High quality for retina
                backgroundColor: '#0f172a',
            });

            const link = document.createElement('a');
            const eventSlug = event.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const ownerLabel = activeTicket.owner_type === 'GUEST' ? 'convidado' : 'membro';
            link.download = `ingresso-prosperus-${eventSlug}-${ownerLabel}.png`;
            link.href = dataUrl;
            link.click();

            toast.dismiss(loadingToast);
            toast.success('Ingresso salvo com sucesso! ✅');
        } catch (err) {
            console.error('Error generating ticket image:', err);
            toast.dismiss(loadingToast);
            toast.error('Erro ao gerar imagem do ingresso.');
        } finally {
            setDownloading(false);
        }
    };

    // Add guest
    const handleAddGuest = async () => {
        if (!guestName.trim()) return;
        setGuestLoading(true);
        try {
            await addGuestToRsvp(rsvpId, eventId, guestName.trim(), guestRole);
            toast.success(`Ingresso de ${guestName.trim()} (${guestRole}) criado!`);
            setGuestName('');
            setGuestRole('Social Media');
            setShowGuestForm(false);
            await fetchTickets();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao adicionar convidado.');
        } finally {
            setGuestLoading(false);
        }
    };

    // Remove guest
    const handleRemoveGuest = async () => {
        setGuestLoading(true);
        try {
            await removeGuestFromRsvp(rsvpId);
            toast.success('Convidado removido.');
            setActiveIndex(0);
            await fetchTickets();
        } catch {
            toast.error('Erro ao remover convidado.');
        } finally {
            setGuestLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm flex flex-col items-center max-h-[95vh] overflow-y-auto">

                {/* ── CLOSE BUTTON ── */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 right-0 z-20 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition shadow-lg"
                >
                    <X size={18} className="text-white" />
                </button>

                {loading ? (
                    <div className="bg-slate-900 rounded-3xl p-12 flex flex-col items-center border border-slate-800">
                        <Loader2 size={32} className="text-yellow-500 animate-spin mb-4" />
                        <p className="text-slate-400 text-sm">Carregando ingressos...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-slate-900 rounded-3xl p-12 flex flex-col items-center border border-slate-800">
                        <QrCode size={32} className="text-slate-600 mb-4" />
                        <p className="text-slate-400 text-sm">Nenhum ingresso encontrado.</p>
                    </div>
                ) : (
                    <>
                        {/* ── NAVIGATION TABS ── */}
                        {tickets.length > 1 && (
                            <div className="flex items-center gap-2 mb-4 w-full overflow-x-auto pb-1">
                                {tickets.map((ticket, idx) => {
                                    const isGuest = ticket.owner_type === 'GUEST';
                                    const dateLabel = ticket.event_date
                                        ? new Date(ticket.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                                        : '';
                                    return (
                                        <button
                                            key={ticket.id}
                                            onClick={() => setActiveIndex(idx)}
                                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                activeIndex === idx
                                                    ? isGuest
                                                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 shadow'
                                                        : 'bg-yellow-600/20 border-yellow-500/40 text-yellow-300 shadow'
                                                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            {isGuest ? '👤 Convidado' : `📅 ${dateLabel}`}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── TICKET CARD (ref for image capture) ── */}
                        {activeTicket && (
                            <div
                                {...bindSwipe()}
                                ref={ticketRef}
                                style={{
                                    transform: `translateX(${dragX}px)`,
                                    transition: dragX === 0 ? 'transform 0.3s ease' : 'none',
                                    touchAction: 'pan-y',
                                }}
                                className="relative w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-yellow-600/30 flex flex-col cursor-grab active:cursor-grabbing select-none"
                            >
                                <div className={`h-28 relative flex items-center justify-center p-6 text-center ${
                                    activeTicket.owner_type === 'GUEST'
                                        ? 'bg-gradient-to-br from-purple-600 to-purple-800'
                                        : 'bg-gradient-to-br from-yellow-600 to-yellow-800'
                                }`}>
                                    <div>
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            {activeTicket.owner_type === 'GUEST' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                                                    <Users2 size={10} /> Convidado
                                                </span>
                                            ) : (
                                                <span className="text-slate-100 text-[10px] font-bold uppercase tracking-widest opacity-80">
                                                    Ingresso Exclusivo
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-white text-lg font-bold line-clamp-2 leading-tight">{event.title}</h1>
                                        {activeTicket.event_date && (
                                            <p className="text-white/70 text-xs mt-1 flex items-center justify-center gap-1">
                                                <CalendarDays size={11} />
                                                {new Date(activeTicket.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Body */}
                                <div className="p-6 flex flex-col items-center bg-slate-900 relative">
                                    {/* Cutout circles for ticket effect */}
                                    <div className="absolute top-0 left-0 w-6 h-6 bg-black rounded-full -translate-x-3 -translate-y-3"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 bg-black rounded-full translate-x-3 -translate-y-3"></div>
                                    
                                    {/* Dotted line */}
                                    <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-slate-700/50"></div>

                                    <div className="mb-5 mt-1 text-center w-full">
                                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                                            {activeTicket.owner_type === 'GUEST' ? 'Convidado(a)' : 'Membro Confirmado'}
                                        </p>
                                        <p className="text-white font-bold text-lg">{activeTicket.owner_name || memberName}</p>
                                    </div>

                                    {/* QR Code Wrapper */}
                                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-5 relative">
                                        <div className={`absolute -top-3 -right-3 p-1.5 rounded-full shadow border-2 border-slate-900 ${
                                            activeTicket.owner_type === 'GUEST' ? 'bg-purple-500 text-purple-900' : 'bg-yellow-500 text-yellow-900'
                                        }`}>
                                            <QrCode size={16} />
                                        </div>
                                        <QRCodeSVG
                                            value={activeTicket.ticket_code}
                                            size={170}
                                            bgColor={"#ffffff"}
                                            fgColor={"#0f172a"}
                                            level={"Q"}
                                            includeMargin={false}
                                        />
                                    </div>

                                    <div className="w-full text-center">
                                        <p className={`font-bold tracking-widest text-sm mb-2 ${
                                            activeTicket.owner_type === 'GUEST' ? 'text-purple-400' : 'text-yellow-500'
                                        }`}>
                                            {activeTicket.ticket_code.split('-')[0].toUpperCase()}
                                        </p>
                                    </div>

                                    {/* ── DOWNLOAD BUTTON ── */}
                                    <button
                                        onClick={handleDownloadTicket}
                                        disabled={downloading}
                                        className="w-full mt-2 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold text-sm transition shadow-lg shadow-yellow-900/30 active:scale-[0.97] disabled:opacity-50"
                                    >
                                        {downloading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Download size={18} />
                                        )}
                                        {downloading ? 'Gerando...' : '📥 Salvar Ingresso (Imagem)'}
                                    </button>
                                    <p className="text-slate-500 text-[10px] mt-2 text-center leading-relaxed max-w-[260px]">
                                        Recomendado: Salve a imagem para acesso rápido caso falte internet no local.
                                    </p>

                                    {/* Remove guest button */}
                                    {activeTicket.owner_type === 'GUEST' && (
                                        <button
                                            onClick={handleRemoveGuest}
                                            disabled={guestLoading}
                                            className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition underline"
                                        >
                                            <Trash2 size={12} />
                                            Remover convidado
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── CAROUSEL NAV ARROWS ── */}
                        {tickets.length > 1 && (
                            <div className="flex items-center justify-between w-full mt-4 px-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={activeIndex === 0}
                                    className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex gap-1.5">
                                    {tickets.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                activeIndex === idx ? 'bg-yellow-500 scale-125' : 'bg-slate-600'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleNext}
                                    disabled={activeIndex === tickets.length - 1}
                                    className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* ── ADD GUEST SECTION ── */}
                        {!hasGuest && !showGuestForm && (
                            <button
                                onClick={() => setShowGuestForm(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/80 border border-dashed border-slate-600 text-slate-400 hover:text-purple-300 hover:border-purple-500/40 text-sm font-medium transition"
                            >
                                <UserPlus size={16} />
                                Adicionar Convidado (Social Media/Staff)
                            </button>
                        )}

                        {showGuestForm && (
                            <div className="mt-4 w-full bg-slate-900 rounded-xl border border-purple-500/30 p-4 flex flex-col gap-3">
                                <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">Novo Convidado</p>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    placeholder="Nome completo do convidado..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/50 transition"
                                    autoFocus
                                />
                                <select
                                    value={guestRole}
                                    onChange={e => setGuestRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition appearance-none"
                                >
                                    <option value="Social Media">📱 Social Media</option>
                                    <option value="Staff">👔 Staff</option>
                                    <option value="Assessor(a)">📋 Assessor(a)</option>
                                    <option value="Fotógrafo(a)">📸 Fotógrafo(a)</option>
                                    <option value="Outro">👤 Outro</option>
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddGuest}
                                        disabled={!guestName.trim() || guestLoading}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition disabled:opacity-40 active:scale-95"
                                    >
                                        {guestLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                        Gerar Ingresso
                                    </button>
                                    <button
                                        onClick={() => { setShowGuestForm(false); setGuestName(''); setGuestRole('Social Media'); }}
                                        className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-sm transition"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default TicketModal;
