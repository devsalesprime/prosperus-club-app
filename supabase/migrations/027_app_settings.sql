-- ============================================
-- APP SETTINGS TABLE (Singleton Pattern)
-- ============================================
-- Tabela de configurações do app (apenas 1 linha - ID=1)

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton: sempre ID=1
    
    -- Suporte Técnico
    support_email TEXT DEFAULT 'suporte@prosperusclub.com.br',
    support_phone TEXT DEFAULT '+55 11 99999-9999',
    
    -- Gerente de Conta / Sucesso do Cliente
    account_manager_name TEXT DEFAULT 'Sua Gerente de Conta',
    account_manager_phone TEXT DEFAULT '+55 11 99999-9999',
    account_manager_email TEXT DEFAULT 'gerente@prosperusclub.com.br',
    
    -- Financeiro
    financial_email TEXT DEFAULT 'financeiro@prosperusclub.com.br',
    financial_phone TEXT DEFAULT '+55 11 99999-9999',
    
    -- Links Importantes
    terms_url TEXT DEFAULT 'https://prosperusclub.com.br/termos',
    privacy_url TEXT DEFAULT 'https://prosperusclub.com.br/privacidade',
    faq_url TEXT DEFAULT 'https://prosperusclub.com.br/faq',
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Todos podem ler (configurações são públicas dentro do app)
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Anyone can read settings"
    ON public.app_settings
    FOR SELECT
    USING (true);

-- Política UPDATE: Apenas ADMIN
DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can update settings"
    ON public.app_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- Política INSERT: Apenas ADMIN (para seed inicial se necessário)
DROP POLICY IF EXISTS "Admins can insert settings" ON public.app_settings;
CREATE POLICY "Admins can insert settings"
    ON public.app_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- Seed: Inserir linha padrão se não existir
INSERT INTO public.app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.app_settings IS 'Configurações globais do app (Singleton - apenas 1 linha)';
COMMENT ON COLUMN public.app_settings.id IS 'Sempre 1 (Singleton pattern)';
