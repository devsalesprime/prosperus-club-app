// ============================================
// ADMIN GLOBAL SEARCH — Command+K Spotlight Modal
// ============================================
// Searchable modal with debounce, grouped results, and keyboard navigation.
// Triggered by Cmd+K / Ctrl+K or the search button in the admin header.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, Calendar, DollarSign, ArrowRight, Loader2, Command } from 'lucide-react';
import { adminSearchService, AdminSearchResults } from '../../../services/adminSearchService';
import { AdminViewState } from '../../../types';

interface AdminGlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: AdminViewState) => void;
}

// ─── Debounce hook ───────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// ─── Component ───────────────────────────────────────────────

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
    isOpen,
    onClose,
    onNavigate,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdminSearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debouncedQuery = useDebounce(query, 300);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Search on debounced query change
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.trim().length < 3) {
            setResults(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        adminSearchService.search(debouncedQuery).then((res) => {
            if (!cancelled) {
                setResults(res);
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [debouncedQuery]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleNavigate = useCallback((view: AdminViewState) => {
        onNavigate(view);
        onClose();
    }, [onNavigate, onClose]);

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    if (!isOpen) return null;

    const hasResults = results && adminSearchService.hasResults(results);
    const showEmpty = results && !hasResults && debouncedQuery.length >= 3 && !loading;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
                    <Search size={20} className="text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar membros, eventos, negócios..."
                        className="flex-1 bg-transparent text-lg text-slate-200 placeholder-slate-500 outline-none"
                        autoComplete="off"
                    />
                    {loading && <Loader2 size={18} className="text-yellow-500 animate-spin shrink-0" />}
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {/* Hint */}
                    {!results && !loading && (
                        <div className="px-5 py-8 text-center text-slate-500 text-sm">
                            Digite ao menos 3 caracteres para buscar
                        </div>
                    )}

                    {/* Empty State */}
                    {showEmpty && (
                        <div className="px-5 py-8 text-center text-slate-500 text-sm">
                            Nenhum resultado para "{debouncedQuery}"
                        </div>
                    )}

                    {/* Members */}
                    {results && results.members.length > 0 && (
                        <div>
                            <div className="px-5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                                Membros
                            </div>
                            {results.members.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleNavigate(AdminViewState.MEMBERS)}
                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-800 transition text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                                        {m.image_url ? (
                                            <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{m.name}</p>
                                        <p className="text-xs text-slate-400 truncate">{m.company || m.email}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Events */}
                    {results && results.events.length > 0 && (
                        <div>
                            <div className="px-5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                                Eventos
                            </div>
                            {results.events.map((e) => (
                                <button
                                    key={e.id}
                                    onClick={() => handleNavigate(AdminViewState.EVENTS)}
                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-800 transition text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Calendar size={14} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{e.title}</p>
                                        <p className="text-xs text-slate-400">{formatDate(e.date)} • {e.category || e.type || 'Evento'}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Deals */}
                    {results && results.deals.length > 0 && (
                        <div>
                            <div className="px-5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                                Negócios
                            </div>
                            {results.deals.map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => handleNavigate(AdminViewState.ROI_AUDIT)}
                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-800 transition text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                                        <DollarSign size={14} className="text-yellow-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{d.description}</p>
                                        <p className="text-xs text-slate-400">
                                            {formatCurrency(d.amount)} • {d.seller_name || '?'} → {d.buyer_name || '?'}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                        d.status === 'AUDITADO' ? 'bg-yellow-500/10 text-yellow-400' :
                                        d.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' :
                                        d.status === 'CONTESTED' ? 'bg-red-500/10 text-red-400' :
                                        'bg-slate-500/10 text-slate-400'
                                    }`}>
                                        {d.status}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Busca Global Admin</span>
                    <div className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-mono">ESC</kbd>
                        <span>para fechar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGlobalSearch;
