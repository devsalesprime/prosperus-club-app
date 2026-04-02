-- ============================================
-- ANALYTICS RPCs — Migration 056
-- Prosperus Club · Março 2026
-- Move heavy aggregation from JavaScript to PostgreSQL
-- ============================================

-- ─── 1. get_daily_activity_stats ────────────────────────────────────
-- Returns daily aggregated counts for the analytics chart.
-- Replaces: getActivityByDay() which downloaded ALL rows to JS.

CREATE OR REPLACE FUNCTION public.get_daily_activity_stats(p_days INT DEFAULT 30)
RETURNS TABLE (
    activity_date TEXT,
    total        BIGINT,
    page_views   BIGINT,
    videos       BIGINT,
    messages     BIGINT
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
        TO_CHAR(d.date_day, 'YYYY-MM-DD')                       AS activity_date,
        COUNT(e.id)                                              AS total,
        COUNT(e.id) FILTER (WHERE e.event_type = 'PAGE_VIEW')    AS page_views,
        COUNT(e.id) FILTER (WHERE e.event_type IN ('VIDEO_START', 'VIDEO_COMPLETE')) AS videos,
        COUNT(e.id) FILTER (WHERE e.event_type = 'MESSAGE_SENT') AS messages
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

COMMENT ON FUNCTION public.get_daily_activity_stats IS
'Returns daily activity counts using generate_series LEFT JOIN for zero-fill. São Paulo timezone.';


-- ─── 2. get_top_content ─────────────────────────────────────────────
-- Returns top N content items by event count for a given event type.
-- Replaces: getTopVideos() and getTopArticles() which downloaded ALL
-- metadata rows to JS for counting.
--
-- Usage:
--   SELECT * FROM get_top_content('VIDEO_START', 30, 5)    -- top 5 videos last 30d
--   SELECT * FROM get_top_content('ARTICLE_READ', 7, 5)    -- top 5 articles last 7d

CREATE OR REPLACE FUNCTION public.get_top_content(
    p_event_type TEXT,
    p_days       INT DEFAULT 30,
    p_limit      INT DEFAULT 5
)
RETURNS TABLE (
    content_id    TEXT,
    content_title TEXT,
    view_count    BIGINT
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
        COALESCE(
            ae.metadata->>'video_id',
            ae.metadata->>'article_id',
            'unknown'
        )                                                       AS content_id,
        COALESCE(
            ae.metadata->>'video_title',
            ae.metadata->>'article_title',
            'Sem título'
        )                                                       AS content_title,
        COUNT(*)                                                AS view_count
    FROM public.analytics_events ae
    WHERE ae.event_type = p_event_type
      AND ae.metadata IS NOT NULL
      AND ae.created_at >= (NOW() - (p_days || ' days')::INTERVAL)
    GROUP BY content_id, content_title
    HAVING COALESCE(
        ae.metadata->>'video_id',
        ae.metadata->>'article_id',
        'unknown'
    ) != 'unknown'
    ORDER BY view_count DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_top_content IS
'Returns top N content items (videos or articles) by event count within a date range.';


-- ─── 3. get_event_type_breakdown ────────────────────────────────────
-- Returns event counts grouped by event_type for the pie chart.
-- Replaces: getEventBreakdown() which downloaded ALL event_type rows to JS.

CREATE OR REPLACE FUNCTION public.get_event_type_breakdown(p_days INT DEFAULT 30)
RETURNS TABLE (
    event_name  TEXT,
    event_count BIGINT
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
        ae.event_type                                AS event_name,
        COUNT(*)                                     AS event_count
    FROM public.analytics_events ae
    WHERE ae.created_at >= (NOW() - (p_days || ' days')::INTERVAL)
    GROUP BY ae.event_type
    ORDER BY event_count DESC;
END;
$$;

COMMENT ON FUNCTION public.get_event_type_breakdown IS
'Returns event type distribution for the admin analytics pie chart.';


-- ─── 4. get_dashboard_stats_with_trends ─────────────────────────────
-- Returns KPI counts for CURRENT period AND PREVIOUS period in one call.
-- Enables real trend calculation: ((current - previous) / previous) * 100.
-- Replaces: getDashboardStats() + hardcoded trend values.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats_with_trends(p_days INT DEFAULT 30)
RETURNS TABLE (
    -- Current period
    active_users_today  BIGINT,
    new_members         BIGINT,
    messages_sent       BIGINT,
    videos_completed    BIGINT,
    total_events        BIGINT,
    -- Previous period (for trend calculation)
    prev_new_members    BIGINT,
    prev_messages_sent  BIGINT,
    prev_videos_completed BIGINT,
    prev_total_events   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_prev_start   TIMESTAMPTZ;
    v_today_start  TIMESTAMPTZ;
BEGIN
    -- Verify caller is ADMIN or TEAM
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_today_start  := DATE_TRUNC('day', NOW());
    v_period_start := NOW() - (p_days || ' days')::INTERVAL;
    v_prev_start   := v_period_start - (p_days || ' days')::INTERVAL;

    RETURN QUERY
    SELECT
        -- Current period
        (SELECT COUNT(DISTINCT ae.user_id)
         FROM public.analytics_events ae
         WHERE ae.created_at >= v_today_start
           AND ae.user_id IS NOT NULL
        ) AS active_users_today,

        (SELECT COUNT(*)
         FROM public.profiles p
         WHERE p.created_at >= v_period_start
        ) AS new_members,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'MESSAGE_SENT'
           AND ae.created_at >= v_period_start
        ) AS messages_sent,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'VIDEO_COMPLETE'
           AND ae.created_at >= v_period_start
        ) AS videos_completed,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.created_at >= v_period_start
        ) AS total_events,

        -- Previous period
        (SELECT COUNT(*)
         FROM public.profiles p
         WHERE p.created_at >= v_prev_start
           AND p.created_at < v_period_start
        ) AS prev_new_members,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'MESSAGE_SENT'
           AND ae.created_at >= v_prev_start
           AND ae.created_at < v_period_start
        ) AS prev_messages_sent,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'VIDEO_COMPLETE'
           AND ae.created_at >= v_prev_start
           AND ae.created_at < v_period_start
        ) AS prev_videos_completed,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.created_at >= v_prev_start
           AND ae.created_at < v_period_start
        ) AS prev_total_events;
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_stats_with_trends IS
'Returns KPI counts for current and previous period, enabling real trend % calculation.';


-- ─── 5. get_benefit_engagement_stats ────────────────────────────────
-- Aggregates benefit engagement using COUNT(DISTINCT) on the server.
-- Replaces: getBenefitEngagement() which downloaded ALL visitor_ids to JS.

CREATE OR REPLACE FUNCTION public.get_benefit_engagement_stats(p_days INT DEFAULT 30)
RETURNS TABLE (
    unique_viewers   BIGINT,
    unique_clickers  BIGINT,
    total_members    BIGINT,
    engagement_rate  NUMERIC,
    conversion_rate  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_viewers  BIGINT;
    v_clickers BIGINT;
    v_members  BIGINT;
    v_start    TIMESTAMPTZ;
BEGIN
    -- Verify caller is ADMIN or TEAM
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    SELECT COUNT(DISTINCT ba.visitor_id)
    INTO v_viewers
    FROM public.benefit_analytics ba
    WHERE ba.action = 'VIEW'
      AND ba.created_at >= v_start
      AND ba.visitor_id IS NOT NULL;

    SELECT COUNT(DISTINCT ba.visitor_id)
    INTO v_clickers
    FROM public.benefit_analytics ba
    WHERE ba.action = 'CLICK'
      AND ba.created_at >= v_start
      AND ba.visitor_id IS NOT NULL;

    SELECT COUNT(*)
    INTO v_members
    FROM public.profiles;

    RETURN QUERY SELECT
        v_viewers,
        v_clickers,
        v_members,
        CASE WHEN v_members > 0
            THEN ROUND((v_viewers::NUMERIC / v_members::NUMERIC) * 100, 2)
            ELSE 0
        END,
        CASE WHEN v_viewers > 0
            THEN ROUND((v_clickers::NUMERIC / v_viewers::NUMERIC) * 100, 2)
            ELSE 0
        END;
END;
$$;

COMMENT ON FUNCTION public.get_benefit_engagement_stats IS
'Returns benefit engagement metrics using server-side COUNT(DISTINCT) instead of JS deduplication.';


-- ─── 6. get_benefit_overview_stats ──────────────────────────────────
-- Aggregates the benefit_stats view on the server.
-- Replaces: getBenefitOverview() which downloaded all stats rows for JS .reduce().

CREATE OR REPLACE FUNCTION public.get_benefit_overview_stats()
RETURNS TABLE (
    active_benefits      BIGINT,
    total_views          BIGINT,
    total_clicks         BIGINT,
    total_unique_visitors BIGINT,
    avg_ctr_percent      NUMERIC,
    benefits_with_activity BIGINT
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
        (SELECT COUNT(*)
         FROM public.profiles p
         WHERE p.exclusive_benefit IS NOT NULL
           AND p.exclusive_benefit->>'active' = 'true'
        ) AS active_benefits,

        COALESCE(SUM(vbs.total_views), 0)          AS total_views,
        COALESCE(SUM(vbs.total_clicks), 0)         AS total_clicks,
        COALESCE(SUM(vbs.unique_visitors), 0)      AS total_unique_visitors,
        CASE WHEN COALESCE(SUM(vbs.total_views), 0) > 0
            THEN ROUND(
                (COALESCE(SUM(vbs.total_clicks), 0)::NUMERIC /
                 COALESCE(SUM(vbs.total_views), 0)::NUMERIC) * 100, 2
            )
            ELSE 0
        END                                        AS avg_ctr_percent,
        COUNT(*)                                   AS benefits_with_activity
    FROM public.view_benefit_stats vbs;
END;
$$;

COMMENT ON FUNCTION public.get_benefit_overview_stats IS
'Returns aggregated benefit overview stats using server-side SUM instead of JS reduce.';


-- ============================================
-- END OF MIGRATION 056
-- ============================================
