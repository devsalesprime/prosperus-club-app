-- ============================================================
-- Migration 080: Birthday Two-Way Sync (HubSpot M2M)
-- Adiciona coluna 'status' à birthday_cards para substituir
-- o campo booleano is_viewed por um estado mais expressivo.
-- ============================================================

-- 1. Adicionar coluna status com constraint
ALTER TABLE public.birthday_cards
    ADD COLUMN IF NOT EXISTS status TEXT
        NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'sent'));

-- 2. Migrar dados existentes
UPDATE public.birthday_cards
    SET status = CASE
        WHEN is_viewed = true  THEN 'sent'
        ELSE 'scheduled'
    END;

-- 3. Índice para a query do sócio (busca rápida de cards pendentes)
CREATE INDEX IF NOT EXISTS idx_birthday_cards_user_status
    ON public.birthday_cards (user_id, status);

-- 4. Índice para o painel admin (filtrar por status + data)
CREATE INDEX IF NOT EXISTS idx_birthday_cards_status_date
    ON public.birthday_cards (status, trigger_date);
