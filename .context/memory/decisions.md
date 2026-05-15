# .context/memory/decisions.md — ADRs (Architectural Decision Records)
# Prosperus Club App · Abril 2026
# Consultar antes de tomar decisões arquiteturais

## ADR-001 · Singleton Supabase
**Decisão:** Um único `createClient()` em `lib/supabase.ts`.
**Contexto:** Múltiplos `createClient()` causavam AbortError no PushAutoSubscriber.
**Consequência:** Todos os arquivos importam `{ supabase }` de `../lib/supabase`.
**Status:** IMUTÁVEL

## ADR-002 · Canal único Realtime para messages
**Decisão:** `useUnreadMessageCount.ts` é o único canal. Componentes usam DOM events.
**Contexto:** Múltiplos channels causavam `mismatch between server and client bindings`.
**Consequência:** ChatWindow, ConversationList, AdminChatManager escutam `window.addEventListener('prosperus:new-message')`.
**Status:** IMUTÁVEL

## ADR-003 · sessionStorage no PushAutoSubscriber
**Decisão:** `sessionStorage` (não `useRef`) como guard de execução única.
**Contexto:** React.StrictMode monta/desmonta/remonta → `useRef` reseta → AbortError → subscription não salva.
**Consequência:** `const sessionKey = \`push-subscribing-\${userId}\``
**Status:** IMUTÁVEL

## ADR-004 · Nomes de channel fixos
**Decisão:** Channel names sempre determinísticos, sem `Math.random()`.
**Contexto:** `Math.random()` causava `mismatch between server and client bindings`.
**Consequência:** Padrão: `` `unread-msgs-${userId}` ``
**Status:** IMUTÁVEL

## ADR-005 · messages sem SECURITY DEFINER
**Decisão:** RLS de `messages` usa subquery direta, sem `SECURITY DEFINER`.
**Contexto:** `SECURITY DEFINER` faz `auth.uid()` retornar null no contexto Realtime → eventos bloqueados.
**Consequência:** SELECT policy usa `conversation_id IN (SELECT ... WHERE user_id = auth.uid())`.
**Status:** IMUTÁVEL

## ADR-006 · messages REPLICA IDENTITY FULL
**Decisão:** `ALTER TABLE messages REPLICA IDENTITY FULL`.
**Contexto:** Filtros no Realtime (ex: `filter: conversation_id=eq.X`) exigem FULL para funcionar.
**Consequência:** Todos os campos são enviados no payload do evento Realtime.
**Status:** IMUTÁVEL

## ADR-007 · Tailwind v4 + @theme como camada de estilo oficial
**Decisão:** Tailwind v4 (via `@tailwindcss/vite`) é a camada de estilo oficial. Os design tokens vivem em `index.css` no bloco `@theme` (equivalente v4 do antigo `tailwind.config.ts`). `utils/designTokens.ts` permanece como fonte para casos não-Tailwind (gradientes inline, manifest PWA, valores CSS-puros). As duas fontes devem manter os mesmos valores.
**Contexto:** ADR-007 original previa "inline styles + designTokens (sem Tailwind)" porque o setup PostCSS+JIT v3 era frágil. Tailwind v4 resolveu isso (plugin Vite + `@theme` em CSS) e o codebase migrou de fato — 2.765+ usos de `className=` em 100+ arquivos, 246 usos de `prosperus-*` tokens. Manter o ADR antigo deixava a documentação contradizendo o código.
**Consequência:**
- Componentes podem usar classes Tailwind. Quando referenciarem cores do clube, devem usar tokens `prosperus-*` definidos em `@theme`, nunca hex hardcoded nem cores default do Tailwind (`bg-emerald-400` etc.).
- `utils/designTokens.ts` é mantido sincronizado com os valores do `@theme`.
- ESLint deve ser configurado para bloquear hex literal em `className` (próxima sprint).
**Status:** ATIVO (substituído em 2026-05-08 — versão original arquivada abaixo)

### ADR-007 (versão original, arquivada)
> Decisão: Inline styles com tokens centralizados em `utils/designTokens.ts`. Sem Tailwind.
> Motivo da revogação: a justificativa técnica (compilador Tailwind indisponível) deixou de existir com Tailwind v4. O codebase nunca seguiu a regra na prática.

## ADR-008 · HubSpot dropdowns (ALLOWED values)
**Decisão:** Sempre validar valores antes de enviar para propriedades dropdown do HubSpot.
**Contexto:** HubSpot aborta o pacote inteiro com `INVALID_OPTION` se um valor não estiver no enum.
**Consequência:** Arrays `ALLOWED_JOBS`, `ALLOWED_HUBSPOT_OPTIONS` — traduzir antes de enviar.
**Status:** ATIVO

## ADR-009 · Shadow Profiles (hubspot_directory)
**Decisão:** Sócios que não fizeram onboarding existem como Shadow Profiles em `hubspot_directory`.
**Contexto:** SmartMemberSelect precisa incluir todos os contatos do HubSpot, não só os com conta ativa.
**Consequência:** `profiles + hubspot_directory = Universal Directory`.
**Status:** ATIVO

## ADR-010 · --no-verify-jwt nas Edge Functions externas
**Decisão:** Edge Functions acionadas por webhooks externos usam `--no-verify-jwt`.
**Contexto:** HubSpot não consegue enviar JWT do Supabase. Segurança garantida por HMAC.
**Consequência:** hubspot-webhook usa HMAC V3 + fallback V1 para ambiente de testes.
**Status:** ATIVO

## ADR-011 · fire-and-forget em notify*
**Decisão:** Funções `notify*` nunca propagam erro para o caller.
**Contexto:** Falha de notificação nunca deve interromper o fluxo principal (salvar deal, criar evento etc.).
**Consequência:** `try { ... } catch(e) { console.error(e) }` — sem `throw`.
**Status:** IMUTÁVEL

## ADR-014 · Sentry como camada de observabilidade do frontend
**Decisão:** Adotar `@sentry/react` + `@sentry/vite-plugin` para captura de erros, performance traces (sample 10%) e session replay on-error (100%). Source maps geradas como `'hidden'` no build e uploadadas via plugin em build-time (`SENTRY_AUTH_TOKEN`). Identidade do usuário injetada via `Sentry.setUser({ id, email, role })` no `AuthContext` quando `userProfile` muda; limpa em logout. Breadcrumbs categorizados (`auth`, `push`, `notification`, `realtime`, `hubspot`) em 6 zonas críticas. `beforeSend` descarta 4 ruídos conhecidos.
**Contexto:** Regressões silenciosas em produção (Issue-010, Issue-011) eram detectadas apenas via reclamação de sócio — tempo de resposta lento e sem stack trace. Sentry tier Free cobre ~5k eventos/mês, suficiente para o volume atual. Custo: zero financeiro, ~5 min de overhead de setup por novo membro.
**Consequência:**
- `lib/sentry.ts` centraliza init + helper `addBreadcrumb()` tipado (`BreadcrumbCategory`)
- `enabled: import.meta.env.PROD` — dev fica off (zero overhead), sem ruído de StrictMode/HMR
- ErrorBoundary próprio (`components/ui/ErrorBoundary.tsx`) **mantido** por causa do auto-reload de `ChunkLoadError`; integra Sentry via `captureException` manual. Decisão explicitada no header do arquivo.
- Release format: `${package.json#version}-${git short sha}` injetado em build-time via `define: { __APP_VERSION__ }`. Falha gracefully para `'unknown'` em ambientes sem git.
- 4 filtros no `beforeSend`: `AbortError aborted`, `HTTP 410 Gone` (push stale, ADR-013), `ResizeObserver loop`, `Non-Error promise rejection captured`
- Tags por role permitem priorização (erro de `ADMIN` > `MEMBER`) no Dashboard
- Source maps NÃO referenciadas no bundle público (sem `//# sourceMappingURL=`), apenas uploadadas → stack trace legível no Sentry, sem expor TS source ao usuário final
**Documentação completa:** `docs/OBSERVABILITY.md`
**Status:** ATIVO

## ADR-013 · DB trigger de push usa pg_net + vault, nunca Database Webhooks UI
**Decisão:** Triggers de banco que invocam Edge Functions DEVEM usar `net.http_post()` (extensão pg_net) com `Authorization: Bearer <service_role_key>` lido de `vault.decrypted_secrets`. Body construído via `jsonb_build_object()` com `NEW.*`. Toda função trigger envolve a chamada em `EXCEPTION WHEN OTHERS THEN RAISE WARNING` para não bloquear o INSERT.
**Contexto:** Antes de 2026-05-11, a trigger `send-push-on-new-notification` em `user_notifications` foi criada via Dashboard → Database Webhooks UI. Essa UI gera `supabase_functions.http_request` SEM Authorization (mesmo quando a função alvo tem `--verify-jwt`) e SEM uso de `NEW` (body literal `'{}'`). Resultado: 401 silencioso, zero pushes entregues. Migration 051 (chat) já usava o padrão correto.
**Consequência:**
- Vault DEVE ter os secrets `supabase_url` e `service_role_key` criados via `vault.create_secret()` (executado uma vez no Dashboard)
- Toda nova trigger que invocar Edge Function: replicar o template da migration `20260511_fix_user_notification_push.sql` ou da 051
- Funções trigger usam `SECURITY DEFINER` (server-side, NÃO contexto Realtime — ADR-005 só restringe DEFINER em funções chamadas pelo Realtime client)
- Database Webhooks UI do Supabase Dashboard: **proibido para Edge Functions com `--verify-jwt`**. Pode ser usado apenas para funções com `--no-verify-jwt` se algum dia houver caso disso.
**Status:** IMUTÁVEL

## ADR-015 · HubSpot rate limit handling com retry/backoff + failure queue
**Decisão:** Todas as chamadas para a HubSpot Public API a partir de Edge Functions Supabase passam por `hubspotFetch()` (em `supabase/functions/_shared/hubspot-client.ts`), que aplica retry com exponential backoff + jitter (4 tentativas, base 1s, factor 2, max 30s, jitter ±25%) e respeita o header `Retry-After` em 429. Falhas que esgotam as 4 tentativas são enfileiradas em `public.hubspot_failed_calls` via `withFailureQueue()`. O cron `hubspot-retry-failures` reprocessa entradas pending a cada 6h (até 4 reprocess_attempts antes de virar `failed_permanent`). Schedules de cron NÃO vivem em `supabase/config.toml` — vivem em migrations `pg_cron` (`net.http_post` + vault secrets, reuso de ADR-013). Toda Edge Function que chama HubSpot retorna **status 200 sempre** com payload uniforme `{ synced, queued, queueId?, error? }`; o status code não é mais usado para sinalizar erro de negócio externo (HubSpot 4xx/5xx). Callers TS (fire-and-forget) já são compatíveis.
**Contexto:** Antes desta decisão, 4 Edge Functions (`sync-hubspot`, `update-hubspot-contact`, `sync-hubspot-birthdays`, `hubspot-webhook`) faziam `fetch()` direto contra `api.hubapi.com` sem qualquer tratamento de 429 ou 5xx. Limite oficial do HubSpot Public App é 110 req/10s — em rajadas (ex: sync de aniversários processando 280 contatos com 4 fetches cada) a função estourava silenciosamente. Sem queue, falhas eram perdidas. Tentativas iniciais de configurar o cron via `[functions.hubspot-retry-failures]` em `config.toml` foram refutadas: o Supabase CLI atual (1.6.x na época) não tem sintaxe de schedule em `config.toml` — `roi-coleta-cron` e `send-birthday-pushes` já existentes não declaravam schedule lá, e o cron vivia configurado fora do versionamento (Dashboard manual ou pg_cron interno). Solução adotada: padronizar pg_cron + vault (espelhando ADR-013 que já era IMUTÁVEL para triggers de push).
**Consequência:**
- `hubspot_failed_calls` (migration `20260511_hubspot_failed_calls.sql`): tabela com `function_name`, `payload jsonb`, `error_status/message`, `attempts default 4`, `status check ('pending'|'reprocessed'|'failed_permanent')`, `reprocess_attempts`. RLS SELECT para `ADMIN`/`TEAM`; INSERT/UPDATE/DELETE só `service_role`.
- `hubspot-retry-failures` Edge Function: lê até 50 pending com `created_at <= now() - 5min`, re-invoca via `supabase.functions.invoke()` com payload original, marca `reprocessed` em sucesso ou incrementa `reprocess_attempts`; após 4 reprocess_attempts → `failed_permanent`.
- Schedule oficial: `pg_cron` job `hubspot-retry-failures-6h` cron `'0 */6 * * *'`. Migration `20260511_hubspot_retry_cron.sql` é idempotente (`cron.unschedule` antes de `cron.schedule`).
- Edge Function `hubspot-webhook` é tratada parcialmente: só os 3 GETs dentro de loops em `handleDealPropertyChange` foram wrappados. GETs one-off não foram wrappados (risco baixo). `withFailureQueue` NÃO é aplicado no webhook — re-invocação por cron passaria sem HMAC válido. HubSpot já tem seu próprio retry no non-2xx do response global; webhook continua retornando 200 sempre.
- Env vars: `HUBSPOT_ACCESS_TOKEN` é o nome canônico do segredo (com fallback opcional para `HUBSPOT_API_KEY` por compatibilidade histórica). O `HUBSPOT_CLIENT_SECRET` é usado APENAS para validação HMAC do webhook (decisão separada, não tocada por ADR-015).
- Todo novo schedule no Prosperus passa a usar pg_cron + vault — Dashboard cron UI fica banido para qualquer função com `--verify-jwt` (mesmo argumento da ADR-013).
- TODO retroativo: criar UI admin para inspecionar a fila (`SELECT` policy já permite). Fica para PR separado.
**Status:** ATIVO

## ADR-018 · Deep-links de notificação via query param

**Status:** **ATIVO**
**Data:** 2026-05-15

**Contexto:** Notificações push criavam URLs sem identificador do recurso (ex: `/app/academy` genérico). `sw.js` navegava corretamente mas a tela de destino não tinha context do item específico — sócio caía na lista geral e tinha que procurar o item manualmente. Investigação preliminar (sessão de 2026-05-15) revelou que 6 de 7 funções `notify*` ignoravam o ID via parâmetro `_underscore` e construíam URLs hardcoded para telas genéricas. Mesmo o `notifyNewGallery` (que aparentemente fazia deep-link via `?album=`) era na verdade um falso positivo: `Gallery.tsx` não lia o query param.

**Decisão:** Adotar **query param** como mecanismo de deep-link para todas as notificações:
- URL construída pelo trigger: `/app/<modulo>?<recurso>=<id>`
- Tela de destino lê query param no mount, **aguarda data load**, abre/foca recurso específico, **limpa query param** via `history.replaceState`
- Padrão simples, sem rotas React Router dedicadas (zero impacto em SPA routing)
- Compatível com `sw.js` atual sem mudanças (zona PROIBIDA mantida)

**Pattern aplicado nesta sessão:** `?video=<uuid>` em Academy. Commits:
- `2d01088` — Camada 2 (trigger constrói URL)
- `d91eee4` — Camada 1 (caller passa videoId)
- `04e40eb` — Camada 3 (Academy lê + abre modal)

**Outras funções `notify*` no mesmo buraco** (Fase 2 do roadmap — replicam o mesmo pattern):
- `notifyNewArticle` → `/app/noticias?artigo=<id>`
- `notifyNewSolution` → `/app/tools/solucoes?solucao=<id>`
- `notifyNewEvent` → `/app/agenda?evento=<id>`
- `notifyEventUpdated` → `/app/agenda?evento=<id>` (idem)
- `notifyNewGallery` → `/app/galeria?album=<id>` (precisa adicionar handler no Gallery.tsx — query param já é construído mas atualmente ignorado)

**Consequências:**
- URLs menos "limpas" que rotas dedicadas (`?video=<uuid>` vs `/video/<uuid>`) — aceito como trade-off pela simplicidade
- Zero risco de quebra de SW/PWA/iOS deep-link (não toca routing engine)
- Cada tela responsável pelo seu próprio query param handling — pattern replicável documentado em `docs/PATTERNS_TYPESCRIPT.md`
- Backward compatible (trigger sem ID → fallback genérico para tela do módulo)
- Guard via `useRef` evita re-disparo quando data refresh ou hot reload

**Não-escopo:** notificações antigas (registros em `user_notifications.action_url` criados antes deste deploy) não migradas. Sócio que clicar em notificação antiga vai pra tela genérica como antes — comportamento idêntico ao anterior, sem regressão.

### Revisão 2026-05-15 — Fase 2a (fix de regex em `handleNotificationNavigate`)

A Fase 1 ficou arquiteturalmente **incompleta**. Investigação revelou que o app **não usa React Router** — roteamento é state-based via `setView(ViewState.X)`. A Camada 3 (useEffect em Academy lendo `?video=`) só dispara se Academy montar, o que depende de uma **Camada A** que mapeie URL → `setView()`.

**Camada A já existia parcialmente** em `contexts/AppContext.tsx:327` (`handleNotificationNavigate`) — chamada pelos componentes in-app (NotificationCenter do sino + NotificationsPage da lista). Mas tinha **bug de regex** captando `'app'` do prefixo `/app/` em vez do segment real ('academy', 'agenda'). Notificações com `action_url='/app/academy?video=X'` caíam no fallback `window.open(url, '_blank')` que **abria nova aba na home** em vez de trocar a view.

**Fix Fase 2a** (commit `7af1f61`): 1 linha adicionando `const stripped = url.replace(/^\/app\//, '/');` antes do regex. Resolve clicks in-app no sino e lista de notificações.

**Status dos 2 caminhos de notificação:**

| Caminho | Quem dispara | Status |
|---|---|---|
| **A — In-app** (sino do header + lista) | `handleNotificationNavigate` em AppContext | ✅ **RESOLVIDO 2026-05-15** (`7af1f61`) |
| **B — Push externo** (notificação do SO com app fechado) | `sw.js` `notificationclick` → `client.navigate(fullUrl)` | ⏳ **Fase 2b** — React não escuta mudança de URL. Solução possível: listener `popstate` no AppProvider OU `BroadcastChannel` (já existe `prosperus-push` no sw.js linha 267, expandir para `NOTIFICATION_CLICK` no `notificationclick`). |

**Limitação adicional descoberta (Fase 2c — TODO):** Alguns triggers usam paths PT que não batem com `ViewState` (que é EN):
- `notifyNewArticle` → `/app/noticias` mas `ViewState.NEWS` (PT≠EN)
- `notifyNewSolution` → `/app/tools/solucoes` mas `ViewState.SOLUTIONS` (estrutura `/tools/X` não bate)
- `notifyNewGallery` → `/app/galeria` mas `ViewState.GALLERY`

Fix futuro (Fase 2c): mapping PT→EN no handler OU alinhar triggers para usar paths EN. Por ora só **vídeo** (`/app/academy`) e **agenda** (`/app/agenda`) funcionam end-to-end.

### Revisão 2026-05-15 — Fase 2c + Fase 3 (Padrão 7 replicado em 5 módulos)

Sessão única com 8 commits direto em `main`. Pré-investigação read-only (relatório consolidado no início da sessão) revelou 3 requisitos pré-Fase 3 que viraram os Commits 1-3.

**Commit 1 — `92f8621`** — `feat(notifications): PT→EN ViewState alias for legacy URLs`
Lookup table `VIEW_ALIASES` em [contexts/AppContext.tsx:327](contexts/AppContext.tsx#L327) (acima de `handleNotificationNavigate`):
```ts
const VIEW_ALIASES: Record<string, ViewState> = {
    'NOTICIAS': ViewState.NEWS,
    'GALERIA': ViewState.GALLERY,
    'SOLUCOES': ViewState.SOLUTIONS,
    'TOOLS': ViewState.SOLUTIONS,  // caso especial: /app/tools/solucoes captura 'TOOLS'
};
```
Handler tenta match direto contra ViewState (EN) primeiro; se falhar, tenta alias PT→EN. Retrocompat com `user_notifications.action_url` antigas e zero impacto em triggers existentes.

`ROI_CRESCIMENTO` (de `notifyColetaFaturamento` → `/app/roi-crescimento`) **removido do alias** — `ViewState.PROGRESS` é sobre arquivos de progresso do sócio (uploads admin), não sobre ROI/faturamento. Match não-óbvio; mantido como fallback `window.open` (comportamento atual preservado).

**Commit 2 — `04be3d0`** — `fix(events): remove duplicate notifyNewEvent dispatch in EventForm`
Bloco redundante em [components/admin/events/EventForm.tsx:274-283](components/admin/events/EventForm.tsx#L274-L283) (`if (shouldNotify)` envolvendo dynamic import de `notifyNewEvent`) removido. `services/eventService.ts:161` já dispara com `data.id` real do INSERT. Bloco antigo enviava 2º push com `eventData.id || 'new'` (ID lixo) — duplicava badge in-app e geraria URL quebrada `/app/agenda?evento=new` no Padrão 7.

**Commit 3 — `c75d8e5`** — `feat(notifications): notifyEventUpdated propagates eventId for deep-link`
Método interno em [notificationTriggers.ts:120](services/notificationTriggers.ts#L120) aceita `eventId?: string`; export `:251` propaga `payload.eventId`. EventForm.tsx:258 já passava `eventId` no payload — apenas não chegava ao service.

**Commit 4 — `e895242`** — `feat(news): notifyNewArticle + NewsList deep-link via ?artigo=<id>`
**Commit 5 — `6d9445a`** — `feat(solutions): notifyNewSolution + SolutionsListPage deep-link via ?solucao=<id>`
**Commit 6 — `bb5a4f5`** — `feat(events): notifyNewEvent + EventDetailsModal deep-link via ?evento=<id>`
**Commit 7 — `d403578`** — `feat(gallery): Gallery deep-link via ?album=<id>` *(trigger já construía a URL desde Fase 1; só faltava a tela ler)*

Cada um replica o pattern 3-camadas: caller (já passava ID em todos os módulos), trigger (constrói URL com query param + fallback genérico) e tela (useEffect + useRef guard + find + abrir recurso + `history.replaceState`).

**EventDetailsModal é global** (renderiza em qualquer view via `selectedEvent` — ViewSwitcher:360-366), então o `useEffect` de evento vive no AppContext, não em uma tela específica. Sócio cai na view atual + modal sobrepõe.

**Caminhos de abertura padronizados:**

| Módulo | Caminho | Componente |
|---|---|---|
| Academy (vídeo) | Modal interno | `VideoPlayerModal` |
| News (artigo) | Tela interna | `ArticleReader` (substitui NewsList em ViewSwitcher) |
| Events (criar + update) | Modal interno global | `EventDetailsModal` |
| Solutions | `window.open(external_url)` | — externo, galeria-style |
| Gallery | `window.open(embedUrl)` | — externo, galeria-style |

**Status final dos 2 caminhos de notificação (PT/EN agora resolvido):**

| Caminho | Status pós-Fase 3 |
|---|---|
| **A — In-app** (sino + lista) | ✅ **5 módulos** (Academy, News, Solutions, Events, Gallery) |
| **B — Push externo** (SO + app fechado) | ⏳ **Fase 2b ainda pendente** — sem listener `popstate` em AppProvider OU `BroadcastChannel` em sw.js, `client.navigate()` do SW não dispara React re-render |

**Não-escopo de Fase 3:** notificações antigas em `user_notifications.action_url` sem ID (gravadas antes do deploy) continuam abrindo tela genérica. Comportamento idêntico ao anterior, sem regressão.

**Validação tripla por commit:** `tsc --noEmit` exit 0 + `npm run build` passou + zero alteração em ZONAS PROIBIDAS (lib/supabase.ts, useUnreadMessageCount.ts, UnreadCountContext.tsx, PushAutoSubscriber.tsx, supabase/migrations/*, public/sw.js).

## ADR-017 · TypeScript strict mode

**Status:** **ATIVO E CONCLUÍDO** (aprovado em 2026-05-13; Sessão 1 + Sessão 2 executadas em produção. `tsconfig.json` agora com `"strict": true` único)
**Data inicial:** 2026-05-13
**Data conclusão:** 2026-05-14
**Branch da auditoria diagnóstica:** `audit/strict-mode` (commit `8bbb2e7`, cherry-picked como `abbfbb7`)

### Execução completa

| Sub-fase | Commit | Resultado |
|---|---|---|
| Pre-step | `3b282d1` | `@types/react-big-calendar@1.8` instalado |
| α.0 | `d4eea98` | `noImplicitThis` + `alwaysStrict` + `strictBindCallApply` (3 flags cost-free) |
| α.1 | `1e20981` | `strictFunctionTypes` + fix `TermsStep.onOpenDoc` (`string` → `DocType`) |
| α.2a | `1601191` | `noImplicitAny` + 3 fixes triviais (AdminArticleEditor, AppContext, PushAutoSubscriber) |
| α.2b | `1166a76` | MemberBook `'NONE'` tipado (Issue-015, comportamento preservado) |
| α.3a | `e57a4d1` | `strictNullChecks` + `strictPropertyInitialization` + 6 fixes triviais |
| α.3b | `675dd31` | adminChatService null array tipado (Issue-016, comportamento preservado) |
| Final | `64fbb7b` | Consolidou 7 flags individuais em `"strict": true` único |

**Estado final do `tsconfig.json`:** `"strict": true` (inclui automaticamente as 7 flags + `useUnknownInCatchVariables` que é bonus do TS 4.4+). `tsc --noEmit` exit 0, `npm run build` passa.

**Conclusão (2026-05-14):** ADR-017 totalmente executada em duas sessões. **R6 (Zero Any) validada por compilador.** 2 bugs latentes documentados como Issues-015 e Issues-016 para investigação futura (OnboardingWizard que estava na previsão original do Cluster 4 foi resolvido em α.1 — fix tipado mudou o callback contract para honest).

### Exceção autorizada à zona ADR-003 (precedente registrado)

Durante α.2a, `noImplicitAny` exigiu return type annotation em `components/push/PushAutoSubscriber.tsx:47` (TS7010). PushAutoSubscriber está em **zona ADR-003 IMUTÁVEL**, mas tech lead autorizou exceção em 2026-05-14 por ser **anotação compile-time PURA** (zero impacto runtime, `sessionStorage` guard intocado).

**Precedente para futuras exceções a ADRs IMUTÁVEIS:**
- ✅ Mudanças **INERTES** (compile-time only): annotation de tipo de retorno, parâmetros, generics → permitidas se autorizadas explicitamente pelo tech lead caso a caso
- ❌ Mudanças **COMPORTAMENTAIS** (runtime): alterar valores de chave/valor de storage, adicionar/remover useEffect/useRef/useState, modificar fluxo subscribe/unsubscribe, mudar ordem de operações → continuam **proibidas** sem revisar a ADR
- Pergunta-chave antes de cada exceção: *"Isso muda algo que rodaria diferente em runtime?"* Se sim → refutar. Se não → seguir.

**Contexto:** auditoria de 2026-05-13 (`docs/AUDITORIA_ANY_2026_05_13.md`, commit `99670c7`) revelou que `tsconfig.json` não tem `"strict": true` nem `"noImplicitAny": true`. Os 29 `:any` explícitos remanescentes eram apenas a superfície visível — auditoria honesta de R6 (Zero Any) exigia ligar strict e medir o iceberg completo.

**Resultado da medição** (`docs/AUDITORIA_STRICT_MODE_2026_05_13.md`):
- `"strict": true` total: **23 erros**, não centenas como temido
- **13 dos 23 (57%) são cascade de 1 problema só:** `react-big-calendar` está em `package.json` (1.8.5) mas sem `@types/react-big-calendar` instalado. Resolver isso baixa para **10 erros reais**.
- 3 flags são "grátis" (0 erros isolados): `noImplicitThis`, `alwaysStrict`, `strictPropertyInitialization`
- `strictFunctionTypes` tem 1 erro
- `noImplicitAny` ~4 erros reais pós-pre-step
- `strictNullChecks` ~7 erros, dos quais **3 são bugs latentes** (Cluster 4 do relatório: `MemberBook.tsx:477` indexa `MatchType` com `'NONE'` ausente do mapa; `OnboardingWizard.tsx:726` mismatch de signature de callback; `adminChatService.ts:136` array com possíveis nulls).
- 4 subpastas inteiras (`hooks/`, `lib/`, `contexts/`, `tests/`) já passam **clean** com strict total.

**Decisão proposta:** Adotar TypeScript strict mode via **Estratégia D — Híbrida + Pre-step**. Plano em 5 sub-fases incrementais, cada uma com PR pequena e validação tripla entre passos:

| Sub-fase | Escopo | Esforço |
|---|---|---|
| Pre-step | Instalar `@types/react-big-calendar` ou stub mínimo | 15min |
| α.0 | Ligar `noImplicitThis` + `alwaysStrict` + `strictPropertyInitialization` (0 erros) | 15min |
| α.1 | `strictFunctionTypes` + fix OnboardingWizard callback | 1h |
| α.2 | `noImplicitAny` + fix 3-4 erros | 1-2h |
| α.3 | `strictNullChecks` + fix 7 erros + resolver Cluster 4 (3 bugs latentes) | 2-3h |
| Final | Consolidar para `"strict": true` único | 5min |

**Custo total estimado:** **~4-6h** distribuídos em 5 sub-fases (não 20-40h como temido).

**Consequência se aprovado:** Compilador captura `:any` implícitos e bugs `null/undefined` em compile-time. Adoção plena de R6 (Zero Any). Bugs latentes do Cluster 4 saem do código por compilação obrigatória, não por boa intenção.

**Consequência se rejeitado:** Continuamos com `noImplicitAny` implícito permitido. Os 3 bugs latentes do Cluster 4 permanecem visíveis apenas para quem ler o relatório — sem garantia de fix.

**Próximo passo:** decisão estratégica. Se aprovado, sessão futura executa Pre-step e Fase α.0 juntos (30min de quick win com PR enxuta).

**Referência:** `docs/AUDITORIA_STRICT_MODE_2026_05_13.md`

## ADR-016 · Push subscription cleanup automatizado
**Decisão:** Edge Function `cleanup-push-subscriptions` em `supabase/functions/cleanup-push-subscriptions/index.ts` roda via pg_cron diário às **03:00 UTC** (job `push-cleanup-daily`, migration `20260513_push_cleanup_cron.sql`). Deleta `push_subscriptions` em 2 regras:
- **Regra A:** `is_active=false AND created_at < NOW() - INTERVAL '30 days'`
- **Regra C:** `user_id NOT IN (SELECT id FROM profiles)` (defensiva para órfãs)
- **Regra B (SKIPPED):** o briefing original previa "is_active=true mas com `last_failed_at` antigo". Coluna `last_failed_at` não existe; candidatas (`last_used_at`, `error_count`) existem mas nunca são populadas por `send-push` em produção (validado via MCP em 2026-05-13: 0/107 rows com `last_used_at` preenchido, 0/107 com `error_count > 0`). Implementar B viraria dead-code. Fica para futuro ADR (provavelmente ADR-018+) quando `send-push` for ajustado para popular essas colunas em catches de 410/4xx.

HARD_LIMIT 500 deletes totais por run. Response 200 sempre com payload estruturado `{ ok, stats, timestamp, errors[] }`. Erros vão em `errors[]`, sem 500 silencioso.
**Contexto:** Em 2026-05-13 a tabela `push_subscriptions` tinha 107 linhas (59 ativas + 48 zombies acumulados desde 2026-03-03). `send-push` já marca `is_active=false` em 410 Gone mas nunca deleta — sem cleanup automático, a tabela cresce indefinidamente, impactando custo Realtime e tempo de auditoria. Este é o **segundo cron seguindo o padrão pg_cron + vault** (precedente: ADR-015 hubspot-retry-failures); padrão consolidado como template oficial daqui em diante.
**Consequência:**
- Tabela `push_subscriptions` estável em médio prazo (zombies > 30d removidos diariamente)
- Padrão `pg_cron + Edge Function + vault` consolidado como template — replicar para qualquer cron novo, NUNCA via Dashboard cron UI
- TODO operacional para Fábio: `supabase functions deploy cleanup-push-subscriptions` no VPS (function vive em disco/origin mas precisa subir no Supabase)
- TODO operacional para Fábio: smoke test manual via `net.http_post` no SQL Editor antes do primeiro firing automático (validar response 200 + `deleted_inactive_old > 0`)
- Coexiste com `hubspot-retry-failures-6h` (jobid=2) sem colisão. `push-cleanup-daily` é jobid=3.
- Próximo passo de melhoria (ADR futuro — ADR-017 já está alocado para strict mode): popular `last_used_at`/`error_count` em `send-push` para habilitar Regra B (marcar ativas que silenciosamente pararam de entregar há tempo)
**Status:** ATIVO

## ADR-012 · Canal único Realtime para user_notifications
**Decisão:** `useNotificationsSubscription.ts` é o único canal Realtime para a tabela `user_notifications`. Instanciado APENAS dentro de `NotificationsContext` (Provider). Componentes consomem via `useNotifications()` ou `window.addEventListener('prosperus:new-notification')`.
**Contexto:** Antes de 2026-05-08, `notificationService.subscribeToNotifications` era chamado diretamente por `NotificationsPage` e `NotificationCenter`, criando N canais com `Math.random()` no nome — replicando o anti-pattern que ADR-002 corrigiu para `messages`. Risco: `mismatch between server and client bindings`, subscription leak no StrictMode, custo Realtime desnecessário.
**Consequência:**
- Channel name determinístico: `` `notifications-${userId}` ``
- Único `event: 'INSERT'` com filter `user_id=eq.${userId}` (RLS de `user_notifications` permite porque usa subquery direta — sem `SECURITY DEFINER`, ver ADR-005)
- Hook dispara DOM event `prosperus:new-notification` com payload tipado (`UserNotification`)
- `NotificationCenter` e `NotificationsPage` consomem via `useOnNewNotification(handler)` helper exportado do context
- `notificationService.subscribeToNotifications` foi REMOVIDO do código
- `UnreadCountContext` mantém seu próprio canal `unread-notif-${userId}` (count + badge) por ora — coexistência aceita; unificação fica para PR futuro
**Status:** IMUTÁVEL
