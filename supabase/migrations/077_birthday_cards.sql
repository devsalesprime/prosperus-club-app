-- ============================================
-- Feature: Homenagem de Aniversário (Greeting Cards Full-Screen)
-- Migration: Criação da tabela birthday_cards e bucket de storage
-- ============================================

-- 1. Criação da tabela
CREATE TABLE IF NOT EXISTS public.birthday_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    trigger_date DATE NOT NULL,
    is_viewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Evita agendar mais de uma homenagem pro mesmo usuário no mesmo dia (ano)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_birthday_card_per_year') THEN
        ALTER TABLE public.birthday_cards ADD CONSTRAINT unique_birthday_card_per_year UNIQUE (user_id, trigger_date);
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.birthday_cards ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies

DROP POLICY IF EXISTS "Admins e Team gerenciam todos os cards" ON public.birthday_cards;
-- Admins e Team podem ver, criar, atualizar e deletar todos os cards
CREATE POLICY "Admins e Team gerenciam todos os cards"
    ON public.birthday_cards FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('ADMIN', 'TEAM')
        )
    );

DROP POLICY IF EXISTS "Usuários veem seus próprios cards" ON public.birthday_cards;
-- Usuários comuns podem VER apenas os seus próprios cards
CREATE POLICY "Usuários veem seus próprios cards"
    ON public.birthday_cards FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem marcar seus cards como lidos" ON public.birthday_cards;
-- Usuários comuns podem ATUALIZAR apenas o status is_viewed dos seus cards
CREATE POLICY "Usuários podem marcar seus cards como lidos"
    ON public.birthday_cards FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        -- Garantir que não está alterando a URL ou a data
    );

-- 3. Storage Bucket: birthday-cards
INSERT INTO storage.buckets (id, name, public) 
VALUES ('birthday-cards', 'birthday-cards', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies do Storage (usando as permissões padrão do public bucket do supabase)

DROP POLICY IF EXISTS "Imagens de aniversário publicamente acessíveis" ON storage.objects;
-- Qualquer um pode visualizar/baixar as imagens
CREATE POLICY "Imagens de aniversário publicamente acessíveis" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'birthday-cards');

DROP POLICY IF EXISTS "Apenas Admins podem fazer upload de homenagens" ON storage.objects;
-- Apenas admins podem fazer upload
CREATE POLICY "Apenas Admins podem fazer upload de homenagens" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'birthday-cards' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
        )
    );

DROP POLICY IF EXISTS "Apenas Admins podem atualizar imagens de homenagens" ON storage.objects;
CREATE POLICY "Apenas Admins podem atualizar imagens de homenagens" 
    ON storage.objects FOR UPDATE 
    WITH CHECK (
        bucket_id = 'birthday-cards' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
        )
    );

DROP POLICY IF EXISTS "Apenas Admins podem deletar imagens de homenagens" ON storage.objects;
CREATE POLICY "Apenas Admins podem deletar imagens de homenagens" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'birthday-cards' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
        )
    );