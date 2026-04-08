import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface BirthdayBanner {
    userId: string;
    name: string;
    email: string;
    birthDate: string;        // Data de nascimento real (ex: 1990-01-15)
    scheduledDate: string;    // Data de exibição do banner (ex: 2026-01-15)
    daysRemaining: number;
    cardId: string | null;
    imageUrl: string | null;
    status: 'scheduled' | 'sent' | 'no_banner';
}

/** @deprecated Use BirthdayBanner. Kept for compatibility. */
export type UpcomingBirthday = BirthdayBanner & {
    triggerDate: string;
    isViewed: boolean;
};

export const adminBirthdayService = {
    /**
     * Lista sócios com birth_date e cruza com os banners agendados.
     * Retorna em ordem de aniversário mais próximo.
     */
    async getUpcomingBirthdays(): Promise<BirthdayBanner[]> {
        try {
            // 1. Todos os MEMBERS ativos com data de nascimento
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, email, birth_date')
                .eq('role', 'MEMBER')
                .eq('is_active', true)
                .not('birth_date', 'is', null);

            if (profilesError) throw profilesError;
            if (!profiles || profiles.length === 0) return [];

            // 2. Banners do ano atual + próximo (para não perder quem ainda vai fazer)
            const currentYear = new Date().getUTCFullYear();
            const { data: cards, error: cardsError } = await supabase
                .from('birthday_cards')
                .select('id, user_id, image_url, trigger_date, status')
                .gte('trigger_date', `${currentYear}-01-01`)
                .lte('trigger_date', `${currentYear + 1}-12-31`);

            if (cardsError) throw cardsError;

            // 3. Calcular próxima data de aniversário
            const today = new Date();
            const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            const banners: BirthdayBanner[] = profiles.map((profile) => {
                const birthDateObj = new Date(profile.birth_date);
                let nextBirthday = new Date(Date.UTC(
                    todayUTC.getUTCFullYear(),
                    birthDateObj.getUTCMonth(),
                    birthDateObj.getUTCDate()
                ));

                if (nextBirthday < todayUTC) {
                    nextBirthday = new Date(Date.UTC(
                        todayUTC.getUTCFullYear() + 1,
                        birthDateObj.getUTCMonth(),
                        birthDateObj.getUTCDate()
                    ));
                }

                const diffMs = nextBirthday.getTime() - todayUTC.getTime();
                const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const scheduledDate = nextBirthday.toISOString().split('T')[0];

                const card = cards?.find(
                    (c) => c.user_id === profile.id && c.trigger_date === scheduledDate
                );

                let status: BirthdayBanner['status'] = 'no_banner';
                if (card) {
                    status = (card.status as 'scheduled' | 'sent') ?? 'scheduled';
                }

                return {
                    userId: profile.id,
                    name: profile.name || 'Sem nome',
                    email: profile.email || '',
                    birthDate: profile.birth_date,
                    scheduledDate,
                    triggerDate: scheduledDate, // compat
                    daysRemaining,
                    cardId: card?.id || null,
                    imageUrl: card?.image_url || null,
                    isViewed: card?.status === 'sent', // compat
                    status,
                };
            });

            return banners.sort((a, b) => a.daysRemaining - b.daysRemaining);
        } catch (error) {
            logger.error('Error fetching birthday banners:', error);
            throw error;
        }
    },

    /**
     * Dispara a Edge Function de sincronização HubSpot → App.
     * Busca contatos com banner_de_aniversario preenchido e faz UPSERT.
     * Retorna estatísticas da operação.
     */
    async syncFromHubSpot(): Promise<{ success: boolean; stats?: Record<string, number>; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('sync-hubspot-birthdays', {
                body: {},
            });

            if (error) throw error;
            return data as { success: boolean; stats: Record<string, number> };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            logger.error('Error syncing from HubSpot:', error);
            return { success: false, error: message };
        }
    },

    /**
     * Exclui um banner agendado (emergência/cancelamento).
     */
    async deleteCard(cardId: string): Promise<void> {
        try {
            const { error } = await supabase.from('birthday_cards').delete().eq('id', cardId);
            if (error) throw error;
        } catch (error) {
            logger.error('Error deleting birthday card:', error);
            throw error;
        }
    },

    // ── DEPRECATED ──────────────────────────────────────────────────────────
    /** @deprecated Removed. Use syncFromHubSpot() instead. */
    async uploadAndScheduleCard(
        _userId: string,
        _file: File,
        _triggerDate: string
    ): Promise<{ success: boolean; url?: string; error?: string }> {
        logger.warn('uploadAndScheduleCard is deprecated. Use syncFromHubSpot() instead.');
        return { success: false, error: 'Upload manual desativado. Use o Botão Sincronizar HubSpot.' };
    },
};
