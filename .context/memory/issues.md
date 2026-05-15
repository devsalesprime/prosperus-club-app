# .context/memory/issues.md — Bugs Conhecidos e Workarounds
# Prosperus Club App · Abril 2026

## RESOLVIDOS — Fase β SUSPEITOS

### Issue-017 — RSVP profiles tipado como objeto, supabase-js generator inferia array (FALSO POSITIVO)
**Descoberto:** Fase β, 2026-05-15
**Tipo:** Limitação de gerador de tipos da lib (`supabase-js`) — não bug runtime
**Status:** ✅ RESOLVIDO 2026-05-15 como falso positivo
**Arquivo:** `components/admin/events/EventList.tsx:146` (+ contexto :70-83, :183-188, :440-451)

**Hipótese inicial:** suspeita de bug latente — `RsvpItem.profiles` declarado como objeto único, mas TypeScript inferia o retorno do `.select('..., profiles:user_id(...)')` como array. Achei que estava causando CSV de presença vazio e nomes faltando na UI.

**Validação runtime (tech lead, 2026-05-15):** Network inspection capturou 5 RSVPs distintos. Em **100% dos casos**, `profiles` veio como objeto único `{ id, name, ... }`, NÃO como array.

**Causa raiz real:** o `supabase-js` type generator é genérico e infere `profiles[]` para qualquer JOIN, mesmo quando a FK é 1-1 com semântica `.single()`. É **limitação conhecida da lib**, não bug do código.

**Fix aplicado:** `setRsvpList((data ?? []) as unknown as RsvpItem[])` com comentário documentando a limitação. O `as unknown as T` (em vez de `as any`) sinaliza que o desvio é intencional e validado em runtime — não é cast cego.

**Padrão consolidado:** Padrão 6 em `docs/PATTERNS_TYPESCRIPT.md` — "Cast honest para limitação de gerador de tipos".

**Comportamento runtime preservado 100%** — nunca houve bug; a hipótese inicial estava errada.

## ABERTOS — Fase β SUSPEITOS

_(nenhuma issue aberta nesta categoria após Issue-017 ser fechada como falso positivo)_

## RESOLVIDOS — Fase β SUSPEITOS (continuação)

### Issue-018 — `(error as any)` narrowing cego em 4 sites (resolvido)
**Descoberto:** Fase β, 2026-05-15
**Tipo:** Drift TS / narrowing cego
**Status:** ✅ RESOLVIDO via commit `1b1bbd2`
**Arquivos:**
- `components/admin/AcademyModule.tsx:74,86`
- `components/ImageUpload.tsx:96`
- `components/admin/NotificationBannersModule.tsx:540`

**Sintoma:** 4 sites de catch de erro acessavam `.message`, `.code`, `.statusCode` via `(error as any).property` — cast cego que perdia o type checking de TypeScript.

**Solução:** Substituídos pelo padrão honest (`docs/PATTERNS_TYPESCRIPT.md` Padrão 1) — narrowing via `Record<string, unknown>` + checagem `typeof === 'string'/'number'`. Em sites que só precisavam de `.message`, usado shorthand `error instanceof Error ? error.message : '...fallback...'`.

**Comportamento runtime preservado 100%** — só tipagem mudou.

### Issue-019 — `banner_url` em profile (campo fantasma, removido)
**Descoberto:** Fase β, 2026-05-15
**Tipo:** Drift DB↔TS — código residual de feature descontinuada
**Status:** ✅ RESOLVIDO via commit `229fd81`
**Arquivos:**
- `components/ProfilePreview.tsx:194`
- `components/MemberBook.tsx:506`

**Sintoma:** Os 2 sites usavam `<img src={(profile as any).banner_url ?? fallback}>`. Validação MCP confirmou que `profiles.banner_url` **não existe** no schema. Em runtime, o `??` sempre caía no fallback porque o cast retornava `undefined`.

**Solução:** Removido o cast residual, mantido apenas o fallback (que era o caminho ativo). Sem mudança visual — sócios já viam o `fundo-prosperus-app.webp` há tempo, agora a tipagem reflete a realidade.

**Atenção:** `banner_url` EXISTE legitimamente em outras tabelas (`events`, `solutions`, `member_progress_tools`). Esses usos foram **preservados** — schema real tem o campo.

### Issue-021 — `notifyNewEvent` disparado em duplicata (EventForm + eventService)
**Descoberto:** Pré-investigação Fase 3 (ADR-018), 2026-05-15
**Tipo:** Bug latente / duplicação silenciosa
**Status:** ✅ RESOLVIDO via commit `04be3d0`
**Arquivos:**
- `components/admin/events/EventForm.tsx:274-283` (bloco redundante removido)
- `services/eventService.ts:161` (caminho oficial preservado)

**Sintoma:** Ao criar evento via admin UI, 2 pushes simultâneos eram enviados para cada sócio:
- `services/eventService.ts:161` dispara `notifyNewEvent(data.id, ...)` com ID real retornado do INSERT
- `components/admin/events/EventForm.tsx:275-282` disparava NOVAMENTE com `eventData.id || 'new'` — `eventData` vem do form, sempre cai no fallback `'new'` (ID lixo)

**Impacto pré-Fase 3:** apenas duplicação silenciosa do badge in-app e 2 push notifications redundantes (URL hardcoded `/app/agenda` igual nos dois). Bug não-disruptivo, escondido por anos.

**Impacto se Fase 3 fosse implementada sem fix:** segunda notificação geraria URL quebrada `/app/agenda?evento=new` — ao clicar, useEffect não acharia evento com id `'new'` em `clubEvents`, falha silenciosa.

**Solução:** removido o bloco `if (shouldNotify) { ... }` do path de criação em EventForm.tsx:271-284. Caminho oficial fica em `eventService.createEvent` (dispatch fire-and-forget interno com ID correto). `shouldNotify` no else já era ilusório: admin nunca tinha controle real porque o service sempre notificava.

**Comportamento runtime preservado 90%** — antes: 2 pushes por evento; depois: 1 push por evento. Notificações continuam chegando ao mesmo destino, com mesmo conteúdo. Único impacto visível: sócios não recebem mais o push duplicado.

### Issue-020 — `isAutomated` flag UI tipada honest
**Descoberto:** Fase β, 2026-05-15
**Tipo:** Flag client-side UI (Caso A — não persiste no banco, computada no merge)
**Status:** ✅ RESOLVIDO via commit `3cc691c`
**Arquivo:** `components/admin/AdminMemberProgress.tsx:267,299,729,742,757,774`

**Sintoma:** 4 condicionais usavam `(file as any).isAutomated` para diferenciar relatórios automatizados (signed URL privada) de uploads manuais (URL pública). Validação MCP confirmou que `isAutomated` **não existe em nenhuma coluna** do banco. Investigação revelou que é flag **client-side** adicionada na L299 (`isAutomated: true, // Internal flag`) quando `mappedReports` mergeia `reports` (M2M automatizado) com `files` (uploads).

**Solução:** Criado type local `EnrichedMemberProgressFile = MemberProgressFile & { isAutomated?: boolean }` com comentário explicando que a flag é client-side. State `allFiles` tipado com o novo type. 4 `(file as any).isAutomated` substituídos por `file.isAutomated` direto.

**Comportamento runtime preservado 100%** — só tipagem reflete a realidade da flag.

## ABERTOS — Bugs latentes do Cluster 4 (ADR-017 Sessão 2)

_(nenhuma issue aberta — Issues 015 e 016 fechadas em 2026-05-15 via sessão pós-strict mode; ver "RESOLVIDOS — Cluster 4" abaixo)_

## RESOLVIDOS — Cluster 4 (ADR-017 Sessão 2)

### Issue-015 — MemberBook 'NONE' string mágica fora do mapa
**Descoberto:** ADR-017 Sessão 2, 2026-05-14 (commit `1166a76`)
**Tipo:** Bug latente / decisão de design pendente
**Status:** ✅ RESOLVIDO via commit `f63d559`, 2026-05-15 (Cenário B)
**Arquivo:** `components/MemberBook.tsx` + `utils/matchEngine.ts`

**Sintoma original:** `MatchType = 'STRONG' | 'COMMON' | 'POTENTIAL' | 'NONE'` mas o `MATCH_CONFIG` só tem 3 das 4 chaves (faltava `NONE`). Em runtime funcionava porque `MemberBook.tsx:165` fazia `.filter(r => r.matchType !== 'NONE')` antes da indexação `MATCH_CONFIG[matchResult.matchType]`, mas o filter não era narrowing válido sem type predicate explícito.

**Cenário escolhido (B):** `'NONE'` era sentinela sem representação visual — sempre filtrada antes da UI. Refator:
- `MatchType` reduzido para `'STRONG' | 'COMMON' | 'POTENTIAL'`
- `calculateMatch` retorna `MatchResult | null` (null para self-match e score < 10)
- `MATCH_CONFIG` virou `Record<MatchType, MatchConfigEntry>` (sem `Partial`) — compilador garante que toda indexação retorna config válida
- Filter em MemberBook usa type predicate `(r): r is MatchResult => r !== null`

**Bonus:** `rankMatches` removida do `matchEngine.ts` — dead code (0 callers no app).

**Comportamento runtime preservado 100%:** self-match e perfis com score baixo continuam não aparecendo no matchMap.

### Issue-016 — adminChatService.getAllConversations() mapping com null silencioso
**Descoberto:** ADR-017 Sessão 2, 2026-05-14 (commit `675dd31`)
**Tipo:** Bug latente / decisão arquitetural pendente
**Status:** ✅ RESOLVIDO via commit `db8fcf2`, 2026-05-15 (Cenário A polido)
**Arquivo:** `services/adminChatService.ts`

**Sintoma original:** dois `filter(Boolean) as T[]` (cast cego) eliminavam nulls do array intermediário sem validação de tipo: o `mappedParticipants` e o `filteredConversations` final. Se o tipo subjacente virasse `T | null | undefined`, o `filter(Boolean)` passaria silenciosamente.

**Cenário escolhido (A polido):** função interna já filtra (return type externo é `PaginatedResult<ConversationWithParticipants>` sem null) — bastava trocar `filter(Boolean) as T[]` por type predicate honest:
- `mappedParticipants`: `.filter((p): p is MappedParticipant => p !== null)`
- `filteredConversations`: `.filter((c): c is ConversationWithParticipants => c !== null)`

**Cenário C (mover search para SQL) explicitamente refutado:** volume confirmado via MCP (9 conversas, 12 participants, 11 mensagens) — refator desnecessário.

**Comportamento runtime preservado 100%.** Compilador agora valida narrowing sem cast cego.

## RESOLVIDOS

### Issue-014 · push_subscriptions acumulando zombies (resolvida via cron)
**Sintoma:** Em 2026-05-13 a tabela tinha 107 linhas: 59 active + 48 inactive. Dos 48 inativos, 33 já tinham > 30 dias (alguns acumulados desde 2026-03-03). `send-push` corretamente marca `is_active=false` em 410 Gone mas nunca deleta — sem cleanup automático, a tabela crescia indefinidamente.
**Causa raiz:** ausência de processo de manutenção. Não era bug do `send-push` (que faz a parte certa de marcação) — era falta de uma rotina de garbage collection downstream.
**Solução (2026-05-13):** ADR-016. Edge Function `cleanup-push-subscriptions` + pg_cron `push-cleanup-daily` (diário 03h UTC). Deleta inativas > 30 dias (Regra A) e órfãs (Regra C). Regra B do briefing original (stale ativas) ficou SKIPPED porque colunas necessárias (`last_failed_at` não existe; `last_used_at` e `error_count` existem mas nunca são populadas em produção). Aguarda ADR-017 futuro com fix em `send-push` para reintroduzir B.
**ADR:** ADR-016
**Status:** ✅ RESOLVIDO 2026-05-13


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
