# Sessão 11 Maio 2026 — Edge Functions Cleanup + Sentry Setup

**Data:** 2026-05-11 (sessão consecutiva à de push/badge)
**Branch:** `main`
**Commits da sessão:** `3eab0f7`, `0bed419`, `fa1eb3f`, `d9f95ae`, `234916d`
**Modelo:** Claude Opus 4.7 (1M context)
**Validação:** `tsc --noEmit` exit 0 em todos os commits + build local com plugin Sentry desativando gracefully sem token

---

## 📋 Sumário executivo

Sessão dividida em dois trabalhos consecutivos. **Primeiro:** limpeza operacional das 2 Edge Functions zeradas (zero invocações em 30 dias confirmadas via Dashboard) e atualização da auditoria com TODO para `receive-report` (~30% 404). **Segundo:** setup completo de observabilidade com `@sentry/react`, espelhando o modo de falha visto em Issue-010 e Issue-011 da sessão anterior — agora regressões silenciosas em produção têm captura, stack trace legível (source maps) e contexto de role do usuário.

Refutações ativas durante o setup do Sentry evitaram 5 desvios da realidade do projeto (entrypoint, services inexistentes, callback de signIn ausente, ErrorBoundary próprio com feature crítica, release version indefinida). Decisões registradas em ADR-014 (ATIVO). Bonus hotfix: `backdrop-blur-md` no `DesktopSidebar` criava stacking context CSS que escondia o dropdown de notificações atrás do conteúdo — resolvido em commit dedicado. E último hotfix arquitetural: import do `@sentry/vite-plugin` virou dinâmico (try/catch) depois que o build no VPS quebrou por falta de `npm ci`.

**Resultado:** Tier 1 do `EXECUTION_PLAN` essencialmente fechado (3 itens concluídos hoje + push da sessão anterior, restando apenas Supabase PITR que aguarda decisão financeira).

---

## 🗑 Cleanup Edge Functions (commit `3eab0f7`)

### O que aconteceu

Validação operacional via Supabase Dashboard → Functions → Logs (últimos 30 dias) confirmou **zero invocações** em produção para:
- `sync-hubspot-amounts`
- `sync-shadow-profiles`

Sem caller TS confirmado (grep limpo desde a auditoria 2026-05-08), sem caller externo (Dashboard logs vazios). Ambas eram utilitários históricos (backfill / sync pontual) que cumpriram propósito ou nunca foram integradas.

### Ações no repo

```bash
rm -rf supabase/functions/sync-hubspot-amounts
rm -rf supabase/functions/sync-shadow-profiles
```

Plus:
- `supabase/config.toml`: removidos blocos `[functions.<nome>]` para as 2 functions
- `.context/project.toml`: removidas das listas `edge_functions.no_verify`
- `README.md`: tree visual atualizado, comando `deploy sync-shadow-profiles` removido
- `docs/INTEGRATIONS_SETUP.md`, `docs/hubspot/SCHEMA_REFERENCE.md`: referências marcadas como removidas
- `docs/EDGE_FUNCTIONS_AUDIT.md`: nova seção "Functions removidas em 2026-05-11" + TODO específico para `receive-report` (~30% taxa de 404 — investigar caller externo, não-dev)

### ⏳ TODO operacional (Fábio, não-dev)

O `rm` no repo + commit **NÃO undeploya** as functions do Supabase. Para fechar o loop:

```
Supabase Dashboard → Functions → Delete:
  a) sync-hubspot-amounts
  b) sync-shadow-profiles
```

Alternativa CLI: `supabase functions delete <name> --project-ref ptvsctwwonvirdwprugv`

Validar undeploy:
```bash
curl https://ptvsctwwonvirdwprugv.supabase.co/functions/v1/sync-hubspot-amounts
# Esperado: HTTP 404 (em vez do 401 atual)
```

### `receive-report` — mantida com TODO de investigação

Function ativa (caller externo confirmado) mas com ~30% dos requests retornando 404 nos logs. Hipóteses possíveis em `docs/EDGE_FUNCTIONS_AUDIT.md`:
- Caller externo usa URL antiga com path errado
- Algum query parameter ausente em 30% dos calls
- Browser cache servindo URL deprecada

Não tocado nesta sessão — fora de escopo, vira sessão operacional separada.

---

## 🛰 Sentry setup (commits `0bed419` + `fa1eb3f`)

### Refutações aceitas antes de instalar (5 pontos)

A tarefa original tinha premissas que não batiam com a realidade do projeto. Antes de `npm install`, levantei 5 pontos para alinhamento — todos aprovados:

| # | Premissa do prompt | Realidade | Decisão |
|---|---|---|---|
| 1 | Entrypoint `main.tsx` ou `src/main.tsx` | É `index.tsx` na raiz | Usar `index.tsx` |
| 2 | Breadcrumbs em `services/pushService.ts` + `services/hubspotService.ts` | **Não existem.** Push em `notificationService` + `PushAutoSubscriber` (ADR-003 IMUTÁVEL); HubSpot em `useProfileForm.ts` + `adminBirthdayService.ts` | Breadcrumbs nos arquivos reais; PushAutoSubscriber intocado |
| 3 | `Sentry.setUser` "no callback de signIn" | Não há callback. Auth é via listener `onAuthStateChange` no useEffect | `setUser` via `useEffect` reagindo a `userProfile`; `setUser(null)` em logout + `SIGNED_OUT` |
| 4 | Envolver com `Sentry.ErrorBoundary` global | `components/ui/ErrorBoundary.tsx` já existe com **auto-reload de ChunkLoadError** (UX crítica em deploys frequentes) | Manter o próprio. Adicionar `Sentry.captureException` no `componentDidCatch`. Refatorar fallback UI com tokens `prosperus-*` (R9) |
| 5 | Release lido de `VITE_APP_VERSION` | Não existe no projeto | Definir via `define: { __APP_VERSION__: '${package.json#version}-${git short sha}' }` injetado em build-time, fallback `'unknown'` |

Pegar essas decisões ANTES de instalar economizou retrabalho — instalar errado e refazer custaria 30-60min.

### Implementação

#### `lib/sentry.ts` (novo)

- `initSentry()` com `enabled: import.meta.env.PROD` (zero overhead em dev)
- `tracesSampleRate: 0.1` em prod
- `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0` (replay só on-error)
- Helper `addBreadcrumb(category, message, data?, level?)` tipado com `BreadcrumbCategory = 'push' | 'notification' | 'realtime' | 'hubspot' | 'auth'`
- Função pura `filterKnownNoise` no `beforeSend`

#### `vite.config.ts`

- `getReleaseVersion()`: `${package.json#version}-${git short sha}` com fallback `'unknown'`
- `define: { __APP_VERSION__: JSON.stringify(releaseVersion) }`
- `build.sourcemap: 'hidden'` — source maps geradas mas sem `//# sourceMappingURL=` no bundle público
- `@sentry/vite-plugin` ativo apenas quando `SENTRY_AUTH_TOKEN` presente

#### `index.tsx`

- `initSentry()` antes do `ReactDOM.createRoot`
- `<App />` envolto pelo `<ErrorBoundary>` próprio (não `Sentry.ErrorBoundary`)

#### `components/ui/ErrorBoundary.tsx`

- ChunkLoadError auto-reload **preservado** (decisão registrada como comentário no topo)
- `componentDidCatch` chama `Sentry.captureException` com `tags`, `level`, `componentStack`
- Fallback UI refatorado com tokens brand: `bg-prosperus-azul-profundo`, `font-display`, CTA gradient gold

#### `contexts/AuthContext.tsx`

- `useEffect` que reage a `userProfile` chama `Sentry.setUser({ id, email, role })`
- `Sentry.setUser(null)` em `logout()` e no listener `SIGNED_OUT` (defesa em camadas)
- Sem mudar shape de `AuthContextType` — nada quebra para consumidores

### Breadcrumbs em 6 arquivos críticos

| Arquivo | Categoria | Pontos de breadcrumb |
|---|---|---|
| `hooks/useUnreadMessageCount.ts` | `realtime` | SUBSCRIBED / CHANNEL_ERROR / TIMED_OUT ao lado dos `logger.debug` existentes. ADR-002 IMUTÁVEL preservada — zero mudança de lógica |
| `hooks/useNotificationsSubscription.ts` | `realtime` | SUBSCRIBED / CHANNEL_ERROR / TIMED_OUT |
| `services/notificationTriggers.ts` | `notification` | Início de cada `notify*` (Coleta, NewArticle, NewSolution, EventUpdated, NewVideo, NewGallery, NewEvent) |
| `hooks/useProfileForm.ts` | `hubspot` | Antes/depois de `invoke('sync-hubspot')` e `invoke('update-hubspot-contact')` |
| `services/adminBirthdayService.ts` | `hubspot` | Em `invoke('sync-hubspot-birthdays')` |
| `services/notificationService.ts` | `push` | `registerPushToken` e `removePushToken` (success/error) |

### Filtros `beforeSend` — 4 ruídos descartados

| Filtro | Razão |
|---|---|
| `AbortError` com `aborted/signal is aborted` | React.StrictMode mount/unmount/remount; AuthContext já trata silenciosamente |
| HTTP `410 Gone` | Push subscriptions stale, auto-cleanup do send-push (ADR-013) — comportamento esperado |
| `ResizeObserver loop` | Bug conhecido de browser sem ação possível |
| `Non-Error promise rejection captured` sem stack | Vem de extensões de browser, zero contexto debug |

### Validação tripla

| Check | Resultado |
|---|---|
| `tsc --noEmit` | ✅ exit 0 em todos os commits |
| `npm run build` (sem `SENTRY_AUTH_TOKEN`) | ✅ exit 0, todos os chunks emitidos, plugin desativou gracefully via `sentryEnabled && plugin` + `.filter(Boolean)` |
| Smoke test em prod build | ⏳ documentado em `docs/OBSERVABILITY.md#6` — requer DSN real no host |

### Nota housekeeping

Durante o `npm run build` apareceu `TypeError: lru_cache_1.LRUCache is not a constructor` pós-bundle (provável version-mismatch trazido pelo install). Artefatos foram entregues, exit code 0, app builda funcional. Anotado para sessão futura — provável fix: `npm dedupe` ou bump da versão de `lru-cache`.

---

## 🩹 Hotfixes pós-Sentry (commits `d9f95ae` + `234916d`)

### `d9f95ae` — Dropdown de notificações atrás do conteúdo (CSS stacking context)

**Sintoma reportado pelo Fábio:** ao clicar no sino do `DesktopSidebar`, dropdown de notificações abre mas fica escondido atrás do conteúdo principal — só aparece um sliver `Nó...` na fronteira sidebar/conteúdo.

**Causa raiz:** `DesktopSidebar.tsx` linha 74 tinha `backdrop-blur-md` no container root. `backdrop-filter` em CSS **cria stacking context isolado** — qualquer elemento `position: absolute` filho fica preso a esse contexto, e seu `z-index` (`z-[60]` no caso) só vale relativo ao sidebar, não ao layout completo.

**Fix:** remover `backdrop-blur-md` do root + comentário explicativo de 6 linhas acima do `return (` para o próximo dev não reintroduzir sem solução alternativa. Trade-off visual mínimo — `bg-white/[0.02]` sozinho mantém leve tint.

**Alternativas registradas no comentário** (para reintroduzir glass-blur futuramente):
1. Renderizar o dropdown via `React.createPortal(... document.body)` — sai do DOM tree do sidebar
2. Mover o blur para wrappers internos que NÃO contenham o sino

Risk de regressão funcional: zero (só CSS class).

### `234916d` — Build no VPS quebrava por falta de `npm ci`

**Sintoma reportado pelo Fábio:** após `git fetch + reset` no VPS, `npm run build` quebrou com:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@sentry/vite-plugin'
imported from .../vite.config.ts
```

**Causa raiz:** o commit `0bed419` adicionou `@sentry/vite-plugin` ao `package.json`, mas o deploy script do VPS rodou `git reset --hard + npm run build` direto, sem `npm ci` no meio. Import estático no `vite.config.ts:9` falhou imediatamente.

**Fix:** trocar import estático por **dinâmico com try/catch**, espelhando o padrão já existente para `@vitejs/plugin-basic-ssl` (linhas 62-67 do mesmo arquivo):

```ts
let sentryPlugin: Plugin | null = null;
if (sentryEnabled) {
  try {
    const { sentryVitePlugin } = await import('@sentry/vite-plugin');
    sentryPlugin = sentryVitePlugin({...}) as unknown as Plugin;
  } catch {
    console.warn('[vite.config] @sentry/vite-plugin não disponível...');
  }
}
```

**Comportamento pós-fix:**
- Com package instalado + token: plugin carrega, source maps são uploadadas
- Sem package no node_modules: console.warn + build CONTINUA funcional (sem source maps)
- Sem `SENTRY_AUTH_TOKEN`: pula o load (mesma lógica de antes)

**TODO operacional do Fábio (registrado no commit):** adicionar `npm ci` ao deploy script do VPS:
```bash
cd /var/www/prosperus-club-app
git fetch origin && git reset --hard origin/main
npm ci                  # ← este passo estava faltando
npm run build
```

---

## 🏛 ADR criada

### ADR-014 · Sentry como camada de observabilidade do frontend

Decisão completa em [`.context/memory/decisions.md`](../.context/memory/decisions.md). Pontos centrais:

- `@sentry/react` SDK + `@sentry/vite-plugin` para source maps
- `enabled: import.meta.env.PROD` — dev silent, zero overhead
- Source maps `'hidden'` (não referenciadas no bundle público)
- Identidade do usuário via `Sentry.setUser({ id, email, role })`
- Breadcrumbs categorizados (auth/push/notification/realtime/hubspot)
- `beforeSend` filtra 4 ruídos
- ErrorBoundary próprio mantido (ChunkLoadError UX preservada) com integração via `captureException` manual

**Status:** ATIVO

---

## 🧠 Lições para sessões futuras

### Sobre refutar premissas do prompt ANTES de executar

O prompt do Sentry tinha 5 premissas que não batiam com a realidade do projeto (entrypoint, services inexistentes, callback de signIn, ErrorBoundary próprio, release version). Levantar essas inconsistências e propor adaptações concretas ANTES de `npm install` evitou retrabalho de 30-60min. Padrão a manter: **se o briefing menciona arquivo, função ou padrão que não confirmei existir, parar e refutar com proposta alternativa**.

### Sobre preservar features existentes ao integrar SDK terceiro

O reflexo é usar componentes "padrão" do SDK (ex: `Sentry.ErrorBoundary`). Mas substituir cego perde features locais críticas — neste caso, auto-reload de `ChunkLoadError`. **Caminho correto:** estender o componente próprio com hooks do SDK em vez de substituir. Comentário no topo do arquivo explicando a decisão evita que próximo dev troque por simplicidade.

### Sobre release tagging com git sha

`package.json#version` muda raramente (semver). Combinado com git short sha (`-abc1234`), o Sentry correlaciona cada erro com commit exato. Fallback `'unknown'` para ambientes sem git (Docker stripado, builds antigos) evita crash em produção. Padrão: `${version}-${sha}` injetado em build-time via `define: { __APP_VERSION__ }`.

### Sobre filtros `beforeSend`

Lista de 4 ruídos descartados (AbortError StrictMode, HTTP 410 push stale, ResizeObserver loop, Non-Error rejection) foi construída a partir do que JÁ era engolido localmente nos catch handlers do app. Princípio: **se o app já trata como ruído conhecido, Sentry também deve descartar — caso contrário Dashboard vira lixeira**.

### Sobre import dinâmico vs estático em plugins de build

Plugins de build não-essenciais (basicSsl em dev, sentry-vite-plugin em CI) devem ser carregados via `await import('package')` dentro de `try/catch`. Resultado: ausência de package no node_modules degrada graciosamente (warning) em vez de quebrar build inteiro. Particularmente importante para projetos com múltiplos ambientes (dev, VPS deploy, CI) onde nem sempre o `npm ci` está garantido na pipeline.

### Sobre `backdrop-filter` e stacking contexts

`backdrop-filter`, `transform`, `filter`, `perspective`, `clip-path`, `isolation`, `mix-blend-mode` — todas essas props CSS criam stacking context isolado. Qualquer `position: absolute` filho fica preso ao contexto pai. Se um dropdown/modal precisa sobrepor irmãos do pai, **não pode** ter ancestral com essas props. Solução robusta: Portal. Solução cirúrgica: remover a prop do ancestral.

---

## 📂 Arquivos modificados

### Commit `3eab0f7` (Edge Functions cleanup)

| Arquivo | Mudança |
|---|---|
| `supabase/functions/sync-hubspot-amounts/` | Pasta deletada (3 arquivos) |
| `supabase/functions/sync-shadow-profiles/` | Pasta deletada (3 arquivos) |
| `supabase/config.toml` | Blocos `[functions.<nome>]` removidos |
| `.context/project.toml` | Listas `edge_functions.no_verify` atualizadas |
| `README.md` | Tree visual + comando deploy |
| `docs/EDGE_FUNCTIONS_AUDIT.md` | Reescrito com seção "Functions removidas" + TODO `receive-report` |
| `docs/INTEGRATIONS_SETUP.md` | Referências marcadas como removidas |
| `docs/hubspot/SCHEMA_REFERENCE.md` | Referências marcadas como removidas |
| `.context/memory/progress.md` | Entrada de hoje + TODO operacional |

### Commit `0bed419` (deps)

| Arquivo | Mudança |
|---|---|
| `package.json` | `@sentry/react@^10.52.0` (dep) + `@sentry/vite-plugin@^5.2.1` (devDep) |
| `package-lock.json` | Lockfile atualizado |

### Commit `fa1eb3f` (Sentry setup)

| Arquivo | Mudança |
|---|---|
| `lib/sentry.ts` | **NOVO** — init + helper `addBreadcrumb` + filtros |
| `vite.config.ts` | Sentry plugin + release version + `sourcemap: 'hidden'` |
| `index.tsx` | `initSentry()` + envolvido por `<ErrorBoundary>` |
| `components/ui/ErrorBoundary.tsx` | `Sentry.captureException` + UI com tokens brand |
| `contexts/AuthContext.tsx` | `useEffect` `Sentry.setUser` + clear no logout/SIGNED_OUT |
| `hooks/useUnreadMessageCount.ts` | Breadcrumbs `realtime` |
| `hooks/useNotificationsSubscription.ts` | Breadcrumbs `realtime` |
| `hooks/useProfileForm.ts` | Breadcrumbs `hubspot` |
| `services/notificationTriggers.ts` | Breadcrumbs `notification` |
| `services/notificationService.ts` | Breadcrumbs `push` |
| `services/adminBirthdayService.ts` | Breadcrumbs `hubspot` |
| `.env.example` | 4 vars Sentry com comentários |
| `.gitignore` | Whitelist de `docs/OBSERVABILITY.md` |
| `docs/OBSERVABILITY.md` | **NOVO** — guia completo |
| `.context/memory/decisions.md` | ADR-014 ATIVO |
| `.context/memory/progress.md` | Entrada de hoje |

### Commit `d9f95ae` (hotfix CSS stacking)

| Arquivo | Mudança |
|---|---|
| `components/layout/DesktopSidebar.tsx` | Removido `backdrop-blur-md` do root + comentário explicativo |

### Commit `234916d` (hotfix build resilience)

| Arquivo | Mudança |
|---|---|
| `vite.config.ts` | Import dinâmico de `@sentry/vite-plugin` com try/catch |

---

## 🎯 Estado do Tier 1 do `EXECUTION_PLAN`

| # | Item | Status |
|---|---|---|
| 1 | Validar 3 Edge Functions suspeitas | ✅ **Concluído** 2026-05-11 — 2 removidas (`3eab0f7`), 1 com TODO investigar |
| 2 | NotificationsProvider (singleton) | ✅ **Concluído** sessão anterior (ver `SESSAO_11_MAI_2026_PUSH_BADGE.md`) |
| 3 | Confirmar Supabase PITR | ⏳ Aguarda decisão financeira do Fábio |
| 4 | Sentry setup completo | ✅ **Concluído** 2026-05-11 — `0bed419` + `fa1eb3f` + hotfix `234916d` |

**Tier 1 essencialmente fechado.** PITR fica em standby até decisão de upgrade.

---

## ⏳ TODOs operacionais (Fábio, não-dev)

### Edge Functions

```
Supabase Dashboard → https://supabase.com/dashboard/project/ptvsctwwonvirdwprugv/functions
  → Sync Hubspot Amounts   → Settings → Delete function
  → Sync Shadow Profiles   → Settings → Delete function
```

Investigar `receive-report` ~30% taxa de 404 (caller externo desconhecido) — detalhes em `docs/EDGE_FUNCTIONS_AUDIT.md`.

### Sentry

1. Criar projeto `prosperus-club-app` em https://sentry.io
2. Obter DSN público + gerar `SENTRY_AUTH_TOKEN` (scopes: `project:read`, `project:releases`, `org:read`)
3. Adicionar 4 env vars no host de produção:
   - `VITE_SENTRY_DSN`
   - `VITE_SENTRY_ORG`
   - `VITE_SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`
4. Adicionar `SENTRY_AUTH_TOKEN` como secret no GitHub Actions; passar as 4 vars no step `npm run build`
5. **Smoke test pós-deploy:** com app rodando em produção, abrir DevTools console e:
   ```js
   throw new Error('sentry-smoke-test ' + new Date().toISOString())
   ```
   Erro deve aparecer no Dashboard Sentry em ~30s. Stack trace deve mostrar paths `.tsx` (source maps OK) e não `.js` minificados.

### Deploy script do VPS

Adicionar `npm ci` antes do `npm run build` no shell script ou hook PM2/CD:

```bash
cd /var/www/prosperus-club-app
git fetch origin
git reset --hard origin/main
npm ci                  # ← este passo precisa estar aqui
npm run build
# (restart nginx / pm2 reload se aplicável)
```

---

## 📜 Linha do tempo dos commits

```
3eab0f7  chore(edge-functions): undeploy 2 zeroed functions
0bed419  chore(deps): add @sentry/react and @sentry/vite-plugin
fa1eb3f  feat(observability): Sentry setup com source maps + breadcrumbs (ADR-014)
d9f95ae  fix(layout): NotificationCenter dropdown some atras do conteudo (backdrop-blur stacking)
234916d  fix(build): import dinamico de @sentry/vite-plugin (resiliente a npm install ausente)
```

Todos para `origin/main` via SSH.

---

## 🎯 Conclusão

Sessão destravou **3 frentes** do Tier 1 num único dia, dando ao projeto ferramentas básicas de produção: limpeza de código zombie, observabilidade para detectar regressões silenciosas em prod (mesmo modo de falha de Issue-010 e -011), e dois bug fixes adicionais que só apareceram durante o deploy real (CSS stacking e build sem `npm ci`). Refutar premissas do prompt antes de instalar evitou retrabalho — padrão a manter em sessões futuras quando o prompt vier do Claude.ai online sem acesso ao filesystem.

Com PITR aguardando decisão financeira, Tier 2 (HubSpot rate limit handling, push subscription cleanup cron, ARCHITECTURE.md, ESLint rule contra hex hardcoded) está liberado como próximo bloco de trabalho.

---

**Fim do relatório · Sessão 2026-05-11 (parte 2) · Edge Functions cleanup + Sentry setup + 2 hotfixes**
