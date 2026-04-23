// ============================================
// AnalyticsExclusions.tsx
// Manage users excluded from analytics counts
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    Settings,
    X,
    Search,
    UserX,
    Trash2,
    Plus,
    Loader2,
    ShieldOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExcludedUser {
    id: string;
    user_id: string;
    email: string;
    reason: string;
    created_at: string;
}

interface MemberOption {
    id: string;
    email: string;
    name: string;
    role: string;
}

export const AnalyticsExclusions: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [excluded, setExcluded] = useState<ExcludedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<MemberOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState<string | null>(null);

    // Load excluded users
    const loadExcluded = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_analytics_excluded_users');
            if (error) throw error;
            setExcluded(data || []);
        } catch (err: unknown) {
            console.error('Error fetching excluded IPS:', err);
            toast.error('Erro ao buscar exclusões: ' + ((err as Error)?.message || 'Desconhecido'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) loadExcluded();
    }, [isOpen, loadExcluded]);

    // Search members
    useEffect(() => {
        if (!searchTerm.trim() || searchTerm.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const term = `%${searchTerm.trim()}%`;
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, email, name, role')
                    .or(`email.ilike.${term},name.ilike.${term}`)
                    .limit(8);

                if (error) throw error;

                // Filter out already excluded
                const excludedIds = new Set(excluded.map(e => e.user_id));
                setSearchResults((data || []).filter(m => !excludedIds.has(m.id)));
            } catch (err: unknown) {
                console.error('Error saving IP:', err);
                toast.error('Erro ao salvar IP: ' + ((err as Error)?.message || 'Desconhecido'));
            } finally {
                setSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, excluded]);

    // Add exclusion
    const handleAdd = async (member: MemberOption) => {
        try {
            setAdding(member.id);
            const { error } = await supabase.rpc('add_analytics_exclusion', {
                p_user_id: member.id,
            });
            if (error) throw error;
            toast.success(`${member.name || member.email} excluído das métricas`);
            setSearchTerm('');
            setSearchResults([]);
            await loadExcluded();
        } catch (err: unknown) {
            toast.error('Erro ao excluir: ' + ((err as Error)?.message || ''));
        } finally {
            setAdding(null);
        }
    };

    // Remove exclusion
    const handleRemove = async (user: ExcludedUser) => {
        try {
            const { error } = await supabase.rpc('remove_analytics_exclusion', {
                p_user_id: user.user_id,
            });
            if (error) throw error;
            toast.success(`${user.email} voltou para as métricas`);
            await loadExcluded();
        } catch (err: unknown) {
            toast.error('Erro ao remover: ' + ((err as Error)?.message || ''));
        }
    };

    const roleBadge = (role: string) => {
        const config: Record<string, { bg: string; text: string }> = {
            ADMIN: { bg: 'bg-red-500/10', text: 'text-red-400' },
            TEAM: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
            MEMBER: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
        };
        const s = config[role] || config.MEMBER;
        return (
            <span className={`${s.bg} ${s.text} text-[10px] font-bold px-1.5 py-0.5 rounded uppercase`}>
                {role}
            </span>
        );
    };

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Excluir usuários das métricas"
            >
                <Settings size={18} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <ShieldOff size={20} className="text-yellow-500" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold">Excluir das Métricas</h2>
                                    <p className="text-xs text-slate-400">Usuários que não serão contados nos analytics</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-slate-800">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por nome ou email..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-yellow-600/50 transition"
                                    autoFocus
                                />
                                {searching && (
                                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 animate-spin" />
                                )}
                            </div>

                            {/* Search results */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                                    {searchResults.map(m => (
                                        <div
                                            key={m.id}
                                            className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/50 transition border-b border-slate-800 last:border-b-0"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div>
                                                    <p className="text-sm text-white truncate">{m.name || 'Sem nome'}</p>
                                                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                                </div>
                                                {roleBadge(m.role)}
                                            </div>
                                            <button
                                                onClick={() => handleAdd(m)}
                                                disabled={adding === m.id}
                                                className="shrink-0 p-1.5 bg-yellow-600/10 text-yellow-500 hover:bg-yellow-600/20 rounded-lg transition disabled:opacity-50"
                                                title="Excluir das métricas"
                                            >
                                                {adding === m.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Excluded list */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-yellow-500" />
                                </div>
                            ) : excluded.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <UserX size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhum usuário excluído ainda.</p>
                                    <p className="text-xs text-slate-600 mt-1">Busque e adicione acima.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 mb-3">
                                        {excluded.length} usuário{excluded.length !== 1 ? 's' : ''} excluído{excluded.length !== 1 ? 's' : ''}
                                    </p>
                                    {excluded.map(u => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-800 hover:border-slate-700 transition"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm text-white truncate">{u.email}</p>
                                                <p className="text-xs text-slate-500">
                                                    Excluído em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                                    {u.reason && ` · ${u.reason}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(u)}
                                                className="shrink-0 p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                title="Remover exclusão (voltar para métricas)"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                            <p className="text-[11px] text-slate-500 text-center">
                                Alterações afetam todos os gráficos e KPIs do dashboard.
                                <br />Os dados históricos desses usuários serão ignorados nas contagens.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AnalyticsExclusions;
