# scripts/migrations/

Scripts de migração one-shot — **JÁ EXECUTADOS, não rodar novamente** sem confirmar com o time.

Cada script tem propósito específico de fazer um backfill ou sync único contra um sistema externo (HubSpot, Supabase, etc.). Idempotência **não está garantida** — re-executar pode criar duplicatas, sobrescrever dados ou gerar inconsistências.

## Inventário

### `sync_hubspot.mjs` + `emails_to_sync.json`

- **O que faz:** lê emails de `emails_to_sync.json` e dispara para a Edge Function `update-hubspot-contact` para cada um (sync de aniversários e dados básicos).
- **Quando rodou:** sessão de sync de aniversários (referenciado em `progress.md` como entrega de Abr/2026).
- **Não rodar novamente:** os contatos já estão sincronizados. Se precisar atualizar contatos específicos, use a UI admin ou invoque a Edge Function `update-hubspot-contact` com o payload pontual.

## Convenção para futuros scripts one-shot

1. Adicionar pasta com data e descrição: `scripts/migrations/YYYY-MM-DD-descricao/`
2. Incluir `README.md` explicando o que faz, quando rodou, e por que não pode rodar de novo
3. Após execução bem-sucedida, atualizar `.context/memory/progress.md` referenciando a migration
4. Manter o script versionado mesmo após executado (auditoria histórica)
