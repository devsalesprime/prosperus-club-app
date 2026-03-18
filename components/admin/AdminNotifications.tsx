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
    UserX,
    ExternalLink,
    Loader2,
    CheckCircle,
    AlertCircle,
    History,
    RefreshCw,
    Paperclip,
    FileText,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { notificationService, NotificationSegment } from '../../services/notificationService';
import { AdminFileUpload } from './shared';
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
        value: 'TEAM_ADMIN',
        label: 'Equipe e Admins',
        icon: <Shield size={18} />,
        description: 'Time interno + Administradores'
    },
    {
        value: 'INACTIVE_30D',
        label: 'Inativos (+30 dias)',
        icon: <UserX size={18} />,
        description: 'Sócios sem atividade há 30+ dias'
    }
];

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ userRole }) => {
    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [segment, setSegment] = useState<NotificationSegment>('ALL');

    // UI state
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<{ count: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Audience reach count
    const [reachCount, setReachCount] = useState<number | null>(null);
    const [loadingCount, setLoadingCount] = useState(false);

    // History state
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [histSegFilter, setHistSegFilter] = useState<'ALL' | 'MEMBERS' | 'TEAM_ADMIN' | 'INACTIVE_30D'>('ALL');
    const [histPage, setHistPage] = useState(1);
    const HIST_PAGE_SIZE = 5;

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

    // Fetch reach count when segment changes
    useEffect(() => {
        let cancelled = false;
        setLoadingCount(true);
        setReachCount(null);

        notificationService.getSegmentCount(segment).then(count => {
            if (!cancelled) {
                setReachCount(count);
                setLoadingCount(false);
            }
        });

        return () => { cancelled = true; };
    }, [segment]);

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const result = await notificationService.getNotificationHistory(1, 50);
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
                setAttachmentUrl('');
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

                        {/* Attachment Upload */}
                        <div>
                            <AdminFileUpload
                                label="Anexo (opcional)"
                                value={attachmentUrl}
                                onUploaded={(url) => {
                                    setAttachmentUrl(url);
                                    // Auto-fill action URL if empty
                                    if (!actionUrl && url) setActionUrl(url);
                                }}
                                onClear={() => {
                                    setAttachmentUrl('');
                                    // Clear action URL only if it was the attachment
                                    if (actionUrl === attachmentUrl) setActionUrl('');
                                }}
                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
                                hint="Anexe PDF ou imagem. Máx 10MB."
                            />
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
                            {/* Reach Preview */}
                            <div className="mt-3 p-2.5 bg-slate-800/80 rounded-lg flex items-center gap-2">
                                {loadingCount ? (
                                    <Loader2 size={14} className="animate-spin text-yellow-500" />
                                ) : (
                                    <span className="text-yellow-500 text-sm">🎯</span>
                                )}
                                <span className="text-xs text-slate-300 font-medium">
                                    Alcance estimado:{' '}
                                    {loadingCount ? (
                                        <span className="text-slate-500">calculando...</span>
                                    ) : (
                                        <span className="text-yellow-400 font-bold">{reachCount} usuário(s)</span>
                                    )}
                                </span>
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
                            disabled={sending || !title.trim() || !message.trim() || loadingCount}
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
                                        {attachmentUrl && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <Paperclip size={12} className="text-yellow-500" />
                                                <span className="text-xs text-yellow-500 font-medium">
                                                    {attachmentUrl.toLowerCase().endsWith('.pdf') ? 'PDF anexado' : 'Imagem anexada'}
                                                </span>
                                            </div>
                                        )}
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
                                Histórico de Envios
                            </h2>
                            <button
                                onClick={loadHistory}
                                disabled={loadingHistory}
                                className="btn-sm p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                            >
                                <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* Segment filter chips */}
                        <div className="flex gap-1.5 mb-4 flex-wrap">
                            {(['ALL', 'MEMBERS', 'TEAM_ADMIN', 'INACTIVE_30D'] as const).map(seg => (
                                <button
                                    key={seg}
                                    onClick={() => { setHistSegFilter(seg); setHistPage(1); }}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition ${histSegFilter === seg
                                        ? 'bg-yellow-600 text-white border-yellow-600'
                                        : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    {seg === 'ALL' ? 'Todos' : seg === 'MEMBERS' ? 'Sócios' : seg === 'TEAM_ADMIN' ? 'Equipe' : 'Inativos'}
                                </button>
                            ))}
                        </div>

                        {loadingHistory ? (
                            <div className="py-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-500" />
                            </div>
                        ) : (() => {
                            const filteredHistory = histSegFilter === 'ALL'
                                ? history
                                : history.filter(h => h.segment === histSegFilter);
                            const histTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HIST_PAGE_SIZE));
                            const paginatedHistory = filteredHistory.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE);

                            return filteredHistory.length === 0 ? (
                                <div className="py-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{histSegFilter !== 'ALL' ? 'Nenhum envio para esse segmento.' : 'Nenhum envio registrado'}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {paginatedHistory.map((item) => (
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
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span className="text-xs text-slate-400 px-2">{histPage} / {histTotalPages}</span>
                                            <button
                                                onClick={() => setHistPage(p => Math.min(histTotalPages, p + 1))}
                                                disabled={histPage === histTotalPages}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
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
        </div>
    );
};

export default AdminNotifications;
