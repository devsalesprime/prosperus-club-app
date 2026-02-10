// Context to share unread count refresh function across components
import React, { createContext, useContext, ReactNode } from 'react';

interface UnreadCountContextType {
    refreshUnreadCount: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextType | null>(null);

export const UnreadCountProvider: React.FC<{
    children: ReactNode;
    refreshFn: () => void;
}> = ({ children, refreshFn }) => {
    return (
        <UnreadCountContext.Provider value={{ refreshUnreadCount: refreshFn }}>
            {children}
        </UnreadCountContext.Provider>
    );
};

export const useUnreadCountContext = () => {
    const context = useContext(UnreadCountContext);
    if (!context) {
        // Return no-op if not in context (graceful degradation)
        return { refreshUnreadCount: () => { } };
    }
    return context;
};
