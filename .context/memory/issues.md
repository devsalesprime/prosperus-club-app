# 🐛 Issues e Pontos de Atenção

**Status Atual:** Zero bugs críticos conhecidos. TSC rodando com 0 erros (`tsc --noEmit`).

## Watchlist (Monitoramento Pós-Deploy):
1. **HubSpot Webhook Limits:** Monitorar o volume de chamadas da API do HubSpot para garantir que as Edge Functions não atinjam limites de rate-limit do CRM durante picos de acesso.
2. **Push Subscriptions RLS:** A política 403 foi corrigida. Verificar logs de permissão caso haja transição rápida de roles de usuários.
3. **Supabase Storage (CORS/Public):** Garantir sempre que novos buckets criados (como o `birthday-cards`) permaneçam configurados como Públicos para evitar quebra de imagens no frontend e problemas de CORS.
