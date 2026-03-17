-- ============================================
-- USER ACTIVITY DETAIL — Migration 062
-- Prosperus Club · Março 2026
-- RPCs for single-user analytics deep-dive
-- ============================================

-- ─── 1) User Activity Summary ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
    event_type    TEXT,
    event_count   BIGINT,
    last_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify caller is ADMIN or TEAM
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        ae.event_type::TEXT,
        COUNT(*)::BIGINT           AS event_count,
        MAX(ae.created_at)         AS last_at
    FROM analytics_events ae
    WHERE ae.user_id = p_user_id
      AND ae.created_at >= (NOW() - (p_days || ' days')::INTERVAL)
    GROUP BY ae.event_type
    ORDER BY event_count DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_activity_summary IS
'Returns event type breakdown for a specific user. Admin only.';

-- ─── 2) User Activity Timeline ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_activity_timeline(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
    activity_date  TEXT,
    event_count    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        TO_CHAR(d.date_day, 'YYYY-MM-DD')::TEXT  AS activity_date,
        COALESCE(COUNT(ae.id), 0)::BIGINT         AS event_count
    FROM generate_series(
        (CURRENT_DATE - (p_days - 1)),
        CURRENT_DATE,
        '1 day'::INTERVAL
    ) AS d(date_day)
    LEFT JOIN analytics_events ae
        ON DATE(timezone('America/Sao_Paulo', ae.created_at)) = d.date_day::DATE
        AND ae.user_id = p_user_id
    GROUP BY d.date_day
    ORDER BY d.date_day ASC;
END;
$$;

COMMENT ON FUNCTION public.get_user_activity_timeline IS
'Returns daily event counts for a specific user. Admin only.';

-- ─── 3) User Recent Events ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_recent_events(p_user_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
    event_id    UUID,
    event_type  TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        ae.id           AS event_id,
        ae.event_type::TEXT,
        ae.metadata,
        ae.created_at
    FROM analytics_events ae
    WHERE ae.user_id = p_user_id
    ORDER BY ae.created_at DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_user_recent_events IS
'Returns recent events for a specific user. Admin only.';

-- ============================================
-- END OF MIGRATION 062
-- ============================================
