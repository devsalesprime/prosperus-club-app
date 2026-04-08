import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface BirthdayCard {
    id: string;
    image_url: string;
    trigger_date: string;
    status: 'scheduled' | 'sent';
    /** @deprecated Use status instead */
    is_viewed: boolean;
}

export const birthdayService = {
    /**
     * Get a pending birthday card for the currently authenticated user.
     * A card is pending if:
     * - status is 'scheduled' (not yet shown)
     * - trigger_date is today or in the past (<= CURRENT_DATE)
     */
    async getPendingCard(): Promise<BirthdayCard | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const { data, error } = await supabase
                .from('birthday_cards')
                .select('id, image_url, trigger_date, status, is_viewed')
                .eq('user_id', user.id)
                .eq('status', 'scheduled')
                .lte('trigger_date', todayStr)
                .order('trigger_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                logger.error('Error fetching pending birthday card:', error);
                return null;
            }

            return data;
        } catch (error) {
            logger.error('Unexpected error fetching birthday card:', error);
            return null;
        }
    },

    /**
     * Mark a card as sent — triggers the Admin panel status update autonomously.
     * Called silently (fire-and-forget) when the member sees the card.
     */
    async markBirthdayBannerAsSent(cardId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('birthday_cards')
                .update({ status: 'sent', is_viewed: true })
                .eq('id', cardId)
                .eq('user_id', user.id);

            if (error) {
                logger.error('Error marking birthday card as sent:', error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Unexpected error marking birthday card as sent:', error);
            return false;
        }
    },

    /**
     * @deprecated Use markBirthdayBannerAsSent instead.
     * Kept for backward compatibility.
     */
    async markCardAsViewed(cardId: string): Promise<boolean> {
        return this.markBirthdayBannerAsSent(cardId);
    },
};
