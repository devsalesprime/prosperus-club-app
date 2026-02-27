// Centralized query keys for React Query cache management
// Each key is a tuple that enables granular cache invalidation

export const QUERY_KEYS = {
    // Profiles
    profiles: () => ['profiles'] as const,
    profile: (id: string) => ['profiles', id] as const,

    // Events
    events: () => ['events'] as const,
    event: (id: string) => ['events', id] as const,

    // Videos / Academy
    videos: () => ['videos'] as const,
    videoCategories: () => ['videos', 'categories'] as const,
    videoProgress: (userId: string) => ['videos', 'progress', userId] as const,
    continueWatching: (userId: string) => ['videos', 'continue', userId] as const,
    academyData: (userId: string) => ['academy', userId] as const,

    // Articles / News
    articles: (category?: string) => ['articles', category ?? 'all'] as const,
    articleCategories: () => ['articles', 'categories'] as const,

    // Notifications
    notifications: (userId: string) => ['notifications', userId] as const,
    unreadCount: (userId: string) => ['notifications', userId, 'unread'] as const,

    // Chat
    conversations: (userId: string) => ['conversations', userId] as const,
    messages: (conversationId: string) => ['messages', conversationId] as const,

    // Business
    deals: (userId: string) => ['deals', userId] as const,
    referrals: (userId: string) => ['referrals', userId] as const,
    rankings: () => ['rankings'] as const,

    // Gallery
    gallery: () => ['gallery'] as const,
    albums: () => ['gallery', 'albums'] as const,

    // Banners
    banners: () => ['banners'] as const,

    // RSVPs
    rsvps: (eventId: string) => ['events', eventId, 'rsvps'] as const,
} as const;
