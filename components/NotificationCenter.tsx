// NotificationCenter.tsx
// Dropdown notification center component

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { notificationService, UserNotification } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '../utils/logger';

interface NotificationCenterProps {
    currentUserId: string;
    onNavigate?: (url: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    currentUserId,
    onNavigate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotifications();
        loadUnreadCount();

        // Subscribe to new notifications
        const unsubscribe = notificationService.subscribeToNotifications(
            currentUserId,
            (newNotification) => {
                logger.debug('🔔 New notification received:', newNotification);
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Trigger shake animation
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 600);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [currentUserId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Refresh data every time dropdown opens
            loadNotifications();
            loadUnreadCount();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const result = await notificationService.getUserNotifications(currentUserId, 1, 20);
            setNotifications(result.data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount(currentUserId);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const handleNotificationClick = async (notification: UserNotification) => {
        try {
            // Navigate FIRST (synchronously) to avoid popup blocker on external URLs
            if (notification.action_url) {
                setIsOpen(false);
                if (onNavigate) {
                    onNavigate(notification.action_url);
                } else {
                    window.location.href = notification.action_url;
                }
            }

            // Then mark as read and update UI (fire-and-forget)
            if (!notification.is_read) {
                await notificationService.markAsRead(notification.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            // Remove from the dropdown list so it disappears immediately
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(currentUserId);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white ${isShaking ? 'animate-shake' : ''}`}
                title="Notificações"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-14 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="text-yellow-500" size={20} />
                            <h3 className="font-bold text-white">Notificações</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="btn-sm p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                                    title="Marcar todas como lidas"
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn-sm p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-slate-400 text-sm">Carregando...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-4 text-left hover:bg-slate-800 transition flex gap-3 ${!notification.is_read ? 'bg-slate-800/50' : ''
                                            }`}
                                    >
                                        {/* Unread Indicator */}
                                        <div className="shrink-0 pt-1">
                                            {!notification.is_read ? (
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            ) : (
                                                <div className="w-2 h-2"></div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4
                                                    className={`font-bold text-sm truncate ${!notification.is_read
                                                        ? 'text-white'
                                                        : 'text-slate-300'
                                                        }`}
                                                >
                                                    {notification.title}
                                                </h4>
                                                {notification.action_url && (
                                                    <ExternalLink
                                                        className="text-slate-500 shrink-0"
                                                        size={14}
                                                    />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-1">
                                                {notification.message}
                                            </p>
                                            <span className="text-xs text-slate-500">
                                                {formatTimestamp(notification.created_at)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    if (onNavigate) onNavigate('NOTIFICATIONS');
                                }}
                                className="w-full text-center text-sm text-yellow-500 hover:text-yellow-400 font-medium transition"
                            >
                                Ver todas as notificações
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Shake animation CSS */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    20% { transform: rotate(-12deg); }
                    40% { transform: rotate(12deg); }
                    60% { transform: rotate(-8deg); }
                    80% { transform: rotate(8deg); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};
