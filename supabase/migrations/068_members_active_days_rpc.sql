-- ============================================
-- MEMBERS ACTIVE DAYS COUNT — Migration 068
-- Prosperus Club · Março 2026
-- RPC: returns count of distinct active days per user from analytics_events
-- Used by admin MembersModule filters
-- ============================================

CREATE OR REPLACE FUNCTION public.get_members_active_days_count()
RETURNS TABLE (
    user_id     UUID,
    active_days BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ae.user_id, COUNT(DISTINCT ae.created_at::date) AS active_days
    FROM analytics_events ae
    WHERE ae.user_id IS NOT NULL
    GROUP BY ae.user_id;
$$;

COMMENT ON FUNCTION public.get_members_active_days_count IS
'Returns the number of distinct days each user had activity. Used in admin Members filters.';

-- ============================================
-- END OF MIGRATION 068
-- ============================================
