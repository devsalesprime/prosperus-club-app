-- ============================================
-- PROSPERUS CLUB - RSVP System Migration
-- ============================================
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- Sistema de Confirmação de Presença com fluxo de aprovação

-- ╔══════════════════════════════════════════════╗
-- ║  1. CRIAR TABELA event_rsvps                 ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'WAITLIST', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Um usuário só pode ter um registro por evento
    UNIQUE(event_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON public.event_rsvps(status);

-- ╔══════════════════════════════════════════════╗
-- ║  2. HABILITAR RLS                            ║
-- ╚══════════════════════════════════════════════╝

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- ╔══════════════════════════════════════════════╗
-- ║  3. POLÍTICAS DE SEGURANÇA (RLS)             ║
-- ╚══════════════════════════════════════════════╝

-- 3.1 INSERT: Usuário autenticado pode solicitar presença (apenas com seu próprio user_id)
DROP POLICY IF EXISTS "Users can request RSVP" ON public.event_rsvps;
CREATE POLICY "Users can request RSVP" ON public.event_rsvps
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- 3.2 SELECT: Usuário vê seus próprios RSVPs + Admins veem todos
DROP POLICY IF EXISTS "Users see own RSVPs and admins see all" ON public.event_rsvps;
CREATE POLICY "Users see own RSVPs and admins see all" ON public.event_rsvps
FOR SELECT USING (
    user_id = auth.uid()
    OR user_has_admin_role(auth.uid())
);

-- 3.3 UPDATE: Apenas Admins podem alterar status (Aprovar/Recusar)
DROP POLICY IF EXISTS "Admins can update RSVP status" ON public.event_rsvps;
CREATE POLICY "Admins can update RSVP status" ON public.event_rsvps
FOR UPDATE USING (
    user_has_admin_role(auth.uid())
);

-- 3.4 DELETE: Usuário pode cancelar seu próprio RSVP + Admins podem deletar qualquer um
DROP POLICY IF EXISTS "Users can cancel own RSVP and admins can delete any" ON public.event_rsvps;
CREATE POLICY "Users can cancel own RSVP and admins can delete any" ON public.event_rsvps
FOR DELETE USING (
    user_id = auth.uid()
    OR user_has_admin_role(auth.uid())
);

-- ╔══════════════════════════════════════════════╗
-- ║  4. VERIFICAÇÃO                              ║
-- ╚══════════════════════════════════════════════╝

-- Conferir tabela criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'event_rsvps'
ORDER BY ordinal_position;

-- Conferir policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'event_rsvps';