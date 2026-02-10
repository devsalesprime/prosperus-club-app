-- RPC para incrementar views de artigo de forma atômica
-- Evita race conditions em acessos simultâneos

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

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.increment_article_views(UUID) TO authenticated;
