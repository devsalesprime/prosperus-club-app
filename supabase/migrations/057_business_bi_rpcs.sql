-- ============================================
-- BUSINESS BI RPCs — Migration 057
-- Prosperus Club · Março 2026
-- Fase B.1: Inteligência de Negócios no PostgreSQL
-- ============================================

-- ─── 0. Schema: adicionar checked_in ao event_rsvps ──────────────
ALTER TABLE public.event_rsvps
    ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_event_rsvps_checked_in
    ON public.event_rsvps(event_id, checked_in)
    WHERE checked_in = true;

COMMENT ON COLUMN public.event_rsvps.checked_in IS
'Flag de presença real no evento. Setado pelo admin no check-in.';


-- ─── 1. get_networking_funnel ───────────────────────────────────────
-- Funil de networking: Indicações → Negócios Criados → Negócios Auditados
-- Mede velocidade do pipeline de valor do clube

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
    -- Admin only
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    -- Indicações criadas no período
    SELECT COUNT(*)
    INTO v_referrals
    FROM public.member_referrals
    WHERE created_at >= v_start;

    -- Negócios criados no período
    SELECT COUNT(*)
    INTO v_deals
    FROM public.member_deals
    WHERE created_at >= v_start;

    -- Negócios auditados no período (audited_at IS NOT NULL dentro do range)
    SELECT COUNT(*), COALESCE(SUM(amount), 0)
    INTO v_audited, v_volume
    FROM public.member_deals
    WHERE audited_at IS NOT NULL
      AND audited_at >= v_start;

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

COMMENT ON FUNCTION public.get_networking_funnel IS
'Returns networking pipeline funnel: referrals → deals → audited deals with volume.';


-- ─── 2. get_top_roi_members ─────────────────────────────────────────
-- Top sócios por volume de negócios auditados
-- Prova de valor para renovação de mensalidade

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
    -- Admin only
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
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
    GROUP BY p.id, p.name, p.image_url
    ORDER BY total_volume DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_top_roi_members IS
'Returns top N members ranked by audited deal volume within a date range.';


-- ─── 3. get_churn_risk_members ──────────────────────────────────────
-- Sócios em risco de churn:
--   1. is_active = true AND role = 'MEMBER'
--   2. Último login/app_open há mais de p_days_inactive dias
--   3. Nenhum deal (seller ou buyer) nos últimos 60 dias

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
    -- Admin only
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
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

    -- Subquery: último evento de login/app_open
    LEFT JOIN LATERAL (
        SELECT MAX(ae.created_at) AS last_access
        FROM public.analytics_events ae
        WHERE ae.user_id = p.id
          AND ae.event_type IN ('APP_OPEN', 'LOGIN')
    ) latest_event ON true

    -- Subquery: deals nos últimos 60 dias (como seller ou buyer)
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM public.member_deals d
        WHERE (d.seller_id = p.id OR d.buyer_id = p.id)
          AND d.created_at >= (NOW() - INTERVAL '60 days')
    ) recent_deals ON true

    WHERE p.is_active = true
      AND p.role = 'MEMBER'
      AND (
          latest_event.last_access IS NULL
          OR latest_event.last_access < (NOW() - (p_days_inactive || ' days')::INTERVAL)
      )
      AND COALESCE(recent_deals.cnt, 0) = 0

    ORDER BY days_inactive DESC;
END;
$$;

COMMENT ON FUNCTION public.get_churn_risk_members IS
'Returns active members at churn risk: inactive for N+ days AND zero deals in last 60 days.';


-- ─── 4. get_academy_completion_rate ─────────────────────────────────
-- Taxa de conclusão: VIDEO_COMPLETE / VIDEO_START
-- Mede qualidade do conteúdo educacional

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
    -- Admin only
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    SELECT COUNT(*)
    INTO v_started
    FROM public.analytics_events
    WHERE event_type = 'VIDEO_START'
      AND created_at >= v_start;

    SELECT COUNT(*)
    INTO v_completed
    FROM public.analytics_events
    WHERE event_type = 'VIDEO_COMPLETE'
      AND created_at >= v_start;

    RETURN QUERY SELECT
        v_started,
        v_completed,
        CASE WHEN v_started > 0
            THEN ROUND((v_completed::NUMERIC / v_started::NUMERIC) * 100, 2)
            ELSE 0
        END;
END;
$$;

COMMENT ON FUNCTION public.get_academy_completion_rate IS
'Returns VIDEO_START vs VIDEO_COMPLETE counts and completion percentage.';


-- ─── 5. get_event_attendance_rate ───────────────────────────────────
-- Taxa de presença: check-ins / RSVPs confirmados
-- Dimensiona capacidade e follow-up de no-shows

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
    -- Admin only
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    v_start := NOW() - (p_days || ' days')::INTERVAL;

    -- RSVPs confirmados em eventos dentro do período
    SELECT COUNT(*)
    INTO v_rsvps
    FROM public.event_rsvps er
    JOIN public.club_events ce ON er.event_id = ce.id
    WHERE er.status = 'CONFIRMED'
      AND ce.date >= v_start;

    -- Check-ins em eventos dentro do período
    SELECT COUNT(*)
    INTO v_checkins
    FROM public.event_rsvps er
    JOIN public.club_events ce ON er.event_id = ce.id
    WHERE er.checked_in = true
      AND ce.date >= v_start;

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

COMMENT ON FUNCTION public.get_event_attendance_rate IS
'Returns RSVP vs check-in counts, attendance rate, and no-show count.';


-- ============================================
-- END OF MIGRATION 057
-- ============================================
