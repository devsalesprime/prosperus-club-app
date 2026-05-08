# Prosperus Club App · Master Audit v3.0
**26/02/2026 — Cobertura: 3 sessões · 24-26/02 · ~30 implementações**

---

## Seção 1 — Scorecard Histórico

### Evolução por Dimensão

| Dimensão | 24/02 | 25/02 | 26/02 | Δ total |
|----------|:-----:|:-----:|:-----:|:-------:|
| Qualidade de Código | 6 | 7 | 7.5 | **+1.5** |
| Cobertura de Testes | 3 | 3 | 3 | 0 |
| Segurança | 5 | 7 | 8 | **+3** |
| Performance | 5 | 6 | 7 | **+2** |
| UX/Usabilidade | 7 | 8 | 8 | +1 |
| Design Consistency | 7 | 7 | 7 | 0 |
| Escalabilidade | 4 | 5 | 7 | **+3** |
| Documentação | 8 | 8 | 8 | 0 |
| **MÉDIA** | **5.6** | **6.4** | **7.2** | **+1.6** |

### Velocity

| Sessão | Data | Resolvidos | Introduzidos | Saldo |
|--------|------|:----------:|:------------:|:-----:|
| Baseline | 24/02 | — | 8 críticos | — |
| Sprint 0+1 | 25/02 | 5 críticos + 4 QW | 0 | +9 |
| Sprint 2+HubSpot+Cleanup | 26/02 | 2 críticos + 6 melhorias | 0 | +8 |
| **TOTAL** | | **7 críticos + 10 melhorias** | **0** | **+17** |

---

## Seção 2 — Inventário Completo

### 2.1 — Arquitetura e Refactor

| Item | Status | Evidência |
|------|:------:|-----------|
| App.tsx: 1.597 → 185 linhas | ✅ | [App.tsx](file:///c:/xampp/htdocs/prosperus-club-app/App.tsx) = 185 lines, 6 outline items |
| AppContext.tsx criado | ✅ | [contexts/AppContext.tsx](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AppContext.tsx) (20.6KB) |
| AuthContext.tsx (auth pura) | ✅ | [contexts/AuthContext.tsx](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AuthContext.tsx) (11.8KB) |
| AppLayout.tsx separado | ✅ | [components/layout/AppLayout.tsx](file:///c:/xampp/htdocs/prosperus-club-app/components/layout/AppLayout.tsx) |
| ProfileEdit.tsx decomposto | ❌ | **Ainda 1.078 linhas** — God component |

### 2.2 — Performance e Cache

| Item | Status | Evidência |
|------|:------:|-----------|
| React Query instalado | ✅ | [package.json](file:///c:/xampp/htdocs/prosperus-club-app/package.json): `@tanstack/react-query@^5.90.21` |
| QueryClient configurado | ✅ | [index.tsx](file:///c:/xampp/htdocs/prosperus-club-app/index.tsx): stale 5min, gc 10min, retry 2 |
| queryKeys.ts centralizado | ✅ | [utils/queryKeys.ts](file:///c:/xampp/htdocs/prosperus-club-app/utils/queryKeys.ts) (1.6KB) |
| useAcademyData hook | ✅ | [hooks/queries/useAcademyData.ts](file:///c:/xampp/htdocs/prosperus-club-app/hooks/queries/useAcademyData.ts) |
| useArticlesQuery hook | ✅ | [hooks/queries/useArticlesQuery.ts](file:///c:/xampp/htdocs/prosperus-club-app/hooks/queries/useArticlesQuery.ts) |
| useEventsQuery hook | ✅ | [hooks/queries/useEventsQuery.ts](file:///c:/xampp/htdocs/prosperus-club-app/hooks/queries/useEventsQuery.ts) |
| Member Book paginado | ✅ | `usePagination` + `IntersectionObserver` (preexistente) |
| select('*') eliminado | ⚠️ | 3 restantes (admin-only: [adminBusinessService.ts](file:///c:/xampp/htdocs/prosperus-club-app/services/adminBusinessService.ts)) |

### 2.3 — Segurança e RBAC

| Item | Status | Evidência |
|------|:------:|-----------|
| supabaseClient.ts deletado | ✅ | [services/supabaseClient.ts](file:///c:/xampp/htdocs/prosperus-club-app/services/supabaseClient.ts) não encontrado |
| auth-helpers-nextjs removido | ❌ | **Ainda em [package.json](file:///c:/xampp/htdocs/prosperus-club-app/package.json) L16** |
| Admin exclusion — Member Book | ✅ | RLS `members_see_only_members` |
| Admin exclusion — New Conversation | ✅ | `.eq('role', 'MEMBER')` L44 |
| Admin exclusion — Register Deal | ✅ | `.eq('role', 'MEMBER')` L90 |
| Admin exclusion — Create Referral | ✅ | `.eq('role', 'MEMBER')` L78 |
| Admin exclusion — Rankings SQL | ✅ | Migration 045: `WHERE p.role = 'MEMBER'` |
| RLS members_see_only_members | ✅ | Migration 042 + 043 (com `is_active`) |
| `is_active` em profiles | ✅ | Migration 043 |
| HubSpot HMAC-SHA256 | ✅ | [hubspot-webhook/index.ts](file:///c:/xampp/htdocs/prosperus-club-app/supabase/functions/hubspot-webhook/index.ts) L46-83 |
| SERVICE_ROLE no frontend | ✅ | Apenas em Edge Functions (server-side) |

### 2.4 — Qualidade de Código

| Item | Status | Evidência |
|------|:------:|-----------|
| Logger centralizado | ✅ | [utils/logger.ts](file:///c:/xampp/htdocs/prosperus-club-app/utils/logger.ts) (1.1KB) |
| supabaseClient.ts deletado | ✅ | Não encontrado |
| InstallPromptIOS.tsx deletado | ✅ | Não encontrado |
| `: any` em contexts | ⚠️ | 9 ocorrências em [AppContext.tsx](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AppContext.tsx) |
| `select('*')` restantes | ⚠️ | 3 em [adminBusinessService.ts](file:///c:/xampp/htdocs/prosperus-club-app/services/adminBusinessService.ts) |

### 2.5 — UX Features

| Item | Status | Evidência |
|------|:------:|-----------|
| PWA Install Prompt unificado | ✅ | [InstallPrompt.tsx](file:///c:/xampp/htdocs/prosperus-club-app/components/InstallPrompt.tsx) existe |
| platformDetect.ts | ✅ | [utils/platformDetect.ts](file:///c:/xampp/htdocs/prosperus-club-app/utils/platformDetect.ts) (1.6KB) |
| installInstructions.ts | ✅ | [utils/installInstructions.ts](file:///c:/xampp/htdocs/prosperus-club-app/utils/installInstructions.ts) (3.2KB) |
| App Tour + useAppTour | ✅ | [AppTour.tsx](file:///c:/xampp/htdocs/prosperus-club-app/components/AppTour.tsx) + [AppTourSteps.tsx](file:///c:/xampp/htdocs/prosperus-club-app/components/AppTourSteps.tsx) |

### 2.6 — Banco de Dados e Backend

| Item | Status | Evidência |
|------|:------:|-----------|
| Total de migrations | 45 | 001 a 045 |
| Edge Functions | 5 | check-email, login-socio, send-push, sync-hubspot, **hubspot-webhook** |
| hubspot-webhook (HubSpot→App) | ✅ | 281 linhas, HMAC, create/update/delete |
| sync-hubspot (App→HubSpot) | ✅ | Atualizado com campos Prosperus |
| profileService → HubSpot sync | ✅ | Fire-and-forget em [updateProfile()](file:///c:/xampp/htdocs/prosperus-club-app/services/profileService.ts#362-413) |
| Migration 043 (is_active) | ✅ | Executada com sucesso |
| Migration 044 (platform) | ✅ | Fix para 400 na Academy |
| Migration 045 (admin rankings) | ✅ | Admin excluído dos rankings |

---

## Seção 3 — Status dos 8 Problemas Críticos

| ID | Problema | Antes | Agora | Status |
|----|----------|-------|-------|:------:|
| **C1** | App.tsx God Component | 1.597 linhas | **185 linhas** | ✅ |
| **C2** | ProfileEdit God Component | 1.078 linhas | **1.078 linhas** | ❌ |
| **C3** | ProfileEdit duplicado no App.tsx | Renderização dupla | Removido | ✅ |
| **C4** | `select('*')` em services | ~12 ocorrências | **3** (admin-only) | ✅ |
| **C5** | Auth duplicada no App.tsx | Lógica duplicada | Em [AuthContext.tsx](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AuthContext.tsx) | ✅ |
| **C6** | `session: any` | Sem tipagem | **9 `: any` em contexts** | ⚠️ |
| **C7** | supabaseClient.ts duplicado | Existia | **Deletado** | ✅ |
| **C8** | auth-helpers-nextjs | No package.json | **Ainda no package.json** | ❌ |

> **Resumo: 5 ✅ totalmente resolvidos · 1 ⚠️ parcial · 2 ❌ pendentes**

### Detalhe C2 (ProfileEdit)
Ainda 1.078 linhas. É o maior componente do app. Decomposição recomendada:
- `ProfileFormFields.tsx` (campos do formulário)
- `ProfileSocialsEditor.tsx` (links sociais)
- `ProfileTagsEditor.tsx` (tags/setores)
- `useProfileForm.ts` (hook de estado)
- Esforço estimado: **4-6 horas**

### Detalhe C8 (auth-helpers-nextjs)
Ainda em [package.json](file:///c:/xampp/htdocs/prosperus-club-app/package.json) L16. Não é usado em nenhum import — é dead dependency. Remoção: `npm uninstall @supabase/auth-helpers-nextjs`.

---

## Seção 4 — Gaps e Pendências

### 4.1 — Problemas Técnicos Remanescentes

| # | Severidade | Descrição | Arquivo | Esforço |
|---|:----------:|-----------|---------|:-------:|
| 1 | 🔴 Alta | ProfileEdit 1.078 linhas | [ProfileEdit.tsx](file:///c:/xampp/htdocs/prosperus-club-app/components/ProfileEdit.tsx) | 4-6h |
| 2 | 🟡 Média | 9 `: any` em AppContext | [AppContext.tsx](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AppContext.tsx) | 1-2h |
| 3 | 🟡 Média | `auth-helpers-nextjs` dead dep | [package.json](file:///c:/xampp/htdocs/prosperus-club-app/package.json) | 5min |
| 4 | 🟢 Baixa | 3 `select('*')` em admin | [adminBusinessService.ts](file:///c:/xampp/htdocs/prosperus-club-app/services/adminBusinessService.ts) | 30min |
| 5 | 🟢 Baixa | `console.log` residuais | Vários services | 1-2h |

### 4.2 — Features do Roadmap

| Feature | Antes | Agora | Bloqueador |
|---------|:-----:|:-----:|------------|
| HubSpot bidirecional | 40% | **90%** | Deploy + config HubSpot Dashboard |
| React Query cache | 0% | **70%** | Mais hooks (notifications, gallery) |
| RSVP para eventos | 0% | 0% | Schema + UI |
| Check-in em eventos | 0% | 0% | Schema + QR |
| Imagens no chat | 0% | 0% | Storage + UI |
| Cobertura de testes | ~5% | ~5% | Priorização |
| 2FA | 0% | 0% | Supabase config |

### 4.3 — Novos Riscos

| Risco | Origem | Mitigação |
|-------|--------|-----------|
| `is_active = false` pode bloquear admin | Migration 043 + RLS | RLS usa `get_my_role()` — admins veem tudo ✅ |
| HubSpot webhook sem retry | `hubspot-webhook` | HubSpot re-envia automaticamente em falha |
| React Query sem ErrorBoundary | [index.tsx](file:///c:/xampp/htdocs/prosperus-club-app/index.tsx) | Adicionar `QueryErrorResetBoundary` |

---

## Seção 5 — Qualidade por Módulo

### 5.1 — Autenticação e Acesso
| Item | Status |
|------|:------:|
| Fluxo de login | ✅ |
| Controle de role | ✅ |
| HubSpot como guardião | ⚠️ (webhook criado, deploy pendente) |
| **Score: 8/10** | |

### 5.2 — Member Book + Match Engine
| Item | Status |
|------|:------:|
| Paginação server-side | ✅ |
| Busca + filtros | ✅ |
| Match engine | ✅ |
| Admin filtrado | ✅ |
| **Score: 9/10** | |

### 5.3 — PWA e Instalação
| Item | Status |
|------|:------:|
| Android Chrome | ✅ |
| iOS Safari | ✅ |
| iOS Chrome | ✅ |
| Desktop Chrome | ✅ |
| **Score: 9/10** | |

### 5.4 — Onboarding e Tour
| Item | Status |
|------|:------:|
| Wizard obrigatório (MEMBER) | ✅ |
| Admin bypassa wizard | ✅ |
| Tour pós-onboarding | ✅ |
| Tour replay | ✅ |
| **Score: 9/10** | |

### 5.5 — HubSpot Integration
| Item | Status |
|------|:------:|
| Webhook recebe eventos | ✅ (código pronto) |
| Cria sócio automaticamente | ✅ (código pronto) |
| Desativa sócio | ✅ (`is_active = false`) |
| App → HubSpot sync | ✅ (funcionando) |
| HMAC validation | ✅ |
| Deploy concluído | ⚠️ (pendente) |
| **Score: 8/10** | |

### 5.6 — Performance e Cache
| Item | Status |
|------|:------:|
| React Query configurado | ✅ |
| Academy cached (15min) | ✅ |
| News cached (10min) | ✅ |
| Member Book paginado | ✅ |
| `select('*')` eliminado | ⚠️ (3 restantes, admin) |
| **Score: 7/10** | |

---

## Seção 6 — Score Final + Resumo Executivo

### 6.1 — Métricas de Progresso

| Métrica | Baseline (24/02) | Hoje (26/02) | Δ |
|---------|:----------------:|:------------:|:-:|
| App.tsx linhas | 1.597 | **185** | **-88%** |
| Críticos resolvidos | 0/8 | **5/8** | +5 |
| Críticos parciais | 0/8 | **1/8** | +1 |
| `select('*')` | ~12 | **3** | -75% |
| Edge Functions | 4 | **5** | +1 |
| Migrations | ~42 | **45** | +3 |
| React Query hooks | 0 | **3** | +3 |
| Admin exclusion points | 1 (RLS) | **6** | +5 |

### 6.2 — Top 5 Ações Mais Importantes

| # | Ação | Impacto | Esforço | Justificativa |
|---|------|---------|---------|---------------|
| 1 | **Decompor ProfileEdit.tsx** | 🔴 Alto | 4-6h | Último God component (1.078 linhas) |
| 2 | **Deploy HubSpot webhook** | 🔴 Alto | 1h | Código pronto, falta deploy + config |
| 3 | **Remover `auth-helpers-nextjs`** | 🟡 Médio | 5min | Dead dependency, risco de confusão |
| 4 | **Tipar `session: any`** | 🟡 Médio | 1-2h | 9 `: any` em AppContext |
| 5 | **Mais React Query hooks** | 🟢 Baixo | 2-3h | Notifications, Gallery, Events |

### 6.3 — Resumo Executivo

**Em 3 sessões de trabalho (24-26/02/2026)**, o Prosperus Club App evoluiu de um score **5.6/10** para **7.2/10** (+28%).

**As maiores conquistas foram:**
- **Arquitetura:** O [App.tsx](file:///c:/xampp/htdocs/prosperus-club-app/App.tsx) caiu de 1.597 para 185 linhas (-88%), com separação limpa de responsabilidades entre [AuthContext](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AuthContext.tsx#11-22), [AppContext](file:///c:/xampp/htdocs/prosperus-club-app/contexts/AppContext.tsx#21-95), `AppLayout` e `ViewSwitcher`.
- **Segurança:** Admin/Team agora invisíveis em 6 pontos do app (Member Book, buscas, conversas, negócios, indicações, rankings). RLS reforçada com `is_active` para desativação via HubSpot.
- **Performance:** React Query implementado com cache de 5-15min. Academy e News mostram conteúdo instantâneo na navegação de volta. Member Book já tinha paginação.
- **HubSpot:** Integração bidirecional completa no código — webhook receptor com HMAC-SHA256, sync de campos Prosperus, e centralização no `profileService`.

**O principal risco atual** é o [ProfileEdit.tsx](file:///c:/xampp/htdocs/prosperus-club-app/components/ProfileEdit.tsx) com 1.078 linhas — é o último God component e o mais complexo de decompor por conter lógica de formulário, upload de imagem, editor de tags, e sync com HubSpot.

**Decisão mais importante das próximas 2 semanas:** priorizar a decomposição do ProfileEdit vs. avançar com features de produto (RSVP, chat com imagens). Recomendação: decompor primeiro — o ProfileEdit é editado frequentemente e um bug lá afeta todos os sócios.
