import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface UpcomingBirthday {
    userId: string;
    name: string;
    email: string;
    birthDate: string;        // The actual birth date (e.g., 1990-01-15)
    triggerDate: string;      // The upcoming anniversary date (e.g., 2026-01-15)
    daysRemaining: number;
    cardId: string | null;
    imageUrl: string | null;
    isViewed: boolean;
    status: 'SEM_ARTE' | 'AGENDADO' | 'VISUALIZADO';
}

export const adminBirthdayService = {
    /**
     * Gets members who have a birth_date set and calculates their upcoming birthdays
     * Cross-references with birthday_cards to check if a card is already scheduled for this year
     */
    async getUpcomingBirthdays(): Promise<UpcomingBirthday[]> {
        try {
            // 1. Get all active members with a birth date
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, email, birth_date')
                .eq('role', 'MEMBER')
                .eq('is_active', true)
                .not('birth_date', 'is', null);

            if (profilesError) throw profilesError;
            if (!profiles || profiles.length === 0) return [];

            // 2. Get all cards scheduled for the current year
            const currentYear = new Date().getUTCFullYear();
            const { data: cards, error: cardsError } = await supabase
                .from('birthday_cards')
                .select('id, user_id, image_url, trigger_date, is_viewed')
                .gte('trigger_date', `${currentYear}-01-01`)
                .lte('trigger_date', `${currentYear + 1}-12-31`);

            if (cardsError) throw cardsError;

            // 3. Process and map data
            const today = new Date();
            // Reset time to start of day in UTC for accurate day calculations
            const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            const upcomingBirthdays: UpcomingBirthday[] = profiles.map(profile => {
                const birthDateObj = new Date(profile.birth_date);
                // The birthday might have passed this year, so it would be next year
                let nextBirthday = new Date(Date.UTC(todayUTC.getUTCFullYear(), birthDateObj.getUTCMonth(), birthDateObj.getUTCDate()));

                if (nextBirthday < todayUTC) {
                    nextBirthday = new Date(Date.UTC(todayUTC.getUTCFullYear() + 1, birthDateObj.getUTCMonth(), birthDateObj.getUTCDate()));
                }

                const diffTime = Math.abs(nextBirthday.getTime() - todayUTC.getTime());
                const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const triggerDateStr = nextBirthday.toISOString().split('T')[0];

                // Check if there is already a card for this upcoming trigger_date
                const scheduledCard = cards?.find(c => c.user_id === profile.id && c.trigger_date === triggerDateStr);

                let status: UpcomingBirthday['status'] = 'SEM_ARTE';
                if (scheduledCard) {
                    status = scheduledCard.is_viewed ? 'VISUALIZADO' : 'AGENDADO';
                }

                return {
                    userId: profile.id,
                    name: profile.name || 'Sem nome',
                    email: profile.email || '',
                    birthDate: profile.birth_date,
                    triggerDate: triggerDateStr,
                    daysRemaining,
                    cardId: scheduledCard?.id || null,
                    imageUrl: scheduledCard?.image_url || null,
                    isViewed: scheduledCard?.is_viewed || false,
                    status
                };
            });

            // 4. Sort by closest upcoming
            return upcomingBirthdays.sort((a, b) => a.daysRemaining - b.daysRemaining);

        } catch (error) {
            logger.error('Error fetching upcoming birthdays:', error);
            throw error;
        }
    },

    /**
     * Uploads the image and schedules the greeting card for a specific trigger date
     */
    async uploadAndScheduleCard(userId: string, file: File, triggerDate: string): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            // 1. Generate unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${triggerDate}-${Date.now()}.${fileExt}`;
            const filePath = `cards/${fileName}`;

            // 2. Upload cleanly to the public bucket
            const { error: uploadError } = await supabase.storage
                .from('birthday-cards')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 3. Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('birthday-cards')
                .getPublicUrl(filePath);

            // 4. Upsert the card record (unique constraint will catch year duplicates, but upsert overwrites if needed)
            const { error: dbError } = await supabase
                .from('birthday_cards')
                .upsert({
                    user_id: userId,
                    image_url: publicUrl,
                    trigger_date: triggerDate,
                    is_viewed: false
                }, {
                    onConflict: 'user_id, trigger_date'
                });

            if (dbError) throw dbError;

            return { success: true, url: publicUrl };
        } catch (error: any) {
            logger.error('Error uploading and scheduling birthday card:', error);
            return { success: false, error: error.message || 'Erro ao agendar homenagem.' };
        }
    },
    
    /**
     * Delete a scheduled card (if sent by mistake or wants to remove)
     */
    async deleteCard(cardId: string): Promise<void> {
        try {
            const { error } = await supabase.from('birthday_cards').delete().eq('id', cardId);
            if (error) throw error;
        } catch (error) {
            logger.error('Error deleting card:', error);
            throw error;
        }
    }
};
