# Auditoria de instâncias `:any` — 2026-05-13

**Auditor:** Claude (Principal Engineer / Tech Lead)
**Escopo:** diagnóstico inicial + execução faseada.
**Regra de referência:** R6 (Zero Any) — `.context/rules.md`

**Status atual:**
- Fase 2 (TRIVIAL) ✅ CONCLUÍDA em 2026-05-13 (commit `5bddae8`)
- ADR-017 ✅ CONCLUÍDA em 2026-05-14 → `"strict": true` enforced. **R6 agora valida `:any` IMPLÍCITO em compile-time.**
- **Fase β SUSPEITOS** (Apêndice A.1 + A.4) ✅ PARCIALMENTE CONCLUÍDA em 2026-05-15. 3 buckets fechados (commits `1b1bbd2`, `229fd81`, `3cc691c`). 1 bucket em STANDBY (Issue-017 RSVP drift), 1 bucket documentado como exceção (UnreadCountContext ADR-002 + vite.config PWA), 1 bucket novo identificado como backlog Fase γ (5 ocorrências de cast em props/enum/deprecated).
- **29 instâncias `:any` EXPLÍCITO** restantes ainda como backlog (Fases 3+). Strict mode bloqueia novos `any` implícitos, mas os explícitos antigos passam até serem removidos manualmente.

---

## Sumário executivo

- **Total bruto inicial:** 38 instâncias de `:any` em 12 arquivos
- **Falsos positivos filtrados:** 0
- **Após Fase 2:** **29 instâncias** (38 − 9 TRIVIAL corrigidas)
- **Reportado anteriormente em `progress.md`:** 81 → redução de **53%** desde a última auditoria, atribuída às refatorações de Edge Functions (ADR-015) e limpezas de Tier 1.

### Achado adicional crítico — `tsconfig.json` sem `"strict"`

`tsconfig.json` **não tem** `"strict": true` nem `"noImplicitAny": true`. Os 38 explícitos são apenas a superfície — **parâmetros sem anotação ficam `any` implícitos sem o compilador reclamar.**

**Auditoria diagnóstica feita em 2026-05-13 (noite) revelou apenas 23 erros com strict total** (não centenas como temido), e **13 deles são cascade de 1 só problema** (falta `@types/react-big-calendar`). Detalhes completos em `docs/AUDITORIA_STRICT_MODE_2026_05_13.md` (branch `audit/strict-mode`).

**ADR-017 PROPOSTO** em `.context/memory/decisions.md` com plano Estratégia D híbrida em 5 sub-fases (~4-6h total).

### Distribuição por categoria

| Categoria | Count inicial | Status | Esforço |
|---|---|---|---|
| TRIVIAL | 9 | ✅ **CONCLUÍDA 2026-05-13** | (real: <1h) |
| MEDIO_SUPABASE | 12 | ⏳ pendente | ~2-3h |
| MEDIO_DOMINIO | 7 | ⏳ pendente | ~2-3h |
| DIFICIL | 10 | ⏳ pendente | ~3-4h |
| SUSPEITO | 0 | — | n/a |
| PROIBIDO_TOCAR | 0 | — | n/a |
| **Restante** | **29** | em backlog | **~7-10h** em 2 fases |

### Sub-escopo: frontend vs Edge Functions

| Camada | Count | Observação |
|---|---|---|
| Frontend (`tsc` vê) | 20 | Validação ativa, mas sem `strict` |
| `supabase/functions/*` (Deno) | 16 | Excluído pelo `tsconfig.exclude`; rodam em Deno runtime |
| `supabase/scripts/*` | 2 | Igual |

---

## Top 10 arquivos com mais ocorrências

| # | Arquivo | Total | Pode tocar? |
|---|---|---|---|
| 1 | `contexts/AppContext.tsx` | 8 | ✅ (não IMUTÁVEL) |
| 2 | `supabase/functions/sync-hubspot/index.ts` | 8 | ✅ |
| 3 | `supabase/functions/hubspot-webhook/index.ts` | 5 | ✅ (ADR-015 já refatorou parcialmente) |
| 4 | `components/admin/GalleryModule.tsx` | 4 | ✅ |
| 5 | `components/admin/chat/AdminChatModals.tsx` | 3 | ✅ |
| 6 | `components/admin/UserActivityDetail.tsx` | 2 | ✅ |
| 7 | `supabase/functions/send-push/index.ts` | 2 | ⚠️ (caminho central — testar bastante) |
| 8 | `supabase/scripts/seed-admin.ts` | 2 | ✅ |
| 9 | `types.ts` | 1 | ⚠️ (impacto global) |
| 10 | `contexts/AuthContext.tsx` | 1 | ⚠️ (central, mas não IMUTÁVEL) |
| 11 | `supabase/functions/check-email-exists/index.ts` | 1 | ✅ |
| 12 | `components/admin/events/EventForm.tsx` | 1 | ✅ |

---

## Inventário detalhado

### TRIVIAL — Fase 2 ✅ **CONCLUÍDA 2026-05-13**

Tipo óbvio do contexto. Catch handlers (TS 4.4+ aceita `unknown`) e acumuladores locais.

| Arquivo:linha | Trecho original | Tipo aplicado |
|---|---|---|
| `contexts/AuthContext.tsx:72` | `} catch (error: any) {` | `unknown` + narrowing via `Record<string, unknown>` (acesso a `.code` exigia preservar PostgrestError) |
| `components/admin/GalleryModule.tsx:43` | `} catch (error: any) {` + 2× `as any` adjacentes | `unknown` + narrowing limpo (`as any` adjacentes também removidos) |
| `components/admin/GalleryModule.tsx:83` | `} catch (error: any) {` | `unknown` (passa direto pra `console.error`, aceita) |
| `supabase/scripts/seed-admin.ts:100` | `} catch (error: any) {` | `unknown` + `error instanceof Error ? error.message : String(error)` |
| `supabase/functions/sync-hubspot/index.ts:191` | `const cleanProps: any = {};` | `Record<string, string>` |
| `supabase/functions/sync-hubspot/index.ts:216` | `const cleanProps: any = {};` | `Record<string, string>` |
| `supabase/functions/hubspot-webhook/index.ts:579` | `const payload: any = { is_active, updated_at }` | `Record<string, unknown>` (boolean+string+number heterogêneos) |
| `supabase/functions/send-push/index.ts:95` | `} catch (err: any) {` | `unknown` + narrowing pra `WebPushError.statusCode` via `Record<string, unknown>` (preserva 410/404 handling) |
| `supabase/functions/send-push/index.ts:122` | `} catch (err: any) {` | `unknown` + `err instanceof Error ? err.message : String(err)` |

**Validações da execução:**
- `tsc --noEmit` exit 0 ✅
- `npm run build` passa ✅ (Sentry source maps uploadadas)
- Zero `as any` introduzido como narrowing (todos os narrowings via `Record<string, unknown>` + checagem de tipo runtime)
- Zero `as Error` usado
- `git diff --stat`: 5 arquivos `.ts/.tsx` modificados (exatamente os listados) + 2 docs

---

### MEDIO_SUPABASE — Fase 3 (~1-2h)

Tipos derivados de `Database['public']['Tables']` (Supabase) ou `User`/`Session` (Supabase Auth).

| Arquivo:linha | Trecho | Tipo proposto |
|---|---|---|
| `contexts/AppContext.tsx:35` | `session: any;` | `Session \| null` (de `@supabase/supabase-js`) |
| `contexts/AppContext.tsx:36` | `setSession: (s: any) => void;` | `(s: Session \| null) => void` |
| `contexts/AppContext.tsx:65` | `pendingUser: any;` | `User \| null` |
| `contexts/AppContext.tsx:75` | `handleLoginSuccess: (user: any) => Promise<void>;` | `(user: User) => Promise<void>` |
| `contexts/AppContext.tsx:349` | `const handleLoginSuccess = async (user: any) =>` | Idem L75 |
| `components/admin/chat/AdminChatModals.tsx:96` | `searchedUsers: any[];` | `Database['public']['Tables']['profiles']['Row'][]` |
| `components/admin/chat/AdminChatModals.tsx:97` | `selectedUser: any \| null;` | `Database['public']['Tables']['profiles']['Row'] \| null` |
| `components/admin/chat/AdminChatModals.tsx:101` | `onSelectUser: (user: any) => void;` | Idem |
| `components/admin/GalleryModule.tsx:54` | `const openModal = (album?: any) => ...` | `Database['public']['Tables']['gallery_albums']['Row']` (confirmar nome real) |
| `components/admin/GalleryModule.tsx:159` | `onEdit={(a: any) => openModal(a)}` | Idem L54 |
| `supabase/scripts/seed-admin.ts:106` | `async function updateProfile(supabase: any, userId: string)` | `SupabaseClient<Database>` |
| `supabase/functions/sync-hubspot/index.ts:46` | `function mapProfileToHubSpot(profile: any)` | Interface `ProfilePayload` (subset usado pela função) ou `Database['public']['Tables']['profiles']['Row']` |

**Risco:** baixo-médio. Requer gerar/usar `Database` type via `supabase gen types typescript`. Verificar se `types/database.ts` ou similar já existe; se não, gerar.

---

### MEDIO_DOMINIO — Fase 3 (~1-2h)

Tipos do domínio interno (interfaces/types em `types.ts` ou inline).

| Arquivo:linha | Trecho | Tipo proposto |
|---|---|---|
| `types.ts:264` | `metadata?: any;` em `AnalyticsEvent` | `Record<string, unknown>` (preserva flexibilidade do JSONB downstream) |
| `contexts/AppContext.tsx:70` | `navItems: any[];` | Criar `NavItem` interface em `types.ts` (id, label, icon, view, children?) |
| `components/admin/UserActivityDetail.tsx:36` | `metadata: any \| null;` | Mesmo padrão de `types.ts:264` → `Record<string, unknown> \| null` |
| `components/admin/UserActivityDetail.tsx:147` | tipo inline `{ ...; metadata: any \| null; ... }` | Idem |
| `components/admin/events/EventForm.tsx:222` | `const onSubmit = async (data: any) =>` | Inferir do react-hook-form (`SubmitHandler<EventFormData>`) ou interface local |
| `supabase/functions/sync-hubspot/index.ts:248` | `let profile: any;` (vem de `req.json()`) | Criar interface `SyncHubSpotRequest { profile: ProfilePayload }` |
| `supabase/functions/check-email-exists/index.ts:93` | `(r: any) => String(r.id)` | Tipo do association (HubSpot) — pode virar `{ id: string }` simples |

**Risco:** baixo-médio. Requer leitura do código adjacente para identificar shape correto. `react-hook-form` já fornece tipos.

---

### DIFICIL — Fase 4 (~3-4h)

Responses de API externa (HubSpot) ou bibliotecas sem tipos prontos.

| Arquivo:linha | Trecho | Estratégia |
|---|---|---|
| `contexts/AppContext.tsx:84` | `calendarDefaultView: any;` | Importar `View` de `react-big-calendar` (lib expõe os tipos) |
| `contexts/AppContext.tsx:88` | `tourSteps: any[];` | Confirmar lib usada (provavelmente `react-joyride`); usar tipo `Step[]` da lib |
| `supabase/functions/sync-hubspot/index.ts:154` | `createHubSpotContact(properties: any)` | Criar interface `HubSpotContactProperties` em `_shared/hubspot-types.ts` |
| `supabase/functions/sync-hubspot/index.ts:168` | `updateHubSpotContact(..., properties: any)` | Reusar `HubSpotContactProperties` |
| `supabase/functions/sync-hubspot/index.ts:189` | `createHubSpotCompany(properties: any, ...)` | Criar `HubSpotCompanyProperties` |
| `supabase/functions/sync-hubspot/index.ts:215` | `updateHubSpotCompany(..., properties: any)` | Reusar `HubSpotCompanyProperties` |
| `supabase/functions/hubspot-webhook/index.ts:127` | `handleContactCreatedOrUpdated(eventData: any)` | Criar `HubSpotWebhookEvent` discriminated union (subscriptionType, eventType, objectId, propertyName?, propertyValue?) em `_shared/hubspot-types.ts` |
| `supabase/functions/hubspot-webhook/index.ts:485` | `handleDealPropertyChange(eventData: any)` | Reusar `HubSpotWebhookEvent` |
| `supabase/functions/hubspot-webhook/index.ts:519` | `.map((r: any) => String(r.id))` | Tipo `HubSpotAssociation` → `{ id: string \| number, type?: string }` |
| `supabase/functions/hubspot-webhook/index.ts:809` | `let events: any[]` | `HubSpotWebhookEvent[]` (do mesmo discriminated union) |

**Risco:** médio. Criar `supabase/functions/_shared/hubspot-types.ts` consolida os shapes do HubSpot API/Webhook em um único lugar. Investimento paga porque o webhook é evoluído frequentemente.

**Sugestão:** primeira PR cria os tipos e refatora um caminho (ex: `handleContactCreatedOrUpdated`). Próximas PRs replicam para os outros caminhos sem necessidade de mais tipos novos.

---

### SUSPEITO — Fase 5 (caso a caso)

**Nenhum `:any` puro foi classificado como SUSPEITO** — todos têm intenção clara ou são limitação de tipagem externa.

**Porém, ver Apêndice A** abaixo — vários `as any` separados são fortes candidatos a SUSPEITO (campos de banco que existem mas não estão no tipo TypeScript).

---

### PROIBIDO_TOCAR — n/a

**Nenhum `:any` puro foi encontrado em zonas IMUTÁVEIS** (`lib/supabase.ts`, `hooks/useUnreadMessageCount.ts`, `contexts/UnreadCountContext.tsx`, `components/push/PushAutoSubscriber.tsx`, `supabase/migrations/*`). Limpeza já foi feita lá.

---

## Apêndice A — `as any` (escopo paralelo, ~30 ocorrências)

Briefing pediu inventário de `:any`. Mas `as any` é o mesmo cheiro de débito técnico e foi encontrado em volume. Listo aqui para próxima sessão.

### A.1 — Suspeitos de bug latente (campo de banco fora do tipo)

| Arquivo:linha | Trecho | Hipótese |
|---|---|---|
| `components/ProfilePreview.tsx:194` | `(profile as any).banner_url` | Campo `banner_url` existe na DB mas não no tipo `Profile`? Investigar `types.ts` + `Database` type real |
| `components/MemberBook.tsx:495` | `(member as any).banner_url` | Mesma raiz |
| `components/admin/AdminMemberProgress.tsx:728,741,756,773` | `(file as any).isAutomated` | Campo `isAutomated` não existe no tipo `File`? Pode ser flag de UI mas marcada como persistente — investigar |
| `services/adminBirthdayService.ts:98` | `} as any);` (em upsert) | Possível workaround de tipo do upsert — investigar |
| `components/admin/events/EventList.tsx:146` | `setRsvpList((data as any) \|\| []);` | Cast cego de resposta de query — pode estar mascarando shape errado |

**Ação proposta:** PR separada de "auditoria de campos do banco vs tipo TypeScript". Gerar `Database` type novamente e diff contra `types.ts` para identificar drift.

### A.2 — Limitação de DOM lib (Badging API experimental)

| Arquivo:linha | Trecho | Zona |
|---|---|---|
| `contexts/UnreadCountContext.tsx:50,52,72` | `(navigator as any).setAppBadge/clearAppBadge` | **PROIBIDO_TOCAR — ADR-002 IMUTÁVEL** |

**Nota:** Badging API é experimental; tipos não estão em `lib.dom.d.ts` padrão. Solução futura (se um dia tocar): `interface Navigator { setAppBadge?(count?: number): Promise<void>; clearAppBadge?(): Promise<void>; }` augmentation em `types/badging.d.ts`. **Não fazer agora — ADR-002.**

### A.3 — Cast em config de build (PWA manifest)

| Arquivo:linha | Total |
|---|---|
| `vite.config.ts` (8 ocorrências em manifest) | Tipos do `vite-plugin-pwa` não cobrem `display_override`, `categories`, `screenshots`, `shortcuts`, `launch_handler`, `share_target`, `edge_side_panel`. Cast pragmático até a lib alinhar. |

**Ação:** sem urgência. Verificar `vite-plugin-pwa` versão newer ou aceitar como nota de manifesto.

### A.4 — Casts triviais

| Padrão | Locais | Resolução |
|---|---|---|
| `e.target.value as any` em onChange de `<select>` | `BannersModule.tsx:295,547` | Cast para literal union do enum corresponde |
| `setView(item.id as any)` | `DesktopSidebar.tsx:156` | Tipar `item.id` como `ViewState \| string` corretamente |
| `DataTable as any` em props | `AdminApp.tsx:281,286` | Definir tipo genérico do `DataTable` component |
| `error as any` (narrowing) | `AcademyModule.tsx:74,86`, `GalleryModule.tsx:44`, `NotificationBannersModule.tsx:540` | Helper `extractErrorMessage(err: unknown): string` ou narrowing inline |

### A.5 — `@ts-ignore`

| Arquivo:linha | Trecho | Análise |
|---|---|---|
| `vite.config.ts:63` | `// @ts-ignore — optional dev dependency, gracefully handled by try/catch` | **Justificado** — `@vitejs/plugin-basic-ssl` é optional. Comentário documentado. Não-bloqueador. |

---

## Próximas fases recomendadas

### Estimativa total: **~8-11h** distribuídas em 3 fases.

**Fase 2 — TRIVIAL (~1h)** — risco baixo, alto volume relativo (9 itens).
- Tudo `catch (e: unknown)` + 3 `cleanProps` simples
- 1 commit único, validar via tsc
- **Quando:** próxima sessão de manutenção (15-30 min)

**Fase 3 — MEDIO_SUPABASE + MEDIO_DOMINIO (~3-5h)** — risco baixo, requer:
- (a) Gerar/atualizar `types/database.ts` via `supabase gen types typescript`
- (b) Criar/usar interfaces de domínio (NavItem, ProfilePayload, etc) em `types.ts`
- (c) Substituir 19 `:any` com tipos corretos
- Multiple commits, um por domínio (Auth/Session, Profiles, Albums, NavItems, etc)

**Fase 4 — DIFICIL (~3-4h)** — risco médio. HubSpot types.
- Criar `supabase/functions/_shared/hubspot-types.ts` com interfaces consolidadas:
  - `HubSpotContactProperties`, `HubSpotCompanyProperties`
  - `HubSpotWebhookEvent` (discriminated union)
  - `HubSpotAssociation`
- Refator de `sync-hubspot`, `hubspot-webhook`, `check-email-exists`
- Primeira PR cria os tipos + 1 caminho; PRs subsequentes replicam

**Fase 5 (paralela) — Apêndice A.1 SUSPEITOS de bug latente** — caso a caso.
- Gerar diff `Database` type vs `types.ts` para identificar drift
- Investigar `banner_url`, `isAutomated`, `data as any` em RSVP
- Pode virar Issues separadas (ex: "Issue-015 — banner_url ausente no tipo Profile")

### Pré-requisito recomendado: Strict mode

Antes de iniciar Fase 2, considerar adicionar `"strict": true` ao `tsconfig.json` em outra branch experimental e contar erros. Se for tratável (~50-200), virar ADR-017 e atacar como Fase 6.

---

## Decisões registradas nesta auditoria

1. ✅ Listei apenas `:any` explícito (escopo do briefing). `as any` mapeado no Apêndice A.
2. ✅ Não classifiquei nenhum `:any` como SUSPEITO porque todos têm justificativa clara — os SUSPEITOS reais estão em `as any` (A.1).
3. ✅ `PROIBIDO_TOCAR` ficou vazio para `:any` puro. As 3 zonas com `as any` listadas em A.2 são informativas.
4. ✅ Auditoria original (commit `99670c7`) não tocou em código de produção.

---

## Histórico de execução

| Fase | Quando | Commit | Resultado |
|---|---|---|---|
| Auditoria inicial | 2026-05-13 manhã | `99670c7` | 38 instâncias classificadas em 5 categorias + Apêndice A |
| **Fase 2 TRIVIAL** | **2026-05-13 tarde** | _(este commit)_ | **-9 instâncias (38 → 29). Padrão estabelecido: narrowing via `Record<string, unknown>` + checagem runtime, sem `as Error` nem `as any`.** |
| Fase α (recomendada antes de 3+) | TBD | — | ADR-017 com `"strict": true` faseado |
| Fase 3a MEDIO_SUPABASE | TBD | — | 12 instâncias (Session/User/Profile types do Database) |
| Fase 3b MEDIO_DOMINIO | TBD | — | 7 instâncias (NavItem, AnalyticsEvent metadata, etc) |
| Fase 4 DIFICIL | TBD | — | 10 instâncias (criar `_shared/hubspot-types.ts`) |
| Fase 5 Apêndice A.1 | TBD | — | SUSPEITOS de bug latente (drift DB vs tipo TS) |

**Padrão de narrowing consolidado em Fase 2** (referência para Fases 3+):

```ts
// Para erros desconhecidos com shape pseudo-estruturado:
const errObj: Record<string, unknown> = (typeof error === 'object' && error !== null)
    ? error as Record<string, unknown>
    : {};
const errMessage = typeof errObj.message === 'string' ? errObj.message : '';
const errCode = typeof errObj.code === 'string' ? errObj.code : undefined;

// Para erros simples onde só precisa de .message:
const message = error instanceof Error ? error.message : String(error);
```

`as Record<string, unknown>` é narrowing honest (não cast cego — TS ainda obriga a checar cada propriedade antes de usar), diferente de `as Error` que é equivalente a `as any`.
