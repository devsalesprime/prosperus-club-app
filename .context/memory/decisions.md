# 🏛️ Architectural Decision Records (ADRs)

1. **ADR 001 - Separação de Camadas (SoC):** Isolar 100% das chamadas do Supabase na pasta `services/`. Motivo: Facilita testes, reutilização e limpa a UI.
2. **ADR 002 - Erradicação de Alertas Nativos:** Banidos `window.alert` e `window.confirm`. Solução: `<AdminConfirmDialog>` e `react-hot-toast`.
3. **ADR 003 - Tailwind v4 + Tokens:** Diretiva `@theme` com variáveis `--color-prosperus-*`. Single Source of Truth em `docs/DESIGN_SYSTEM.md`.
4. **ADR 004 - Transformação de Imagem no Edge:** Supabase Storage retorna `.webp` com redimensionamento no servidor (`48x48`, `40x40`).
5. **ADR 005 - Exportação CSV Nativa (BOM UTF-8):** Prefixo `\uFEFF` nos CSVs para compatibilidade pt-BR no Excel.
6. **ADR 006 - Tratamento de Datas (HubSpot):** Extração UTC-safe de datas do CRM para prevenir day-shift no fuso de Brasília.
7. **ADR 007 - Acesso por `situacao_do_negocio` (HubSpot):** Toda validação de acesso usa SOMENTE `situacao_do_negocio`. Valores ativos: `['ativo', 'solicitacao de cancelamento']` (normalizado via NFD). Removida dependência de `dealstage` e `comprovante_de_pagamento_arq` — que são campos do sócio principal e não dos participantes vinculados.
8. **ADR 008 - Ícones de Categoria (Academy):** Ícones armazenados no bucket `category-icons`. Cor padronizada por CSS filter `brightness(0) saturate(100%) invert(67%) sepia(45%) saturate(700%) hue-rotate(3deg)` em vez de forçar SVG colorido — funciona com PNG, SVG e WebP.
9. **ADR 009 - Deploy de Functions do Windows:** Para funções Supabase Edge, o deploy direto do Windows (`supabase functions deploy NOME --project-ref ID`) é preferível ao ciclo VPS git-pull, pois a pasta `supabase/functions/` não é sempre sincronizada via git em todos os ambientes.
