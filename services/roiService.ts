// roiService.ts
// Service for ROI tracking: Deals and Referrals

import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export interface FinancialGrowth {
    totalRevenue: number;
    dealsRevenue: number;
    referralsRevenue: number;
    dealsCount: number;
    referralsCount: number;
}

export interface Deal {
    id: string;
    seller_id: string;
    buyer_id: string;
    amount: number;
    description: string;
    status: 'PENDING' | 'CONFIRMED' | 'CONTESTED';
    deal_date: string;
    created_at: string;
    updated_at: string;
    // Joined data
    seller_name?: string;
    buyer_name?: string;
}

export interface Referral {
    id: string;
    referrer_id: string;
    receiver_id: string;
    lead_name: string;
    lead_email?: string;
    lead_phone?: string;
    notes?: string;
    status: 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST';
    converted_amount?: number;
    feedback?: string;
    created_at: string;
    updated_at: string;
    converted_at?: string;
    // Joined data
    referrer_name?: string;
    receiver_name?: string;
}

export interface RankingEntry {
    user_id: string;
    name: string;
    image_url: string;
    total_amount: number;
    count: number;
}

// ============================================
// SERVICE CLASS
// ============================================

class RoiService {
    /**
     * Get financial growth summary for a user
     * Aggregates confirmed deals + converted referrals
     */
    async getMyFinancialGrowth(userId: string): Promise<FinancialGrowth> {
        try {
            // Fetch confirmed deals where user is seller
            const { data: deals, error: dealsError } = await supabase
                .from('member_deals')
                .select('amount')
                .eq('seller_id', userId)
                .eq('status', 'CONFIRMED');

            if (dealsError) throw dealsError;

            // Fetch converted referrals where user is referrer
            const { data: referrals, error: referralsError } = await supabase
                .from('member_referrals')
                .select('converted_amount')
                .eq('referrer_id', userId)
                .eq('status', 'CONVERTED')
                .not('converted_amount', 'is', null);

            if (referralsError) throw referralsError;

            const dealsRevenue = deals?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
            const referralsRevenue = referrals?.reduce((sum, r) => sum + Number(r.converted_amount), 0) || 0;

            return {
                totalRevenue: dealsRevenue + referralsRevenue,
                dealsRevenue,
                referralsRevenue,
                dealsCount: deals?.length || 0,
                referralsCount: referrals?.length || 0
            };
        } catch (error) {
            console.error('[ROI Service] Error fetching financial growth:', error);
            return {
                totalRevenue: 0,
                dealsRevenue: 0,
                referralsRevenue: 0,
                dealsCount: 0,
                referralsCount: 0
            };
        }
    }

    /**
     * Get all deals for a user (as seller or buyer)
     */
    async getMyDeals(userId: string): Promise<Deal[]> {
        try {
            const { data, error } = await supabase
                .from('member_deals')
                .select(`
                    *,
                    seller:profiles!seller_id(name),
                    buyer:profiles!buyer_id(name)
                `)
                .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(d => ({
                ...d,
                seller_name: d.seller?.name,
                buyer_name: d.buyer?.name
            }));
        } catch (error) {
            console.error('[ROI Service] Error fetching deals:', error);
            return [];
        }
    }

    /**
     * Get all referrals for a user (as referrer or receiver)
     */
    async getMyReferrals(userId: string): Promise<Referral[]> {
        try {
            const { data, error } = await supabase
                .from('member_referrals')
                .select(`
                    *,
                    referrer:profiles!referrer_id(name),
                    receiver:profiles!receiver_id(name)
                `)
                .or(`referrer_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(r => ({
                ...r,
                referrer_name: r.referrer?.name,
                receiver_name: r.receiver?.name
            }));
        } catch (error) {
            console.error('[ROI Service] Error fetching referrals:', error);
            return [];
        }
    }

    /**
     * Create a new deal
     */
    async createDeal(deal: {
        buyer_id: string;
        amount: number;
        description: string;
        deal_date?: string;
    }): Promise<{ success: boolean; data?: Deal; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('member_deals')
                .insert({
                    ...deal,
                    deal_date: deal.deal_date || new Date().toISOString().split('T')[0]
                })
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error: any) {
            console.error('[ROI Service] Error creating deal:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a new referral
     */
    async createReferral(referral: {
        receiver_id: string;
        lead_name: string;
        lead_email?: string;
        lead_phone?: string;
        notes?: string;
    }): Promise<{ success: boolean; data?: Referral; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('member_referrals')
                .insert(referral)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error: any) {
            console.error('[ROI Service] Error creating referral:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get top sellers ranking
     */
    async getTopSellers(limit: number = 10): Promise<RankingEntry[]> {
        try {
            const { data, error } = await supabase
                .from('view_ranking_sellers')
                .select('user_id, name, image_url, deal_count, total_amount')
                .limit(limit);

            if (error) throw error;

            // Map deal_count to count for RankingEntry interface
            return (data || []).map(row => ({
                user_id: row.user_id,
                name: row.name,
                image_url: row.image_url,
                total_amount: row.total_amount,
                count: row.deal_count
            }));
        } catch (error) {
            console.error('[ROI Service] Error fetching top sellers:', error);
            return [];
        }
    }

    /**
     * Get top referrers ranking
     */
    async getTopReferrers(limit: number = 10): Promise<RankingEntry[]> {
        try {
            const { data, error } = await supabase
                .from('view_ranking_referrers')
                .select('user_id, name, image_url, referral_count, total_converted_amount')
                .limit(limit);

            if (error) throw error;

            // Map referral_count to count and total_converted_amount to total_amount
            return (data || []).map(row => ({
                user_id: row.user_id,
                name: row.name,
                image_url: row.image_url,
                total_amount: row.total_converted_amount,
                count: row.referral_count
            }));
        } catch (error) {
            console.error('[ROI Service] Error fetching top referrers:', error);
            return [];
        }
    }
}

export const roiService = new RoiService();
