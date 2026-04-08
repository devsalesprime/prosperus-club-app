# 🐛 Issues e Pontos de Atenção

**Status Atual:** Zero bugs críticos conhecidos. TSC rodando com 0 erros.

## Watchlist (Monitoramento Pós-Deploy — Abril 2026):
1. **HubSpot Rate Limit (Deal Search):** `login-socio` e `check-email-exists` agora fazem 2 chamadas extras à API de deals para participantes vinculados. Monitorar se usuários com muitos deals associados causam lentidão ou erros 429.
2. **Propriedades de Participante no HubSpot:** As propriedades `e_mail___participante_vinculado__0X_` devem estar configuradas como pesquisáveis (`searchable`) na conta HubSpot para que o filtro `EQ` funcione. Verificar se a conta tem essa configuração.
3. **Bucket `category-icons` (Supabase Storage):** Garantir que o bucket está configurado como público para que os ícones das categorias Academy apareçam no frontend sem erros CORS.
4. **Push Subscriptions RLS:** Política 403 foi corrigida anteriormente. Verificar logs caso haja transição rápida de roles.
5. **Deploy workflow:** Preferir `supabase functions deploy NOME --project-ref ptvsctwwonvirdwprugv` direto do Windows para functions — mais confiável que ciclo VPS+git.
