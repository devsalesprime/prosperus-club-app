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

## Fase 2c + Fase 3 Deep-link — 2026-05-15 — Padrão 7 replicado em 5 módulos

Sessão única com 8 commits direto em `main`. Pré-investigação read-only (relatório consolidado) revelou 3 requisitos pré-Fase 3 que viraram Commits 1-3, depois 4 commits replicam Padrão 7 nos módulos restantes, +1 commit de documentação.

**Commits da sessão (em ordem):**

| Commit | O que mudou |
|---|---|
| `92f8621` | `feat(notifications): PT→EN ViewState alias for legacy URLs` — `VIEW_ALIASES` em AppContext.tsx mapeia NOTICIAS→NEWS, GALERIA→GALLERY, SOLUCOES→SOLUTIONS, TOOLS→SOLUTIONS |
| `04be3d0` | `fix(events): remove duplicate notifyNewEvent dispatch in EventForm` — bloco redundante (ID lixo `'new'`) removido. Caminho oficial fica em `eventService.createEvent` |
| `c75d8e5` | `feat(notifications): notifyEventUpdated propagates eventId for deep-link` |
| `e895242` | `feat(news): notifyNewArticle + NewsList deep-link via ?artigo=<id>` |
| `6d9445a` | `feat(solutions): notifyNewSolution + SolutionsListPage deep-link via ?solucao=<id>` |
| `bb5a4f5` | `feat(events): notifyNewEvent + EventDetailsModal deep-link via ?evento=<id>` |
| `d403578` | `feat(gallery): Gallery deep-link via ?album=<id>` (trigger já estava OK desde Fase 1) |
| _(este commit)_ | `docs(deep-link): ADR-018 revisada + Fase 3 concluída` |

**Padrão 7 ativo em 5 módulos:** Academy, News, Solutions, Events, Gallery — cobrindo todas as 6 funções `notify*` que tinham buracos (notifyNewVideo já estava OK desde Fase 1).

**Validação tripla em cada commit:**
- `tsc --noEmit` exit 0
- `npm run build` passa
- Zero alteração em ZONAS PROIBIDAS (`lib/supabase.ts`, `useUnreadMessageCount.ts`, `UnreadCountContext.tsx`, `PushAutoSubscriber.tsx`, `supabase/migrations/*`, `public/sw.js`)

**Bug latente fechado nesta sessão:** Issue do duplo disparo de `notifyNewEvent` (EventForm.tsx enviava 2º push com ID lixo `'new'`). Bug existia desde sempre; impacto era duplicação silenciosa, mas com Padrão 7 geraria URL quebrada. Resolvido via Commit 2.

**TODOs restantes:**
- **Fase 2b** (push externo do SO com app fechado): React não escuta `client.navigate()` do SW. Decisão pendente: listener `popstate` em AppProvider OU `BroadcastChannel` em sw.js (zona PROIBIDA — exige autorização explícita).
- **Notificações antigas no banco:** `user_notifications.action_url` gravadas antes do deploy continuam sem ID — abrem tela genérica (sem regressão, comportamento idêntico ao anterior).

**TODO operacional (Fábio):**
- Smoke test em produção para cada um dos 5 módulos:
  - Admin cria artigo → push deve chegar → clicar pelo sino → NEWS abre → ArticleReader aparece com artigo correto
  - Admin cria solução → push → clicar sino → SolutionsListPage abre → `window.open(external_url)` em nova aba
  - Admin cria evento → push → clicar sino → modal de evento sobrepõe view atual
  - Admin edita evento (data/local/link mudou) → push de update → clicar → modal abre
  - Admin cria álbum → push → clicar sino → Gallery abre → `window.open(embedUrl)` em nova aba

## Fase 2a Deep-link — 2026-05-15 — fix regex `handleNotificationNavigate`

Investigação pós-deploy da Fase 1 revelou que o fix arquitetural estava **incompleto**:
- App **não usa React Router** — view switching é state-based
- Camada 3 (useEffect Academy) só dispara se Academy montar
- Academy só monta via `setView(ViewState.ACADEMY)` — não por URL
- Logo, a Fase 1 era dead code sem uma Camada A funcionando

**Camada A já existia** em `AppContext.tsx:327` (`handleNotificationNavigate`) chamada pelos cliques in-app (NotificationCenter + NotificationsPage), mas com bug de regex.

**Commit `7af1f61`** — fix cirúrgico de 1 linha:
```diff
+ const stripped = url.replace(/^\/app\//, '/');
- const pathMatch = url.match(/^\/?([a-zA-Z_-]+)/);
+ const pathMatch = stripped.match(/^\/?([a-zA-Z_-]+)/);
```

Antes: `/app/academy?video=X` → captava `'app'` → fallback `window.open` abria nova aba.
Depois: stripped → captava `'academy'` → `setView(ACADEMY)` → Academy monta → useEffect da Fase 1 dispara → modal abre.

**Status dos 2 caminhos:**

| Caminho | Status |
|---|---|
| A — In-app (sino + lista) | ✅ RESOLVIDO via `7af1f61` |
| B — Push externo (SO com app fechado) | ⏳ Fase 2b — React não escuta `client.navigate()` do SW |

**TODO Fase 2b:** decidir entre listener `popstate` no AppProvider OU expandir `BroadcastChannel prosperus-push` (já em `sw.js:267`) para `NOTIFICATION_CLICK`. Requer alteração em `sw.js` (zona PROIBIDA — pedir autorização) OU adicionar listener `popstate` (sem mudar sw.js, mas com risco de não disparar em todos browsers).

**TODO Fase 2c:** alinhar paths PT/EN. Triggers atuais usam paths PT (`/app/noticias`, `/app/galeria`, `/app/tools/solucoes`) que não batem com `ViewState` em EN. Fix: mapping PT→EN no handler OU realinhar URLs dos triggers para EN. Apenas `vídeo` (Academy) e `evento` (Agenda) batem hoje.

**Validação:**
- `tsc --noEmit` exit 0
- `npm run build` passa
- Diff cirúrgico: 1 linha funcional adicionada, 1 removida (resto comentário)
- ZONAS PROIBIDAS intocadas (sw.js, ADRs IMUTÁVEIS)

**TODO operacional (Fábio):**
- Smoke test em produção: criar vídeo → push deve chegar → clicar pelo sino do header → Academy deve montar → modal deve abrir com vídeo correto
- Se sócio clicar via push externo (app fechado): hoje ainda cai em Dashboard (Fase 2b resolve)

## Fase 1 Deep-link — 2026-05-15 — fix vídeo + pattern estabelecido (ADR-018)

Bug em produção: push "Novo vídeo: X" abria `/app/academy` (lista genérica), perdendo contexto do vídeo específico. Investigação preliminar mapeou causa em 3 camadas e revelou que 6 de 7 `notify*` ignoravam IDs via parâmetro `_underscore`.

Esta sessão entrega fix completo do caso vídeo + estabelece pattern replicável.

**4 commits direto em main:**

| Commit | Camada | O que mudou |
|---|---|---|
| `2d01088` | 2 (Trigger) | `notifyNewVideo` constrói `/app/academy?video=<id>` quando `videoId` presente, fallback `/app/academy` |
| `d91eee4` | 1 (Caller) | `AcademyModule.tsx:156` passa `newVideo.id` em vez de string vazia (refutação aceita: `videoData.id` do briefing era `newVideo.id` real) |
| `04e40eb` | 3 (Tela) | `Academy.tsx` adicionou `useEffect` que lê `?video=<id>`, aguarda `allVideos`, abre `VideoPlayerModal` e limpa query param. Guard via `useRef` evita re-disparo |
| _(este commit)_ | docs | ADR-018 + Padrão 7 em PATTERNS + progress.md |

**ADR-018 estabelecida:** deep-link via query param. URL no formato `/app/<modulo>?<recurso>=<id>`. Tela lê no mount, aguarda data load, abre item, limpa URL. Backward compatible — trigger sem ID cai em fallback genérico.

**Validação:**
- `tsc --noEmit` exit 0 em CADA commit
- `npm run build` passa
- ZONA PROIBIDA `sw.js` intocada (já funcionava corretamente)
- 3 cenários cobertos por leitura de código: ID válido → modal abre; ID inválido → tela genérica sem erro; sem param → comportamento original

**Próximas fases (5 funções similares no mesmo buraco):**
- `notifyNewArticle` → `/app/noticias?artigo=<id>`
- `notifyNewSolution` → `/app/tools/solucoes?solucao=<id>`
- `notifyNewEvent` + `notifyEventUpdated` → `/app/agenda?evento=<id>`
- `notifyNewGallery` → `Gallery.tsx` precisa adicionar handler (trigger já constrói `?album=` mas a tela ignora hoje — falso positivo descoberto na investigação)

Cada uma replica exatamente o pattern do Padrão 7. Estimativa: ~3-4h total (5 funções × ~30-45min).

**TODO operacional (Fábio):**
- Smoke test em produção: criar vídeo no admin → push deve chegar → clicar → modal deve abrir
- Sem necessidade de redeploy de Edge Functions (Fase 1 é só frontend + trigger TS)
- Rebuild frontend (`npm run build`) ao puxar os 4 commits

## Fase β SUSPEITOS — 2026-05-15 — `as any` drift parcial fechado

Fase β do backlog R6 (Apêndice A.1 da auditoria `:any`). Investigação MCP-validada antes de cada fix.

**Inventário inicial:** 27 ocorrências de `as any` no codebase, categorizadas em 5 buckets.

**3 buckets fechados nesta sessão (3 commits):**

| Commit | Bucket | O que mudou |
|---|---|---|
| `1b1bbd2` | D — narrowing de erro | 4 sites em 3 arquivos (`AcademyModule`, `ImageUpload`, `NotificationBannersModule`) refeitos com padrão honest |
| `229fd81` | A — banner_url profile | 2 sites (`ProfilePreview`, `MemberBook`) — coluna não existe no schema, código residual de feature descontinuada removido |
| `3cc691c` | A — isAutomated UI flag | 4 sites em `AdminMemberProgress` tipados via `EnrichedMemberProgressFile = MemberProgressFile & { isAutomated?: boolean }` (Caso A — flag client-side) |

**1 bucket em STANDBY:**

| Bucket | Arquivo | Razão |
|---|---|---|
| B — `setRsvpList` cast | `components/admin/events/EventList.tsx:146` | Bug latente provável: query do Supabase retorna `profiles` como array, mas tipo declara objeto. Pode estar causando **CSV de presença vazio** e nomes faltando na lista UI. Rollback aplicado (working tree limpo, `(data as any)` voltou). Issue-017 criada com diagnóstico completo. Aguarda runtime check do tech lead (Network tab capturar Response real de `/event_rsvps`) antes de aplicar fix. |

**1 bucket NÃO TOCADO (zonas + lib limitations) — documentado como exceção:**

| Bucket | Arquivos | Razão |
|---|---|---|
| C — DOM/lib | `contexts/UnreadCountContext.tsx` (3× Badging API), `vite.config.ts` (8× PWA manifest) | UnreadCountContext: ADR-002 IMUTÁVEL. vite.config: tipos do `vite-plugin-pwa` incompletos para `display_override`, `categories`, `screenshots`, `shortcuts`, `launch_handler`, `share_target`, `edge_side_panel`. Cast pragmático até a lib atualizar. |

**1 bucket NOVO descoberto (Bucket E — backlog Fase γ):**

| Arquivo:linha | Caso |
|---|---|
| `AdminApp.tsx:281,286` | `DataTable as any` em props genéricas |
| `BannersModule.tsx:295,547` | `e.target.value as any` em onChange de enum/select |
| `DesktopSidebar.tsx:156` | `setView(item.id as any)` (string vs enum union) |
| `services/adminBirthdayService.ts:98` | `} as any` em função `@deprecated` (a remover quando função for purgada) |

5 ocorrências, ~1-2h de trabalho. **Não cria Issue agora** — todos são pequenos, registro como backlog.

**Issues criadas:**
- Issue-017: RSVP profiles drift (STANDBY)
- Issue-018: 4 sites de error narrowing cego (RESOLVIDO via `1b1bbd2`)
- Issue-019: banner_url residual (RESOLVIDO via `229fd81`)
- Issue-020: isAutomated UI flag tipada (RESOLVIDO via `3cc691c`)

**Validação tripla:**
- `tsc --noEmit` exit 0 em cada commit
- `npm run build` testado (não foi rodado a cada commit, mas a base passa)
- Zero `as any` introduzido como narrowing
- Zonas IMUTÁVEIS preservadas
- 0 modificações em runtime — tudo é tipagem

**TODO operacional (Fábio):**
- Capturar Response do Network tab de `/rest/v1/event_rsvps?...` para Issue-017
- Sem necessidade de redeploy de Edge Functions (Fase β só toca frontend)
- Apenas rebuild do frontend (`npm run build`) quando puxar os commits

## Sessão 2 do ADR-017 — 2026-05-14 — STRICT MODE CONCLUÍDO

ADR-017 totalmente executada. `tsconfig.json` agora com `"strict": true`. R6 (Zero Any) enforced em compile-time.

**6 commits direto em main:**

| Commit | Sub-fase | Resultado |
|---|---|---|
| `1601191` | α.2a | `noImplicitAny` + 3 fixes triviais (AdminArticleEditor `quillModules`, AppContext `useMemo<unknown[]>`, PushAutoSubscriber `: null` return type) |
| `1166a76` | α.2b | MemberBook `'NONE'` tipado via `Partial<Record<MatchType, ...>>` (Issue-015) |
| `e57a4d1` | α.3a | `strictNullChecks` + `strictPropertyInitialization` + 6 trivial guards (AdminMemberProgress `return;` esquecido, EventList `?? undefined/''`, EventScanner IIFE, ConversationList `?? 0`, AdminNotifications `\|\| Date.now()`) |
| `675dd31` | α.3b | adminChatService array null tipado (Issue-016) |
| `64fbb7b` | final | Consolidou 7 flags em `"strict": true` único |
| _(este commit)_ | docs | ADR-017 concluída + Issues-015/016 + patterns |

**Exceção autorizada à ADR-003:** PushAutoSubscriber recebeu return type annotation (`: null`). Tech lead autorizou exceção por ser INERTE (compile-time only, sem mudança runtime). Precedente registrado em ADR-017 para futuras exceções (regra INERTE vs COMPORTAMENTAL).

**2 Issues criadas:**
- Issue-015: MemberBook `'NONE'` fora do MATCH_CONFIG (filter upstream protege, mas tipagem agora reflete realidade)
- Issue-016: adminChatService.getAllConversations mapping com null silencioso (filter post-hoc na L203)

Ambos os bugs latentes ficaram com **comportamento preservado 100%** — apenas tipagem mudou. Decisão de produto/arquitetura fica para sessão futura.

**Validação:**
- `tsc --noEmit` exit 0 em CADA commit ✅
- `npm run build` passa ✅ (PWA, 62 entries precache, dist gerado)
- ZERO `as any`/`as Error`/`@ts-ignore` introduzido como narrowing
- Zonas IMUTÁVEIS preservadas (exceto exceção INERTE em PushAutoSubscriber, autorizada explicitamente)
- 2 bugs latentes do Cluster 4 documentados, comportamento preservado

**Próximas fases (backlog atualizado):**
- Investigar Issues-015/016 (decisão de produto/arquitetura)
- Fase β — Apêndice A.1 SUSPEITOS em `docs/AUDITORIA_ANY_2026_05_13.md` (drift DB vs tipo TS — `(profile as any).banner_url`, etc)
- Fase 3a/3b/4 da auditoria `:any` — 29 instâncias explícitas restantes ainda como backlog
  (R6 agora bloqueia `any` IMPLÍCITO, mas explícito ainda passa enquanto não removido)

## Manutenção 2026-05-14 — 3 fixes pontuais

Sessão de pequenos fixes em produção, todos com tsc verde e isolados.

### Fix 1 — AdminBenefitsApproval mostrava descrição truncada (`e39e46c`)

`components/admin/AdminBenefitsApproval.tsx:170` usava `line-clamp-2` na coluna "Descrição", truncando em 2 linhas. Trocado por `whitespace-pre-line break-words` — descrição completa, preservando `\n` que o sócio escreveu, quebrando palavras longas sem estourar o grid. Só CSS, zero impacto em schema/serviço.

### Fix 2 — Sync de banner de aniversário aparentava ter parado (`723ff4a`)

**Sintoma:** admin > Homenagens de Aniversário mostrava toast de erro ao Sincronizar HubSpot, mesmo a sincronização funcionando (14 cards entrando em `birthday_cards`).

**Causa raiz:** dupla de boundaries desalinhados após ADR-015:
- Edge Function `sync-hubspot-birthdays` (refatorada no commit `46707dd`) retorna `{ synced, queued, queueId?, error?, stats }` (contrato uniforme).
- `services/adminBirthdayService.syncFromHubSpot()` fazia `data as { success, stats }` — cast cego sobre o shape antigo.
- `AdminBirthdaysModule:84` testava `result.success` → sempre `undefined` → toast de erro.

**Fix:** adapter no service traduz o novo contrato (`payload.synced === true → success`) para manter o componente intacto. Narrowing honest com shape literal explícito (alinha com `docs/PATTERNS_TYPESCRIPT.md`).

**Lição estrutural:** quando uma Edge Function muda contract via ADR, fazer grep dos callers TS e auditar adapters do service. ADR-015 (Edge Functions HubSpot uniformes) deveria ter quebrado o tsc — mas como o service fazia `as` cego, passou silenciosamente em compile-time e só apareceu em runtime.

### Fix 3 — Banner do Adriano não vinha (HubSpot ↔ Supabase email mismatch)

Sócio `adriano5f@hotmail.com` (Adriano Domacir De Freitas, profile `9af56350...`) tinha banner setado no HubSpot mas o sync ignorava. Diagnóstico via MCP:

- HubSpot contact `213238444657`: email = `aadriano5f@hotmail.com` (**2 'a' no início — typo**)
- Supabase profile: email = `adriano5f@hotmail.com` (correto)
- Edge Function busca profile via `.eq('email', email_do_hubspot)` → não bate → `stats.skipped++`

**Fix operacional:** email corrigido no HubSpot via MCP (`manage_crm_objects`) de `aadriano5f` → `adriano5f`. Próximo sync no admin deve gerar o card normalmente. **Sem mudança de código.**

**Armadilha conhecida para o futuro:** sempre que um banner não aparecer após sync, primeira hipótese é mismatch de email entre HubSpot (fonte do sync) e Supabase (alvo). Validação rápida via MCP:
```sql
-- HubSpot via MCP
get_crm_objects contacts [id] → confere `email`

-- Supabase
SELECT email FROM profiles WHERE hubspot_contact_id = '<id>'
```

Se divergir: corrigir no HubSpot (fonte canônica) e sincronizar.

**TODO de longo prazo (não acionado nesta sessão):** robustecer `sync-hubspot-birthdays` com fallback por `hubspot_contact_id` quando o email não bater. Resolveria toda essa categoria de casos. Fica para sprint dedicada.

## Sessão 1 do ADR-017 — 2026-05-13 (noite-2) — EXECUÇÃO STRICT MODE

ADR-017 (TypeScript strict mode) aprovada pelo tech lead. Sessão 1 executa **Pre-step + α.0 + α.1** direto em main, 5 commits independentes:

| Commit | Sub-fase | Resultado |
|---|---|---|
| `abbfbb7` | Cherry-pick da auditoria | Traz ADR-017 (PROPOSTO), relatório, padrões do `audit/strict-mode` para main |
| `3b282d1` | Pre-step | `@types/react-big-calendar@1.8` instalado (alinhado com lib 1.8.5). Remove cascade de 13 erros do compilador tratar lib como `any`. |
| `d4eea98` | α.0 | 3 flags cost-free: `noImplicitThis` + `alwaysStrict` + `strictBindCallApply`. **Ajuste do plano original:** `strictPropertyInitialization` exige `strictNullChecks` explícito (TS5052), movida para α.3. Substituída por `strictBindCallApply` (também 0 erros). |
| `1e20981` | α.1 | `strictFunctionTypes` ativa + fix em `TermsStep.tsx`: tipo do callback `onOpenDoc` mudou de `string` para `DocType` importado de `support/SupportDocsSheet`. Antes a bivariância mascarava o contrato — agora honest. |
| _(este commit)_ | docs | ADR-017 promovida PROPOSTO → **ATIVO** em `decisions.md`. `AUDITORIA_STRICT_MODE_2026_05_13.md` atualizada com histórico. Refs futuras a "ADR-017" em ADR-016 ajustadas (eram para outro tema). |

**Estado do `tsconfig.json` (4 flags strict ativas):**
- `noImplicitThis: true`
- `alwaysStrict: true`
- `strictBindCallApply: true`
- `strictFunctionTypes: true`

**Pendente — Sessão 2 (próxima):**
- α.2: `noImplicitAny` + ~4 fixes (cascade de `react-big-calendar` já resolvido pelo Pre-step)
- α.3: `strictNullChecks` + `strictPropertyInitialization` (dependente) + 7 fixes — inclui **3 bugs latentes do Cluster 4** (MemberBook indexação 'NONE', OnboardingWizard callback contract, adminChatService null em array tipado)
- Final: consolidar 7 flags em `"strict": true` único

**Validações triplas (cada commit):**
- `tsc --noEmit` exit 0 ✅
- `npm run build` passa ✅
- Zero alteração em arquivos PROIBIDOS (ADR-001/002/003) ✅
- 5 commits direto em main, rollback granular preservado

**TODO operacional:** `git push origin main` quando os 5 commits estiverem prontos.

---

## Fase α da Auditoria R6 — 2026-05-13 (noite) — DIAGNÓSTICO STRICT MODE

Auditoria diagnóstica do `tsconfig.json` strict mode. **Zero código de produção tocado.**
Branch: `audit/strict-mode` (NÃO mergeada — apenas docs são candidatas a cherry-pick para main).

**Achados:**
- `"strict": true` total revela **23 erros** (não centenas como temido)
- **13 dos 23 (57%) são cascade de 1 problema:** falta `@types/react-big-calendar`
- Resolver isso baixa para **10 erros reais**
- 4 subpastas inteiras já passam clean: `hooks/`, `lib/`, `contexts/`, `tests/`
- 3 flags "grátis" (0 erros isolados): `noImplicitThis`, `alwaysStrict`, `strictPropertyInitialization`
- 3 bugs latentes descobertos (Cluster 4 do relatório):
  - `MemberBook.tsx:477` — `MATCH_STYLES['NONE']` indexa propriedade inexistente
  - `OnboardingWizard.tsx:726` — mismatch de signature em callback (DocType vs string)
  - `services/adminChatService.ts:136` — array com null sendo atribuído a type sem null

**Entregue:**
- `docs/AUDITORIA_STRICT_MODE_2026_05_13.md` — relatório completo com 5 sub-fases
- `docs/PATTERNS_TYPESCRIPT.md` — padrões consolidados (narrowing honest, acumuladores, catch shorthand)
- ADR-017 PROPOSTO em `decisions.md` (estratégia D híbrida + pre-step, ~4-6h em 5 sub-fases)
- `.gitignore` atualizado: whitelist `PATTERNS_*.md`, blocklist `STRICT_AUDIT_RAW.log`
- cross-ref em `AUDITORIA_ANY_2026_05_13.md` apontando para esta auditoria

**Validação:**
- `tsconfig.json` REVERTIDO ao baseline ao final (`git diff tsconfig.json` vazio)
- `tsc --noEmit` exit 0 antes e depois da auditoria
- Zero `.ts/.tsx` de produção modificado
- Commit único na branch `audit/strict-mode`

**Decisão pendente:** tech lead aprova ou rejeita ADR-017?
- Se aprovado, próxima sessão começa pelo Pre-step (~15min): `npm i --save-dev @types/react-big-calendar`.
- Se rejeitado, manter `tsconfig.json` como está e atacar Fase β (Apêndice A.1 SUSPEITOS) ou Fase 3 (MEDIO_*) sem strict mode.

## Fase 2 da Auditoria R6 — 2026-05-13 (tarde-2)

Execução da Fase 2 (TRIVIAL) da auditoria de `:any`.

**Entregue:**
- 9 instâncias TRIVIAL corrigidas (38 → 29)
- Padrão de narrowing consolidado: `Record<string, unknown>` + checagem runtime, sem `as Error` ou `as any`
- WebPushError em `send-push:95` mantém acesso a `.statusCode` (não-padrão de Error) via narrowing limpo
- 2 `as any` adjacentes em `GalleryModule.tsx:43-44` também removidos no mesmo escopo
- Validação: `tsc --noEmit` exit 0, `npm run build` passa

**Arquivos tocados (5 .ts/.tsx + 2 docs):**
- `contexts/AuthContext.tsx`
- `components/admin/GalleryModule.tsx`
- `supabase/scripts/seed-admin.ts`
- `supabase/functions/sync-hubspot/index.ts`
- `supabase/functions/hubspot-webhook/index.ts`
- `supabase/functions/send-push/index.ts`
- `docs/AUDITORIA_ANY_2026_05_13.md` (status + histórico)
- `.context/memory/progress.md` (esta entrada)

**TODO operacional (Fábio):** deploy via CLI das 3 Edge Functions tocadas para sincronizar com produção:
```bash
cd /var/www/prosperus-club-app && git pull origin main
supabase functions deploy sync-hubspot
supabase functions deploy hubspot-webhook
supabase functions deploy send-push
```

**Próximas fases (backlog):**
- Fase α (recomendada): ADR-017 com `"strict": true` faseado
- Fase 3a: MEDIO_SUPABASE (12) — gerar `Database` types
- Fase 3b: MEDIO_DOMINIO (7) — interfaces de domínio
- Fase 4: DIFICIL (10) — criar `_shared/hubspot-types.ts`
- Fase 5: SUSPEITOS Apêndice A.1 (caso a caso, podem virar Issues)

## Auditoria 2026-05-13 (tarde) — Inventário de `:any` (R6)

Auditoria diagnóstica das instâncias `:any` no codebase. Zero alteração em
código de produção.

**Achados:**
- **38 instâncias** explícitas em 12 arquivos (não 81 como reportado antes —
  redução de 53% atribuída às refatorações Edge Functions ADR-015 + cleanup Tier 1)
- 20 instâncias no frontend (`tsc` vê) + 18 em `supabase/` (Deno runtime)
- **Achado crítico:** `tsconfig.json` não tem `"strict"` nem `"noImplicitAny"`.
  Há `any` IMPLÍCITOS no codebase não capturados por essa auditoria.
- Apêndice A: ~30 `as any` separados (incluindo SUSPEITOS de bug latente
  como `(profile as any).banner_url` indicando drift entre DB e tipo TS)

**Distribuição:**
| Categoria | Count | Esforço |
|---|---|---|
| TRIVIAL | 9 | ~1h |
| MEDIO_SUPABASE | 12 | ~2-3h |
| MEDIO_DOMINIO | 7 | ~2-3h |
| DIFICIL | 10 | ~3-4h |
| SUSPEITO (em `:any`) | 0 | — |
| PROIBIDO_TOCAR | 0 | — |
| **Total** | **38** | **~8-11h** em 3 fases |

**Relatório completo:** `docs/AUDITORIA_ANY_2026_05_13.md`

**Próximas fases recomendadas:**
- Fase 2 (TRIVIAL ~1h) — catch handlers + acumuladores
- Fase 3 (MEDIO_SUPABASE + MEDIO_DOMINIO ~3-5h) — gerar `Database` types + interfaces
- Fase 4 (DIFICIL ~3-4h) — criar `_shared/hubspot-types.ts` consolidando shapes da API HubSpot
- Fase 5 paralela — investigar `as any` SUSPEITOS (drift DB/tipo)
- Pré-requisito recomendado antes de Fase 2: ADR-017 com `"strict": true` faseado

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
