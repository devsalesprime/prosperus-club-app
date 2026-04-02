-- ============================================
-- MEMBER LAST ACTIVITY — Migration 059
-- Prosperus Club · Março 2026
-- RPC: returns last activity timestamp per user from analytics_events
-- ============================================

CREATE OR REPLACE FUNCTION public.get_members_with_last_activity()
RETURNS TABLE (
    user_id   UUID,
    last_seen TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ae.user_id, MAX(ae.created_at) AS last_seen
    FROM analytics_events ae
    WHERE ae.user_id IS NOT NULL
    GROUP BY ae.user_id;
$$;

COMMENT ON FUNCTION public.get_members_with_last_activity IS
'Returns the last activity timestamp for each user. Used in admin Members table.';

-- ============================================
-- END OF MIGRATION 059
-- ============================================
