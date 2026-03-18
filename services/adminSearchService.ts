// ============================================
// ADMIN SEARCH SERVICE
// ============================================
// Multi-entity search for Admin panel.
// Searches members, events, and deals in parallel.
// Admin has broader access than member search — no RLS filter on role.

import { supabase } from '../lib/supabase';

// ─── Result Types ────────────────────────────────────────────

export interface AdminSearchMember {
    id: string;
    name: string;
    email: string;
    company: string | null;
    image_url: string | null;
    role: string;
}

export interface AdminSearchEvent {
    id: string;
    title: string;
    date: string;
    type: string | null;
    category: string | null;
}

export interface AdminSearchDeal {
    id: string;
    description: string;
    amount: number;
    status: string;
    deal_date: string;
    seller_name: string | null;
    buyer_name: string | null;
}

export interface AdminSearchResults {
    members: AdminSearchMember[];
    events: AdminSearchEvent[];
    deals: AdminSearchDeal[];
}

const EMPTY: AdminSearchResults = { members: [], events: [], deals: [] };

// ─── Service ────────────────────────────────────────────────

class AdminSearchService {
    /**
     * Global admin search across members, events, and deals.
     * Requires min 3 characters. Returns max 5 per category.
     */
    async search(query: string): Promise<AdminSearchResults> {
        if (!query || query.trim().length < 3) return EMPTY;

        const term = `%${query.trim()}%`;

        try {
            const [membersRes, eventsRes, dealsRes] = await Promise.all([
                // Members — search name, email, company (all roles visible to admin)
                supabase
                    .from('profiles')
                    .select('id, name, email, company, image_url, role')
                    .or(`name.ilike.${term},email.ilike.${term},company.ilike.${term}`)
                    .order('name')
                    .limit(5),

                // Events — search by title
                supabase
                    .from('club_events')
                    .select('id, title, date, type, category')
                    .ilike('title', term)
                    .order('date', { ascending: false })
                    .limit(5),

                // Deals — search by description (join seller/buyer names)
                supabase
                    .from('member_deals')
                    .select(`
                        id, description, amount, status, deal_date,
                        seller:profiles!seller_id(name),
                        buyer:profiles!buyer_id(name)
                    `)
                    .ilike('description', term)
                    .order('deal_date', { ascending: false })
                    .limit(5),
            ]);

            const members: AdminSearchMember[] = membersRes.error
                ? []
                : (membersRes.data as AdminSearchMember[]) || [];

            const events: AdminSearchEvent[] = eventsRes.error
                ? []
                : (eventsRes.data as AdminSearchEvent[]) || [];

            const deals: AdminSearchDeal[] = dealsRes.error
                ? []
                : (dealsRes.data || []).map((d: any) => ({
                    id: d.id,
                    description: d.description,
                    amount: d.amount,
                    status: d.status,
                    deal_date: d.deal_date,
                    seller_name: d.seller?.name || null,
                    buyer_name: d.buyer?.name || null,
                }));

            return { members, events, deals };
        } catch (err) {
            console.error('[AdminSearch] Error:', err);
            return EMPTY;
        }
    }

    hasResults(r: AdminSearchResults): boolean {
        return r.members.length > 0 || r.events.length > 0 || r.deals.length > 0;
    }
}

export const adminSearchService = new AdminSearchService();
