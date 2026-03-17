-- ============================================
-- Migration 067: Exclude users from ALL remaining analytics RPCs
-- ============================================
-- Updates RPCs from migrations 057 (business BI) and 058 (files)
-- to filter out users in analytics_excluded_users table.
-- Migration 065 already handled: get_daily_activity_stats,
-- get_top_content, get_event_type_breakdown,
-- get_dashboard_stats_with_trends, get_daily_access_metrics,
-- get_benefit_engagement_stats.
-- Migration 066 already handled: get_section_click_stats.
-- This migration handles the remaining 7 RPCs.

-- ═══════════════════════════════════════════════════════════════
-- 1. UPDATED: get_networking_funnel (from 057)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_networking_funnel(p_days INT DEFAULT 30)
RETURNS TABLE (
    total_referrals    BIGINT,
    total_deals        BIGINT,
    audited_deals      BIGINT,
    audited_volume     NUMERIC,
    conversion_rate    NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrals   BIGINT;
    v_deals       BIGINT;
    v_audited     BIGINT;
    v_volume      NUMERIC;
    v_start       TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    SELECT COUNT(*)
    INTO v_referrals
    FROM public.member_referrals mr
    WHERE mr.created_at >= v_start
      AND mr.referrer_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    SELECT COUNT(*)
    INTO v_deals
    FROM public.member_deals md
    WHERE md.created_at >= v_start
      AND md.seller_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    SELECT COUNT(*), COALESCE(SUM(md.amount), 0)
    INTO v_audited, v_volume
    FROM public.member_deals md
    WHERE md.audited_at IS NOT NULL
      AND md.audited_at >= v_start
      AND md.seller_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    RETURN QUERY SELECT
        v_referrals,
        v_deals,
        v_audited,
        v_volume,
        CASE WHEN v_referrals > 0
            THEN ROUND((v_audited::NUMERIC / v_referrals::NUMERIC) * 100, 2)
            ELSE 0
        END;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 2. UPDATED: get_top_roi_members (from 057)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_top_roi_members(
    p_days  INT DEFAULT 30,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    member_id    UUID,
    member_name  TEXT,
    member_image TEXT,
    deal_count   BIGINT,
    total_volume NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        p.id                             AS member_id,
        p.name                           AS member_name,
        p.image_url                      AS member_image,
        COUNT(d.id)                      AS deal_count,
        COALESCE(SUM(d.amount), 0)       AS total_volume
    FROM public.member_deals d
    JOIN public.profiles p ON d.seller_id = p.id
    WHERE d.audited_at IS NOT NULL
      AND d.audited_at >= (NOW() - (p_days || ' days')::INTERVAL)
      AND p.id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex)
    GROUP BY p.id, p.name, p.image_url
    ORDER BY total_volume DESC
    LIMIT p_limit;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 3. UPDATED: get_churn_risk_members (from 057)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_churn_risk_members(p_days_inactive INT DEFAULT 14)
RETURNS TABLE (
    member_id       UUID,
    member_name     TEXT,
    member_email    TEXT,
    member_image    TEXT,
    member_phone    TEXT,
    last_access     TIMESTAMPTZ,
    days_inactive   INT,
    deals_last_60d  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        p.id                                                    AS member_id,
        p.name                                                  AS member_name,
        p.email                                                 AS member_email,
        p.image_url                                             AS member_image,
        p.phone                                                 AS member_phone,
        latest_event.last_access                                AS last_access,
        EXTRACT(DAY FROM NOW() - COALESCE(latest_event.last_access, p.created_at))::INT AS days_inactive,
        COALESCE(recent_deals.cnt, 0)                           AS deals_last_60d
    FROM public.profiles p

    LEFT JOIN LATERAL (
        SELECT MAX(ae.created_at) AS last_access
        FROM public.analytics_events ae
        WHERE ae.user_id = p.id
          AND ae.event_type IN ('APP_OPEN', 'LOGIN')
    ) latest_event ON true

    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM public.member_deals d
        WHERE (d.seller_id = p.id OR d.buyer_id = p.id)
          AND d.created_at >= (NOW() - INTERVAL '60 days')
    ) recent_deals ON true

    WHERE p.is_active = true
      AND p.role = 'MEMBER'
      AND p.id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex)
      AND (
          latest_event.last_access IS NULL
          OR latest_event.last_access < (NOW() - (p_days_inactive || ' days')::INTERVAL)
      )
      AND COALESCE(recent_deals.cnt, 0) = 0

    ORDER BY days_inactive DESC;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 4. UPDATED: get_academy_completion_rate (from 057)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_academy_completion_rate(p_days INT DEFAULT 30)
RETURNS TABLE (
    videos_started   BIGINT,
    videos_completed BIGINT,
    completion_rate   NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_started   BIGINT;
    v_completed BIGINT;
    v_start     TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    SELECT COUNT(*)
    INTO v_started
    FROM public.analytics_events ae
    WHERE ae.event_type = 'VIDEO_START'
      AND ae.created_at >= v_start
      AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex));

    SELECT COUNT(*)
    INTO v_completed
    FROM public.analytics_events ae
    WHERE ae.event_type = 'VIDEO_COMPLETE'
      AND ae.created_at >= v_start
      AND (ae.user_id IS NULL OR ae.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex));

    RETURN QUERY SELECT
        v_started,
        v_completed,
        CASE WHEN v_started > 0
            THEN ROUND((v_completed::NUMERIC / v_started::NUMERIC) * 100, 2)
            ELSE 0
        END;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 5. UPDATED: get_event_attendance_rate (from 057)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_event_attendance_rate(p_days INT DEFAULT 30)
RETURNS TABLE (
    total_rsvps      BIGINT,
    total_checkins   BIGINT,
    attendance_rate  NUMERIC,
    no_show_count    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rsvps    BIGINT;
    v_checkins BIGINT;
    v_start    TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    SELECT COUNT(*)
    INTO v_rsvps
    FROM public.event_rsvps er
    JOIN public.club_events ce ON er.event_id = ce.id
    WHERE er.status = 'CONFIRMED'
      AND ce.date >= v_start
      AND er.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    SELECT COUNT(*)
    INTO v_checkins
    FROM public.event_rsvps er
    JOIN public.club_events ce ON er.event_id = ce.id
    WHERE er.checked_in = true
      AND ce.date >= v_start
      AND er.user_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex);

    RETURN QUERY SELECT
        v_rsvps,
        v_checkins,
        CASE WHEN v_rsvps > 0
            THEN ROUND((v_checkins::NUMERIC / v_rsvps::NUMERIC) * 100, 2)
            ELSE 0
        END,
        GREATEST(v_rsvps - v_checkins, 0);
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 6. UPDATED: get_file_download_stats (from 058)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_file_download_stats(
  p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
  file_id          UUID,
  title            TEXT,
  file_type        TEXT,
  category         TEXT,
  total_downloads  BIGINT,
  unique_downloaders BIGINT,
  last_downloaded  TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    f.id,
    f.title,
    f.file_type,
    f.category,
    COUNT(d.id)               AS total_downloads,
    COUNT(DISTINCT d.user_id) AS unique_downloaders,
    MAX(d.downloaded_at)      AS last_downloaded
  FROM member_files f
  LEFT JOIN file_downloads d ON d.file_id = f.id
    AND (
      p_period = 'all'
      OR d.downloaded_at > NOW() - (p_period::INTERVAL)
    )
    AND (d.user_id IS NULL OR d.user_id NOT IN (SELECT aex.user_id FROM analytics_excluded_users aex))
  GROUP BY f.id, f.title, f.file_type, f.category
  ORDER BY total_downloads DESC;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 7. UPDATED: get_top_file_downloaders (from 058)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_top_file_downloaders(
  p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
  user_id         UUID,
  user_name       TEXT,
  user_image      TEXT,
  user_company    TEXT,
  total_downloads BIGINT,
  unique_files    BIGINT,
  last_download   TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.name,
    p.image_url,
    p.company,
    COUNT(d.id)              AS total_downloads,
    COUNT(DISTINCT d.file_id) AS unique_files,
    MAX(d.downloaded_at)     AS last_download
  FROM file_downloads d
  JOIN profiles p ON p.id = d.user_id
  WHERE (
    p_period = 'all'
    OR d.downloaded_at > NOW() - (p_period::INTERVAL)
  )
  AND p.id NOT IN (SELECT aex.user_id FROM analytics_excluded_users aex)
  GROUP BY p.id, p.name, p.image_url, p.company
  ORDER BY total_downloads DESC
  LIMIT 20;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 8. UPDATED: view_benefit_stats (from 035)
-- ═══════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_benefit_stats CASCADE;

CREATE VIEW public.view_benefit_stats AS
SELECT
    benefit_owner_id,
    COUNT(*) FILTER (WHERE action = 'VIEW') AS total_views,
    COUNT(*) FILTER (WHERE action = 'CLICK') AS total_clicks,
    COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'VIEW') AS unique_visitors,
    COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'CLICK') AS unique_conversions,
    CASE
        WHEN COUNT(*) FILTER (WHERE action = 'VIEW') > 0
        THEN ROUND(
            (COUNT(*) FILTER (WHERE action = 'CLICK')::NUMERIC /
             COUNT(*) FILTER (WHERE action = 'VIEW')::NUMERIC) * 100, 2)
        ELSE 0
    END AS ctr_percent,
    CASE
        WHEN COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'VIEW') > 0
        THEN ROUND(
            (COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'CLICK')::NUMERIC /
             COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'VIEW')::NUMERIC) * 100, 2)
        ELSE 0
    END AS engagement_rate,
    MIN(created_at) FILTER (WHERE action = 'VIEW') AS first_view_at,
    MAX(created_at) AS last_activity_at
FROM public.benefit_analytics
WHERE visitor_id IS NULL
   OR visitor_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex)
GROUP BY benefit_owner_id;


-- ═══════════════════════════════════════════════════════════════
-- 9. UPDATED: view_top_benefits (from 035)
-- ═══════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_top_benefits CASCADE;

CREATE VIEW public.view_top_benefits AS
SELECT
    ba.benefit_owner_id,
    p.name AS owner_name,
    p.image_url AS owner_image,
    p.exclusive_benefit->>'title' AS benefit_title,
    COUNT(*) FILTER (WHERE ba.action = 'VIEW') AS total_views,
    COUNT(*) FILTER (WHERE ba.action = 'CLICK') AS total_clicks,
    COUNT(DISTINCT ba.visitor_id) FILTER (WHERE ba.action = 'VIEW') AS unique_visitors,
    COUNT(DISTINCT ba.visitor_id) FILTER (WHERE ba.action = 'CLICK') AS unique_conversions,
    CASE
        WHEN COUNT(*) FILTER (WHERE ba.action = 'VIEW') > 0
        THEN ROUND(
            (COUNT(*) FILTER (WHERE ba.action = 'CLICK')::NUMERIC /
             COUNT(*) FILTER (WHERE ba.action = 'VIEW')::NUMERIC) * 100, 2)
        ELSE 0
    END AS ctr_percent
FROM public.benefit_analytics ba
JOIN public.profiles p ON ba.benefit_owner_id = p.id
WHERE p.exclusive_benefit->>'active' = 'true'
  AND (ba.visitor_id IS NULL
       OR ba.visitor_id NOT IN (SELECT aex.user_id FROM public.analytics_excluded_users aex))
GROUP BY ba.benefit_owner_id, p.name, p.image_url, p.exclusive_benefit->>'title'
ORDER BY total_clicks DESC;


-- ═══════════════════════════════════════════════════════════════
-- 10. UPDATED: get_my_benefit_stats (from 035) — reads from updated view
-- ═══════════════════════════════════════════════════════════════
-- No change needed — get_my_benefit_stats reads from view_benefit_stats which is now filtered.

-- ═══════════════════════════════════════════════════════════════
-- 11. UPDATED: get_top_benefits (from 035) — reads from updated view
-- ═══════════════════════════════════════════════════════════════
-- No change needed — get_top_benefits reads from view_top_benefits which is now filtered.


-- ============================================
-- END OF MIGRATION 067
-- ============================================
