-- ============================================
-- PROSPERUS CLUB - Events RLS Fix & Cleanup
-- ============================================
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)

-- ╔══════════════════════════════════════════════╗
-- ║  1. DIAGNÓSTICO: Ver policies atuais         ║
-- ╚══════════════════════════════════════════════╝
SELECT 
    policyname,
    tablename,
    cmd,
    qual,
    roles
FROM pg_policies 
WHERE tablename = 'events';

-- ╔══════════════════════════════════════════════╗
-- ║  2. CORREÇÃO: Habilitar leitura para todos   ║
-- ╚══════════════════════════════════════════════╝

-- Primeiro, garantir que RLS está habilitado
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

-- Criar policy de leitura para todos os usuários autenticados
-- (DROP primeiro caso já exista uma com mesmo nome)
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."events";

CREATE POLICY "Enable read access for all users"
ON "public"."events"
FOR SELECT
USING (true);

-- ╔══════════════════════════════════════════════╗
-- ║  3. LIMPEZA: Deletar eventos de teste        ║
-- ╚══════════════════════════════════════════════╝

-- Preview antes de deletar (rode este SELECT primeiro!)
SELECT id, title, start_date, created_at
FROM "public"."events"
WHERE title ILIKE '%teste%'
   OR title ILIKE '%test%'
ORDER BY created_at DESC;

-- Após confirmar, execute o DELETE:
DELETE FROM "public"."events"
WHERE title ILIKE '%teste%'
   OR title ILIKE '%test%';

-- ╔══════════════════════════════════════════════╗
-- ║  4. ADICIONAR COLUNA SESSIONS (Multi-dia)    ║
-- ╚══════════════════════════════════════════════╝

-- Adicionar campo sessions para eventos multi-dia (JSONB array)
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT NULL;

-- Formato esperado:
-- [{"date": "2026-03-15", "startTime": "09:00", "endTime": "18:00"}, ...]

-- ╔══════════════════════════════════════════════╗
-- ║  5. EVENTOS PRIVADOS: Colunas + RLS          ║
-- ╚══════════════════════════════════════════════╝

-- Adicionar colunas para eventos privados (tipo PRIVATE)
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS target_member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS target_member_name TEXT;

-- Atualizar RLS: eventos PRIVATE só visíveis para o sócio destinatário
-- (Remove a política antiga de "todos podem ver tudo")
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."events";
DROP POLICY IF EXISTS "Events viewable by target or all" ON "public"."events";

CREATE POLICY "Events viewable by target or all" ON "public"."events"
FOR SELECT USING (
    target_member_id IS NULL                -- Eventos públicos (MEMBER/TEAM)
    OR target_member_id = auth.uid()        -- Evento privado para este sócio
);

-- Nota: Admins veem tudo pelo painel admin que usa service_role key

-- ╔══════════════════════════════════════════════╗
-- ║  6. VERIFICAÇÃO FINAL                        ║
-- ╚══════════════════════════════════════════════╝

-- Listar todos os eventos visíveis
SELECT id, title, start_date, end_date, category, type, target_member_id, target_member_name
FROM "public"."events"
ORDER BY start_date DESC
LIMIT 20;

-- Listar policies finais
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'events';
