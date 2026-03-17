-- ============================================
-- Migration 066: Section Click Analytics RPC
-- ============================================
-- Provides aggregated click stats for Gallery, Solutions, Reports, and Files
-- Used by the Analytics Dashboard "Conteúdo" tab

-- ─── RPC: get_section_click_stats ──────────────────────────
-- Returns summary KPI counts + top items by event type for a given period
CREATE OR REPLACE FUNCTION get_section_click_stats(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_since TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
    v_excluded UUID[];
    v_result JSONB;
BEGIN
    -- Get excluded user IDs
    SELECT ARRAY_AGG(user_id) INTO v_excluded
    FROM analytics_excluded_users;

    -- Build result with KPIs and top items
    SELECT jsonb_build_object(
        'kpis', (
            SELECT jsonb_build_object(
                'gallery_views', COALESCE(SUM(CASE WHEN event_type = 'GALLERY_VIEW' THEN 1 ELSE 0 END), 0),
                'solution_clicks', COALESCE(SUM(CASE WHEN event_type = 'TOOL_VIEW' THEN 1 ELSE 0 END), 0),
                'report_views', COALESCE(SUM(CASE WHEN event_type = 'REPORT_VIEW' THEN 1 ELSE 0 END), 0),
                'file_downloads', COALESCE(SUM(CASE WHEN event_type = 'FILE_DOWNLOAD' THEN 1 ELSE 0 END), 0)
            )
            FROM analytics_events
            WHERE created_at >= v_since
              AND event_type IN ('GALLERY_VIEW', 'TOOL_VIEW', 'REPORT_VIEW', 'FILE_DOWNLOAD')
              AND (v_excluded IS NULL OR user_id != ALL(v_excluded))
        ),
        'top_galleries', (
            SELECT COALESCE(jsonb_agg(row_to_json(g)), '[]'::jsonb)
            FROM (
                SELECT
                    metadata->>'album_title' AS name,
                    COUNT(*) AS count
                FROM analytics_events
                WHERE event_type = 'GALLERY_VIEW'
                  AND created_at >= v_since
                  AND metadata->>'album_title' IS NOT NULL
                  AND (v_excluded IS NULL OR user_id != ALL(v_excluded))
                GROUP BY metadata->>'album_title'
                ORDER BY count DESC
                LIMIT 5
            ) g
        ),
        'top_solutions', (
            SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb)
            FROM (
                SELECT
                    metadata->>'tool_name' AS name,
                    COUNT(*) AS count
                FROM analytics_events
                WHERE event_type = 'TOOL_VIEW'
                  AND created_at >= v_since
                  AND metadata->>'tool_name' IS NOT NULL
                  AND (v_excluded IS NULL OR user_id != ALL(v_excluded))
                GROUP BY metadata->>'tool_name'
                ORDER BY count DESC
                LIMIT 5
            ) s
        ),
        'top_reports', (
            SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
            FROM (
                SELECT
                    metadata->>'report_name' AS name,
                    COUNT(*) AS count
                FROM analytics_events
                WHERE event_type = 'REPORT_VIEW'
                  AND created_at >= v_since
                  AND metadata->>'report_name' IS NOT NULL
                  AND (v_excluded IS NULL OR user_id != ALL(v_excluded))
                GROUP BY metadata->>'report_name'
                ORDER BY count DESC
                LIMIT 5
            ) r
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;
