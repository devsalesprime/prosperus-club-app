// AdminNotifications.tsx
// Admin module for sending notifications with individual user targeting

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Users, Briefcase, Shield, Loader2, CheckCircle, AlertCircle, User, Search, X, Clock, CalendarDays, History, RefreshCw, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';
import { notificationService, NotificationSegment, getScheduledNotifications, cancelScheduledNotification, ScheduledNotification } from '../../services/notificationService';
import { supabase } from '../../lib/supabase';

interface MemberProfile {
    id: string;
    name: string;
    role: string;
    image_url?: string;
    company?: string;
}

export const AdminNotifications: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [segment, setSegment] = useState<NotificationSegment>('ALL');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Individual user targeting
    const [selectedUser, setSelectedUser] = useState<MemberProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MemberProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Scheduling
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [scheduledList, setScheduledList] = useState<ScheduledNotification[]>([]);
    const [loadingScheduled, setLoadingScheduled] = useState(false);

    // History state
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [histSegFilter, setHistSegFilter] = useState<'ALL' | 'MEMBERS' | 'TEAM' | 'ADMIN'>('ALL');
    const [histPage, setHistPage] = useState(1);
    const HIST_PAGE_SIZE = 5;

    // Debounced search
    const searchUsers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role, image_url, company')
                .or(`name.ilike.%${query}%,company.ilike.%${query}%`)
                .order('name')
                .limit(10);

            if (!error && data) {
                setSearchResults(data);
                setShowDropdown(true);
            }
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                searchUsers(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    const handleSelectUser = (user: MemberProfile) => {
        setSelectedUser(user);
        setSearchQuery('');
        setShowDropdown(false);
        setSearchResults([]);
    };

    const handleClearUser = () => {
        setSelectedUser(null);
        setSearchQuery('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            setResult({ type: 'error', message: 'Título e mensagem são obrigatórios' });
            return;
        }

        if (segment === 'INDIVIDUAL' && !selectedUser) {
            setResult({ type: 'error', message: 'Selecione um usuário para envio individual' });
            return;
        }

        try {
            setSending(true);
            setResult(null);

            const scheduledFor = isScheduled && scheduledDate && scheduledTime
                ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                : undefined;

            const count = await notificationService.createNotification(
                title.trim(),
                message.trim(),
                segment,
                actionUrl.trim() || undefined,
                segment === 'INDIVIDUAL' ? selectedUser?.id : undefined,
                scheduledFor
            );

            setResult({
                type: 'success',
                message: isScheduled
                    ? `Notificação agendada com sucesso para ${scheduledDate} às ${scheduledTime}!`
                    : segment === 'INDIVIDUAL'
                        ? `Notificação enviada com sucesso para ${selectedUser?.name}!`
                        : `Notificação enviada com sucesso para ${count} usuário(s)!`
            });

            // Clear form
            setTitle('');
            setMessage('');
            setActionUrl('');
            setSegment('ALL');
            setSelectedUser(null);
            setIsScheduled(false);
            setScheduledDate('');
            setScheduledTime('');
            if (isScheduled) loadScheduledNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            setResult({
                type: 'error',
                message: 'Erro ao enviar notificação. Tente novamente.'
            });
        } finally {
            setSending(false);
        }
    };

    // Load scheduled notifications
    const loadScheduledNotifications = useCallback(async () => {
        setLoadingScheduled(true);
        try {
            const data = await getScheduledNotifications();
            setScheduledList(data);
        } catch (err) {
            console.error('Error loading scheduled:', err);
        } finally {
            setLoadingScheduled(false);
        }
    }, []);

    useEffect(() => {
        loadScheduledNotifications();
    }, [loadScheduledNotifications]);

    // Load notification history
    const loadHistory = useCallback(async () => {
        try {
            setLoadingHistory(true);
            const result = await notificationService.getNotificationHistory(1, 50);
            setHistory(result.data);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    const handleCancelScheduled = async (id: string) => {
        try {
            await cancelScheduledNotification(id);
            setScheduledList(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error cancelling scheduled notification:', err);
        }
    };

    const segments = [
        { value: 'ALL' as const, label: 'Todos os Usuários', icon: Users, description: 'Sócios, Time e Admins' },
        { value: 'MEMBERS' as const, label: 'Apenas Sócios', icon: Users, description: 'Somente sócios regulares' },
        { value: 'TEAM' as const, label: 'Time e Admins', icon: Briefcase, description: 'Time comercial e administradores' },
        { value: 'ADMIN' as const, label: 'Apenas Admins', icon: Shield, description: 'Somente administradores' },
        { value: 'INDIVIDUAL' as const, label: 'Usuário Individual', icon: User, description: 'Enviar para um sócio específico' }
    ];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>;
            case 'TEAM': return <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">TIME</span>;
            default: return <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">SÓCIO</span>;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-yellow-600/20 rounded-lg">
                        <Bell className="text-yellow-500" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Enviar Notificação</h1>
                        <p className="text-slate-400 text-sm">
                            Envie notificações in-app para os usuários
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-white mb-2">
                        Título da Notificação *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Nova funcionalidade disponível!"
                        maxLength={100}
                        disabled={sending}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition disabled:opacity-50"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">{title.length}/100 caracteres</p>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-sm font-bold text-white mb-2">
                        Mensagem *
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite a mensagem da notificação..."
                        rows={4}
                        maxLength={500}
                        disabled={sending}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition resize-none disabled:opacity-50"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">{message.length}/500 caracteres</p>
                </div>

                {/* Action URL */}
                <div>
                    <label className="block text-sm font-bold text-white mb-2">
                        Link de Ação (Opcional)
                    </label>
                    <input
                        type="url"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="https://exemplo.com ou /dashboard"
                        disabled={sending}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition disabled:opacity-50"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        URL para redirecionar quando o usuário clicar na notificação
                    </p>
                </div>

                {/* Scheduling Toggle */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={isScheduled}
                                onChange={(e) => setIsScheduled(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${isScheduled ? 'bg-yellow-600' : 'bg-slate-700'
                                }`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${isScheduled ? 'translate-x-[22px]' : 'translate-x-0.5'
                                    }`} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-yellow-500" />
                            <span className="text-sm font-bold text-white">Agendar para depois</span>
                        </div>
                    </label>

                    {isScheduled && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    <CalendarDays size={12} className="inline mr-1" />
                                    Data
                                </label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    <Clock size={12} className="inline mr-1" />
                                    Horário
                                </label>
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                    required
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Segment Selection */}
                <div>
                    <label className="block text-sm font-bold text-white mb-3">
                        Público-Alvo *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {segments.map((seg) => {
                            const Icon = seg.icon;
                            return (
                                <button
                                    key={seg.value}
                                    type="button"
                                    onClick={() => {
                                        setSegment(seg.value);
                                        if (seg.value !== 'INDIVIDUAL') {
                                            setSelectedUser(null);
                                            setSearchQuery('');
                                        }
                                    }}
                                    disabled={sending}
                                    className={`p-4 rounded-lg border-2 transition text-left ${segment === seg.value
                                        ? seg.value === 'INDIVIDUAL'
                                            ? 'border-purple-500 bg-purple-600/10'
                                            : 'border-yellow-600 bg-yellow-600/10'
                                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                        } disabled:opacity-50`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon
                                            className={
                                                segment === seg.value
                                                    ? seg.value === 'INDIVIDUAL' ? 'text-purple-400' : 'text-yellow-500'
                                                    : 'text-slate-400'
                                            }
                                            size={20}
                                        />
                                        <div className="flex-1">
                                            <h4
                                                className={`font-bold text-sm mb-1 ${segment === seg.value ? 'text-white' : 'text-slate-300'
                                                    }`}
                                            >
                                                {seg.label}
                                            </h4>
                                            <p className="text-xs text-slate-500">{seg.description}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Individual User Picker */}
                {segment === 'INDIVIDUAL' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-white mb-2">
                            Selecionar Usuário *
                        </label>

                        {selectedUser ? (
                            <div className="flex items-center gap-3 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                                <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center overflow-hidden shrink-0">
                                    {selectedUser.image_url ? (
                                        <img src={selectedUser.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-purple-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-white text-sm truncate">{selectedUser.name}</p>
                                        {getRoleBadge(selectedUser.role)}
                                    </div>
                                    {selectedUser.company && (
                                        <p className="text-xs text-slate-400 truncate">{selectedUser.company}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearUser}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition shrink-0"
                                    title="Remover seleção"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                        placeholder="Busque por nome ou empresa..."
                                        disabled={sending}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
                                    />
                                    {isSearching && (
                                        <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 animate-spin" />
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {showDropdown && searchResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition text-left border-b border-slate-700/50 last:border-b-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                                                    {user.image_url ? (
                                                        <img src={user.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={16} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white text-sm truncate">{user.name}</p>
                                                        {getRoleBadge(user.role)}
                                                    </div>
                                                    {user.company && (
                                                        <p className="text-xs text-slate-500 truncate">{user.company}</p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Empty State */}
                                {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 text-center">
                                        <p className="text-sm text-slate-400">Nenhum usuário encontrado para "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mt-2">
                            Digite no mínimo 2 caracteres para buscar. A busca inclui nome e empresa.
                        </p>
                    </div>
                )}

                {/* Result Message */}
                {result && (
                    <div
                        className={`p-4 rounded-lg border flex items-start gap-3 ${result.type === 'success'
                            ? 'bg-green-900/20 border-green-600/30'
                            : 'bg-red-900/20 border-red-600/30'
                            }`}
                    >
                        {result.type === 'success' ? (
                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                        ) : (
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                        )}
                        <p
                            className={`text-sm ${result.type === 'success' ? 'text-green-400' : 'text-red-400'
                                }`}
                        >
                            {result.message}
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={sending || !title.trim() || !message.trim() || (segment === 'INDIVIDUAL' && !selectedUser)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                {segment === 'INDIVIDUAL' && selectedUser
                                    ? `Enviar para ${selectedUser.name.split(' ')[0]}`
                                    : isScheduled
                                        ? 'Agendar Notificação'
                                        : 'Enviar Notificação'
                                }
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h4 className="font-bold text-white text-sm mb-2">ℹ️ Informações</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                    <li>• As notificações aparecerão no sino (🔔) do menu superior</li>
                    <li>• Usuários receberão um badge vermelho indicando novas notificações</li>
                    <li>• Notificações são marcadas como lidas automaticamente ao clicar</li>
                    <li>• Use "Usuário Individual" para enviar mensagens personalizadas</li>
                    <li>• Use "Agendar para depois" para envio futuro programado</li>
                </ul>
            </div>

            {/* Scheduled Notifications List */}
            {scheduledList.length > 0 && (
                <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                        <Clock className="text-yellow-500" size={18} />
                        <h4 className="font-bold text-white text-sm">Notificações Agendadas ({scheduledList.length})</h4>
                    </div>
                    <div className="divide-y divide-slate-700">
                        {scheduledList.map(notif => (
                            <div key={notif.id} className="p-4 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                                    <p className="text-xs text-slate-400 truncate">{notif.message}</p>
                                    <p className="text-xs text-yellow-500 mt-1">
                                        📅 {new Date(notif.scheduled_for).toLocaleString('pt-BR')}
                                        <span className="text-slate-500 ml-2">• {notif.segment}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCancelScheduled(notif.id)}
                                    className="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-1 border border-red-500/30 rounded hover:bg-red-500/10 transition shrink-0"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Notification History ─── */}
            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="text-yellow-500" size={18} />
                        <h4 className="font-bold text-white text-sm">Histórico de Envios</h4>
                    </div>
                    <button
                        onClick={loadHistory}
                        disabled={loadingHistory}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                    >
                        <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Segment filter chips */}
                <div className="flex gap-1.5 p-4 pb-0 flex-wrap">
                    {(['ALL', 'MEMBERS', 'TEAM', 'ADMIN'] as const).map(seg => (
                        <button
                            key={seg}
                            onClick={() => { setHistSegFilter(seg); setHistPage(1); }}
                            className={`px-3 py-1 text-xs font-medium rounded-lg border transition ${histSegFilter === seg
                                ? 'bg-yellow-600 text-white border-yellow-600'
                                : 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-500'
                            }`}
                        >
                            {seg === 'ALL' ? 'Todos' : seg === 'MEMBERS' ? 'Sócios' : seg === 'TEAM' ? 'Time' : 'Admins'}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 size={20} className="animate-spin text-yellow-500" />
                        </div>
                    ) : (() => {
                        const filteredHistory = histSegFilter === 'ALL'
                            ? history
                            : history.filter(h => h.segment === histSegFilter);
                        const histTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HIST_PAGE_SIZE));
                        const paginatedHistory = filteredHistory.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE);

                        return filteredHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">
                                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{histSegFilter !== 'ALL' ? 'Nenhum envio para esse segmento.' : 'Nenhum envio registrado'}</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {paginatedHistory.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="p-3 bg-slate-900/60 rounded-lg hover:bg-slate-800 transition border border-slate-700/50"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="font-medium text-sm text-white truncate">{item.title}</h4>
                                                <span className="text-xs text-slate-500 shrink-0">
                                                    {new Date(item.sent_at || item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate mb-1">{item.message}</p>
                                            <span className="inline-block text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                                                {item.segment === 'ALL' ? 'Todos' : item.segment === 'MEMBERS' ? 'Sócios' : item.segment === 'TEAM' ? 'Time' : item.segment === 'ADMIN' ? 'Admins' : item.segment}
                                            </span>
                                            {item.target_url && /\.(pdf|jpg|jpeg|png|webp|gif)$/i.test(item.target_url) && (
                                                <span className="inline-block text-[10px] px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded-full ml-1">
                                                    <Paperclip size={10} className="inline mr-0.5" />
                                                    {item.target_url.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Imagem'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {histTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-1 mt-4">
                                        <button
                                            onClick={() => setHistPage(p => Math.max(1, p - 1))}
                                            disabled={histPage === 1}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="text-xs text-slate-400 px-2">{histPage} / {histTotalPages}</span>
                                        <button
                                            onClick={() => setHistPage(p => Math.min(histTotalPages, p + 1))}
                                            disabled={histPage === histTotalPages}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

