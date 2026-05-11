# Sessão 11 Maio 2026 — Push Web Nativo + Sincronia de Badge

**Data:** 2026-05-11
**Branch:** `main`
**Commits da sessão:** `3e7ae6f`, `df7171e`, `c1b6691`, `caea7e8`
**Modelo:** Claude Opus 4.7 (1M context)
**Validação:** `tsc --noEmit` exit 0 em todos os commits + validação E2E pelo usuário no dispositivo real

---

## 📋 Sumário executivo

Sessão dedicada a desbloquear **Web Push nativo** (notificação OS-level no iPhone/Android/Desktop) e a corrigir **sincronia de badge** entre telas. Diagnóstico feito via **MCP do Supabase** (recém-conectado): trigger de banco, schema, RLS, REPLICA IDENTITY, vault secrets, logs de Edge Function — tudo inspecionado em produção em tempo real.

**Resultado:** push nativo chegando em 100% dos endpoints válidos. Badge zerando em tempo real ao marcar como lida (com sincronia cross-device via Realtime).

---

## 🚨 Issues resolvidas

### Issue-010 · Web Push nativo não disparando

**Sintoma reportado:** Notificações in-app (Realtime) chegavam normalmente, mas push nativo no iPhone/Android/Desktop não aparecia quando app estava fechado. 101 push_subscriptions ativas no banco mas zero entregas.

**Causa raiz dupla:**
1. **Vault vazio** — `vault.decrypted_secrets` não tinha `supabase_url` nem `service_role_key`. Migration 051 (push de chat) já assumia esses secrets via `SELECT decrypted_secret FROM vault.decrypted_secrets`, então também estava silenciosamente quebrada (exception handler engolia).
2. **Trigger `send-push-on-new-notification` configurado errado** — Criado via Dashboard → Database Webhooks UI, usava `supabase_functions.http_request` SEM Authorization header e com body literal `'{}'`. Como `send-push` roda com `--verify-jwt`, respondia 401 silenciosamente. Sem `NEW.*` no body, mesmo se autenticasse, não saberia para quem enviar.

**Diagnóstico (via MCP Supabase):**
- `get_logs(edge-function)` → 401 isolado no send-push (visível no meio de centenas de 401 do hubspot-webhook)
- `information_schema.triggers` → action_statement com headers/body errados
- `vault.decrypted_secrets` → 0 rows
- `_http_response` do pg_net (após fix) → confirmou send-push retornando 200

**Solução (2 etapas):**
1. **Usuário criou os 2 vault secrets** via Dashboard SQL Editor (`SELECT vault.create_secret(...)`)
2. **Migration `20260511_fix_user_notification_push.sql`** aplicada via MCP `apply_migration`:
   - `DROP TRIGGER "send-push-on-new-notification"`
   - Nova função `notify_new_user_notification_push()` espelhando migration 051: `pg_net.http_post()` + `vault.decrypted_secrets` para `Authorization: Bearer` + `jsonb_build_object(NEW.user_id, NEW.title, ...)` + `EXCEPTION WHEN OTHERS THEN RAISE WARNING`
   - Novo trigger `on_new_user_notification_push` (snake_case)

**Validação:** INSERT teste em `user_notifications` para `fabio.soares@salesprime.com.br` → `send-push` 200 OK → `{"sent": 8, "failed": 8, "total": 16}` (8 entregues, 8 stale 410s auto-desativadas pelo cleanup interno).

**Bonus colateral:** Migration 051 (push de chat) também desbloqueada pelos secrets — começou a funcionar automaticamente.

**Status:** ✅ RESOLVIDO 2026-05-11

---

### Issue-011 · Badge não decrementava após markAsRead/delete

**Sintoma reportado:** Após marcar como lida ou deletar uma notification, o badge "1" persistia no sininho do header E no app icon nativo (Badging API). Tab "Não lidas" zerava localmente mas badge não.

**Causa raiz TRIPLA:**

1. **Arquitetural client-side** — `NotificationCenter` (dropdown bell) mantinha `unreadCount` em state **LOCAL** desconectado do `NotificationsContext`. `NotificationsPage` mutava apenas seu array local de notifications sem propagar mudanças ao context global.

2. **Realtime UPDATE silenciosamente dropado** — `user_notifications` estava com `REPLICA IDENTITY DEFAULT` (só PK = `id`). Filter `user_id=eq.${userId}` em UPDATE events falhava porque o server precisa do `user_id` no payload para avaliar o filter — e o payload do UPDATE só continha a PK. Mesmo padrão que ADR-006 já tinha resolvido para `messages`.

3. **Race condition em `NotificationsPage` useEffect** — `markAllRead()` e `refreshNotifications()` rodavam em **paralelo** (não awaited). O SELECT count rodava ANTES do UPDATE markAllRead completar → retornava valor antigo.

4. **`NotificationsContext` cego para UPDATE/DELETE** — só escutava DOM event `prosperus:new-notification` (INSERT). Mudanças em outras telas/abas/dispositivos não chegavam.

**Solução em 3 commits:**

| Commit | Frente | Mudança |
|---|---|---|
| `df7171e` | Client-side sync | `NotificationCenter` consome `useNotifications().unreadNotifications` em vez de state local. `NotificationsPage` chama `refreshNotifications()` em todos os handlers (markAsRead, markAllAsRead, delete, dismiss, deleteAllRead). |
| `c1b6691` | Banco | Migration `20260511_user_notifications_replica_full.sql` aplicada via MCP: `ALTER TABLE public.user_notifications REPLICA IDENTITY FULL`. |
| `caea7e8` | Realtime UPDATE/DELETE + race | (a) `useNotificationsSubscription.ts` ganha `.on('postgres_changes', UPDATE)` e `.on(...,DELETE)` que disparam DOM events `prosperus:notification-updated` e `prosperus:notification-deleted` tipados. (b) `NotificationsContext` escuta esses events e chama `refreshNotifications()`. (c) `NotificationsPage.useEffect` faz `await markAllRead()` antes de `await refreshNotifications()` — IIFE async com flag `cancelled` para StrictMode. |

**Validação:** Usuário confirmou no dispositivo real após deploy do `caea7e8`: "Funcionou perfeitamente. Todas as regras."

**Status:** ✅ RESOLVIDO 2026-05-11

---

## 🏛 ADR novo (IMUTÁVEL)

### ADR-013 · DB trigger de push usa pg_net + vault, nunca Database Webhooks UI

**Decisão:** Triggers de banco que invocam Edge Functions DEVEM usar `net.http_post()` (extensão `pg_net`) com `Authorization: Bearer <service_role_key>` lido de `vault.decrypted_secrets`. Body construído via `jsonb_build_object()` com `NEW.*`. Toda função trigger envolve a chamada em `EXCEPTION WHEN OTHERS THEN RAISE WARNING` para não bloquear o INSERT.

**Contexto:** Database Webhooks UI do Dashboard gera triggers que usam `supabase_functions.http_request` sem Authorization (mesmo quando função alvo tem `--verify-jwt`) e sem uso de `NEW.*` (body literal). Resultado: 401 silencioso em produção.

**Consequência:**
- Vault DEVE ter os secrets `supabase_url` e `service_role_key` criados via `vault.create_secret()` (uma vez, no Dashboard)
- Toda nova trigger que invocar Edge Function: replicar o template da migration `20260511_fix_user_notification_push.sql` ou da `051_push_on_new_message.sql`
- Funções trigger usam `SECURITY DEFINER` (server-side, NÃO contexto Realtime — ADR-005 só restringe DEFINER em funções chamadas pelo Realtime client)
- Database Webhooks UI **proibido** para Edge Functions com `--verify-jwt`

**Status:** IMUTÁVEL

---

## 📦 ADR-006 estendido a user_notifications

ADR-006 já documentava REPLICA IDENTITY FULL para `messages`. Esta sessão estendeu o mesmo princípio a `user_notifications`:
- Migration `20260511_user_notifications_replica_full.sql`
- Filter `user_id=eq.X` em UPDATE/DELETE events agora funciona
- Custo: payload do event maior (8 colunas), negligível para tabela compacta

---

## 🗄 Migrations aplicadas (via MCP `apply_migration`)

| Arquivo local | Version no banco | O que faz |
|---|---|---|
| `supabase/migrations/20260511_fix_user_notification_push.sql` | `20260511114252` | Trigger correto para push em user_notifications |
| `supabase/migrations/20260511_user_notifications_replica_full.sql` | aplicado em 2026-05-11 | `REPLICA IDENTITY FULL` |

Ambas versionadas localmente espelhando o que está em produção (sincronia banco ↔ repo).

---

## 📂 Arquivos modificados (lista completa)

### Código (TS/TSX)

| Arquivo | Commit | Mudança |
|---|---|---|
| `hooks/useNotificationsSubscription.ts` | `caea7e8` | Adiciona `.on(UPDATE)` e `.on(DELETE)` no canal singleton. Dispara DOM events `prosperus:notification-updated` e `-deleted` com payload `UserNotification` tipado. |
| `contexts/NotificationsContext.tsx` | `caea7e8` | Escuta os 2 novos DOM events e chama `refreshNotifications()`. Cleanup de listeners no unmount. |
| `components/notifications/NotificationCenter.tsx` | `df7171e` | Remove state local `unreadCount`. Consome `useNotifications().unreadNotifications`. Chama `refreshNotifications()` após handleNotificationClick, handleMarkAllAsRead. |
| `components/notifications/NotificationsPage.tsx` | `df7171e` + `caea7e8` | Importa `useNotifications`. Chama `refreshNotifications()` em handleMarkAsRead, handleMarkAllAsRead, handleDelete, handleDeleteAllRead, handleDismiss, handleUndoDismiss. **useEffect inicial agora awaita `markAllRead` antes de `refreshNotifications` (corrige race).** |

### Banco

| Arquivo | Commit |
|---|---|
| `supabase/migrations/20260511_fix_user_notification_push.sql` | `3e7ae6f` |
| `supabase/migrations/20260511_user_notifications_replica_full.sql` | `c1b6691` |

### Documentação

| Arquivo | Commit | Mudança |
|---|---|---|
| `.context/memory/decisions.md` | `3e7ae6f` | **ADR-013 (IMUTÁVEL)** adicionada |
| `.context/memory/issues.md` | `3e7ae6f` + `c1b6691` | Issue-010 e Issue-011 marcados como RESOLVIDOS com diagnóstico + solução |
| `.context/memory/progress.md` | `3e7ae6f` | Entrada "Push web nativo desbloqueado (2026-05-11)" |

---

## 🧠 Lições para sessões futuras

### Sobre Database Webhooks UI vs migrations SQL

A UI do Supabase Dashboard para criar Database Webhooks **não envia Authorization header nem usa `NEW.*` por padrão**. Para Edge Functions com `--verify-jwt`, isso quebra silenciosamente. Sempre criar triggers de push via migration SQL com pg_net + vault (template em ADR-013).

### Sobre REPLICA IDENTITY e filters do Realtime

Tabelas que precisam de filters em UPDATE/DELETE events do Realtime **DEVEM ter REPLICA IDENTITY FULL**. Default só inclui PK no payload — filter avalia contra payload e falha silenciosamente se a coluna do filter não estiver lá. Checar via `pg_class.relreplident` (`'d'` = default, `'f'` = full).

### Sobre await em useEffect com mutations

`markAllRead()` + `refreshNotifications()` no mesmo useEffect SEM await encadeado → race condition determinística. SELECT count corre antes do UPDATE terminar → valor antigo. Padrão correto: IIFE async com flag `cancelled` para cleanup do effect em StrictMode.

### Sobre arquitetura de badge

Estado de count deve viver no **Provider/Context** centralizado, não em state local de cada componente que mostra badge. Componentes consomem; mutators chamam `refresh*()` do context após qualquer mudança no banco. Caso contrário, sincronia entre telas é impossível.

### Sobre MCP do Supabase para diagnóstico

`execute_sql`, `get_logs`, `apply_migration` resolvem em minutos o que via Dashboard manual leva horas. Especialmente útil para:
- Inspecionar `information_schema.triggers` + `action_statement`
- Confirmar REPLICA IDENTITY via `pg_class.relreplident`
- Checar publication via `pg_publication_tables`
- Ver `vault.decrypted_secrets` sem expor valores
- Validar pg_net `_http_response` após fire de trigger

---

## 🎯 Estado atual

**Funcionando ponta-a-ponta:**
- INSERT em `user_notifications` → trigger pg_net → send-push 200 → push nativo no OS (iPhone/Android/Desktop)
- markAsRead/delete em qualquer tela/aba/dispositivo → Realtime UPDATE/DELETE → DOM event → context refresh → badge zera em <1s

**Issues abertas que NÃO foram tocadas nesta sessão:**
- Push subscription cleanup automatizado (cron) — backlog P2, ainda relevante
- Sentry observability (Tier 1 do EXECUTION_PLAN)
- Supabase PITR confirmation (Tier 1)
- HubSpot rate limit handling (Tier 2)

**Próximos passos sugeridos no plano:**
1. Sentry setup completo (~2-3h) — para detectar regressões nesse fluxo de push no futuro
2. Confirmar Supabase PITR no Dashboard (30min) — segurança crítica
3. Subscription cleanup cron (~2h) — manter o banco saudável

---

## ✅ Critérios de aceite atendidos

- [x] Push nativo chega ao dispositivo (validado pelo usuário em produção)
- [x] Badge do sino dentro do app sincroniza com banco em tempo real
- [x] App icon badge (Badging API) limpa após markAllRead
- [x] Cross-device sync (markAsRead num device atualiza badge no outro)
- [x] Zero `:any` introduzido (R6)
- [x] Channel name determinístico (R4)
- [x] notify* fire-and-forget preservado (R5)
- [x] ADR-002 e ADR-006 IMUTÁVEIS respeitadas (não tocadas em useUnreadMessageCount nem UnreadCountContext)
- [x] tsc --noEmit exit 0 em todos os commits
- [x] CI verde no `main` após cada push

---

## 📜 Linha do tempo dos commits

```
3e7ae6f  fix(push): trigger user_notifications usa pg_net + vault (ADR-013)
df7171e  fix(notifications): badge sincroniza entre NotificationsPage e NotificationCenter
c1b6691  fix(realtime): REPLICA IDENTITY FULL em user_notifications (Issue-011)
caea7e8  fix(notifications): Realtime UPDATE/DELETE + race condition em markAllRead
```

Todos para `origin/main` via SSH (ADR-008 do `.context` não-aplicável, mas registrado em `prosperus_integrations.md` da memória externa).

---

**Fim do relatório · Sessão 2026-05-11 · push web nativo + badge realtime sync**
