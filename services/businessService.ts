// services/businessService.ts
// Business Core: ROI Tracking & Referral Management
// Prosperus Club App v2.5

import { supabase } from '../lib/supabase';

// ========== TYPES ==========

export type DealStatus = 'PENDING' | 'CONFIRMED' | 'CONTESTED';
export type ReferralStatus = 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST';

export interface Deal {
    id: string;
    seller_id: string;
    buyer_id: string;
    amount: number;
    description: string;
    status: DealStatus;
    deal_date: string;
    created_at: string;
    updated_at: string;
    // Joined Data
    seller?: {
        id: string;
        name: string;
        image_url: string;
    };
    buyer?: {
        id: string;
        name: string;
        image_url: string;
    };
}

export interface Referral {
    id: string;
    referrer_id: string;
    receiver_id: string;
    lead_name: string;
    lead_email?: string;
    lead_phone?: string;
    notes?: string;
    status: ReferralStatus;
    converted_amount?: number;
    feedback?: string; // Motivo da perda (required when LOST)
    created_at: string;
    updated_at: string;
    converted_at?: string;
    // Joined Data
    referrer?: {
        id: string;
        name: string;
        image_url: string;
    };
    receiver?: {
        id: string;
        name: string;
        image_url: string;
    };
}

export interface RankingEntry {
    user_id: string;
    name: string;
    image_url: string;
    total_amount?: number;
    deal_count?: number;
    referral_count?: number;
    converted_count?: number;
    total_converted_amount?: number;
}

export interface CreateDealInput {
    buyer_id: string;
    amount: number;
    description: string;
    deal_date?: string;
}

export interface CreateReferralInput {
    receiver_id: string;
    lead_name: string;
    lead_email?: string;
    lead_phone?: string;
    notes?: string;
}

export interface BusinessStats {
    totalSales: number;
    totalPurchases: number;
    pendingConfirmations: number;
    referralsSent: number;
    referralsReceived: number;
    conversions: number;
}

// ========== SERVICE CLASS ==========

class BusinessService {
    // ==================== DEALS ====================

    /**
     * Register a new deal (as seller)
     * Status starts as PENDING until buyer confirms
     */
    async registerDeal(data: CreateDealInput): Promise<Deal> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: deal, error } = await supabase
            .from('member_deals')
            .insert({
                seller_id: user.id,
                buyer_id: data.buyer_id,
                amount: data.amount,
                description: data.description,
                deal_date: data.deal_date || new Date().toISOString().split('T')[0],
                status: 'PENDING'
            })
            .select(`
                *,
                seller:seller_id (id, name, image_url),
                buyer:buyer_id (id, name, image_url)
            `)
            .single();

        if (error) throw error;

        // Notify buyer about pending deal
        await this.notifyBuyer(deal);

        return deal;
    }

    /**
     * Confirm a deal (as buyer) using secure RPC
     * Uses database function to prevent amount manipulation
     */
    async confirmDeal(dealId: string): Promise<Deal> {
        const { data: deal, error } = await supabase
            .rpc('confirm_deal', { deal_id: dealId });

        if (error) throw error;

        // Fetch full deal with joins for notification
        const { data: fullDeal } = await supabase
            .from('member_deals')
            .select(`
                *,
                seller:seller_id (id, name, image_url),
                buyer:buyer_id (id, name, image_url)
            `)
            .eq('id', dealId)
            .single();

        // Notify seller about confirmation
        if (fullDeal) await this.notifySeller(fullDeal, 'confirmed');

        return fullDeal || deal;
    }

    /**
     * Contest a deal (as buyer) using secure RPC
     * Uses database function to prevent amount manipulation
     */
    async contestDeal(dealId: string): Promise<Deal> {
        const { data: deal, error } = await supabase
            .rpc('contest_deal', { deal_id: dealId });

        if (error) throw error;

        // Fetch full deal with joins for notification
        const { data: fullDeal } = await supabase
            .from('member_deals')
            .select(`
                *,
                seller:seller_id (id, name, image_url),
                buyer:buyer_id (id, name, image_url)
            `)
            .eq('id', dealId)
            .single();

        // Notify seller about contestation
        if (fullDeal) await this.notifySeller(fullDeal, 'contested');

        return fullDeal || deal;
    }

    /**
     * Get user's deals (as seller or buyer)
     */
    async getMyDeals(type: 'sales' | 'purchases'): Promise<Deal[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const column = type === 'sales' ? 'seller_id' : 'buyer_id';

        const { data, error } = await supabase
            .from('member_deals')
            .select(`
                *,
                seller:seller_id (id, name, image_url),
                buyer:buyer_id (id, name, image_url)
            `)
            .eq(column, user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get pending deals for confirmation (as buyer)
     */
    async getPendingDealsForConfirmation(): Promise<Deal[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data, error } = await supabase
            .from('member_deals')
            .select(`
                *,
                seller:seller_id (id, name, image_url),
                buyer:buyer_id (id, name, image_url)
            `)
            .eq('buyer_id', user.id)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // ==================== REFERRALS ====================

    /**
     * Create a new referral (as referrer)
     */
    async createReferral(data: CreateReferralInput): Promise<Referral> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: referral, error } = await supabase
            .from('member_referrals')
            .insert({
                referrer_id: user.id,
                receiver_id: data.receiver_id,
                lead_name: data.lead_name,
                lead_email: data.lead_email,
                lead_phone: data.lead_phone,
                notes: data.notes,
                status: 'NEW'
            })
            .select(`
                *,
                referrer:referrer_id (id, name, image_url),
                receiver:receiver_id (id, name, image_url)
            `)
            .single();

        if (error) throw error;

        // Notify receiver about new referral
        await this.notifyReceiver(referral);

        return referral;
    }

    /**
     * Update referral status (as receiver) using secure RPC
     * When converting, amount is required
     * When losing, feedback is required
     */
    async updateReferralStatus(
        id: string,
        status: ReferralStatus,
        options?: { converted_amount?: number; feedback?: string }
    ): Promise<Referral> {
        const { data: referral, error } = await supabase
            .rpc('update_referral_status', {
                referral_id: id,
                new_status: status,
                amount: options?.converted_amount || null,
                loss_feedback: options?.feedback || null
            });

        if (error) throw error;

        // Fetch full referral with joins for notification
        const { data: fullReferral } = await supabase
            .from('member_referrals')
            .select(`
                *,
                referrer:referrer_id (id, name, image_url),
                receiver:receiver_id (id, name, image_url)
            `)
            .eq('id', id)
            .single();

        // Notify referrer when converted
        if (status === 'CONVERTED' && fullReferral) {
            await this.notifyReferrerConversion(fullReferral);
        }

        return fullReferral || referral;
    }

    /**
     * Get user's referrals (sent or received)
     */
    async getMyReferrals(type: 'sent' | 'received'): Promise<Referral[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const column = type === 'sent' ? 'referrer_id' : 'receiver_id';

        const { data, error } = await supabase
            .from('member_referrals')
            .select(`
                *,
                referrer:referrer_id (id, name, image_url),
                receiver:receiver_id (id, name, image_url)
            `)
            .eq(column, user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // ==================== RANKINGS (Using SQL Views) ====================

    /**
     * Get top sellers by confirmed deal volume
     * Uses pre-calculated SQL View for optimal performance
     */
    async getTopSellers(): Promise<RankingEntry[]> {
        const { data, error } = await supabase
            .from('view_ranking_sellers')
            .select('user_id, name, image_url, total_amount, deal_count')
            .order('total_amount', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get top referrers by referral count
     * Uses pre-calculated SQL View for optimal performance
     */
    async getTopReferrers(): Promise<RankingEntry[]> {
        const { data, error } = await supabase
            .from('view_ranking_referrers')
            .select('user_id, name, image_url, referral_count')
            .order('referral_count', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // ==================== STATISTICS ====================

    /**
     * Get user's business statistics for ROI Widget
     */
    async getMyStats(): Promise<BusinessStats> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        // Get deals stats
        const { data: deals } = await supabase
            .from('member_deals')
            .select('seller_id, buyer_id, status, amount')
            .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);

        // Get referrals stats
        const { data: referrals } = await supabase
            .from('member_referrals')
            .select('referrer_id, receiver_id, status')
            .or(`referrer_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const sales = (deals || []).filter(d =>
            d.seller_id === user.id && d.status === 'CONFIRMED'
        );
        const purchases = (deals || []).filter(d =>
            d.buyer_id === user.id && d.status === 'CONFIRMED'
        );
        const pending = (deals || []).filter(d =>
            d.buyer_id === user.id && d.status === 'PENDING'
        );

        const sent = (referrals || []).filter(r => r.referrer_id === user.id);
        const received = (referrals || []).filter(r => r.receiver_id === user.id);
        const converted = received.filter(r => r.status === 'CONVERTED');

        return {
            totalSales: sales.reduce((sum, d) => sum + Number(d.amount), 0),
            totalPurchases: purchases.reduce((sum, d) => sum + Number(d.amount), 0),
            pendingConfirmations: pending.length,
            referralsSent: sent.length,
            referralsReceived: received.length,
            conversions: converted.length
        };
    }

    // ==================== NOTIFICATIONS ====================

    private async notifyBuyer(deal: Deal): Promise<void> {
        try {
            const formattedAmount = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(deal.amount);

            await supabase.from('user_notifications').insert({
                user_id: deal.buyer_id,
                title: 'Novo Negócio para Confirmar',
                message: `${deal.seller?.name || 'Um membro'} registrou um negócio de ${formattedAmount} com você. Confirme para validar!`,
                action_url: '/deals?tab=purchases'
            });
        } catch (error) {
            console.error('Failed to notify buyer:', error);
        }
    }

    private async notifySeller(deal: Deal, action: 'confirmed' | 'contested'): Promise<void> {
        try {
            const formattedAmount = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(deal.amount);

            const isConfirmed = action === 'confirmed';
            const title = isConfirmed ? 'Negócio Confirmado! 🎉' : 'Negócio Contestado';
            const message = isConfirmed
                ? `${deal.buyer?.name || 'O comprador'} confirmou o negócio de ${formattedAmount}!`
                : `${deal.buyer?.name || 'O comprador'} contestou o negócio de ${formattedAmount}. Entre em contato para resolver.`;

            await supabase.from('user_notifications').insert({
                user_id: deal.seller_id,
                title,
                message,
                action_url: '/deals?tab=sales'
            });
        } catch (error) {
            console.error('Failed to notify seller:', error);
        }
    }

    private async notifyReceiver(referral: Referral): Promise<void> {
        try {
            await supabase.from('user_notifications').insert({
                user_id: referral.receiver_id,
                title: 'Nova Indicação Recebida',
                message: `${referral.referrer?.name || 'Um membro'} indicou um lead para você: ${referral.lead_name}`,
                action_url: '/referrals?tab=received'
            });
        } catch (error) {
            console.error('Failed to notify receiver:', error);
        }
    }

    private async notifyReferrerConversion(referral: Referral): Promise<void> {
        try {
            await supabase.from('user_notifications').insert({
                user_id: referral.referrer_id,
                title: 'Indicação Convertida! 🎉',
                message: `Sua indicação "${referral.lead_name}" foi convertida por ${referral.receiver?.name || 'o membro'}!`,
                action_url: '/referrals?tab=sent'
            });
        } catch (error) {
            console.error('Failed to notify referrer:', error);
        }
    }
}

// Singleton Export
export const businessService = new BusinessService();
