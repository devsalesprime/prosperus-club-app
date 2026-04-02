-- ============================================
-- RLS POLICIES FOR BANNERS TABLE
-- ============================================
-- SELECT: Público (todos podem ver banners ativos)
-- INSERT/UPDATE/DELETE: Apenas ADMIN e TEAM

-- Habilitar RLS (se ainda não estiver)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes (se houver)
DROP POLICY IF EXISTS "Anyone can view banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;

-- Política SELECT: Todos podem ver banners ativos
CREATE POLICY "Public can view active banners"
    ON public.banners
    FOR SELECT
    USING (is_active = true);

-- Política INSERT: Apenas ADMIN e TEAM
CREATE POLICY "Admins can insert banners"
    ON public.banners
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'TEAM')
        )
    );

-- Política UPDATE: Apenas ADMIN e TEAM
CREATE POLICY "Admins can update banners"
    ON public.banners
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'TEAM')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'TEAM')
        )
    );

-- Política DELETE: Apenas ADMIN e TEAM
CREATE POLICY "Admins can delete banners"
    ON public.banners
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'TEAM')
        )
    );

-- Política SELECT para Admin (ver todos, incluindo inativos)
CREATE POLICY "Admins can view all banners"
    ON public.banners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'TEAM')
        )
    );
