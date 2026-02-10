// ============================================
// ADMIN BUSINESS SERVICE
// ============================================
// Admin-specific operations for ROI audit and management
// Requires ADMIN or TEAM role

import { supabase } from '../lib/supabase';
import { Deal, DealStatus, RankingEntry } from '../types';

export interface AdminDealFilters {
    status?: DealStatus[];
    sellerId?: string;
    buyerId?: string;
    minAmount?: number;
    maxAmount?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface AdminKPIs {
    totalVolume: number;
    avgTicket: number;
    dealsCount: number;
    confirmedCount: number;
    auditedCount: number;
    contestedCount: number;
    invalidatedCount: number;
    pendingCount: number;
    highValueCount: number;
}

export interface SuspiciousDeal extends Deal {
    suspicion_type: string;
    suspicion_count: number;
}

class AdminBusinessService {
    /**
     * Get all deals with filters and pagination
     */
    async getAllDeals(filters: AdminDealFilters = {}): Promise<{ data: Deal[]; total: number }> {
        const {
            status,
            sellerId,
            buyerId,
            minAmount,
            maxAmount,
            dateFrom,
            dateTo,
            page = 1,
            limit = 50
        } = filters;

        let query = supabase
            .from('member_deals')
            .select(`
                *,
                seller:profiles!seller_id(id, name, email, image_url),
                buyer:profiles!buyer_id(id, name, email, image_url),
                auditor:profiles!audited_by(id, name, email)
            `, { count: 'exact' });

        // Apply filters
        if (status && status.length > 0) {
            query = query.in('status', status);
        }

        if (sellerId) {
            query = query.eq('seller_id', sellerId);
        }

        if (buyerId) {
            query = query.eq('buyer_id', buyerId);
        }

        if (minAmount !== undefined) {
            query = query.gte('amount', minAmount);
        }

        if (maxAmount !== undefined) {
            query = query.lte('amount', maxAmount);
        }

        if (dateFrom) {
            query = query.gte('deal_date', dateFrom);
        }

        if (dateTo) {
            query = query.lte('deal_date', dateTo);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        // Order by created_at desc
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching deals:', error);
            throw new Error('Erro ao buscar negócios');
        }

        return {
            data: data || [],
            total: count || 0
        };
    }

    /**
     * Audit a deal (approve or reject)
     */
    async auditDeal(
        dealId: string,
        decision: 'APPROVE' | 'REJECT',
        notes: string
    ): Promise<void> {
        if (!notes || notes.trim() === '') {
            throw new Error('Notas de auditoria são obrigatórias');
        }

        const { error } = await supabase.rpc('admin_audit_deal', {
            p_deal_id: dealId,
            p_decision: decision,
            p_notes: notes.trim()
        });

        if (error) {
            console.error('Error auditing deal:', error);
            throw new Error(error.message || 'Erro ao auditar negócio');
        }
    }

    /**
     * Bulk audit multiple deals
     */
    async bulkAuditDeals(
        dealIds: string[],
        decision: 'APPROVE' | 'REJECT',
        notes: string
    ): Promise<number> {
        if (!notes || notes.trim() === '') {
            throw new Error('Notas de auditoria são obrigatórias');
        }

        const { data, error } = await supabase.rpc('admin_bulk_audit_deals', {
            p_deal_ids: dealIds,
            p_decision: decision,
            p_notes: notes.trim()
        });

        if (error) {
            console.error('Error bulk auditing deals:', error);
            throw new Error(error.message || 'Erro ao auditar negócios em lote');
        }

        return data || 0;
    }

    /**
     * Get contested deals (priority queue)
     */
    async getContestedDeals(): Promise<any[]> {
        const { data, error } = await supabase
            .from('view_admin_contested_deals')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching contested deals:', error);
            throw new Error('Erro ao buscar negócios contestados');
        }

        return data || [];
    }

    /**
     * Get high-value deals requiring audit
     */
    async getHighValueDeals(threshold: number = 10000): Promise<any[]> {
        const { data, error } = await supabase
            .from('view_admin_high_value_deals')
            .select('*')
            .gte('amount', threshold)
            .order('amount', { ascending: false });

        if (error) {
            console.error('Error fetching high-value deals:', error);
            throw new Error('Erro ao buscar negócios de alto valor');
        }

        return data || [];
    }

    /**
     * Get official rankings (audited deals only)
     */
    async getOfficialRankings(): Promise<RankingEntry[]> {
        const { data, error } = await supabase
            .from('view_admin_official_rankings')
            .select('seller_id, name, image_url, total_sales, deals_count, avg_ticket')
            .order('total_sales', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching official rankings:', error);
            throw new Error('Erro ao buscar rankings oficiais');
        }

        return (data || []).map((row, index) => ({
            rank: index + 1,
            user_id: row.seller_id,
            name: row.name,
            image_url: row.image_url,
            total_sales: row.total_sales,
            deals_count: row.deals_count,
            avg_ticket: row.avg_ticket
        }));
    }

    /**
     * Get admin KPIs for dashboard
     */
    async getAdminKPIs(month?: string): Promise<AdminKPIs> {
        const { data, error } = await supabase.rpc('get_admin_roi_kpis', {
            p_month: month || null
        });

        if (error) {
            console.error('Error fetching admin KPIs:', error);
            throw new Error('Erro ao buscar KPIs administrativos');
        }

        return data || {
            totalVolume: 0,
            avgTicket: 0,
            dealsCount: 0,
            confirmedCount: 0,
            auditedCount: 0,
            contestedCount: 0,
            invalidatedCount: 0,
            pendingCount: 0,
            highValueCount: 0
        };
    }

    /**
     * Get suspicious deals (fraud detection)
     */
    async getSuspiciousDeals(): Promise<SuspiciousDeal[]> {
        const { data, error } = await supabase
            .from('view_admin_suspicious_deals')
            .select('*')
            .order('suspicion_count', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching suspicious deals:', error);
            throw new Error('Erro ao buscar negócios suspeitos');
        }

        return data || [];
    }

    /**
     * Export rankings to CSV
     */
    async exportRankingsCSV(): Promise<string> {
        const rankings = await this.getOfficialRankings();

        // CSV Header
        let csv = 'Posição,Nome,Email,Total Vendas,Qtd Negócios,Ticket Médio\n';

        // CSV Rows
        rankings.forEach(entry => {
            csv += `${entry.rank},"${entry.name}","${entry.user_id}",${entry.total_sales},${entry.deals_count},${entry.avg_ticket}\n`;
        });

        return csv;
    }

    /**
     * Download CSV file
     */
    downloadCSV(csv: string, filename: string = 'rankings.csv') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get deal details by ID
     */
    async getDealById(dealId: string): Promise<Deal | null> {
        const { data, error } = await supabase
            .from('member_deals')
            .select(`
                *,
                seller:profiles!seller_id(id, name, email, image_url, company, job_title),
                buyer:profiles!buyer_id(id, name, email, image_url, company, job_title),
                auditor:profiles!audited_by(id, name, email)
            `)
            .eq('id', dealId)
            .single();

        if (error) {
            console.error('Error fetching deal:', error);
            return null;
        }

        return data;
    }

    /**
     * Get audit history for a deal
     */
    async getDealAuditHistory(dealId: string): Promise<any[]> {
        // This would require an audit_log table for full history
        // For now, we just return the current audit info
        const deal = await this.getDealById(dealId);

        if (!deal || !deal.audited_at) {
            return [];
        }

        return [{
            action: deal.status === 'AUDITADO' ? 'APPROVED' : 'REJECTED',
            notes: deal.audit_notes,
            audited_by: deal.auditor,
            audited_at: deal.audited_at
        }];
    }
}

export const adminBusinessService = new AdminBusinessService();
