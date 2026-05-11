# Edge Functions Audit — Prosperus Club

**Última atualização:** 2026-05-11 (ADR-015 retry/backoff + queue)
**Escopo atual:** 12 Edge Functions em `supabase/functions/` (11 deploy + `_shared` lib não-deployável)

## Status geral

| Function | Tipo | Caller(s) confirmados | Status |
|----------|------|----------------------|--------|
| `check-email-exists` | client-invoke | `components/auth/LoginModal.tsx` | ✅ Ativa |
| `send-push` | client + cron + DB trigger | `notificationService`, `businessService`, `adminBusinessService`, `send-birthday-pushes`, `roi-coleta-cron`, trigger SQL `051_push_on_new_message`, trigger `on_new_user_notification_push` | ✅ Ativa (caminho central) |
| `login-socio` | client-invoke | `components/auth/LoginModal.tsx` | ✅ Ativa |
| `sync-hubspot` | client-invoke | `hooks/useProfileForm.ts`, `services/profileService.ts` | ✅ Ativa — **ADR-015 (retry + queue)** |
| `update-hubspot-contact` | client + script externo | `hooks/useProfileForm.ts`, `scripts/migrations/sync_hubspot.mjs` | ✅ Ativa — **ADR-015 (retry + queue)** |
| `sync-hubspot-birthdays` | client-invoke | `services/adminBirthdayService.ts:136` | ✅ Ativa — **ADR-015 (retry + queue, payload `{}`)** |
| `hubspot-webhook` | webhook externo (HubSpot) | — (chamado externamente) | ✅ Ativa — **ADR-015 parcial: só loops wrappados, sem queue por design** |
| `hubspot-retry-failures` | cron pg_cron (a cada 6h) | `cron.job 'hubspot-retry-failures-6h'` via pg_net | ✅ Ativa — **NOVA em 2026-05-11 (ADR-015)** |
| `roi-coleta-cron` | cron | Schedule externo (Dashboard) | ✅ Ativa |
| `send-birthday-pushes` | cron | Schedule externo (Dashboard) | ✅ Ativa |
| `receive-report` | webhook externo (admin tool não-Prosperus) | — (POST externo) | ⚠️ Ativa com ~30% 404 — TODO investigar caller |
| `_shared/hubspot-client.ts` | biblioteca interna | `sync-hubspot`, `update-hubspot-contact`, `sync-hubspot-birthdays`, `hubspot-webhook` | ✅ Lib (não-deployável) |
| ~~`sync-hubspot-amounts`~~ | — | — | 🗑️ **REMOVIDA 2026-05-11** |
| ~~`sync-shadow-profiles`~~ | — | — | 🗑️ **REMOVIDA 2026-05-11** |

## ADR-015 — Rate limit handling (resumo operacional)

- **Wrapper:** `hubspotFetch()` em `_shared/hubspot-client.ts` faz retry exponencial (4 attempts, base 1s, factor 2, max 30s, jitter ±25%) e respeita `Retry-After` em 429.
- **Queue:** `withFailureQueue()` enfileira em `public.hubspot_failed_calls` quando o wrapper esgota. INSERT via service_role (lazy singleton no módulo).
- **Cron:** `hubspot-retry-failures` lê até 50 pending com idade ≥ 5min, re-invoca a função original via `supabase.functions.invoke()`, marca `reprocessed` em sucesso ou incrementa `reprocess_attempts` (até 4 → `failed_permanent`).
- **Schedule:** pg_cron job `hubspot-retry-failures-6h`, cron `0 */6 * * *`, migration `20260511_hubspot_retry_cron.sql`. NUNCA via Dashboard cron UI.
- **Webhook excluído por design:** `withFailureQueue` não aplicado em `hubspot-webhook` — re-invocação por cron não tem HMAC válido. HubSpot retém o retry no non-2xx, mas o webhook continua retornando 200 sempre.

## 🗑️ Functions removidas em 2026-05-11

### Razão da remoção

Validação operacional via Supabase Dashboard → Functions → Logs (últimos 30 dias):
- `sync-hubspot-amounts`: **ZERO invocações** em 30 dias
- `sync-shadow-profiles`: **ZERO invocações** em 30 dias

Sem caller TS confirmado (validado via grep em sessões 2026-05-08 e 2026-05-11), sem caller externo (Dashboard logs vazios). Ambas eram utilitários históricos (backfill ou sync pontual) que cumpriram seu propósito ou nunca foram integradas. Manter código zombie só polui o repositório e a superfície de ataque.

### Ações executadas no repositório

1. `rm -rf supabase/functions/sync-hubspot-amounts`
2. `rm -rf supabase/functions/sync-shadow-profiles`
3. Removidos blocos `[functions.sync-hubspot-amounts]` e `[functions.sync-shadow-profiles]` de `supabase/config.toml`
4. Removidas das listas em `.context/project.toml#edge_functions.no_verify`
5. Atualizada referência em `README.md`, `docs/INTEGRATIONS_SETUP.md`, `docs/PROSPERUS_10_10.md`, `docs/hubspot/SCHEMA_REFERENCE.md`

### ⏳ Pendente — operacional (precisa do Fábio no Dashboard)

```
Supabase Dashboard → Functions → Delete:
  a) sync-hubspot-amounts
  b) sync-shadow-profiles
```

O `rm` no repo + commit não remove a function do projeto Supabase em produção. Ela continua "deployada" até alguém clicar Delete no Dashboard ou rodar `supabase functions delete <name>` via CLI. Sem este passo, alguém poderia ainda invocá-la via URL pública.

## ⚠️ receive-report — 30% taxa de 404

Function ativa mas com taxa de 404 anormalmente alta (~30% dos requests retornam 404). Hipóteses:

- Caller externo (admin tool não-Prosperus) usa URL antiga com path errado
- Algum query parameter obrigatório ausente em 30% dos calls
- Browser cache servindo URL deprecada

**TODO operacional (não-dev):**
- [ ] Identificar quem é o caller externo (curl/Postman/admin tool externa)
- [ ] Validar com esse caller se a URL/payload está correto
- [ ] Se for legado: redirecionar/atualizar caller
- [ ] Se for ataque: documentar e mitigar com rate-limit ou IP allow-list

Não tocado nesta sessão — fora de escopo.

## Checklist de deprecação (para futuras removals)

Quando confirmar zero uso em 30 dias via Dashboard logs:

```bash
# 1. No repositório (PR review):
rm -rf supabase/functions/<nome-da-function>
# Atualizar:
#   - supabase/config.toml (entries [functions.<nome>])
#   - .context/project.toml ([edge_functions] no_verify e with_verify)
#   - README.md (lista de Edge Functions)
#   - docs/PROSPERUS_10_10.md, INTEGRATIONS_SETUP.md, SCHEMA_REFERENCE.md
#   - Este arquivo (mover linha pra "Functions removidas")

# 2. No Supabase Dashboard (manual):
#    Functions → função → Settings → Delete
#    (alternativa CLI: supabase functions delete <name> --project-ref <ref>)

# 3. Confirmar undeploy
#    curl https://<ref>.supabase.co/functions/v1/<name> → deve retornar 404
```

## Histórico

- **2026-05-08:** Auditoria inicial — 3 functions identificadas como "sem caller TS confirmado" (`receive-report`, `sync-hubspot-amounts`, `sync-shadow-profiles`)
- **2026-05-11:** Validação Dashboard 30 dias + remoção de 2 functions zeroed (`sync-hubspot-amounts`, `sync-shadow-profiles`). `receive-report` mantida (caller externo ativo) com TODO para investigar 30% 404.
