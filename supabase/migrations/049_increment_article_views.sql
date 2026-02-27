-- Migration 049: Increment Article Views RPC
-- Origem: sql/increment_article_views.sql
-- Data: 27/02/2026
-- Atomic view counter to avoid race conditions

CREATE OR REPLACE FUNCTION public.increment_article_views(article_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE articles
    SET views = COALESCE(views, 0) + 1
    WHERE id = article_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_views(UUID) TO authenticated;
