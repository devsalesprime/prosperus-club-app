-- ============================================
-- Migration: REPLICA IDENTITY FULL em user_notifications
-- Aplicada via MCP em 2026-05-11
--
-- Sintoma reportado: badge "1" persistia no NotificationCenter/app icon
-- mesmo após o usuário marcar a notification como lida ou deletar.
--
-- Causa: REPLICA IDENTITY estava em DEFAULT (só PK = id). Server do
-- Realtime precisa do user_id no payload para avaliar o filter
-- `user_id=eq.${userId}` em events UPDATE/DELETE. Sem FULL, payload do
-- UPDATE só contém a PK → filter falha silenciosamente → channel do
-- UnreadCountContext nunca recebe event → count fica congelado.
--
-- Solução: ALTER TABLE com FULL. Mesmo pattern de ADR-006 (messages,
-- migration 028_enable_messages_realtime.sql).
-- Trade-off: payload dos events fica maior (8 colunas), mas a tabela é
-- compacta — overhead negligível.
-- ============================================

ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;

COMMENT ON TABLE public.user_notifications IS
  'Individual user notification inbox. REPLICA IDENTITY FULL exigido para
   filters do Realtime (filter: user_id=eq.X em UPDATE/DELETE events).
   Ver ADR-006 (mesmo padrão para messages).';
