# Auditoria — TypeScript strict mode

**Data:** 2026-05-13
**Auditor:** Claude (Principal Engineer / Tech Lead)
**Branch:** `audit/strict-mode` (esta auditoria — tsconfig.json **revertido** ao final, sem mudança em código de produção)
**Baseline confirmado:** `tsc --noEmit` exit 0 antes e depois da auditoria.

---

## Sumário executivo

| Métrica | Valor |
|---|---|
| Erros com `"strict": true` total | **23** |
| Dos quais cascateados de **1 problema só** (falta `@types/react-big-calendar`) | **13 (57%)** |
| Erros "reais" após resolver pre-step | **10** |
| Esforço estimado total | **~4-6h** em 3 fases |
| Estratégia recomendada | **D Híbrida + Pre-step** |

**Achado mais importante:** o codebase já está em **estado excelente** para strict mode. Auditoria anterior previa "centenas a milhares" de erros — realidade é **23**, dos quais **13 são consequência de 1 dependência sem types** (`react-big-calendar`). Após corrigir a dependência, são **10 erros distribuídos em 10 arquivos** — atacáveis em meio sprint.

---

## Detalhamento por flag isolada

Cada flag testada sozinha, com baseline restaurado entre testes:

| Flag | Erros isolados | Diagnóstico |
|---|---|---|
| `noImplicitAny` | 17 | Maior bloco. **13 são cascade de `react-big-calendar`** sem types. 4 reais. |
| `strictNullChecks` | 15 | Inclui 12 dos cascade do calendar (que viram null/undefined). 3 reais distintos. |
| `strictFunctionTypes` | 1 | Trivial — 1 callback signature em OnboardingWizard. |
| `strictPropertyInitialization` | +0 (sobre strictNullChecks) | Sem classes com propriedades sem inicializador. **Grátis.** |
| `noImplicitThis` | 0 | **Grátis.** |
| `alwaysStrict` | 0 | **Grátis.** |
| **`strict: true` combinado** | **23** | Overlap entre flags (alguns erros disparam em múltiplas) |

**3 flags "grátis"** (0 erros isolados): `noImplicitThis`, `alwaysStrict`, `strictPropertyInitialization`. Podem ligar **imediatamente** sem custo.

---

## Detalhamento por arquivo (top 10)

| Arquivo | Erros | Categoria predominante |
|---|---|---|
| `components/layout/ViewSwitcher.tsx` | **12** | react-big-calendar (cascade) |
| `components/admin/events/EventScanner.tsx` | 3 | strictNullChecks (mesmo objeto 3×) |
| `utils/calendarUtils.tsx` | 1 | react-big-calendar import |
| `components/MemberBook.tsx` | 1 | TS7053 (MatchType 'NONE' fora do mapa — **bug latente**) |
| `components/onboarding/OnboardingWizard.tsx` | 1 | TS2322 (DocType vs string signature) |
| `components/notifications/AdminNotifications.tsx` | 1 | TS2769 (`new Date(undefined)`) |
| `components/admin/AdminMemberProgress.tsx` | 1 | TS2322 (File\|null vs File) |
| `components/admin/events/EventList.tsx` | 1 | TS2322 (string\|null vs string\|undefined) |
| `components/chat/ConversationList.tsx` | 1 | TS18048 (`conv.unreadCount` possibly undefined) |
| `services/adminChatService.ts` | 1 | TS2322 (null em array tipado) |

---

## Detalhamento por subpasta

| Subpasta | Erros | Pode ligar strict imediatamente? |
|---|---|---|
| `components/` | 22 | Não — 22 erros, mas concentrados em 10 arquivos |
| `utils/` | 1 | Quase (1 erro do react-big-calendar) |
| `services/` | 1 | Quase (1 erro de null filter) |
| `hooks/` | 0 | **Sim** ✅ |
| `lib/` | 0 | **Sim** ✅ |
| `contexts/` | 0 | **Sim** ✅ |
| `tests/` | 0 | **Sim** ✅ |
| `types.ts` (root) | 0 | **Sim** ✅ |
| `AppContext.tsx`, `AdminApp.tsx`, `App.tsx` (root) | 0 | **Sim** ✅ |

**4 subpastas inteiras (hooks/lib/contexts/tests) já passam clean com strict total.** O codebase tem boa higiene — o débito está concentrado em interações com `react-big-calendar` e algumas validações `null` defensivas em UI.

---

## Mapa dos 23 erros

### Cluster 1 — `react-big-calendar` sem types (13 erros)

`react-big-calendar` está em `package.json` (1.8.5) mas NÃO tem `@types/react-big-calendar` instalado. Compilador trata o módulo inteiro como `any`, e todos os callbacks que recebem objetos da lib (`localizer`, `event`, `date`, `culture`, etc) ficam `any`.

| Arquivo | Erros | Tipo |
|---|---|---|
| `components/layout/ViewSwitcher.tsx` | 12 (1× TS7016 + 10× TS7006 + 1× TS7016 import dynamic) | Todo o componente do calendário |
| `utils/calendarUtils.tsx` | 1 (TS7016) | Import helper |

**Solução pré-step:** `npm i --save-dev @types/react-big-calendar` resolve TODOS os 13 erros se o pacote existe no NPM. Se não, criar declaração mínima em `types/react-big-calendar.d.ts`:
```ts
declare module 'react-big-calendar';
```
Já bloqueia o cascade. Refinar depois com tipos parciais.

### Cluster 2 — strictNullChecks "atômico" (4 erros)

| Arquivo:linha | Erro | Decisão sugerida |
|---|---|---|
| `AdminMemberProgress.tsx:145` | `File \| null` → `File` | Adicionar guard `if (file) { ... }` antes de passar |
| `EventList.tsx:446` | `string \| null` → `string \| undefined` | `?? undefined` no cast |
| `ConversationList.tsx:137` | `conv.unreadCount` possivelmente undefined | `conv.unreadCount ?? 0` |
| `AdminNotifications.tsx:651` | `new Date(undefined)` em overload | Guard `if (dateStr)` ou `new Date(dateStr ?? Date.now())` |

### Cluster 3 — strictNullChecks compósito (3 erros)

`EventScanner.tsx:170,180,183` — mesmo objeto (provavelmente `qrResult` ou similar) acessado em 3 lugares sem guard. **1 narrow no topo da função resolve todos.**

### Cluster 4 — Bugs latentes (3 erros)

| Arquivo:linha | Diagnóstico | Severidade |
|---|---|---|
| `MemberBook.tsx:477` | `MATCH_STYLES[matchType]` onde `matchType: MatchType` inclui `'NONE'` mas o mapa só tem `STRONG/COMMON/POTENTIAL`. Sem fallback. | 🔴 **Bug em produção** — quando matchType=NONE, indexação retorna `undefined` sem warning |
| `OnboardingWizard.tsx:726` | Callback declarado como `(docType: string) => void` mas implementação passa `(type: DocType)`. Tipo mais restrito que contrato. | 🟡 Aceita mais valores que o caller poderia passar — risco de runtime |
| `services/adminChatService.ts:136` | Array com possíveis `null` sendo atribuído a `ConversationWithParticipants[]` (sem null). | 🟡 Em runtime pode haver nulls passando — `.filter((c): c is ConversationWithParticipants => c !== null)` |

**Estes 3 erros são valor agregado da auditoria** — bugs reais que o tsc strict pegaria em compile-time. Atacar mesmo se rejeitar strict total.

---

## Estratégias avaliadas

### A — Big bang
Ligar `strict: true` numa PR, pagar 23 erros. **Custo:** alto pra revisar PR única.
**Risco:** mistura categorias diferentes (cascade vs bugs).
❌ Não recomendado.

### B — Por flag, gradual
1 PR por flag (`noImplicitAny`, depois `strictNullChecks`, etc).
**Custo:** médio (6 PRs).
**Risco:** baixo, mas burocrático.
🟡 Razoável, mas Estratégia D resolve em menos PRs.

### C — Por subpasta via project references
Cada subpasta vira sub-tsconfig com strict próprio.
**Custo:** médio (precisa refator de import paths e config build).
**Risco:** médio (Vite + project refs tem nuances).
❌ Overengineering para 23 erros.

### D — Híbrida + pre-step ✅ **RECOMENDADA**
- **Pre-step (5min):** instalar `@types/react-big-calendar` ou stub mínimo
- **Fase α.0 (15min):** ligar `noImplicitThis` + `alwaysStrict` + `strictPropertyInitialization` (0 erros)
- **Fase α.1 (1h):** ligar `strictFunctionTypes` + fix 1 erro do OnboardingWizard
- **Fase α.2 (1-2h):** ligar `noImplicitAny` + fix 3-4 erros restantes pós pre-step
- **Fase α.3 (2-3h):** ligar `strictNullChecks` + fix 7 erros + endereçar 3 bugs latentes (Cluster 4)

**Total estimado:** **4-6h em 5 sub-fases**, cada uma com PR pequena e diff revisável.

---

## Recomendação

**Estratégia D** — implementação em 5 passos discretos com validação tripla entre cada um.

### Próximos passos sugeridos (se aprovado)

1. **Pre-step (sessão curta de 15min):**
   - Tentar `npm i --save-dev @types/react-big-calendar`
   - Se não existir: stub em `types/react-big-calendar.d.ts`
   - Confirmar 23 → 10 erros restantes
   - Commit: `chore(deps): add @types/react-big-calendar`

2. **Fase α.0 (15min):** Ligar 3 flags grátis
   - Commit: `chore(tsconfig): enable noImplicitThis, alwaysStrict, strictPropertyInitialization`

3. **Fase α.1 (1h):** strictFunctionTypes + fix
   - Commit: `chore(tsconfig): enable strictFunctionTypes + fix OnboardingWizard callback`

4. **Fase α.2 (1-2h):** noImplicitAny + fixes
   - Commit: `chore(tsconfig): enable noImplicitAny + fixes`

5. **Fase α.3 (2-3h):** strictNullChecks + fixes (inclui resolver 3 bugs latentes do Cluster 4)
   - Commit final: `chore(tsconfig): enable strictNullChecks + fix latent bugs`

6. **Bonus:** com tudo verde, simplificar para um único `"strict": true` no tsconfig (mesmas 7 flags ativas).

### Decisão de execução

Esta auditoria fica em **`audit/strict-mode`** branch. **Não merge automático.** Cherry-pick apenas dos docs (`docs/AUDITORIA_STRICT_MODE_2026_05_13.md`, `.context/memory/decisions.md` com ADR-017, etc) para `main`. tsconfig.json **NÃO entra** no merge.

---

## Cross-references

- Auditoria anterior de `:any` explícito (29 restantes): `docs/AUDITORIA_ANY_2026_05_13.md`
- ADR-017 (Strict mode — proposto): `.context/memory/decisions.md`
- Padrão narrowing honest (consolidado em Fase 2): `.context/rules.md` ou `docs/PATTERNS_TYPESCRIPT.md`
- Branch auditoria: `audit/strict-mode` (commit único)

## Log bruto

`docs/STRICT_AUDIT_RAW.log` — gerado pelo `tsc --noEmit` com strict total. Não vai pro git (`.gitignore`). Para reproduzir, ativar `"strict": true` em `tsconfig.json` e rodar `npx tsc --noEmit > docs/STRICT_AUDIT_RAW.log 2>&1`.
