-- ============================================
-- Migration: fix push trigger em user_notifications
-- Aplicada via MCP em 2026-05-11 11:42:52 UTC (version DB: 20260511114252)
--
-- Problema: trigger `send-push-on-new-notification` (criada via Dashboard
-- Webhooks UI) chamava send-push sem Authorization header e com body literal
-- '{}'. send-push tem --verify-jwt, retornava 401 silenciosamente. 101 push
-- subscriptions ativas mas zero pushes chegando aos dispositivos.
--
-- Adicionalmente: vault estava sem os secrets `supabase_url` e `service_role_key`
-- que a migration 051 (chat) já assumia existir. Esses foram criados manualmente
-- no Dashboard antes desta migration via SELECT vault.create_secret(...).
--
-- Solução: substituir trigger por padrão espelho à migration 051 — pg_net +
-- vault secrets + exception handler que não bloqueia INSERT.
-- ============================================

-- 1. Dropar trigger antigo (vinha do Database Webhooks UI)
DROP TRIGGER IF EXISTS "send-push-on-new-notification" ON public.user_notifications;

-- 2. Função que dispara push para o destinatário da notification
CREATE OR REPLACE FUNCTION public.notify_new_user_notification_push()
RETURNS trigger AS $$
DECLARE
  v_supabase_url    text;
  v_service_key     text;
  v_action_url      text;
BEGIN
  -- Abortar silenciosamente se faltar destinatário
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ler secrets do vault (necessários para invocar send-push com --verify-jwt)
  SELECT decrypted_secret INTO v_supabase_url
    FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  -- Sem secrets → warning e abortar (não bloqueia INSERT)
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'notify_new_user_notification_push: vault secrets ausentes (supabase_url ou service_role_key)';
    RETURN NEW;
  END IF;

  v_action_url := COALESCE(NEW.action_url, '/notificacoes');

  -- Disparar Edge Function send-push via pg_net (non-blocking)
  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := jsonb_build_object(
      'user_id', NEW.user_id,
      'title',   NEW.title,
      'body',    NEW.message,
      'url',     v_action_url,
      'tag',     'notification-' || NEW.id,
      'type',    COALESCE(NEW.type, 'notification')
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Nunca bloquear INSERT de notification por causa de push
    RAISE WARNING 'notify_new_user_notification_push trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger novo (snake_case per convenção Postgres)
DROP TRIGGER IF EXISTS on_new_user_notification_push ON public.user_notifications;

CREATE TRIGGER on_new_user_notification_push
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_notification_push();

COMMENT ON FUNCTION public.notify_new_user_notification_push IS
  'Dispara web push via send-push Edge Function quando uma user_notification é inserida. Espelho do padrão usado em messages (migration 051) com mesmas garantias: pg_net non-blocking, secrets via vault, exception handler para nunca bloquear INSERT.';
