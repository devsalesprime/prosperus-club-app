-- ============================================
-- BENEFIT ANALYTICS - Migration 035
-- Prosperus Club App v2.8
-- Rastreamento de Views e Clicks nos Benefícios
-- ============================================

-- 1. TABELA benefit_analytics
CREATE TABLE IF NOT EXISTS public.benefit_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benefit_owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('VIEW', 'CLICK')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ÍNDICES para Performance (Agregações Rápidas)
CREATE INDEX IF NOT EXISTS idx_benefit_owner ON public.benefit_analytics(benefit_owner_id);
CREATE INDEX IF NOT EXISTS idx_benefit_action ON public.benefit_analytics(action);
CREATE INDEX IF NOT EXISTS idx_benefit_owner_action ON public.benefit_analytics(benefit_owner_id, action);
CREATE INDEX IF NOT EXISTS idx_benefit_visitor ON public.benefit_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_benefit_created ON public.benefit_analytics(created_at DESC);

-- 3. RLS POLICIES
ALTER TABLE public.benefit_analytics ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir analytics (fire-and-forget)
CREATE POLICY "Authenticated users can track analytics"
ON public.benefit_analytics FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários podem ver analytics dos seus próprios benefícios
CREATE POLICY "Users can view their own benefit analytics"
ON public.benefit_analytics FOR SELECT
USING (auth.uid() = benefit_owner_id);

-- Admins podem ver todos os analytics
CREATE POLICY "Admins can view all analytics"
ON public.benefit_analytics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    )
);

-- 4. VIEW AGREGADA: view_benefit_stats
-- Drop existing view to avoid column name conflicts
DROP VIEW IF EXISTS public.view_benefit_stats CASCADE;

CREATE VIEW public.view_benefit_stats AS
SELECT 
    benefit_owner_id,
    
    -- Contadores
    COUNT(*) FILTER (WHERE action = 'VIEW') AS total_views,
    COUNT(*) FILTER (WHERE action = 'CLICK') AS total_clicks,
    COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'VIEW') AS unique_visitors,
    COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'CLICK') AS unique_conversions,
    
    -- CTR (Click-Through Rate)
    CASE 
        WHEN COUNT(*) FILTER (WHERE action = 'VIEW') > 0 
        THEN ROUND(
            (COUNT(*) FILTER (WHERE action = 'CLICK')::NUMERIC / 
             COUNT(*) FILTER (WHERE action = 'VIEW')::NUMERIC) * 100, 
            2
        )
        ELSE 0 
    END AS ctr_percent,
    
    -- Engagement Rate (Unique Conversions / Unique Visitors)
    CASE 
        WHEN COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'VIEW') > 0 
        THEN ROUND(
            (COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'CLICK')::NUMERIC / 
             COUNT(DISTINCT visitor_id) FILTER (WHERE action = 'VIEW')::NUMERIC) * 100, 
            2
        )
        ELSE 0 
    END AS engagement_rate,
    
    -- Timestamps
    MIN(created_at) FILTER (WHERE action = 'VIEW') AS first_view_at,
    MAX(created_at) AS last_activity_at
    
FROM public.benefit_analytics
GROUP BY benefit_owner_id;

-- 5. VIEW PARA ADMIN: Top Benefícios
-- Drop existing view to avoid conflicts
DROP VIEW IF EXISTS public.view_top_benefits CASCADE;

CREATE VIEW public.view_top_benefits AS
SELECT 
    ba.benefit_owner_id,
    p.name AS owner_name,
    p.image_url AS owner_image,
    p.exclusive_benefit->>'title' AS benefit_title,
    
    -- Métricas
    COUNT(*) FILTER (WHERE ba.action = 'VIEW') AS total_views,
    COUNT(*) FILTER (WHERE ba.action = 'CLICK') AS total_clicks,
    COUNT(DISTINCT ba.visitor_id) FILTER (WHERE ba.action = 'VIEW') AS unique_visitors,
    COUNT(DISTINCT ba.visitor_id) FILTER (WHERE ba.action = 'CLICK') AS unique_conversions,
    
    -- CTR
    CASE 
        WHEN COUNT(*) FILTER (WHERE ba.action = 'VIEW') > 0 
        THEN ROUND(
            (COUNT(*) FILTER (WHERE ba.action = 'CLICK')::NUMERIC / 
             COUNT(*) FILTER (WHERE ba.action = 'VIEW')::NUMERIC) * 100, 
            2
        )
        ELSE 0 
    END AS ctr_percent
    
FROM public.benefit_analytics ba
JOIN public.profiles p ON ba.benefit_owner_id = p.id
WHERE p.exclusive_benefit->>'active' = 'true'
GROUP BY ba.benefit_owner_id, p.name, p.image_url, p.exclusive_benefit->>'title'
ORDER BY total_clicks DESC;

-- 6. FUNÇÃO RPC: Obter estatísticas do próprio benefício
CREATE OR REPLACE FUNCTION public.get_my_benefit_stats()
RETURNS TABLE (
    total_views BIGINT,
    total_clicks BIGINT,
    unique_visitors BIGINT,
    unique_conversions BIGINT,
    ctr_percent NUMERIC,
    engagement_rate NUMERIC,
    first_view_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vbs.total_views,
        vbs.total_clicks,
        vbs.unique_visitors,
        vbs.unique_conversions,
        vbs.ctr_percent,
        vbs.engagement_rate,
        vbs.first_view_at,
        vbs.last_activity_at
    FROM public.view_benefit_stats vbs
    WHERE vbs.benefit_owner_id = auth.uid();
END;
$$;

-- 7. FUNÇÃO RPC: Obter top benefícios (Admin)
CREATE OR REPLACE FUNCTION public.get_top_benefits(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    benefit_owner_id UUID,
    owner_name TEXT,
    owner_image TEXT,
    benefit_title TEXT,
    total_views BIGINT,
    total_clicks BIGINT,
    unique_visitors BIGINT,
    unique_conversions BIGINT,
    ctr_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores';
    END IF;
    
    RETURN QUERY
    SELECT 
        vtb.benefit_owner_id,
        vtb.owner_name,
        vtb.owner_image,
        vtb.benefit_title,
        vtb.total_views,
        vtb.total_clicks,
        vtb.unique_visitors,
        vtb.unique_conversions,
        vtb.ctr_percent
    FROM public.view_top_benefits vtb
    LIMIT limit_count;
END;
$$;

-- 8. Habilitar Realtime (Opcional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.benefit_analytics;

-- ============================================
-- FIM DA MIGRATION 035
-- ============================================
