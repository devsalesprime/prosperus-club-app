import { supabase } from '../lib/supabase';
import { AdminJourneyMilestone } from '../types';

export const adminJourneyService = {
    async getAllMilestones(): Promise<AdminJourneyMilestone[]> {
        const { data, error } = await supabase
            .from('member_journey_milestones')
            .select(`
                *,
                profiles:user_id(id, name, company, image_url)
            `)
            .order('achieved_at', { ascending: false });

        if (error) throw error;
        return data as AdminJourneyMilestone[];
    },

    async adminSaveMilestone(milestone: Partial<AdminJourneyMilestone>): Promise<AdminJourneyMilestone> {
        const payload = {
            id: milestone.id,
            user_id: milestone.user_id,
            revenue_amount: milestone.revenue_amount,
            milestone_title: milestone.milestone_title,
            achieved_at: milestone.achieved_at
        };

        const { data, error } = await supabase
            .from('member_journey_milestones')
            .upsert([payload], { onConflict: 'id' })
            .select(`
                *,
                profiles:user_id(id, name, company, image_url)
            `)
            .single();

        if (error) throw error;
        return data as AdminJourneyMilestone;
    },

    async adminDeleteMilestone(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('member_journey_milestones')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            return false;
        }
        return true;
    },

    calculateGlobalWealth(milestones: AdminJourneyMilestone[]): number {
        // Group by user_id and select the one with the maximum achieved_at for each user
        const latestMilestones = new Map<string, AdminJourneyMilestone>();

        milestones.forEach(m => {
            const existing = latestMilestones.get(m.user_id);
            if (!existing || new Date(m.achieved_at) > new Date(existing.achieved_at)) {
                latestMilestones.set(m.user_id, m);
            }
        });

        // Sum up the revenue_amount of the latest milestones
        return Array.from(latestMilestones.values()).reduce((sum, m) => sum + Number(m.revenue_amount), 0);
    }
};
