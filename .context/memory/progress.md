# .context/memory/progress.md — Status Atual
# Prosperus Club App · Abril 2026
# Atualizar após cada sprint

## Score: 10/10

| Módulo | Score | Entregue em |
|--------|-------|-------------|
| Smart Login + Auth | 10/10 | Fev/2026 |
| Onboarding (7 steps + calibração ROI) | 10/10 | Abr/2026 |
| Dashboard + Analytics | 10/10 | Mar/2026 |
| Member Book + Conexão Estratégica | 10/10 | Mar/2026 |
| Business Core + Rankings | 10/10 | Mar/2026 |
| Agenda + RSVP + QR Tickets | 10/10 | Abr/2026 |
| Chat Realtime (DOM events) | 10/10 | Mar/2026 |
| Academy + Materiais | 10/10 | Mar/2026 |
| Galeria | 10/10 | Mar/2026 |
| Prosperus Tools | 10/10 | Mar/2026 |
| Push iOS + Android + Desktop | 10/10 | Mar/2026 |
| Crescimento (ROI / Múltiplo) | 10/10 | Abr/2026 |
| Banners de Notificação | 10/10 | Abr/2026 |
| HubSpot Integration (omnichannel) | 10/10 | Abr/2026 |
| Universal Directory + Shadow Profiles | 10/10 | Abr/2026 |
| Aniversários (sync + push) | 10/10 | Abr/2026 |
| Admin Panel (13 módulos) | 10/10 | Mar/2026 |
| Banco + RLS + Realtime | 10/10 | Mar/2026 |

## Métricas do codebase (re-medido 2026-05-08)

```
Arquivos TS/TSX:     275
Migrations:          95 (001 → 080 + 20260331_* + 20260429_* + 20260511_* x4)
Edge Functions:      11 deploy + 1 lib interna (_shared/hubspot-client.ts)
Linhas de código:    ~60k
console.log prod:    0
:any remanescentes:  81  (era 183 — auditoria anterior estava 2× pessimista)
```

## Sprint 2026-05-13 — Push subscription cleanup automatizado (ADR-016)

Resolução de Issue-014 (48 zombies em `push_subscriptions` acumulados desde 2026-03-03).

**Entregue:**
- `supabase/functions/cleanup-push-subscriptions/index.ts` — Edge Function de manutenção (Regra A: delete inativas >30d; Regra C: delete órfãs; Regra B skipped por colunas não-populadas — ver ADR-016)
- Migration `20260513_push_cleanup_cron.sql` — pg_cron `push-cleanup-daily` cron `0 3 * * *` aplicada via MCP (jobid=3, active=true)
- ADR-016 documentado em `decisions.md`
- Issue-014 marcada resolvida em `issues.md`
- `docs/EDGE_FUNCTIONS_AUDIT.md` atualizado: 13 Edge Functions agora

**Validações:**
- Estado real validado via MCP antes de codar (107 linhas, 33 deletáveis na primeira run)
- `tsc --noEmit` clean
- Migration aplicada via MCP `apply_migration`
- `cron.job` confirma `push-cleanup-daily` jobid=3 active=true coexistindo com `hubspot-retry-failures-6h` jobid=2
- Refutação aceita: Regra B cancelada nesta versão (colunas necessárias não populadas em produção)

**TODOs operacionais (Fábio executa no VPS):**
1. **Deploy via CLI:**
   ```bash
   cd /var/www/prosperus-club-app
   git pull origin main
   supabase functions deploy cleanup-push-subscriptions
   ```
2. **Smoke test manual** (antes do primeiro firing automático às 03:00 UTC):
   ```sql
   -- Dashboard SQL Editor
   SELECT net.http_post(
     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1)
            || '/functions/v1/cleanup-push-subscriptions',
     headers := jsonb_build_object(
       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
       'Content-Type', 'application/json'
     ),
     body := '{}'::jsonb
   );

   -- Aguarda 5-10s, depois:
   SELECT status_code, content::text FROM net._http_response
   ORDER BY created DESC LIMIT 1;
   ```
   Esperado: `status_code=200` + payload com `deleted_inactive_old` ≈ 33 (estado em 2026-05-13).
3. Após smoke test OK, deixar o cron rodar diariamente.

**Padrão consolidado:** este é o **segundo cron seguindo pg_cron + vault + Edge Function** (precedente: ADR-015 hubspot-retry-failures). Daqui em diante, todo cron novo segue exatamente este template — NUNCA via Dashboard cron UI.

**TODO futuro (ADR-017):** popular `last_used_at`/`error_count` em `send-push` para habilitar Regra B (ativas que silenciosamente pararam de entregar há >90 dias).

## Sprint 2026-05-11 — HubSpot rate limit handling (ADR-015)

Resolução de Issue-012 retroativa (perda silenciosa de chamadas HubSpot em 429/5xx).

**Entregue:**
- `supabase/functions/_shared/hubspot-client.ts` — `hubspotFetch` (retry/backoff) + `withFailureQueue`
- Migration `20260511_hubspot_failed_calls.sql` — fila persistente
- Refactor das 4 Edge Functions HubSpot (sync-hubspot, update-hubspot-contact, sync-hubspot-birthdays full; hubspot-webhook parcial por design)
- `hubspot-retry-failures` Edge Function + migration `20260511_hubspot_retry_cron.sql` (pg_cron `0 */6 * * *`)
- ADR-015 documentado em `decisions.md`
- Issue-012 marcada resolvida em `issues.md`

**Validações:**
- Migration aplicada via MCP `apply_migration` — tabela criada com 13 colunas + 2 indexes + RLS policy
- pg_cron 1.6.4 habilitada; job `hubspot-retry-failures-6h` ativo (jobid=1)
- Vault secrets `supabase_url` e `service_role_key` confirmados (reuso ADR-013)
- `tsc --noEmit` clean
- Callers TS (fire-and-forget) inalterados

**TODO operacional (fora desta sprint):**
- Deploy das 5 Edge Functions atualizadas via CLI (`supabase functions deploy <name>`)
- UI admin para inspecionar a fila (SELECT policy já permite ADMIN/TEAM)

## Sprint 2026-05-11 (tarde) — Recovery do deploy ADR-015

Auditoria do briefing original revelou que `hubspot-retry-failures` deveria estar
deployada mas não estava. Investigação encontrou um problema **maior**:

### Achados
1. **6 commits locais não pushados para `origin/main`** desde `909468b` (manhã):
   ```
   2756905 fix(push): guard de sessao antes do upsert
   633f255 docs(hubspot): ADR-015 + audit + schema reference
   aef3c4e feat(hubspot): cron job to retry queued failures every 6h
   46707dd refactor(hubspot): edge functions use retry wrapper + queue
   a975419 feat(hubspot): persistence layer for failed call queue
   909468b feat(hubspot): retry/backoff wrapper with failure queue support
   ```
2. **VPS (`/var/www/prosperus-club-app/`) não tem nenhum desses 6 commits** —
   `supabase functions deploy hubspot-retry-failures` falhou com "no such file
   or directory".
3. **Functions HubSpot deployadas (v38/v23/v13/v7) AINDA RODAM O CÓDIGO ANTIGO**
   pré-ADR-015. Validado via `mcp__Supabase__get_edge_function sync-hubspot`:
   - Faz `fetch()` raw (sem retry/backoff)
   - Retorna status 400 em erro (não 200 uniforme)
   - Não importa de `_shared/hubspot-client.ts`
   - Não usa `withFailureQueue`
4. Como consequência: a fila `hubspot_failed_calls` nunca recebe inserts em
   produção — toda a ADR-015 está deployada **pela metade**.
5. Cron job `hubspot-retry-failures-6h` original (jobid=1) tinha sido
   completamente removido (não só pausado) — recriado como jobid=2 com mesmo schedule.

### Ações executadas via MCP (não dependem do VPS)
- `mcp__Supabase__deploy_edge_function` para `hubspot-retry-failures` →
  function ACTIVE (v1) em produção, independente do estado do VPS.
- Workaround no JSDoc do arquivo local: a sequência `*/` em comentário
  multiline JSDoc quebra o parser Deno Edge Runtime. Trocado para `//`
  comentários de linha.
- `cron.schedule` recriado para `hubspot-retry-failures-6h` cron `0 */6 * * *`
  active=true (jobid=2).
- Teste manual via `net.http_post`: status_code=200, response
  `{"ok":true,"stats":{"picked":0,...}}` confirma function viva.
- Limpeza de `.git/refs/desktop.ini` (junk file Windows) que envenenava
  comandos `git log --all`/`--grep` no repo local.

### TODOs operacionais que sobraram (precisa do Fábio)
**Críticos:**
1. `git push origin main` do meu local (eu não pushei automaticamente — ação
   visível precisa autorização). Vai subir os 6 commits para o repo remoto.
2. No VPS: `cd /var/www/prosperus-club-app && git pull origin main`
3. No VPS: redeploy das 4 Edge Functions HubSpot para puxar o refactor real:
   ```bash
   supabase functions deploy sync-hubspot
   supabase functions deploy update-hubspot-contact
   supabase functions deploy sync-hubspot-birthdays
   supabase functions deploy hubspot-webhook
   ```
   Sem isso, a queue continua vazia em produção.
4. Opcional: `supabase functions deploy hubspot-retry-failures` no VPS para
   alinhar a versão deployada (atualmente é a MCP-deployed v1, que é
   funcionalmente igual mas estilisticamente diferente do que está no disco).

**Não-crítico:**
- Diagnóstico do PushAutoSubscriber (47 subs acumuladas, 403 RLS). Patch
  defensivo já no commit `2756905`. Reproduzir no desktop pós-deploy.

### Checkpoint consolidado — 2026-05-12

**Tier 1 quase 100%:**

| Item | Status |
|---|---|
| Push web nativo (iOS/Android/Desktop) | ✅ Issue-010 |
| Badge realtime sync | ✅ Issue-011 |
| NotificationsProvider singleton | ✅ ADR-012 |
| Edge Functions cleanup (2 zombies removidas) | ✅ |
| Sentry observability live (release `0.1.0-<sha>`) | ✅ ADR-014 |
| PushAutoSubscriber 403 RLS | ✅ commit `2756905` |
| HubSpot rate limit + fila + cron | ✅ ADR-015 end-to-end |
| Supabase PITR | ⏳ aguardando decisão financeira |
| Push subscription cleanup cron | ⏳ próxima sessão |

**Janela de observação 24-48h (2026-05-12 a 2026-05-14):** sem código novo.
Hábito diário sugerido: checar `cron.job_run_details` (jobid=2), contar status
em `hubspot_failed_calls`, contar `push_subscriptions` por `is_active`, e
Issues novas no Sentry filtradas por `level:error` e `tags:role`.

**TODOs de baixa prioridade (não-bloqueantes):**

1. **Dupla SUBSCRIBED de `notifications channel`** — Sentry breadcrumb em
   2026-05-12 17:06:37 + 17:06:38 mostra 2 `SUBSCRIBED` consecutivos após
   um `CHANNEL_ERROR` transient. Pode ser apenas ruído de log do cliente
   Supabase ou um leak menor em `useNotificationsSubscription.ts`. Não é
   regressão visível (badge funciona, push chega). Investigar só quando
   outro fluxo tocar o hook — abrir caixa preta sem motivo seria desperdício.
2. **47 subs acumuladas em `push_subscriptions`** de 1 user específico
   (`bdab9235-4de2-4e05-bd77-83261b989082`) — endpoints rotacionando.
   Cleanup cron é a próxima sprint de Tier 1.
3. **UI admin para inspecionar `hubspot_failed_calls`** — RLS SELECT já
   permite ADMIN/TEAM. Espera primeira entrada real na fila antes de
   priorizar.
4. **`package.json#version`** bumped 0.0.0 → 0.1.0 no commit deste checkpoint.
   Próximo build inclui Sentry release `0.1.0-<sha>` corretamente.

### Fechamento final do gap (mesma sessão, ~14:40 UTC)

Após `git push origin main` (7 commits) e Fábio rodar deploy no VPS, status atualizado:

| Function | Versão | ezbr_sha256 | ADR-015 |
|---|---|---|---|
| `sync-hubspot` | v39 | `51ad528e...` | ✅ refactor live |
| `update-hubspot-contact` | v8 | `6940889d...` | ✅ refactor live |
| `sync-hubspot-birthdays` | v14 | `9502ce04...` | ✅ refactor live |
| `hubspot-webhook` | v24 | `608d8dd3...` | ✅ refactor live (loops wrappados) |
| `hubspot-retry-failures` | v1 | `f90e3827...` | ✅ deploy MCP |

Validação via `mcp__Supabase__get_edge_function sync-hubspot`: bundle contém
`import {...} from '../_shared/hubspot-client.ts'`, `withFailureQueue`, response
200 uniforme. **ADR-015 oficialmente end-to-end em produção.**

Cron job `hubspot-retry-failures-6h` ativo (jobid=2, schedule `0 */6 * * *`).
Próximo firing: 00:00 UTC do dia seguinte (já em horário ativo, pode disparar
nas próximas horas se passar de uma marca de 6h).

## Limpeza executada (Abr/2026)

Deletados com 0 importações confirmadas:
- services/exportService.ts
- hooks/useGlobalSubscription.ts
- hooks/useLongPress.ts
- hooks/useTypingIndicator.ts
- utils/profileUtils.ts
- utils/clearSupabaseCache.js

## Limpeza executada (2026-05-08 — sessão estruturada P0/P1/P2)

### P0 — Deleções imediatas (commit `chore(cleanup): P0`)
- 8 leftovers do root: `tsc_errors{,2,3}.txt`, `pdf_content.txt`, `inventory.csv`, `fix-overflow.cjs`, `test_db.mjs`, `test_rls.sql`
- 18 docs obsoletos em docs/: `FIX_*` (9), `CORRECAO_*` (3), `TROUBLESHOOTING_*` (2), `SOLUCAO_*` (1), `PUSH-NOTIFICATIONS-FIX.md`, `ERRO_EDGE_FUNCTION.md`, `GALLERY_COVER_IMAGE.md`
- 1 doc órfão: `supabase/functions/DENO_TYPESCRIPT_FIX.md`
- 2 audit docs movidos do root → docs/ (local-only): `auditoria_features_abril_2026.md`, `certificacao_academy_notificacoes.md`
- `.gitignore` reescrito: troca `docs/` por `docs/*` + whitelist seletiva de canônicos
- Baseline de docs canônicos versionados: `SESSAO_*`, `DESIGN_SYSTEM`, `BRAND_MIGRATION_GUIDE`, `INTEGRATIONS_SETUP`, `EDGE_FUNCTIONS_AUDIT`, `MIGRATIONS_HISTORY`, `archive/`, `hubspot/SCHEMA_REFERENCE`

### P1 — Reorganização (commit `chore(cleanup): P1`)
- `raw-imports.d.ts` deletado (zero usos confirmados via grep)
- `scripts/migrations/` (NOVO) ← `sync_hubspot.mjs`, `emails_to_sync.json` + README explicando "não rodar de novo"
- `infra/nginx/` (NOVO) ← `nginx-cache.conf`, `nginx-upload.conf`
- `scripts/utils/` (NOVO) ← `extract_docx.{js,py}`
- `public/templates/` (NOVO) ← `email-template-atualizacao.html`
- `public/assets/screenshots/` (NOVO) ← `deals_mobile_cards_*.png`
- Deletados (filesystem-only, eram em docs/ ainda gitignored): `presenca_evento_*.csv`, `Admin_Panel_Report_Prosperus.docx`, `migracao.zip`
- `docs/EDGE_FUNCTIONS_AUDIT.md` (NOVO) — 3 functions marcadas como "CONFIRMAR" (receive-report, sync-hubspot-amounts, sync-shadow-profiles) por não terem caller TS confirmado

### P2 — Scaffolding (commit `chore(cleanup): P2`)
- `docs/archive/2026-Q1/` e `2026-Q2/` (NOVO) com README de convenção
- 6 docs históricos arquivados em 2026-Q1: `auditoria_completa.md`, `master_audit_v3_26_02_2026.md`, `prosperus_club_app_audit_2026.md`, `AUDITORIA_SISTEMA_2026.md`, `week_close_audit_27_02_2026.md`, `walkthrough.md` (244KB)
- `docs/MIGRATIONS_HISTORY.md` (NOVO) — documenta 11 pares duplicados, 2 nuclear fixes, saga RLS de chat, quebra de convenção e proposta YYYYMMDD_HHMM para futuras

### Pendências externas (não-código)
- Validar logs no Supabase Dashboard das 3 Edge Functions suspeitas (ver `docs/EDGE_FUNCTIONS_AUDIT.md`)
- P2 futuro: rodar `npx ts-prune` ou `knip` para confirmar 0 órfãos no TS/TSX
- P2 futuro: adicionar CI check de colisão de prefixo de migration (script em `MIGRATIONS_HISTORY.md`)

## Relatórios completos da sessão 2026-05-11 (cross-reference)

- `docs/SESSAO_11_MAI_2026_PUSH_BADGE.md` — primeira parte: push web nativo + badge realtime sync
- `docs/SESSAO_11_MAI_2026_CLEANUP_SENTRY.md` — segunda parte: Edge Functions cleanup + Sentry setup + 2 hotfixes

## Sentry — camada de observabilidade (2026-05-11)

ADR-014 criada (ATIVO). Setup completo do `@sentry/react` para captura de
erros em produção, espelhando os modos de falha vistos em Issue-010
(trigger broken) e Issue-011 (race condition silenciosa).

### Frontend SDK
- `lib/sentry.ts` — `initSentry()` + helper `addBreadcrumb()` tipado por
  categoria (`auth/push/notification/realtime/hubspot`). `enabled:
  import.meta.env.PROD` (dev fica off, zero overhead).
- `vite.config.ts` — `@sentry/vite-plugin` ativo apenas quando
  `SENTRY_AUTH_TOKEN` presente. `build.sourcemap: 'hidden'` — source maps
  geradas mas não referenciadas no bundle público. Release injetado em
  build-time via `define: { __APP_VERSION__: '${version}-${git sha}' }`.

### Integração
- `index.tsx` — `initSentry()` antes do `ReactDOM.createRoot`. `<App />`
  envolto por `<ErrorBoundary>` (próprio, não Sentry.ErrorBoundary).
- `components/ui/ErrorBoundary.tsx` — mantido (ChunkLoadError
  auto-reload preservado). `componentDidCatch` agora chama
  `Sentry.captureException` com `tags`, `level` e `componentStack`. UI
  refatorada com tokens `prosperus-*` (R9): fundo
  `bg-prosperus-azul-profundo`, título `font-display`, CTA gradient gold.
- `contexts/AuthContext.tsx` — `useEffect` que reage a `userProfile` chama
  `Sentry.setUser({ id, email, role })`. `Sentry.setUser(null)` no
  `logout()` e no listener `SIGNED_OUT`. Sem mudar shape do
  `AuthContextType`.

### Breadcrumbs em 6 arquivos críticos
- `hooks/useUnreadMessageCount.ts` — ADR-002 IMUTÁVEL preservada;
  `addBreadcrumb('realtime', ...)` apenas ao lado dos `logger.debug/error`
  no callback `.subscribe()` (SUBSCRIBED / CHANNEL_ERROR / TIMED_OUT)
- `hooks/useNotificationsSubscription.ts` — categoria `realtime` no
  callback `.subscribe()`
- `services/notificationTriggers.ts` — categoria `notification` no início
  de cada notify*
- `hooks/useProfileForm.ts` — categoria `hubspot` antes/depois de
  `invoke('sync-hubspot')` e `invoke('update-hubspot-contact')`
- `services/adminBirthdayService.ts` — categoria `hubspot` em
  `invoke('sync-hubspot-birthdays')`
- `services/notificationService.ts` — categoria `push` em
  `registerPushToken` e `removePushToken`

### Filtros (beforeSend)
4 ruídos conhecidos descartados antes do envio ao Sentry:
1. `AbortError` com mensagem `aborted/signal is aborted` (StrictMode)
2. HTTP `410 Gone` (push stale, auto-cleanup esperado per ADR-013)
3. `ResizeObserver loop` (browser noise)
4. `Non-Error promise rejection captured` sem stack útil

### Documentação
- `docs/OBSERVABILITY.md` — guia completo (acesso, env vars, decisões de
  design, tags por role, template de breadcrumb, smoke test em prod build,
  política de retenção, pendências externas operacionais)
- `.env.example` — 4 novas variáveis (`VITE_SENTRY_DSN`,
  `VITE_SENTRY_ORG`, `VITE_SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`)

### TODO operacional (não-dev — Fábio)
- [ ] Criar projeto `prosperus-club-app` em sentry.io e obter DSN
- [ ] Gerar `SENTRY_AUTH_TOKEN` com scopes `project:read`, `project:releases`, `org:read`
- [ ] Adicionar variáveis ao host de produção (Vercel/Netlify/etc.)
- [ ] Adicionar `SENTRY_AUTH_TOKEN` como secret no GitHub Actions
- [ ] Atualizar `.github/workflows/main.yml` (já tem `npm run build`) para passar as 4 vars do Sentry no env do step
- [ ] Smoke test: build local + preview + `throw new Error('sentry-smoke-test')` no console

## Edge Functions cleanup — sync-hubspot-amounts e sync-shadow-profiles (2026-05-11)

Auditoria operacional confirmou zero invocações em 30 dias para 2 das 3 functions marcadas como "CONFIRMAR" na sessão 2026-05-08:
- `sync-hubspot-amounts`
- `sync-shadow-profiles`

`receive-report` permanece ATIVA (caller externo confirmado) mas com ~30% taxa de 404 — TODO operacional (não-dev) registrado em `docs/EDGE_FUNCTIONS_AUDIT.md` para investigar caller.

### Ações executadas no repositório
- `rm -rf supabase/functions/{sync-hubspot-amounts,sync-shadow-profiles}`
- `supabase/config.toml`: removidos blocos `[functions.sync-hubspot-amounts]` e `[functions.sync-shadow-profiles]`
- `.context/project.toml`: removidas das listas `edge_functions.no_verify`
- `README.md`: removido comando `deploy sync-shadow-profiles` + tree
- `docs/EDGE_FUNCTIONS_AUDIT.md`: reescrita com sessão "Functions removidas" + TODO `receive-report`
- `docs/INTEGRATIONS_SETUP.md`, `docs/hubspot/SCHEMA_REFERENCE.md`: referências marcadas como removidas

### ⏳ TODO operacional do Fábio (não-dev, não bloqueia commits)

Acessar Supabase Dashboard e deletar as 2 functions remotamente — o `rm` no repo NÃO undeploya:

```
Dashboard → https://supabase.com/dashboard/project/ptvsctwwonvirdwprugv/functions
  → Sync Hubspot Amounts   → Settings → Delete function
  → Sync Shadow Profiles   → Settings → Delete function
```

Alternativa via CLI (se logado):
```bash
supabase functions delete sync-hubspot-amounts --project-ref ptvsctwwonvirdwprugv
supabase functions delete sync-shadow-profiles --project-ref ptvsctwwonvirdwprugv
```

Validar undeploy:
```bash
curl https://ptvsctwwonvirdwprugv.supabase.co/functions/v1/sync-hubspot-amounts
# Esperado: HTTP 404 (em vez do 401 atual)
```

## Push web nativo desbloqueado (2026-05-11)

Issue-010 resolvido. Diagnóstico via MCP do Supabase:
- Vault estava sem `supabase_url` e `service_role_key` — migration 051 (chat) também afetada silenciosamente
- Trigger `send-push-on-new-notification` em `user_notifications` foi criada via Dashboard Webhooks UI sem auth + body vazio → 401 silencioso

Solução em 2 etapas:
1. Usuário criou os 2 vault secrets via Dashboard SQL Editor (`SELECT vault.create_secret(...)`)
2. Migration `20260511_fix_user_notification_push.sql` aplicada via MCP (`apply_migration`):
   - DROP trigger antigo `send-push-on-new-notification`
   - Nova função `notify_new_user_notification_push()` no padrão da migration 051 (pg_net + vault + exception handler + NEW.* no body)
   - Novo trigger `on_new_user_notification_push` em `user_notifications`

Validação: INSERT de teste no `user_notifications` (user_id do Fábio) → send-push respondeu 200 → 8 pushes entregues + 8 marcadas como inactive (HTTP 410 stale subs, auto-cleanup interno do send-push).

Bonus: Issue-010 também desbloqueia push de chat (migration 051) que estava silenciosamente quebrada pelo mesmo motivo (vault vazio).

ADR-013 criado (IMUTÁVEL): "DB trigger de push usa pg_net + vault, nunca Database Webhooks UI".

## NotificationsProvider — fechamento P1 #1 (2026-05-08)

ADR-012 criada (IMUTÁVEL). Arquitetura paralela ao ADR-002 (messages):

- **NOVO:** `hooks/useNotificationsSubscription.ts` — singleton com canal determinístico `notifications-${userId}`, dispatch DOM event `prosperus:new-notification`, reconnect logic + online listener (espelho de useUnreadMessageCount).
- **NOVO:** `contexts/NotificationsContext.tsx` — Provider expondo `useNotifications()` (count, refresh, markAllRead) + helper `useOnNewNotification(handler)` para componentes que mantêm listas próprias.
- **NOVO:** `<NotificationsProvider>` wrappado em `App.tsx` em ambos branches (admin + member), aninhado dentro de `<UnreadCountProvider>`.
- **MIGRADO:** `NotificationCenter.tsx` e `NotificationsPage.tsx` — removidas chamadas diretas a `subscribeToNotifications`, agora usam `useOnNewNotification`.
- **REMOVIDO:** `notificationService.subscribeToNotifications` (anti-pattern com `Math.random()` no nome do channel — último Math.random remanescente no codebase).
- **REGRA R2 estendida:** rules.md agora menciona ADR-012 explicitamente.

Critério de aceite atendido: zero `supabase.channel/from` para user_notifications fora do hook singleton (exceto `UnreadCountContext.unread-notif-*` que era fora de escopo, ADR-002 imutável). Validação tripla: `tsc --noEmit` exit 0, build local OK, browser test pendente do usuário.

## Pendentes (próxima sprint)

```
CRÍTICO:
□ Performance Lighthouse 29 → 75+ (PROMPT_PERFORMANCE_SPRINT.md pronto)

ALTA:
□ Photo Editor circular (PROMPT_PHOTO_EDITOR_PRO.md pronto)
□ Design System tokens em todo o app (PROMPT_DESIGN_SYSTEM_UPDATE.md pronto)
□ Fix carrossel Academy + sidebar vídeo (PROMPT_FIX_CAROUSEL_VIDEO_SCROLL.md)

MÉDIA:
✅ notifyNewSolution / notifyNewArticle / notifyEventUpdated — entregues e fire-and-forget
✅ notifyNewVideo / notifyNewGallery / notifyNewEvent — implementados (eram stubs)
□ 4 plugs de analytics
□ Remediação dos 81 :any (era 183 — re-medido 2026-05-08)

NEGÓCIO:
□ App Stores: Apple US$99/ano + Google US$25 (burocracia pendente)
□ D-U-N-S Number para conta empresa Apple
□ HubSpot: scope crm.objects.companies.write
```
