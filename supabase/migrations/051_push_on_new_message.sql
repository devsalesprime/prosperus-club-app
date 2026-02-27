-- ============================================
-- Migration 051: Push notification trigger on new messages
-- Chama Edge Function send-push via pg_net quando nova mensagem é inserida
-- ============================================

-- Função que dispara push notification para o destinatário
CREATE OR REPLACE FUNCTION notify_new_message_push()
RETURNS trigger AS $$
DECLARE
  recipient_id uuid;
  sender_name  text;
  conv_record  record;
BEGIN
  -- Buscar conversa para identificar os participantes
  SELECT participant_a, participant_b
    INTO conv_record
    FROM conversations
   WHERE id = NEW.conversation_id;

  -- Se não encontrou conversa, tentar via conversation_participants
  IF conv_record IS NULL THEN
    SELECT user_id INTO recipient_id
      FROM conversation_participants
     WHERE conversation_id = NEW.conversation_id
       AND user_id != NEW.sender_id
     LIMIT 1;
  ELSE
    -- Identificar o destinatário (o que NÃO é o sender)
    IF conv_record.participant_a = NEW.sender_id THEN
      recipient_id := conv_record.participant_b;
    ELSE
      recipient_id := conv_record.participant_a;
    END IF;
  END IF;

  -- Se não encontrou destinatário, abortar silenciosamente
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do remetente
  SELECT name INTO sender_name
    FROM profiles
   WHERE id = NEW.sender_id;

  -- Disparar Edge Function send-push via pg_net (non-blocking)
  PERFORM net.http_post(
    url     := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1)
               || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body    := jsonb_build_object(
      'user_id', recipient_id,
      'title',   COALESCE(sender_name, 'Nova mensagem'),
      'body',    LEFT(NEW.content, 100),
      'url',     '/chat?conversation=' || NEW.conversation_id,
      'tag',     'chat-' || NEW.conversation_id,
      'type',    'message'
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Nunca bloquear INSERT de mensagem por causa de push
    RAISE WARNING 'Push notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: dispara após cada nova mensagem
DROP TRIGGER IF EXISTS on_new_message_push ON messages;

CREATE TRIGGER on_new_message_push
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message_push();

-- Nota: Este trigger usa pg_net (extensão Supabase built-in).
-- Verificar se pg_net está habilitada:
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- 
-- Se pg_net não estiver disponível ou se preferir usar vault secrets,
-- a alternativa é chamar send-push diretamente do frontend após sendMessage().
-- O trigger server-side é preferível porque funciona mesmo com desconexão do app.
