// NotificationsPage.tsx
// Full notifications page for members to view all notifications and manage them

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, CheckCheck, Check, ExternalLink, Loader2, ChevronDown, Inbox } from 'lucide-react';
import { notificationService, UserNotification } from '../../services/notificationService';
import { useUnreadCount } from '../../contexts/UnreadCountContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COPY } from '../../utils/copy';
import { CardSkeleton } from '../ui/CardSkeleton';
import { SwipeableItem } from '../ui/SwipeableItem';
import { UndoToast } from '../ui/UndoToast';

// Type-based icons for visual distinction
const NOTIFICATION_ICONS: Record<string, string> = {
    message: '💬',
    event: '📅',
    video: '🎥',
    gallery: '🖼️',
    referral: '🤝',
    deal: '💼',
    report: '📊',
    notification: '🔔',
};

interface NotificationsPageProps {
    currentUserId: string;
    onNavigate?: (url: string) => void;
}

type FilterTab = 'ALL' | 'UNREAD' | 'READ';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
    currentUserId,
    onNavigate
}) => {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(new Set());

    // SwipeableItem: track which item is open
    const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

    // Undo toast state for dismiss
    const [undoData, setUndoData] = useState<{ id: string; data: UserNotification } | null>(null);
    const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const { markAllRead } = useUnreadCount();

    // Mark all as read when page opens (clears badge)
    useEffect(() => { markAllRead(); }, [markAllRead]);

    const loadNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const result = await notificationService.getUserNotifications(currentUserId, pageNum, 20);

            if (append) {
                setNotifications(prev => [...prev, ...result.data]);
            } else {
                setNotifications(result.data);
            }
            setTotal(result.total);
            setHasMore(result.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        loadNotifications();

        // Subscribe to new notifications
        const unsubscribe = notificationService.subscribeToNotifications(
            currentUserId,
            (newNotification) => {
                setNotifications(prev => [newNotification, ...prev]);
                setTotal(prev => prev + 1);
            }
        );

        return () => unsubscribe();
    }, [currentUserId, loadNotifications]);

    const handleMarkAsRead = async (notification: UserNotification) => {
        if (notification.is_read) return;

        setMarkingReadIds(prev => new Set(prev).add(notification.id));
        try {
            await notificationService.markAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        } finally {
            setMarkingReadIds(prev => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(currentUserId);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (notification: UserNotification) => {
        setDeletingIds(prev => new Set(prev).add(notification.id));
        try {
            await notificationService.deleteNotification(notification.id);
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            setTotal(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error deleting notification:', error);
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    };

    const handleDeleteAllRead = async () => {
        const readNotifications = notifications.filter(n => n.is_read);
        if (readNotifications.length === 0) return;

        const readIds = new Set(readNotifications.map(n => n.id));
        setDeletingIds(readIds);

        try {
            // Delete all read notifications in parallel
            await Promise.all(
                readNotifications.map(n => notificationService.deleteNotification(n.id))
            );
            setNotifications(prev => prev.filter(n => !n.is_read));
            setTotal(prev => Math.max(0, prev - readNotifications.length));
        } catch (error) {
            console.error('Error deleting read notifications:', error);
        } finally {
            setDeletingIds(new Set());
        }
    };

    const handleNotificationClick = async (notification: UserNotification) => {
        // Navigate FIRST (synchronously) to avoid popup blocker on external URLs
        if (notification.action_url && onNavigate) {
            onNavigate(notification.action_url);
        }

        // Then mark as read (fire-and-forget, no await to block navigation)
        if (!notification.is_read) {
            handleMarkAsRead(notification);
        }
    };

    const handleLoadMore = () => {
        loadNotifications(page + 1, true);
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: ptBR
            });
        } catch {
            return '';
        }
    };

    const formatFullDate = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    // ─── Swipe dismiss (with undo) ───────────────────────────────
    const handleDismiss = useCallback((notification: UserNotification) => {
        // Save data for undo
        setUndoData({ id: notification.id, data: notification });

        // Optimistic remove
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setTotal(prev => Math.max(0, prev - 1));

        // Actually delete after 3s
        const timer = setTimeout(async () => {
            await notificationService.deleteNotification(notification.id);
            setUndoData(null);
        }, 3000);
        setUndoTimer(timer);
    }, []);

    const handleUndoDismiss = useCallback(() => {
        if (!undoData) return;
        if (undoTimer) clearTimeout(undoTimer);
        setNotifications(prev =>
            [...prev, undoData.data].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        );
        setTotal(prev => prev + 1);
        setUndoData(null);
        setUndoTimer(null);
    }, [undoData, undoTimer]);

    // Filter notifications based on active tab
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'UNREAD') return !n.is_read;
        if (activeTab === 'READ') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const readCount = notifications.filter(n => n.is_read).length;

    const tabs: { key: FilterTab; label: string; count?: number }[] = [
        { key: 'ALL', label: 'Todas', count: total },
        { key: 'UNREAD', label: 'Não lidas', count: unreadCount },
        { key: 'READ', label: 'Lidas', count: readCount }
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-in fade-in">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-yellow-600/20 rounded-lg">
                        <Bell className="text-yellow-500" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Notificações</h1>
                        <p className="text-slate-400 text-sm">
                            {total > 0 ? `${total} aviso${total !== 1 ? 's' : ''}` : 'Nenhum aviso'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Bar + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                {/* Tabs */}
                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === tab.key
                                ? 'bg-yellow-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-yellow-500 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition"
                            title="Marcar todas como lidas"
                        >
                            <CheckCheck size={14} />
                            Marcar todas como lidas
                        </button>
                    )}
                    {readCount > 0 && (
                        <button
                            onClick={handleDeleteAllRead}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-900/20 px-3 py-2 rounded-lg border border-slate-700 hover:border-red-600/30 transition"
                            title="Excluir todas as lidas"
                        >
                            <Trash2 size={14} />
                            Limpar lidas
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {loading ? (
                <CardSkeleton count={5} variant="list" />
            ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                        <Inbox className="text-slate-600" size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400 mb-1">
                        {activeTab === 'UNREAD' ? 'Tudo em dia!' : activeTab === 'READ' ? 'Nenhuma lida' : 'Nenhuma notificação'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {activeTab === 'UNREAD'
                            ? 'Você será avisado sobre eventos, mensagens e novidades do clube.'
                            : activeTab === 'READ'
                                ? 'Nenhuma notificação lida para exibir.'
                                : 'Você será avisado sobre eventos, mensagens e novidades do clube.'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                        <SwipeableItem
                            key={notification.id}
                            itemId={notification.id}
                            openItemId={openSwipeId}
                            onOpen={setOpenSwipeId}
                            rightActions={[
                                // Unread: show "Lida" button first
                                ...(!notification.is_read ? [{
                                    label: 'Lida',
                                    icon: <Check size={18} />,
                                    color: 'bg-emerald-600',
                                    width: 72,
                                    onTrigger: () => handleMarkAsRead(notification),
                                }] : []),
                                // Always show dismiss
                                {
                                    label: 'Dispensar',
                                    icon: <Trash2 size={18} />,
                                    color: 'bg-red-500',
                                    width: 80,
                                    destructive: true,
                                    onTrigger: () => handleDismiss(notification),
                                },
                            ]}
                            leftActions={[
                                // Swipe right = quick mark as read
                                ...(!notification.is_read ? [{
                                    label: 'Lida',
                                    icon: <Check size={18} />,
                                    color: 'bg-emerald-600',
                                    width: 80,
                                    destructive: true,
                                    onTrigger: () => handleMarkAsRead(notification),
                                }] : []),
                            ]}
                            className="rounded-xl"
                        >
                            <div
                                className={`group bg-slate-900 border rounded-xl transition overflow-hidden ${!notification.is_read
                                    ? 'border-yellow-600/30 bg-yellow-900/5'
                                    : 'border-slate-800 hover:border-slate-700'
                                    } ${deletingIds.has(notification.id) ? 'opacity-50 scale-95' : ''}`}
                            >
                                <div className="flex items-start gap-3 p-4">
                                    {/* Type icon */}
                                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${!notification.is_read
                                        ? 'bg-yellow-600/15 border border-yellow-600/20'
                                        : 'bg-slate-800 border border-slate-700/50'
                                        }`}>
                                        {NOTIFICATION_ICONS[notification.type || 'notification'] || NOTIFICATION_ICONS['notification']}
                                    </div>

                                    {/* Content */}
                                    <button
                                        className="flex-1 min-w-0 text-left"
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className={`font-bold text-sm ${!notification.is_read ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                {notification.title}
                                            </h4>
                                            {notification.action_url && (
                                                <ExternalLink className="text-slate-600 shrink-0 mt-0.5" size={14} />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500" title={formatFullDate(notification.created_at)}>
                                                {formatTimestamp(notification.created_at)}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Actions (desktop hover) */}
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification)}
                                                disabled={markingReadIds.has(notification.id)}
                                                className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition"
                                                title="Marcar como lida"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification)}
                                            disabled={deletingIds.has(notification.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                                            title="Excluir notificação"
                                        >
                                            {deletingIds.has(notification.id) ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SwipeableItem>
                    ))}

                    {/* Load More */}
                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="w-full py-3 text-sm font-medium text-slate-400 hover:text-yellow-500 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Carregando...
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={16} />
                                    Carregar mais
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Undo Toast */}
            {undoData && (
                <UndoToast
                    message="Notificação dispensada"
                    onUndo={handleUndoDismiss}
                    onExpire={() => setUndoData(null)}
                    duration={3000}
                />
            )}
        </div>
    );
};
