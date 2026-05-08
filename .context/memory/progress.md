# .context/memory/progress.md — Status Atual
# Prosperus Club App · Abril 2026
# Atualizar após cada sprint

## Score: 10/10

| Módulo | Score | Entregue em |
|--------|-------|-------------|
| Smart Login + Auth | 10/10 | Fev/2026 |
| Onboarding (7 steps + calibração ROI) | 10/10 | Abr/2026 |
| Dashboard + Analytics | 10/10 | Mar/2026 |
| Member Book + Conexão Estratégica | 10/10 | Mar/2026 |
| Business Core + Rankings | 10/10 | Mar/2026 |
| Agenda + RSVP + QR Tickets | 10/10 | Abr/2026 |
| Chat Realtime (DOM events) | 10/10 | Mar/2026 |
| Academy + Materiais | 10/10 | Mar/2026 |
| Galeria | 10/10 | Mar/2026 |
| Prosperus Tools | 10/10 | Mar/2026 |
| Push iOS + Android + Desktop | 10/10 | Mar/2026 |
| Crescimento (ROI / Múltiplo) | 10/10 | Abr/2026 |
| Banners de Notificação | 10/10 | Abr/2026 |
| HubSpot Integration (omnichannel) | 10/10 | Abr/2026 |
| Universal Directory + Shadow Profiles | 10/10 | Abr/2026 |
| Aniversários (sync + push) | 10/10 | Abr/2026 |
| Admin Panel (13 módulos) | 10/10 | Mar/2026 |
| Banco + RLS + Realtime | 10/10 | Mar/2026 |

## Métricas do codebase (re-medido 2026-05-08)

```
Arquivos TS/TSX:     275
Migrations:          92 (001 → 080 + 20260331_* + 20260429_*)
Edge Functions:      13 (10 deploy + auxiliares)
Linhas de código:    ~60k
console.log prod:    0
:any remanescentes:  81  (era 183 — auditoria anterior estava 2× pessimista)
```

## Limpeza executada (Abr/2026)

Deletados com 0 importações confirmadas:
- services/exportService.ts
- hooks/useGlobalSubscription.ts
- hooks/useLongPress.ts
- hooks/useTypingIndicator.ts
- utils/profileUtils.ts
- utils/clearSupabaseCache.js

## Limpeza executada (2026-05-08 — sessão estruturada P0/P1/P2)

### P0 — Deleções imediatas (commit `chore(cleanup): P0`)
- 8 leftovers do root: `tsc_errors{,2,3}.txt`, `pdf_content.txt`, `inventory.csv`, `fix-overflow.cjs`, `test_db.mjs`, `test_rls.sql`
- 18 docs obsoletos em docs/: `FIX_*` (9), `CORRECAO_*` (3), `TROUBLESHOOTING_*` (2), `SOLUCAO_*` (1), `PUSH-NOTIFICATIONS-FIX.md`, `ERRO_EDGE_FUNCTION.md`, `GALLERY_COVER_IMAGE.md`
- 1 doc órfão: `supabase/functions/DENO_TYPESCRIPT_FIX.md`
- 2 audit docs movidos do root → docs/ (local-only): `auditoria_features_abril_2026.md`, `certificacao_academy_notificacoes.md`
- `.gitignore` reescrito: troca `docs/` por `docs/*` + whitelist seletiva de canônicos
- Baseline de docs canônicos versionados: `SESSAO_*`, `DESIGN_SYSTEM`, `BRAND_MIGRATION_GUIDE`, `INTEGRATIONS_SETUP`, `EDGE_FUNCTIONS_AUDIT`, `MIGRATIONS_HISTORY`, `archive/`, `hubspot/SCHEMA_REFERENCE`

### P1 — Reorganização (commit `chore(cleanup): P1`)
- `raw-imports.d.ts` deletado (zero usos confirmados via grep)
- `scripts/migrations/` (NOVO) ← `sync_hubspot.mjs`, `emails_to_sync.json` + README explicando "não rodar de novo"
- `infra/nginx/` (NOVO) ← `nginx-cache.conf`, `nginx-upload.conf`
- `scripts/utils/` (NOVO) ← `extract_docx.{js,py}`
- `public/templates/` (NOVO) ← `email-template-atualizacao.html`
- `public/assets/screenshots/` (NOVO) ← `deals_mobile_cards_*.png`
- Deletados (filesystem-only, eram em docs/ ainda gitignored): `presenca_evento_*.csv`, `Admin_Panel_Report_Prosperus.docx`, `migracao.zip`
- `docs/EDGE_FUNCTIONS_AUDIT.md` (NOVO) — 3 functions marcadas como "CONFIRMAR" (receive-report, sync-hubspot-amounts, sync-shadow-profiles) por não terem caller TS confirmado

### P2 — Scaffolding (commit `chore(cleanup): P2`)
- `docs/archive/2026-Q1/` e `2026-Q2/` (NOVO) com README de convenção
- 6 docs históricos arquivados em 2026-Q1: `auditoria_completa.md`, `master_audit_v3_26_02_2026.md`, `prosperus_club_app_audit_2026.md`, `AUDITORIA_SISTEMA_2026.md`, `week_close_audit_27_02_2026.md`, `walkthrough.md` (244KB)
- `docs/MIGRATIONS_HISTORY.md` (NOVO) — documenta 11 pares duplicados, 2 nuclear fixes, saga RLS de chat, quebra de convenção e proposta YYYYMMDD_HHMM para futuras

### Pendências externas (não-código)
- Validar logs no Supabase Dashboard das 3 Edge Functions suspeitas (ver `docs/EDGE_FUNCTIONS_AUDIT.md`)
- P2 futuro: rodar `npx ts-prune` ou `knip` para confirmar 0 órfãos no TS/TSX
- P2 futuro: adicionar CI check de colisão de prefixo de migration (script em `MIGRATIONS_HISTORY.md`)

## Pendentes (próxima sprint)

```
CRÍTICO:
□ Performance Lighthouse 29 → 75+ (PROMPT_PERFORMANCE_SPRINT.md pronto)

ALTA:
□ Photo Editor circular (PROMPT_PHOTO_EDITOR_PRO.md pronto)
□ Design System tokens em todo o app (PROMPT_DESIGN_SYSTEM_UPDATE.md pronto)
□ Fix carrossel Academy + sidebar vídeo (PROMPT_FIX_CAROUSEL_VIDEO_SCROLL.md)

MÉDIA:
✅ notifyNewSolution / notifyNewArticle / notifyEventUpdated — entregues e fire-and-forget
✅ notifyNewVideo / notifyNewGallery / notifyNewEvent — implementados (eram stubs)
□ 4 plugs de analytics
□ Remediação dos 81 :any (era 183 — re-medido 2026-05-08)

NEGÓCIO:
□ App Stores: Apple US$99/ano + Google US$25 (burocracia pendente)
□ D-U-N-S Number para conta empresa Apple
□ HubSpot: scope crm.objects.companies.write
```
