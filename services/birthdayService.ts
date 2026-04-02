import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface BirthdayCard {
    id: string;
    image_url: string;
    trigger_date: string;
    is_viewed: boolean;
}

export const birthdayService = {
    /**
     * Get a pending birthday card for the currently authenticated user
     * A card is pending if:
     * - is_viewed is false
     * - trigger_date is today or in the past (<= CURRENT_DATE)
     */
    async getPendingCard(): Promise<BirthdayCard | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Get current date in YYYY-MM-DD format (local timezone)
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const { data, error } = await supabase
                .from('birthday_cards')
                .select('id, image_url, trigger_date, is_viewed')
                .eq('user_id', user.id)
                .eq('is_viewed', false)
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
     * Mark a specific card as viewed so it doesn't show up again
     */
    async markCardAsViewed(cardId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('birthday_cards')
                .update({ is_viewed: true })
                .eq('id', cardId)
                // RLS already protects this, but we add an extra filter just in case
                .eq('user_id', user.id);

            if (error) {
                logger.error('Error marking birthday card as viewed:', error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Unexpected error marking birthday card as viewed:', error);
            return false;
        }
    }
};
