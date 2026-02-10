-- ============================================
-- Migration: Fix Chat Realtime Issues
-- Descrição: Habilita Realtime e corrige políticas RLS para chat
-- Data: 02/02/2026
-- ============================================

-- 1. Habilitar Realtime nas tabelas de chat
-- Nota: Se já estiver habilitado, o comando é ignorado
DO $$
BEGIN
  -- Adicionar tabelas à publicação Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- 2. Adicionar política para permitir leitura de participants com filtro neq
DROP POLICY IF EXISTS "Users can view all participants" ON conversation_participants;

CREATE POLICY "Users can view all participants"
ON conversation_participants FOR SELECT
USING (
  -- Permite ver todos os participantes de conversas que o usuário faz parte
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- 3. Criar índice para melhorar performance das queries com neq
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON conversation_participants(conversation_id, user_id);

-- 4. Verificar status (apenas para debug)
DO $$
DECLARE
  conv_count INTEGER;
  part_count INTEGER;
  msg_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conv_count FROM conversations;
  SELECT COUNT(*) INTO part_count FROM conversation_participants;
  SELECT COUNT(*) INTO msg_count FROM messages;
  
  RAISE NOTICE '✅ Realtime habilitado para chat';
  RAISE NOTICE 'Conversations: %', conv_count;
  RAISE NOTICE 'Participants: %', part_count;
  RAISE NOTICE 'Messages: %', msg_count;
END $$;

