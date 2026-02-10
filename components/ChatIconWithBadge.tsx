// Chat icon with unread message badge
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { UnreadCountProvider } from '../contexts/UnreadCountContext';

interface ChatIconWithBadgeProps {
    userId: string;
    size?: number;
    onClick?: () => void;
    className?: string;
    children?: React.ReactNode;
}

export const ChatIconWithBadge: React.FC<ChatIconWithBadgeProps> = ({
    userId,
    size = 20,
    onClick,
    className = '',
    children
}) => {
    const { unreadCount, refreshCount } = useUnreadMessageCount(userId);

    return (
        <UnreadCountProvider refreshFn={refreshCount}>
            <button
                onClick={onClick}
                className={`relative p-2 text-prosperus-grey hover:text-prosperus-gold hover:bg-prosperus-navy-light rounded-lg transition-colors ${className}`}
                title="Chat"
            >
                <MessageCircle size={size} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
            {children}
        </UnreadCountProvider>
    );
};
