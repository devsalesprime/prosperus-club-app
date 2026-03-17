-- ============================================
-- ANALYTICS EXCLUDED USERS — Migration 065
-- Prosperus Club · Março 2026
-- Table to exclude admin/test users from analytics
-- + Update ALL aggregate RPCs to filter them out
-- ============================================

-- ─── 1. Exclusion Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_excluded_users (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email      TEXT NOT NULL,
    reason     TEXT DEFAULT 'admin/teste',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.analytics_excluded_users ENABLE ROW LEVEL SECURITY;

-- Only ADMIN can manage exclusions
CREATE POLICY "admin_manage_exclusions" ON public.analytics_excluded_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

COMMENT ON TABLE public.analytics_excluded_users IS
'Users to exclude from analytics aggregation (admins, testers). Managed via admin panel.';


-- ─── 2. Helper: list excluded user_ids ──────────────────────────────
-- Reusable subquery for all RPCs
-- Usage: WHERE ae.user_id NOT IN (SELECT user_id FROM analytics_excluded_users)

-- ─── 3. RPC: get_excluded_user_ids (for frontend listing) ──────────
CREATE OR REPLACE FUNCTION public.get_analytics_excluded_users()
RETURNS TABLE (
    id         UUID,
    user_id    UUID,
    email      TEXT,
    reason     TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND role = 'ADMIN'
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT aeu.id, aeu.user_id, aeu.email, aeu.reason, aeu.created_at
    FROM public.analytics_excluded_users aeu
    ORDER BY aeu.created_at DESC;
END;
$$;

-- ─── 4. RPC: add exclusion ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_analytics_exclusion(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND role = 'ADMIN'
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    -- Get email from profiles
    SELECT p.email INTO v_email FROM public.profiles p WHERE p.id = p_user_id;
    IF v_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO public.analytics_excluded_users (user_id, email)
    VALUES (p_user_id, v_email)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- ─── 5. RPC: remove exclusion ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.remove_analytics_exclusion(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND role = 'ADMIN'
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    DELETE FROM public.analytics_excluded_users WHERE user_id = p_user_id;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- UPDATE AGGREGATE RPCs — Add NOT IN (excluded) filter
-- ═══════════════════════════════════════════════════════════════

-- ─── 6. UPDATED: get_daily_activity_stats (from 056) ────────────────
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
        AND (e.user_id IS NULL OR e.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
    GROUP BY d.date_day
    ORDER BY d.date_day ASC;
END;
$$;


-- ─── 7. UPDATED: get_top_content (from 056) ────────────────────────
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
      AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
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


-- ─── 8. UPDATED: get_event_type_breakdown (from 056) ────────────────
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
      AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
    GROUP BY ae.event_type
    ORDER BY event_count DESC;
END;
$$;


-- ─── 9. UPDATED: get_dashboard_stats_with_trends (from 056) ────────
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_with_trends(p_days INT DEFAULT 30)
RETURNS TABLE (
    active_users_today  BIGINT,
    new_members         BIGINT,
    messages_sent       BIGINT,
    videos_completed    BIGINT,
    total_events        BIGINT,
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
        (SELECT COUNT(DISTINCT ae.user_id)
         FROM public.analytics_events ae
         WHERE ae.created_at >= v_today_start
           AND ae.user_id IS NOT NULL
           AND ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex)
        ) AS active_users_today,

        (SELECT COUNT(*)
         FROM public.profiles p
         WHERE p.created_at >= v_period_start
           AND p.id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex)
        ) AS new_members,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'MESSAGE_SENT'
           AND ae.created_at >= v_period_start
           AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
        ) AS messages_sent,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'VIDEO_COMPLETE'
           AND ae.created_at >= v_period_start
           AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
        ) AS videos_completed,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.created_at >= v_period_start
           AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
        ) AS total_events,

        -- Previous period
        (SELECT COUNT(*)
         FROM public.profiles p
         WHERE p.created_at >= v_prev_start
           AND p.created_at < v_period_start
           AND p.id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex)
        ) AS prev_new_members,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'MESSAGE_SENT'
           AND ae.created_at >= v_prev_start
           AND ae.created_at < v_period_start
           AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
        ) AS prev_messages_sent,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.event_type = 'VIDEO_COMPLETE'
           AND ae.created_at >= v_prev_start
           AND ae.created_at < v_period_start
           AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
        ) AS prev_videos_completed,

        (SELECT COUNT(*)
         FROM public.analytics_events ae
         WHERE ae.created_at >= v_prev_start
           AND ae.created_at < v_period_start
           AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
        ) AS prev_total_events;
END;
$$;


-- ─── 10. UPDATED: get_daily_access_metrics (from 060) ──────────────
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
        AND (e.user_id IS NULL OR e.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
    GROUP BY d.date_day
    ORDER BY d.date_day ASC;
END;
$$;


-- ─── 11. UPDATED: get_benefit_engagement_stats (from 056) ──────────
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
      AND ba.visitor_id IS NOT NULL
      AND ba.visitor_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    SELECT COUNT(DISTINCT ba.visitor_id)
    INTO v_clickers
    FROM public.benefit_analytics ba
    WHERE ba.action = 'CLICK'
      AND ba.created_at >= v_start
      AND ba.visitor_id IS NOT NULL
      AND ba.visitor_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    SELECT COUNT(*)
    INTO v_members
    FROM public.profiles p
    WHERE p.id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

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


-- ============================================
-- END OF MIGRATION 065
-- ============================================
