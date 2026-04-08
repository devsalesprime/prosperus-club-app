# 📈 Estado Atual do Projeto

**Data de Atualização:** Abril 2026
**Versão Atual:** 3.3.0 (Academy Visual Wayfinding + Multi-Participant HubSpot)
**Status Geral:** Plataforma em produção ativa. Sustentação contínua + evolução incremental.

## Últimos Marcos Atingidos (Concluídos):
- **Academy — Visual Wayfinding (Ícones de Categoria):** Migration `079_add_category_icon.sql` adicionou `icon_url` à tabela `video_categories` e criou bucket `category-icons`. Admin pode fazer upload PNG/SVG/WebP por categoria. Frontend exibe ícone com filtro CSS `#CA9A43` ao lado do título do swimlane.
- **HubSpot — Multi-Sócios por Contrato:** `login-socio` e `check-email-exists` agora suportam 5 propriedades de email de participante vinculado no deal (`e_mail___participante_vinculado__01_`, `c_e_mail`, `02_`, `03_`, `04_`). Fallback via busca de deals por propriedade usando `filterGroups` OR.
- **Acesso por `situacao_do_negocio`:** Removida dependência de `dealstage=closedwon` e `comprovante_de_pagamento_arq`. Critério único: `situacao_do_negocio` ∈ {Ativo, Solicitação de cancelamento}. Normalização via NFD (remove acentos e case).
- **Deploy Workflow:** Descoberto que Supabase CLI no Windows pode deployar functions diretamente (`supabase functions deploy NOME --project-ref ptvsctwwonvirdwprugv`), sem dependência do ciclo git VPS.
- **Otimização de Performance (WPO):** Code Splitting, Extração de Vendors, WebP Transformation via Edge Supabase, Anti-FOUC.
- **Arquitetura & Desacoplamento:** Lógica de banco 100% em `/services`. Componentes monolíticos fatiados.
- **Produtividade Admin:** Paginação Server-side, Ações em Massa, Busca Global, Exportação CSV Universal (UTF-8 BOM).
- **Compliance & Resiliência:** Logs de Auditoria (`admin_audit_log`), Error Boundaries globais, RLS revisado.
