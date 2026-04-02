-- ============================================
-- BUSINESS CORE - Migration 032
-- Prosperus Club App v2.5
-- Execute no Dashboard do Supabase (SQL Editor)
-- ============================================

-- 1. ENUMS para Status
DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('PENDING', 'CONFIRMED', 'CONTESTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM ('NEW', 'IN_PROGRESS', 'CONVERTED', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. MEMBER_DEALS (ROI Tracker)
CREATE TABLE IF NOT EXISTS public.member_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    status deal_status NOT NULL DEFAULT 'PENDING',
    deal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: Seller ≠ Buyer
    CONSTRAINT different_parties CHECK (seller_id != buyer_id)
);

-- Indices para Performance
CREATE INDEX IF NOT EXISTS idx_deals_seller ON public.member_deals(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_buyer ON public.member_deals(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_date ON public.member_deals(deal_date DESC);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.member_deals(status);

-- 3. MEMBER_REFERRALS (Lead CRM)
CREATE TABLE IF NOT EXISTS public.member_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Lead Data
    lead_name TEXT NOT NULL,
    lead_email TEXT,
    lead_phone TEXT,
    notes TEXT,

    -- Status Tracking
    status referral_status NOT NULL DEFAULT 'NEW',
    converted_amount NUMERIC(12, 2) CHECK (converted_amount > 0),
    feedback TEXT, -- Motivo da perda (obrigatório quando LOST)

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT different_members CHECK (referrer_id != receiver_id),
    CONSTRAINT converted_requires_amount CHECK (
        (status = 'CONVERTED' AND converted_amount IS NOT NULL) OR
        (status != 'CONVERTED')
    ),
    CONSTRAINT lost_requires_feedback CHECK (
        (status = 'LOST' AND feedback IS NOT NULL AND feedback != '') OR
        (status != 'LOST')
    )
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.member_referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_receiver ON public.member_referrals(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.member_referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON public.member_referrals(created_at DESC);

-- 4. RLS POLICIES

-- Enable RLS
ALTER TABLE public.member_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_referrals ENABLE ROW LEVEL SECURITY;

-- DEALS: Users see where they are seller OR buyer
CREATE POLICY "Users can view their own deals"
ON public.member_deals FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- DEALS: Only seller can create
CREATE POLICY "Sellers can create deals"
ON public.member_deals FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- REFERRALS: Users see where they are referrer OR receiver
CREATE POLICY "Users can view their referrals"
ON public.member_referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = receiver_id);

-- REFERRALS: Only referrer can create
CREATE POLICY "Referrers can create referrals"
ON public.member_referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- 5. TRIGGERS

-- Trigger para member_deals updated_at
CREATE OR REPLACE FUNCTION update_member_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_deals_updated_at ON public.member_deals;
CREATE TRIGGER trigger_update_member_deals_updated_at
    BEFORE UPDATE ON public.member_deals
    FOR EACH ROW
    EXECUTE FUNCTION update_member_deals_updated_at();

-- Trigger para member_referrals updated_at + converted_at
CREATE OR REPLACE FUNCTION update_member_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'CONVERTED' AND OLD.status != 'CONVERTED' THEN
        NEW.converted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_referrals_updated_at ON public.member_referrals;
CREATE TRIGGER trigger_update_member_referrals_updated_at
    BEFORE UPDATE ON public.member_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_member_referrals_updated_at();

-- 6. RANKING VIEWS (Performance Optimization)

-- View para Ranking de Vendas (Top Sellers)
CREATE OR REPLACE VIEW public.view_ranking_sellers AS
SELECT 
    d.seller_id as user_id,
    p.name,
    p.image_url,
    COUNT(d.id) as deal_count,
    COALESCE(SUM(d.amount), 0) as total_amount
FROM public.member_deals d
JOIN public.profiles p ON d.seller_id = p.id
WHERE d.status = 'CONFIRMED'
GROUP BY d.seller_id, p.name, p.image_url
ORDER BY total_amount DESC;

-- View para Ranking de Indicações (Top Referrers)
CREATE OR REPLACE VIEW public.view_ranking_referrers AS
SELECT 
    r.referrer_id as user_id,
    p.name,
    p.image_url,
    COUNT(r.id) as referral_count,
    SUM(CASE WHEN r.status = 'CONVERTED' THEN 1 ELSE 0 END) as converted_count,
    COALESCE(SUM(CASE WHEN r.status = 'CONVERTED' THEN r.converted_amount ELSE 0 END), 0) as total_converted_amount
FROM public.member_referrals r
JOIN public.profiles p ON r.referrer_id = p.id
GROUP BY r.referrer_id, p.name, p.image_url
ORDER BY referral_count DESC;

-- 7. SECURE RPC FUNCTIONS

-- Função para confirmar deal (apenas buyer pode chamar)
CREATE OR REPLACE FUNCTION public.confirm_deal(deal_id UUID)
RETURNS public.member_deals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.member_deals;
BEGIN
    -- Verificar se o caller é o buyer e o deal está PENDING
    UPDATE public.member_deals
    SET status = 'CONFIRMED', updated_at = NOW()
    WHERE id = deal_id 
      AND buyer_id = auth.uid()
      AND status = 'PENDING'
    RETURNING * INTO result;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Deal não encontrado ou você não tem permissão para confirmar';
    END IF;
    
    RETURN result;
END;
$$;

-- Função para contestar deal (apenas buyer pode chamar)
CREATE OR REPLACE FUNCTION public.contest_deal(deal_id UUID)
RETURNS public.member_deals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.member_deals;
BEGIN
    UPDATE public.member_deals
    SET status = 'CONTESTED', updated_at = NOW()
    WHERE id = deal_id 
      AND buyer_id = auth.uid()
      AND status = 'PENDING'
    RETURNING * INTO result;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Deal não encontrado ou você não tem permissão para contestar';
    END IF;
    
    RETURN result;
END;
$$;

-- Função para atualizar status de referral (apenas receiver pode chamar)
CREATE OR REPLACE FUNCTION public.update_referral_status(
    referral_id UUID,
    new_status referral_status,
    amount NUMERIC DEFAULT NULL,
    loss_feedback TEXT DEFAULT NULL
)
RETURNS public.member_referrals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.member_referrals;
BEGIN
    -- Validações
    IF new_status = 'CONVERTED' AND amount IS NULL THEN
        RAISE EXCEPTION 'Valor convertido é obrigatório para status CONVERTED';
    END IF;
    
    IF new_status = 'LOST' AND (loss_feedback IS NULL OR loss_feedback = '') THEN
        RAISE EXCEPTION 'Motivo da perda é obrigatório para status LOST';
    END IF;
    
    UPDATE public.member_referrals
    SET 
        status = new_status,
        converted_amount = CASE WHEN new_status = 'CONVERTED' THEN amount ELSE NULL END,
        feedback = CASE WHEN new_status = 'LOST' THEN loss_feedback ELSE feedback END,
        converted_at = CASE WHEN new_status = 'CONVERTED' THEN NOW() ELSE converted_at END,
        updated_at = NOW()
    WHERE id = referral_id 
      AND receiver_id = auth.uid()
    RETURNING * INTO result;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Indicação não encontrada ou você não tem permissão para atualizar';
    END IF;
    
    RETURN result;
END;
$$;

-- 8. Habilitar Realtime para as novas tabelas (opcional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.member_deals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.member_referrals;

-- ============================================
-- FIM DA MIGRATION 032
-- ============================================
