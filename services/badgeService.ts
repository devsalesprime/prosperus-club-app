// PWA Badge Service
// Uses the Badging API to show unread count on the app icon
// Supported: Android Chrome 81+, Edge 84+, Desktop Chrome/Edge
// Not supported: iOS Safari (no Badging API)

import { notificationService } from '../services/notificationService';
import { unreadMessageService } from '../services/unreadMessageService';

class BadgeService {
    private currentBadge = 0;

    /**
     * Update the app badge with combined unread count
     * (notifications + messages)
     */
    async updateBadge(userId: string): Promise<void> {
        if (!this.isSupported()) return;

        try {
            const [unreadNotifications, unreadMessages] = await Promise.all([
                notificationService.getUnreadCount(userId),
                unreadMessageService.getTotalUnreadCount(userId)
            ]);

            const total = unreadNotifications + unreadMessages;
            this.setBadge(total);
        } catch (error) {
            console.error('❌ BadgeService: Error updating badge:', error);
        }
    }

    /**
     * Set the badge to a specific count
     */
    setBadge(count: number): void {
        if (!this.isSupported()) return;

        this.currentBadge = count;

        try {
            if (count > 0) {
                (navigator as any).setAppBadge(count);
            } else {
                (navigator as any).clearAppBadge();
            }
        } catch (error) {
            // Silently fail — user may not have granted permission
        }
    }

    /**
     * Increment badge by 1 (for new incoming notification/message)
     */
    increment(): void {
        this.setBadge(this.currentBadge + 1);
    }

    /**
     * Clear the badge entirely
     */
    clear(): void {
        this.setBadge(0);
    }

    /**
     * Check if the Badging API is supported
     */
    isSupported(): boolean {
        return 'setAppBadge' in navigator;
    }
}

export const badgeService = new BadgeService();
