# .context/memory/issues.md — Bugs Conhecidos e Workarounds
# Prosperus Club App · Abril 2026

## RESOLVIDOS

### Issue-001 · WebSocket mismatch
**Sintoma:** `mismatch between server and client bindings for postgres changes`
**Causa:** Múltiplos channels para `messages` com configurações diferentes.
**Solução:** Canal único em `useUnreadMessageCount.ts`, DOM events nos componentes.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-002 · AbortError no PushAutoSubscriber
**Sintoma:** `AbortError: signal is aborted without reason`
**Causa:** `useRef` resetado pelo React.StrictMode → dois upserts simultâneos no banco.
**Solução:** `sessionStorage` como guard de execução única.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-003 · Realtime não entregava eventos
**Sintoma:** Contador de mensagens só atualizava após refresh manual.
**Causa:** RLS com `SECURITY DEFINER` → `auth.uid()` retornava null no contexto Realtime.
**Solução:** Remover SECURITY DEFINER, usar subquery direta na policy SELECT.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-004 · Push iOS não chegava
**Sintoma:** Notificações push não apareciam no iPhone mesmo com permissão.
**Causa:** 17 subscriptions expiradas acumuladas + AbortError impedindo renovação.
**Solução:** Limpeza de subscriptions (HTTP 410) + fix AbortError.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-005 · HubSpot INVALID_OPTION
**Sintoma:** Sync do perfil falhava silenciosamente no HubSpot.
**Causa:** Texto livre enviado para propriedades dropdown (cargo_na_empresa_2_).
**Solução:** Arrays ALLOWED_JOBS + formatHubspotOption() de normalização.
**Status:** ✅ RESOLVIDO Abr/2026

### Issue-006 · HubSpot Company scope
**Sintoma:** Website e nome_fantasia não sincronizavam.
**Causa:** Propriedades de Empresa enviadas para objeto Contato.
**Solução:** Separar em dois calls — Contato + Empresa (crm.objects.companies.write).
**Status:** ✅ RESOLVIDO Abr/2026

### Issue-010 · Web Push nativo não disparando (OS-level)
**Sintoma:** Notificações in-app (Realtime) chegavam, mas push nativo no iPhone/Android/Desktop não aparecia. 101 push_subscriptions ativas mas zero entregues.
**Causa raiz dupla:**
1. Vault sem secrets `supabase_url` e `service_role_key` — migration 051 (chat) também afetada silenciosamente (exception handler engolia)
2. Trigger `send-push-on-new-notification` (criada via Dashboard Webhooks UI) chamava `supabase_functions.http_request` SEM Authorization header e com body literal `'{}'`. send-push tem `--verify-jwt` → respondia 401
**Diagnóstico:** logs do edge-function mostraram 401 isolado no send-push; `_http_response` do pg_net e information_schema.triggers confirmaram config quebrada.
**Solução (2026-05-11):**
1. Usuário criou os 2 vault secrets via Dashboard
2. Migration `20260511_fix_user_notification_push.sql` substituiu trigger pelo padrão espelho à 051: pg_net + vault + exception handler + body com NEW.* + Authorization Bearer
3. INSERT de teste: send-push retornou 200, enviou 8/16 (8 falharam 410 — subs antigas, auto-desativadas pelo cleanup interno)
**Status:** ✅ RESOLVIDO 2026-05-11

## ATIVOS (backlog)

### Issue-007 · Performance Lighthouse 29
**Sintoma:** FCP 7.7s · TBT 3.170ms · Performance 29
**Causa:** Bundle único sem code splitting.
**Workaround:** Nenhum — app funciona mas lento em 4G.
**Solução parcial:** `vite.config.ts` já tem `manualChunks` (admin-bundle, vendor-supabase, vendor-query, vendor-ui) e `index.html` tem resource hints (`preconnect` Supabase + Google Fonts + Typekit). Falta validar se Lighthouse melhorou e fazer React.lazy nas rotas pesadas.
**Status:** ⏳ PENDENTE — re-medir Lighthouse

### Issue-008 · 81 instâncias :any (era 183 — re-medido 2026-05-08)
**Sintoma:** TypeScript fraco em 81 pontos do codebase.
**Causa:** Histórico de desenvolvimento rápido.
**Workaround:** App funciona, mas tipos não protegem esses pontos.
**Solução planejada:** Sprint de tipagem — remediação incremental. Começar pelos 4 `as any` em `contexts/UnreadCountContext.tsx`.
**Status:** ⏳ BACKLOG

### Issue-009 · Carrossel Academy desktop
**Sintoma:** Setas aparecem mas cards não scrollam.
**Causa:** `trackRef` pode estar no elemento errado ou container pai com overflow:hidden.
**Workaround:** Scroll manual na tela.
**Solução planejada:** PROMPT_FIX_CAROUSEL_VIDEO_SCROLL.md
**Status:** ⏳ PENDENTE
