import { supabase } from '../lib/supabase';
import { JourneyMilestone } from '../types';

export const journeyService = {
    async getMilestones(userId: string): Promise<JourneyMilestone[]> {
        const { data, error } = await supabase
            .from('member_journey_milestones')
            .select('*')
            .eq('user_id', userId)
            .order('achieved_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async saveMilestone(milestone: Partial<JourneyMilestone>): Promise<JourneyMilestone> {
        const { data, error } = await supabase
            .from('member_journey_milestones')
            .insert([milestone])
            .select()
            .single();

        if (error) throw error;
        return data as JourneyMilestone;
    }
}
