# docs/archive/

Documentos históricos arquivados — **nunca deletados**, só movidos para fora da raiz `docs/` para manter ela enxuta.

## Convenção

```
docs/archive/
├── 2026-Q1/   ← jan, fev, mar de 2026
├── 2026-Q2/   ← abr, mai, jun de 2026
├── 2026-Q3/   ← jul, ago, set de 2026 (criar quando necessário)
└── 2026-Q4/   ← out, nov, dez de 2026 (criar quando necessário)
```

## O que vai pra cá

- **Auditorias antigas** quando uma versão mais nova as supera (ex: `master_audit_v3_26_02_2026.md` quando existe `AUDITORIA_ABRIL_2026.md`)
- **Sessões de trabalho concluídas** (`SESSAO_*.md` com mais de ~3 meses)
- **Checklists de fases entregues** (`FASE_*.md`, `ETAPA_*.md`)
- **Planejamentos antigos** que viraram realidade ou foram superseded (`PLANEJAMENTO_*`, `PLANO_ACAO_*`)
- **Walkthroughs / capturas grandes** (>100KB) que perderam relevância imediata mas têm valor histórico

## O que NÃO vai pra cá

- Documentação canônica viva (DESIGN_SYSTEM.md, BRAND_MIGRATION_GUIDE.md)
- Auditorias mais recentes (mantém na raiz `docs/`)
- Status atual do projeto
- Termos legais (TERMOS_DE_USO.md, POLITICA_PRIVACIDADE.md)

## Como mover

```bash
# Determinar trimestre da data do documento (criação ou data citada no título)
git mv docs/SESSAO_29_JAN_2026.md docs/archive/2026-Q1/

# Se o pattern do gitignore atual whitelistar o arquivo (ex: SESSAO_*.md),
# o arquivo continuará sendo tracked após o move (porque docs/archive/ é
# whitelistada por padrão).

# Atualizar links em docs/ que apontavam para o arquivo movido (se houver)
```

## Histórico

- 2026-05-08: estrutura criada via `chore(cleanup) P2`. População inicial: 5 auditorias antigas + walkthrough.md.
