# Migrations History — Prosperus Club

**Última auditoria:** 2026-05-08
**Total atual:** 92 migrations em `supabase/migrations/`

Documento histórico das anomalias estruturais nas migrations SQL. Migrations já executadas em produção são **imutáveis** — este doc registra o passado, não propõe alterações.

## ⚠️ 11 pares duplicados de número

Mesmo prefixo numérico em 2 arquivos distintos. Em ambiente novo via `supabase db reset`, a ordem de execução depende do tiebreaker alfabético do nome — comportamento não garantido entre versões do CLI.

| # | Arquivo A | Arquivo B | Tipo de conflito |
|---|-----------|-----------|------------------|
| 008 | `008_fix_series_id_type.sql` | `008_video_admin_policies.sql` | schema change vs RLS |
| 025 | `025_nuclear_fix_rls.sql` | `025_push_subscriptions.sql` | nuclear fix vs nova feature |
| 026 | `026_banners_rls.sql` | `026_fix_profiles_rls.sql` | feature RLS vs fix RLS |
| 027 | `027_app_settings.sql` | `027_nuclear_fix_profiles_rls.sql` | nova tabela vs nuclear fix |
| 033 | `033_fix_notifications_insert.sql` | `033_prosperus_tools.sql` | fix policy vs nova feature |
| 050 | `050_rsvp_events.sql` | `050_terms_acceptance.sql` | feature vs alter column |
| 051 | `051_custom_interest.sql` | `051_push_on_new_message.sql` | alter column vs trigger |
| 060 | `060_daily_access_metrics.sql` | `060_registros_faturamento.sql` | RPC vs tabela |
| 061 | `061_roi_approved.sql` | `061_video_materials.sql` | view+col vs tabela |
| 062 | `062_notification_banners.sql` | `062_user_activity_detail.sql` | tabela vs RPC |
| 068 | `068_members_active_days_rpc.sql` | `068_universal_directory.sql` | RPC vs tabela |

**Quem venceu na produção:** ambos foram aplicados (idempotentes ou em ordem alfabética). Como o banco prod já está estável, nenhum dos pares precisa ser tocado.

**Risco residual:** novo dev rodando `supabase db reset` localmente pode obter ordem diferente do CLI futuro. Para mitigar: documentar comportamento real e adicionar CI check de colisão (P2 backlog).

## 🔥 2 migrations "nuclear fix"

Ambas desabilitam RLS, removem TODAS as policies, e recriam do zero. **Janela de race condition** durante a execução em que a tabela fica sem proteção.

### `025_nuclear_fix_rls.sql`
- **Alvo:** `conversation_participants`
- **Motivo histórico:** resolver erro 406 e recursão infinita em chat
- **Risco em prod:** durante migration não há RLS — qualquer query autenticada pode ler/escrever todos os registros. Em prática, o tempo de execução é < 1s, mas é uma janela.

### `027_nuclear_fix_profiles_rls.sql`
- **Alvo:** `profiles`
- **Motivo histórico:** segunda iteração de fix em profiles RLS (a primeira foi `026_fix_profiles_rls.sql`)
- **Risco em prod:** mesmo padrão.

## 🔁 Saga RLS de Chat (5+ iterações)

Cronologia completa de tentativas de resolver "infinite recursion" em `conversation_participants`:

```
024_fix_rls_recursion.sql              ← 1ª tentativa
  ↓
025_nuclear_fix_rls.sql                ← reset total da policy
  ↓
026_fix_profiles_rls.sql               ← (em paralelo, profiles)
  ↓
027_nuclear_fix_profiles_rls.sql       ← reset total profiles
  ↓
029_admin_chat_permissions.sql         ← bypass admin
  ↓
041_fix_conversation_participant_insert.sql  ← fix policy INSERT
  ↓
047_chat_rls_definitive.sql            ← 🎯 CONSOLIDAÇÃO ("definitive")
  ↓
052_fix_messages_update_rls.sql        ← fix UPDATE em messages
```

**Estado final em produção:** `047_chat_rls_definitive.sql` declara consolidar 8+ scripts iterativos. Funciona estável desde Mar/2026.

## 📐 Quebra de convenção (Mar/2026)

Migrations 001–080 usavam prefixo sequencial simples. A partir de 31/03/2026 mudou para timestamp ISO:

```
080_birthday_two_way_sync.sql              ← última com convenção sequencial
  ↓ ↓ ↓
20260331_add_benefit_rejection_reason.sql  ← primeira com timestamp
20260331_add_benefit_status.sql
20260331_add_reports_rls.sql
20260331_create_member_reports.sql
20260331_fix_admin_rls.sql
20260429_fix_rls_public_tables.sql         ← última do snapshot atual
```

**Motivação provável:** evitar colisões de número quando há múltiplas migrations no mesmo dia (problema dos 11 pares acima).

## 🎯 Convenção recomendada para futuras migrations

```
YYYYMMDD_HHMM_descricao_concisa.sql

Exemplos:
20260508_1430_add_lms_courses.sql
20260508_1445_lms_courses_rls.sql
20260509_0900_fix_birthday_trigger.sql
```

**Vantagens:**
- Data + hora explícita = ordenação alfabética = ordem cronológica real
- Múltiplas migrations no mesmo dia: minutos no nome resolvem colisão
- Compatível com Git history (não confunde merge)
- Fácil para code review identificar "quando isso foi escrito"

**Adoção:** aplicar a partir da próxima migration. Não renomear migrations já executadas (são imutáveis em produção).

## 🛡️ CI check sugerido (P2 backlog)

Script que falha o CI se detectar colisão de prefixo numérico no diretório `supabase/migrations/`:

```bash
#!/bin/bash
# scripts/check-migration-collisions.sh
DUPS=$(ls supabase/migrations/*.sql | sed 's|.*/||' | grep -oE '^[0-9]+_' | sort | uniq -c | awk '$1 > 1 {print $2}')
if [ -n "$DUPS" ]; then
  echo "❌ Migration collisions detected: $DUPS"
  exit 1
fi
echo "✅ Sem colisões de prefixo"
```

Adicionar no `.github/workflows/main.yml` antes do step `TypeScript check`.

## Referências

- `supabase/migrations/047_chat_rls_definitive.sql` — comentário de cabeçalho explica os 8+ scripts consolidados
- `.context/memory/issues.md` Issue-001 (mismatch bindings) e Issue-003 (Realtime + SECURITY DEFINER)
- `docs/rls.md` — documentação técnica de RLS
- `docs/relacionamentos.md` — modelo relacional do banco
