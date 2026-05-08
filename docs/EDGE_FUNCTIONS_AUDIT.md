# Edge Functions Audit — Prosperus Club

**Data:** 2026-05-08
**Escopo:** 12 Edge Functions em `supabase/functions/`

## Status geral

| Function | Tipo | Caller(s) confirmados no código | Status |
|----------|------|--------------------------------|--------|
| `check-email-exists` | client-invoke | `components/auth/LoginModal.tsx` | ✅ Ativa |
| `send-push` | client + cron + DB trigger | `notificationService`, `businessService`, `adminBusinessService`, `send-birthday-pushes`, `roi-coleta-cron`, trigger SQL `051_push_on_new_message` | ✅ Ativa (caminho central) |
| `login-socio` | client-invoke | `components/auth/LoginModal.tsx` | ✅ Ativa |
| `sync-hubspot` | client-invoke | `hooks/useProfileForm.ts`, `services/profileService.ts` | ✅ Ativa |
| `update-hubspot-contact` | client + script externo | `hooks/useProfileForm.ts`, `scripts/migrations/sync_hubspot.mjs` | ✅ Ativa |
| `sync-hubspot-birthdays` | client-invoke | `services/adminBirthdayService.ts:136` | ✅ Ativa |
| `hubspot-webhook` | webhook externo (HubSpot) | — (chamado externamente) | ✅ Ativa |
| `roi-coleta-cron` | cron (config.toml `enabled=true`) | Schedule do Supabase | ✅ Ativa |
| `send-birthday-pushes` | cron (config.toml `enabled=true`) | Schedule do Supabase | ✅ Ativa |
| **`receive-report`** | client-invoke? | ❌ **Zero callers no código TS** (só docs) | ⚠️ **CONFIRMAR** |
| **`sync-hubspot-amounts`** | webhook? cron? | ❌ **Zero callers no código TS** (config.toml registra) | ⚠️ **CONFIRMAR** |
| **`sync-shadow-profiles`** | utilitário backfill | ❌ **Zero callers no código TS** (config.toml registra) | ⚠️ **CONFIRMAR** |

## ⚠️ Não deletar antes de validar

As 3 functions marcadas como "CONFIRMAR" não têm caller direto no código TS, mas isso **não significa que estão obsoletas**. Possíveis cenários:
- Disparadas por **cron schedule no Supabase Dashboard** (não visível no código)
- Disparadas por **webhook externo** apontando para a URL pública
- Disparadas **manualmente** por admin (curl/Postman)

## TODO — Validar com logs do Supabase Dashboard

Antes de qualquer ação de deprecação, conferir nos últimos 30 dias em:

```
https://supabase.com/dashboard/project/ptvsctwwonvirdwprugv/functions
```

Para cada function suspeita, abrir → Logs → filtrar últimos 30 dias:

### `receive-report`
- [ ] Verificar invocações nos últimos 30 dias
- [ ] Se zero: depreciar (undeploy + remover pasta + atualizar README e docs)
- [ ] Se > zero: rastrear o caller real (provavelmente é uma admin tool externa que faz POST direto pra `/functions/v1/receive-report`)

### `sync-hubspot-amounts`
- [ ] Verificar invocações nos últimos 30 dias
- [ ] Confirmar se é disparada pelo `hubspot-webhook` internamente
- [ ] Confirmar se está agendada via cron no Dashboard

### `sync-shadow-profiles`
- [ ] Verificar invocações nos últimos 30 dias
- [ ] Confirmar se ainda é necessária (era backfill — pode ter cumprido propósito)
- [ ] Se obsoleta: depreciar com cuidado (verifique se algum sistema externo invoca)

## Como executar a validação

Sem MCP do Supabase configurado, o caminho atual é manual:

```sql
-- Caso o admin queira ver invocações via SQL no Dashboard SQL Editor:
-- (não funciona — logs de Edge Functions ficam no edge_logs do projeto, não exposto via SQL nativo)
```

**Caminho oficial:** Dashboard → Edge Functions → `<function_name>` → aba **Logs** → range "Last 30 days".

Se a aba Logs estiver vazia ou só mostrar invocações de teste manual antigas, a function é candidata a deprecação.

## Checklist de deprecação (quando confirmar zero uso)

```bash
# No Supabase Dashboard:
# 1. Functions → função → Settings → Disable / Pause
# 2. Aguardar 7 dias para confirmar que ninguém reclamou
# 3. Functions → função → Delete

# No repositório (este projeto):
git rm -r supabase/functions/<nome-da-function>
# Atualizar:
#   - README.md (lista de Edge Functions)
#   - .context/project.toml ([edge_functions] no_verify e with_verify)
#   - docs/PROSPERUS_10_10.md (se aplicável)
#   - supabase/config.toml (entries [functions.<nome>])
```

## Histórico

- 2026-05-08: auditoria inicial — 3 functions identificadas como "sem caller TS confirmado"
