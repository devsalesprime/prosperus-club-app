// AdminNotifications.tsx
// Painel de administração para envio de notificações em massa
// Inclui: Formulário, Preview, Histórico

import React, { useState, useEffect } from 'react';
import {
    Bell,
    Send,
    Users,
    UserCheck,
    Shield,
    ExternalLink,
    Loader2,
    CheckCircle,
    AlertCircle,
    History,
    RefreshCw
} from 'lucide-react';
import { notificationService, NotificationSegment } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminNotificationsProps {
    userRole: 'ADMIN' | 'TEAM' | 'MEMBER';
}

interface NotificationHistory {
    id: string;
    title: string;
    message: string;
    segment: string;
    sent_at: string;
    target_url?: string;
}

const SEGMENT_OPTIONS: { value: NotificationSegment; label: string; icon: React.ReactNode; description: string }[] = [
    {
        value: 'ALL',
        label: 'Todos os Usuários',
        icon: <Users size={18} />,
        description: 'Sócios, Time e Admins'
    },
    {
        value: 'MEMBERS',
        label: 'Apenas Sócios',
        icon: <UserCheck size={18} />,
        description: 'Somente membros do clube'
    },
    {
        value: 'TEAM',
        label: 'Time Interno',
        icon: <Shield size={18} />,
        description: 'Time e Administradores'
    },
    {
        value: 'ADMIN',
        label: 'Apenas Admins',
        icon: <Shield size={18} />,
        description: 'Somente administradores'
    }
];

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ userRole }) => {
    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [segment, setSegment] = useState<NotificationSegment>('ALL');

    // UI state
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<{ count: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // History state
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Security check
    if (userRole !== 'ADMIN' && userRole !== 'TEAM') {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
                <p className="text-slate-400">Você não tem permissão para acessar esta seção.</p>
            </div>
        );
    }

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const result = await notificationService.getNotificationHistory(1, 5);
            setHistory(result.data);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title.trim()) {
            setError('Título é obrigatório');
            return;
        }
        if (!message.trim()) {
            setError('Mensagem é obrigatória');
            return;
        }

        try {
            setSending(true);
            setError(null);
            setSuccess(null);

            const result = await notificationService.sendNotificationWithLog(
                title.trim(),
                message.trim(),
                segment,
                actionUrl.trim() || undefined
            );

            if (result.success) {
                setSuccess({ count: result.count });
                // Clear form
                setTitle('');
                setMessage('');
                setActionUrl('');
                setSegment('ALL');
                // Reload history
                loadHistory();
            } else {
                setError(result.error || 'Erro ao enviar notificação');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ptBR
            });
        } catch {
            return '';
        }
    };

    const getSegmentLabel = (seg: string) => {
        const option = SEGMENT_OPTIONS.find(o => o.value === seg);
        return option?.label || seg;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-xl">
                    <Bell className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Central de Notificações</h1>
                    <p className="text-slate-400">Envie comunicados para os membros do clube</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Form Column */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Send size={18} className="text-yellow-500" />
                        Nova Notificação
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                                Título <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                                placeholder="Ex: Novo conteúdo disponível!"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white 
                                         placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition"
                                maxLength={50}
                            />
                            <p className="text-xs text-slate-500 mt-1 text-right">{title.length}/50</p>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                                Mensagem <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                                placeholder="Descreva o que você quer comunicar..."
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white 
                                         placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition resize-none"
                                maxLength={250}
                            />
                            <p className="text-xs text-slate-500 mt-1 text-right">{message.length}/250</p>
                        </div>

                        {/* Action URL */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                                Link de Ação <span className="text-slate-600">(opcional)</span>
                            </label>
                            <div className="relative">
                                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="url"
                                    value={actionUrl}
                                    onChange={(e) => setActionUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white 
                                             placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>

                        {/* Segment */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                                Enviar para
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {SEGMENT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setSegment(option.value)}
                                        className={`p-3 rounded-lg border transition flex items-center gap-2 text-left ${segment === option.value
                                            ? 'bg-yellow-600/20 border-yellow-600 text-yellow-500'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {option.icon}
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{option.label}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-900/50 rounded-lg text-green-400 text-sm">
                                <CheckCircle size={16} />
                                Notificação enviada para {success.count} usuário(s)!
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={sending || !title.trim() || !message.trim()}
                            className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                     rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Enviar Notificação
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                    {/* Live Preview */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Bell size={18} className="text-yellow-500" />
                            Preview
                        </h2>

                        {/* Preview Card */}
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            {title || message ? (
                                <div className="flex gap-3">
                                    {/* Unread indicator */}
                                    <div className="pt-1.5 shrink-0">
                                        <span className="block w-2 h-2 rounded-full bg-yellow-500" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-white truncate">
                                                {title || 'Título da notificação'}
                                            </h4>
                                            {actionUrl && (
                                                <ExternalLink className="text-slate-500 shrink-0" size={14} />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-1">
                                            {message || 'A mensagem aparecerá aqui...'}
                                        </p>
                                        <span className="text-xs text-slate-500">agora mesmo</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Preencha o formulário para ver o preview</p>
                                </div>
                            )}
                        </div>

                        {/* Segment Info */}
                        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg flex items-center gap-3">
                            {SEGMENT_OPTIONS.find(o => o.value === segment)?.icon}
                            <div>
                                <p className="text-sm font-medium text-white">
                                    {SEGMENT_OPTIONS.find(o => o.value === segment)?.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {SEGMENT_OPTIONS.find(o => o.value === segment)?.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <History size={18} className="text-yellow-500" />
                                Últimos Envios
                            </h2>
                            <button
                                onClick={loadHistory}
                                disabled={loadingHistory}
                                className="btn-sm p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                            >
                                <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div className="py-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-500" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="py-8 text-center text-slate-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhum envio registrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="font-medium text-sm text-white truncate">
                                                {item.title}
                                            </h4>
                                            <span className="text-xs text-slate-500 shrink-0">
                                                {formatTime(item.sent_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mb-1">
                                            {item.message}
                                        </p>
                                        <span className="inline-block text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                                            {getSegmentLabel(item.segment)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
