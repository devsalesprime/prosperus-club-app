-- ============================================
-- DAILY ACCESS METRICS — Migration 060
-- Prosperus Club · Março 2026
-- RPC: total sessions + unique users per day
-- ============================================

CREATE OR REPLACE FUNCTION public.get_daily_access_metrics(p_days INT DEFAULT 30)
RETURNS TABLE (
    activity_date  TEXT,
    total_sessions BIGINT,
    unique_users   BIGINT
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
        TO_CHAR(d.date_day, 'YYYY-MM-DD')                                             AS activity_date,
        COUNT(e.id) FILTER (WHERE e.event_type IN ('APP_OPEN', 'LOGIN'))::BIGINT       AS total_sessions,
        COUNT(DISTINCT e.user_id) FILTER (WHERE e.user_id IS NOT NULL)::BIGINT         AS unique_users
    FROM generate_series(
        (CURRENT_DATE - (p_days - 1)),
        CURRENT_DATE,
        '1 day'::INTERVAL
    ) AS d(date_day)
    LEFT JOIN public.analytics_events e
        ON DATE(timezone('America/Sao_Paulo', e.created_at)) = d.date_day::DATE
    GROUP BY d.date_day
    ORDER BY d.date_day ASC;
END;
$$;

COMMENT ON FUNCTION public.get_daily_access_metrics IS
'Returns daily total sessions (APP_OPEN + LOGIN events) and unique users (DAU) for the admin analytics dashboard.';

-- ============================================
-- END OF MIGRATION 060
-- ============================================
