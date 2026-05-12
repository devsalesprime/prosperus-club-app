# .context/memory/issues.md — Bugs Conhecidos e Workarounds
# Prosperus Club App · Abril 2026

## RESOLVIDOS

### Issue-013 · provisionProfileByEmail perdia dados do deal (hubspot_contact_id, amount, closedate)
**Sintoma:** sócios cujo email de signup do app difere do email principal do HubSpot contact (entram via `c_e_mail`/`e_mail___participante_vinculado_*` no deal) ficavam com `hubspot_contact_id`, `hubspot_deal_id`, `valor_pago_mentoria` e `data_entrada_clube` NULL. Painel admin ROI ("Crescimento") mostrava investimento vazio mesmo com `amount` setado no HubSpot. 10 sócios afetados (Amanda Vilas Calheiros + 9).
**Causa raiz:** `hubspot-webhook::provisionProfileByEmail(email, isActive)` aceitava apenas 2 parâmetros e atualizava só `is_active`. O loop dos CRM-associated contacts propagava `valor_pago_mentoria`, mas o branch de participants via `c_e_mail` não. Sem `hubspot_contact_id` populado, sync futuro também não sabia ligar.
**Casos especiais descobertos:**
- **Thais Miraldo:** `c_e_mail` do deal = email corporativo (`thais@singularmedicamentos.com.br`), profile no app = email pessoal (`tmiralldo@gmail.com`). Nunca bate via `c_e_mail` — só via CRM association.
- **Guilherme Cruz:** `c_e_mail` armazenado com **espaço no final** (`guilhermecruz@me.com `). Webhook código já tem `trim()` (linha 488), bug era só na minha query manual de auditoria.
- **Débora De Landa:** dois profiles duplicados (`joiaskether@gmail.com` antigo com 2 ROI records + `deboradelanda07@gmail.com` novo, com email do HubSpot). Merge: registros_faturamento/analytics/profile_history/user_notifications/member_reports do source movidos para target; source desativado com nome "Débora (conta antiga — usar deboradelanda07@gmail.com)".
**Solução (2026-05-12):**
- Backfill manual via MCP `execute_sql`, em **2 rodadas**:
  - **Rodada 1** (LIMIT 10 inicial, filtro `hubspot_contact_id IS NULL AND valor_pago_mentoria IS NULL`): 10 UPDATEs cirúrgicos. Total recuperado: R$ 2.052.000.
  - **Rodada 2** (re-auditoria depois de feedback "faltaram Davyd, Leomarcos, Nayara"): query original era muito restrita — escapavam profiles com `valor_pago` preenchido mas `hubspot_contact_id` NULL, profiles com `hubspot_contact_id` preenchido mas `valor_pago` NULL, e os que caíram fora do LIMIT 10. Re-auditoria sem LIMIT revelou ~80 profiles com algum gap HubSpot. Backfill cirúrgico dos 13 críticos pro painel ROI (gap em `valor_pago` OU `contact_id`): + R$ 785.000.
  - Total final: **23 sócios, R$ 2.837.000** restaurados no painel Crescimento.
- Os ~60 profiles restantes têm gap **só de `hubspot_deal_id` + `data_entrada_clube`** — não afetam o ROI Admin (que usa só `valor_pago_mentoria`). Ficam como TODO de baixa prioridade.
- **Lição estrutural:** filtro de auditoria com `AND ... IS NULL AND ... IS NULL` perde casos onde só uma coluna está NULL. Próxima auditoria estrutural usar `OR` ou `COALESCE` ou um SELECT por coluna individual.
- Refator `provisionProfileByEmail` em `supabase/functions/hubspot-webhook/index.ts`:
  - Nova interface `DealContext { dealId, amount, closedate }`
  - Lookup do `hubspot_contact_id` via `hubspotFetch` (search-by-email) — 1 chamada extra com retry/backoff ADR-015
  - Só sobrescreve `hubspot_contact_id` no profile se atualmente NULL (respeita unique constraint)
  - Update/create propaga `hubspot_deal_id`, `valor_pago_mentoria`, `data_entrada_clube` (do closedate normalizado pra YYYY-MM-DD)
- Ambas as call sites (`situacao_do_negocio` change + DEAL_PARTICIPANT_EMAIL_PROPS individual change) agora passam `dealContext` com amount + closedate buscados do deal.
**ADR:** ADR-015 (wrapper reusado)
**Status:** ✅ RESOLVIDO 2026-05-12

### Issue-012 · HubSpot 429/5xx eram perdidos silenciosamente (retroativa)
**Sintoma:** Sócios reportavam que mudanças no perfil ocasionalmente não apareciam no HubSpot CRM. Sem rastreamento — `sync-hubspot` era fire-and-forget e o erro era apenas `console.error` no log da Edge Function.
**Causa raiz:** As 4 Edge Functions HubSpot (`sync-hubspot`, `update-hubspot-contact`, `sync-hubspot-birthdays`, `hubspot-webhook`) faziam `fetch()` direto sem tratar 429 (rate limit) nem 5xx. Em rajadas — especialmente `sync-hubspot-birthdays` processando 280 contatos com 4 fetches cada — o HubSpot retornava 429 com `Retry-After`, mas o código tratava como erro fatal e abortava o lote.
**Solução (2026-05-11):**
- `supabase/functions/_shared/hubspot-client.ts`: wrapper `hubspotFetch()` com retry exponencial (4 tentativas, jitter ±25%, max 30s, respeitando `Retry-After`)
- `public.hubspot_failed_calls` (migration `20260511_hubspot_failed_calls.sql`): fila persistente para chamadas que esgotaram retry
- `hubspot-retry-failures` Edge Function + `pg_cron` job `'0 */6 * * *'` (migration `20260511_hubspot_retry_cron.sql`): reprocessa pending a cada 6h
- 4 Edge Functions refatoradas para usar `hubspotFetch` + `withFailureQueue` (webhook tem refactor parcial — só loops wrappados; sem queue por arquitetura HMAC)
- Response uniforme 200 sempre `{ synced, queued, queueId?, error? }` — callers fire-and-forget inalterados
**ADR:** ADR-015
**Status:** ✅ RESOLVIDO 2026-05-11

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

### Issue-011 · Badge não decrementava após markAsRead/delete
**Sintoma:** Após marcar notification como lida ou deletar, badge "1" persistia no sininho do header E no app icon nativo (Badging API).
**Causa raiz tripla — fix em 3 frentes:**
1. **Arquitetural client-side:** `NotificationCenter` mantinha `unreadCount` em state LOCAL, desconectado do `NotificationsContext`. `NotificationsPage` mutava só seu array local de notifications sem chamar `refreshNotifications()` do context.
2. **Realtime UPDATE silenciosamente dropado:** `user_notifications` estava com REPLICA IDENTITY DEFAULT (só PK = id). Filter `user_id=eq.X` em UPDATE events falhava porque o server precisa do user_id no payload para avaliar. Mesmo padrão que ADR-006 resolveu para `messages`.
3. **Side-effect do (2):** `UnreadCountContext.refreshUnreadCount()` nunca era chamado após markAsRead → app icon badge (Badging API) ficava congelado.
**Solução (2026-05-11):**
- `NotificationCenter` consome `useNotifications().unreadNotifications` (commit `df7171e`)
- `NotificationsPage` chama `refreshNotifications()` em todos os handlers (commit `df7171e`)
- Migration `20260511_user_notifications_replica_full.sql` aplicada via MCP: `ALTER TABLE user_notifications REPLICA IDENTITY FULL`
**Validação:** INSERT manual + markAsRead pelo usuário confirmou badge zerando imediatamente.
**Status:** ✅ RESOLVIDO 2026-05-11

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
