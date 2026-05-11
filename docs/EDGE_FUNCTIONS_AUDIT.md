# Edge Functions Audit — Prosperus Club

**Última atualização:** 2026-05-11
**Escopo atual:** 11 Edge Functions em `supabase/functions/` (era 13 antes de 2026-05-11)

## Status geral

| Function | Tipo | Caller(s) confirmados | Status |
|----------|------|----------------------|--------|
| `check-email-exists` | client-invoke | `components/auth/LoginModal.tsx` | ✅ Ativa |
| `send-push` | client + cron + DB trigger | `notificationService`, `businessService`, `adminBusinessService`, `send-birthday-pushes`, `roi-coleta-cron`, trigger SQL `051_push_on_new_message`, trigger `on_new_user_notification_push` | ✅ Ativa (caminho central) |
| `login-socio` | client-invoke | `components/auth/LoginModal.tsx` | ✅ Ativa |
| `sync-hubspot` | client-invoke | `hooks/useProfileForm.ts`, `services/profileService.ts` | ✅ Ativa |
| `update-hubspot-contact` | client + script externo | `hooks/useProfileForm.ts`, `scripts/migrations/sync_hubspot.mjs` | ✅ Ativa |
| `sync-hubspot-birthdays` | client-invoke | `services/adminBirthdayService.ts:136` | ✅ Ativa |
| `hubspot-webhook` | webhook externo (HubSpot) | — (chamado externamente) | ✅ Ativa |
| `roi-coleta-cron` | cron (config.toml `enabled=true`) | Schedule do Supabase | ✅ Ativa |
| `send-birthday-pushes` | cron (config.toml `enabled=true`) | Schedule do Supabase | ✅ Ativa |
| `receive-report` | webhook externo (admin tool não-Prosperus) | — (POST externo) | ⚠️ Ativa com ~30% 404 — TODO investigar caller |
| ~~`sync-hubspot-amounts`~~ | — | — | 🗑️ **REMOVIDA 2026-05-11** |
| ~~`sync-shadow-profiles`~~ | — | — | 🗑️ **REMOVIDA 2026-05-11** |

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
