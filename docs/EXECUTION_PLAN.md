# Execution Plan — Prosperus Club App

**Última atualização:** 2026-05-08
**Status:** Trabalho visual (cores, fontes, photo editor) **PAUSADO** aguardando definição de novos layouts. Plano abaixo cobre apenas trabalho não-visual.

---

## Parte 1 — Refutação do backlog enviado

Recebi um plano consolidado vindo do Claude.ai online. A maior parte é boa. Onde discordo, refuto explicitamente abaixo.

### Estimativas otimistas demais

| Item enviado | Estimativa proposta | Estimativa real | Por quê |
|---|---|---|---|
| **Sentry setup** | 1h | **2-3h** | 1h é só o `npm install` + `init()`. Real precisa: source maps no build de produção, error boundaries em rotas críticas, breadcrumbs configurados, alerting rules, e — crítico — primeira semana de filtragem de ruído (browsers exóticos, extensões, auto-fill). Underestimar leva a abandono. |
| **Playwright + 5 fluxos críticos** | 1d | **3-4d** | Login com Supabase auth + RLS = 1 dia só de setup. Push subscribe exige HTTPS + browser permissions = mais 1 dia. RSVP/deal/faturamento dependem de seed de dados de teste. PWA + Service Worker têm gotchas próprias. 1 dia entrega smoke test, não cobertura real. |
| **Bundle size budget no CI** | 2h | **2h é OK** | Mas observação: sem baseline atual, primeiro run só mede. O budget real precisa de 2-3 builds para definir threshold sem causar falsos positivos. |
| **Acessibilidade audit AA** | 3-4h | **3-4h só audit** | As correções variam de 2h (pequenos ajustes de aria-label) a semanas (re-design de componentes com contraste insuficiente). Audit-only é útil para *saber*, não para *consertar*. |
| **Handover doc + ARCHITECTURE.md** | 2h | **4-6h** | 2h dá um README enxuto. Um ARCHITECTURE.md útil precisa: diagrama de request flow, modelo relacional simplificado, integration map (HubSpot/Supabase/Bunny), deployment topology, runbook de troubleshooting. |
| **Rate limiting Edge Functions** | (sem estimativa) | **dias a semanas** | Supabase não tem rate limiting nativo em Edge Functions. Soluções: Cloudflare em frente (infra nova), Redis bucket dentro da function (latência+código), ou plano Pro do Supabase (DDoS, não granular). Não é trabalho de algumas horas. |

### Discordâncias estratégicas

#### 1. **D-U-N-S no "ordem de emergência" do dev**
D-U-N-S Number é puramente burocrático (operações empresariais), zero linhas de código. Não devia estar no plano de execução do tech. **Mover para "Trilha paralela ops"**, com TODO para Fábio iniciar agora (são ~30 dias de espera).

#### 2. **`@types/react@18.3` alignment — não vale o risco**
O backlog lista isso como dívida. Discordo. Estado atual:
- `react@18.2.0` runtime
- `@types/react@19.2.13` no lockfile
- tsc local exit 0
- CI verde

**O "mismatch" ainda não causou nenhum bug.** Mexer envolve downgrade de tipos, possíveis quebras em hooks que dependem de assinaturas de React 19. Risco real, ganho hipotético. **Adiar até alinharmos com upgrade real do React (19.x), em outra sprint.**

#### 3. **Renomear `useUnreadMessageCount` → `useUnreadMessages`**
Listado como P2. Discordo de fazer.
- Hook usado em apenas 1 lugar (`UnreadCountContext`) por ADR-002
- Renomeação envolve update do consumer + memória persistente + docs
- Benefício: cosmético (nome ligeiramente mais idiomático)
- Risco: marginal mas real

**Adiar indefinidamente.** Só rebatizar se um dia precisar fragmentar a responsabilidade (ex: separar contagem de mensagens vs notifications), aí cabe na refatoração.

#### 4. **ESLint hex hardcoded — depende do estado anterior**
Listado em ordem #6. Faz sentido como prevenção. **MAS:** o objetivo dele é trancar o estado pós-migração de cores. Como a migração está pausada, instalar ESLint agora vai produzir centenas de errors/warnings em código existente, exigindo `eslint-disable` em massa ou ignore-list grande. Isso polui o setup.

**Reagendar ESLint hex para *depois* da migração de cores.** Quando a migração rodar, instalar ESLint na mesma sprint = trava entra logo após a limpeza.

### O que faltou no radar do backlog

#### A. **HubSpot rate limit handling em Edge Functions** — **CRÍTICO**
HubSpot OAuth: 100 req/10s. Private app (que vocês usam): 110 req/10s. As Edge Functions `sync-hubspot`, `update-hubspot-contact`, `sync-hubspot-amounts`, `sync-hubspot-birthdays` **não têm retry/backoff visível**. Sob carga (sync em massa), pacotes abortam silenciosamente com `429 Too Many Requests`. Precisa: middleware de retry com exponential backoff + jitter, ou rate limiter local que enfileira chamadas.
**Esforço real:** 3-4h por função afetada.

#### B. **Push subscription cleanup automatizado**
A tabela `push_subscriptions` acumula registros expirados (HTTP 410 do navegador). Issue-004 documentou um caso onde 17 subscriptions stale impediam delivery iOS. Não há cron de limpeza. Cada deploy/usuário novo cria mais. Em 12 meses isso vira problema operacional sério.
**Esforço:** Edge Function `cleanup-stale-push-subscriptions` + cron diário, ~2h.

#### C. **SW update UX**
`swVersionStamp` em `vite.config.ts` versiona o SW automaticamente, mas o usuário com aba aberta continua no SW antigo até reload. Push notifications podem chegar em SW velho que não sabe da rota nova. Falta: detectar `controllerchange` e mostrar toast "Atualização disponível, recarregar" ao invés de auto-reload silencioso.
**Esforço:** ~2h em `index.html` + componente Toast.

#### D. **Procedure de rotação de chaves**
Esta sessão expôs duas credenciais (PAT do GitHub, passphrase SSH). Não há doc de "se vazou X, faça Y". Cobrir: VAPID keys (push), HubSpot tokens, Supabase service role, SSH passphrase, GitHub PAT, Adobe Fonts kit secret.
**Esforço:** ~3h para `docs/SECURITY_INCIDENT_RESPONSE.md`.

#### E. **Database query audit (N+1, índices ausentes)**
Sem nenhuma análise visível de performance de queries. Suspeita: `MemberBook` carregando perfis + benefícios + ranking em cascade pode ter N+1. Indexes ausentes em colunas de filtro frequente (provavel candidato: `messages.conversation_id` se não tiver btree, `user_notifications.user_id+is_read` composto). Postgres `pg_stat_statements` revela em 1h.
**Esforço:** 1h auditoria + variável (1-8h fixes dependendo de achados).

#### F. **Onboarding analytics — drop-off por step**
Onboarding tem 7 steps. Sem instrumentação de qual step os usuários abandonam, otimizar é chute. Adicionar evento `onboarding_step_completed` por step → dashboard. Pode revelar que 40% abandona no step 4 (calibração ROI), o que é informação cara.
**Esforço:** ~2h instrumentação + ~1h dashboard.

#### G. **Supabase PITR confirmation**
"Sem backup plan documentado" = perda permanente de dados num evento crítico. Confirmar: o plano Supabase atual tem Point-in-Time Recovery? Qual janela? RPO/RTO real? Se tier free/pro sem PITR, **escalar agora** — custa US$25-100/mês mas é seguro mínimo.
**Esforço:** 30min de investigação + decisão financeira.

---

## Parte 2 — Plano final priorizado (sem trabalho visual)

### 🔴 Tier 1 — Esta/próxima semana (sem dependências externas)

| # | Item | Esforço | Status |
|---|---|---|---|
| 1 | **Validar 3 Edge Functions suspeitas no Dashboard** (receive-report, sync-hubspot-amounts, sync-shadow-profiles) | 30min | ✅ **Concluído 2026-05-11** — 2 removidas (commit `3eab0f7`); `receive-report` mantida com TODO 30% 404. Detalhes em [`SESSAO_11_MAI_2026_CLEANUP_SENTRY.md`](./SESSAO_11_MAI_2026_CLEANUP_SENTRY.md) |
| 2 | **NotificationsProvider** (P1 #1 da sessão anterior) | 3-4h | ✅ **Concluído 2026-05-11** — singleton + ADR-012 + REPLICA IDENTITY FULL. Detalhes em [`SESSAO_11_MAI_2026_PUSH_BADGE.md`](./SESSAO_11_MAI_2026_PUSH_BADGE.md) |
| 3 | **Confirmar Supabase PITR + RPO/RTO** | 30min | ⏳ **Pendente** — aguarda decisão financeira de upgrade do plano Supabase |
| 4 | **Sentry setup completo** (incluindo source maps + alerting + 1 semana de filtragem de ruído) | 2-3h ativo + 1 semana de monitoramento | ✅ **Concluído 2026-05-11** — ADR-014 ATIVO; commits `0bed419` + `fa1eb3f` + hotfix `234916d`. Smoke test em prod pendente do Fábio. Detalhes em [`SESSAO_11_MAI_2026_CLEANUP_SENTRY.md`](./SESSAO_11_MAI_2026_CLEANUP_SENTRY.md) |

**Tier 1: 3/4 concluídos.** Resta PITR aguardando upgrade financeiro.

### 🟠 Tier 2 — Próximas 2 semanas

| # | Item | Esforço | Notas |
|---|---|---|---|
| 5 | **Remediar `:any` em UnreadCountContext** (4 instâncias da Badging API) | 1h | Smoking gun de R6. Type guards corretos para `setAppBadge`/`clearAppBadge`. |
| 6 | **HubSpot rate limit handling** | 3-4h por função (priorizar `sync-hubspot` e `update-hubspot-contact`) | Bug latente sério. Falha silenciosa hoje. |
| 7 | **Remediar `:any` em services** | 2-3h | Próximo lote dos 81 (resta 77 após item 5). Services > hooks > components em ordem de impacto. |
| 8 | **ts-prune ou knip** | 30min run + 1-2h triagem dos achados | Confirma 0 órfãos com confiança >95%. Audit anterior usou Explore agent (boa heurística, não exaustiva). |
| 9 | **CI check de colisão de prefixo de migration** | 2h | Script já está em `MIGRATIONS_HISTORY.md`. Adicionar em `.github/workflows/main.yml`. |
| 10 | **Push subscription cleanup cron** | 2h | Edge Function `cleanup-stale-push-subscriptions` + agendamento. Resolve dívida acumulada. |
| 11 | **SW update UX (toast em vez de auto-reload)** | 2h | Pequeno, mas tira fricção de UX em deploys. |

**Tempo total: ~15-20h ao longo de 2 semanas.**

### 🟡 Tier 3 — Próximo mês

| # | Item | Esforço |
|---|---|---|
| 12 | **ARCHITECTURE.md** (com diagramas de request flow + modelo relacional + deployment topology) | 4-6h |
| 13 | **Procedure de rotação de chaves** (`docs/SECURITY_INCIDENT_RESPONSE.md`) | 3h |
| 14 | **Database query audit** + N+1/índices ausentes | 1h audit + 1-8h fixes |
| 15 | **Bundle size budget no CI** | 2h script + 2-3 builds para definir threshold |
| 16 | **Onboarding analytics — drop-off por step** | 3h |
| 17 | **Lighthouse re-medir** + plano de fixes | 1h medir + variável |
| 18 | **Playwright + 5 fluxos críticos** (login, push subscribe, criar deal, registrar faturamento, RSVP) | **3-4 dias**, não 1 |
| 19 | **Remediar `:any` restantes** (~60 ocorrências em components) | varia, ~1 sprint |
| 20 | **Acessibilidade audit AA** (audit only — fixes ficam para depois da migração de cores) | 3-4h audit |

### ⏸️ Bloqueado (aguarda definição de novos layouts)

- Migração de cores: sócio, eventos, chat, business, admin secundário
- `font-display` em headlines em `<div>`/`<span>`
- Photo Editor circular (crop+zoom+pan)
- ESLint rule contra hex hardcoded
- Acessibilidade — fixes (a partir do audit do tier 3)

### 🔵 Trilha paralela — Operações (zero dev, mas iniciar já)

| Item | Owner | Prazo |
|---|---|---|
| **D-U-N-S Number** registration | Operações | **30 dias de espera** — iniciar agora |
| **Apple Developer Program** US$99/ano | Operações | Após D-U-N-S |
| **Google Play Console** US$25 | Operações | Independente |
| **HubSpot scope** `crm.objects.companies.write` | DevOps | Solicitação ao admin |
| **Adobe Fonts kit** — confirmar domínios autorizados (Typekit avz7ism) | Tech | 5min em fonts.adobe.com |

### 🟢 Trilha de produto (independente do tech debt)

| Item | Notas |
|---|---|
| **LMS B2B Fase 1** | banco + Bunny.net + Admin Master. Sem roadmap visível no repo. Depende de decisão produto antes de começar. |

---

## Parte 3 — Status atual da execução

### ✅ Entregue nesta sessão (2026-05-08)

| Frente | Commits | Resultado |
|---|---|---|
| Auditoria do sistema | — | Score 7.4/10 → ~9/10. 4 ADRs IMUTÁVEIS reconciliadas. |
| Brand foundation (tokens, Adobe Garamond Pro via Typekit, ADR-007 reescrita) | 12d7a46 | Paleta brand oficial aplicada. |
| Refactor admin dashboard (R7 service extraction + brand) | 215763f | dashboardService.ts criado. AdminDashboardHome refatorado. |
| Migração brand de 13 componentes shared/base UI | e349251 | Button, Avatar, ModalHeader, 10 admin/shared. |
| Stability fixes (notify*, channel determinístico, sync docs) | 50d1c7a | P0 #1, #2, #4 fechados. |
| Cleanup P0 (root files + docs obsoletos + DENO_TYPESCRIPT_FIX) | 6d4f20f | -27 arquivos. .gitignore com whitelist seletivo. |
| Cleanup P1 (raw-imports, scripts/, infra/, public/, EDGE_FUNCTIONS_AUDIT) | 99c21ea | Reorganização estrutural. |
| Cleanup P2 (archive, MIGRATIONS_HISTORY, progress.md) | 07bda16 | Estrutura de archive. Histórico de migrations. |
| GitHub SSH setup | (não-commit) | PAT antigo precisa ser rotado pelo usuário. |
| Documentação canônica versionada | em vários commits | DESIGN_SYSTEM, BRAND_MIGRATION_GUIDE, INTEGRATIONS_SETUP, EDGE_FUNCTIONS_AUDIT, MIGRATIONS_HISTORY, SCHEMA_REFERENCE, SESSAO_*, archive/ |

### ⚠️ Pendências críticas pessoais (Fábio)

1. **Rotear PAT GitHub antigo** (`ghp_tFLQ...sP5`) em https://github.com/settings/tokens
2. **Definir nova passphrase SSH** (antiga `ProsperusTech1` foi exposta) — comando em `INTEGRATIONS_SETUP.md`
3. **Iniciar D-U-N-S Number** (30 dias de espera)
4. **Validar 3 Edge Functions no Supabase Dashboard** (logs últimos 30 dias) per `EDGE_FUNCTIONS_AUDIT.md`

---

## Parte 4 — Recomendação imediata para próxima sessão

**Atacar Tier 1 inteiro numa sessão dedicada.** Especificamente:

1. NotificationsProvider (3-4h) — refatoração arquitetural pura, sem visual
2. Sentry setup (2-3h) — observability gap é real

Justificativa: ambos são técnicos puros, fecham riscos arquiteturais (R4 estendido) e operacionais (cegueira em prod), e não competem com o trabalho visual em pause. Total ~6-7h, cabe numa sessão.

**Não recomendo:**
- Começar Playwright sem primeiro definir os fluxos críticos com produto
- Mexer em `@types/react` agora (ver refutação acima)
- Renomear `useUnreadMessageCount` (ver refutação acima)
- ESLint hex (faz sentido pós-migração de cores)

---

## Histórico de revisões

| Data | Revisor | Mudança |
|---|---|---|
| 2026-05-08 | Claude (Opus 4.7) | Documento criado. Refutação do backlog enviado pelo Claude.ai online. Plano priorizado sem trabalho visual. |
