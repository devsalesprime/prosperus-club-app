# 🏛️ Architectural Decision Records (ADRs)

1. **ADR 001 - Separação de Camadas (SoC):** Isolar 100% das chamadas do Supabase na pasta `services/`. Motivo: Facilita testes, reutilização (ex: Paginação server-side) e limpa a UI.
2. **ADR 002 - Erradicação de Alertas Nativos:** Banidos `window.alert` e `window.confirm`. Motivo: Quebra de UX premium. Solução: `<AdminConfirmDialog>` e `react-hot-toast`.
3. **ADR 003 - Tailwind v4 + Tokens:** Fim do *hardcoding* de cores. Utilizar diretiva `@theme` injetando variáveis (`--color-prosperus-*`). Single Source of Truth no `docs/DESIGN_SYSTEM.md`.
4. **ADR 004 - Transformação de Imagem no Edge:** Uso da API do Supabase Storage para retornar imagens em formato `.webp` com redimensionamento exato no servidor (`48x48`, `40x40`), poupando banda e acelerando o LCP brutalmente.
5. **ADR 005 - Exportação CSV Nativa (BOM UTF-8):** Arquivos CSV gerados pelo frontend incluem manualmente o prefixo `\uFEFF` para garantir compatibilidade perfeita de caracteres pt-BR no Microsoft Excel.
6. **ADR 006 - Tratamento de Datas (HubSpot):** Extração de datas (ex: aniversários) do CRM via Edge Functions utilizando lógica UTC-safe para prevenir o bug de *day-shift* no fuso de Brasília.
