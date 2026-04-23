# .context/memory/issues.md — Bugs Conhecidos e Workarounds
# Prosperus Club App · Abril 2026

## RESOLVIDOS

### Issue-001 · WebSocket mismatch
**Sintoma:** `mismatch between server and client bindings for postgres changes`
**Causa:** Múltiplos channels para `messages` com configurações diferentes.
**Solução:** Canal único em `useUnreadMessageCount.ts`, DOM events nos componentes.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-002 · AbortError no PushAutoSubscriber
**Sintoma:** `AbortError: signal is aborted without reason`
**Causa:** `useRef` resetado pelo React.StrictMode → dois upserts simultâneos no banco.
**Solução:** `sessionStorage` como guard de execução única.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-003 · Realtime não entregava eventos
**Sintoma:** Contador de mensagens só atualizava após refresh manual.
**Causa:** RLS com `SECURITY DEFINER` → `auth.uid()` retornava null no contexto Realtime.
**Solução:** Remover SECURITY DEFINER, usar subquery direta na policy SELECT.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-004 · Push iOS não chegava
**Sintoma:** Notificações push não apareciam no iPhone mesmo com permissão.
**Causa:** 17 subscriptions expiradas acumuladas + AbortError impedindo renovação.
**Solução:** Limpeza de subscriptions (HTTP 410) + fix AbortError.
**Status:** ✅ RESOLVIDO Mar/2026

### Issue-005 · HubSpot INVALID_OPTION
**Sintoma:** Sync do perfil falhava silenciosamente no HubSpot.
**Causa:** Texto livre enviado para propriedades dropdown (cargo_na_empresa_2_).
**Solução:** Arrays ALLOWED_JOBS + formatHubspotOption() de normalização.
**Status:** ✅ RESOLVIDO Abr/2026

### Issue-006 · HubSpot Company scope
**Sintoma:** Website e nome_fantasia não sincronizavam.
**Causa:** Propriedades de Empresa enviadas para objeto Contato.
**Solução:** Separar em dois calls — Contato + Empresa (crm.objects.companies.write).
**Status:** ✅ RESOLVIDO Abr/2026

## ATIVOS (backlog)

### Issue-007 · Performance Lighthouse 29
**Sintoma:** FCP 7.7s · TBT 3.170ms · Performance 29
**Causa:** Bundle único sem code splitting.
**Workaround:** Nenhum — app funciona mas lento em 4G.
**Solução planejada:** PROMPT_PERFORMANCE_SPRINT.md (React.lazy + manualChunks + resource hints)
**Status:** ⏳ PENDENTE

### Issue-008 · 183 instâncias :any
**Sintoma:** TypeScript fraco em 183 pontos do codebase.
**Causa:** Histórico de desenvolvimento rápido.
**Workaround:** App funciona, mas tipos não protegem esses pontos.
**Solução planejada:** Sprint de tipagem — remediação incremental.
**Status:** ⏳ BACKLOG

### Issue-009 · Carrossel Academy desktop
**Sintoma:** Setas aparecem mas cards não scrollam.
**Causa:** `trackRef` pode estar no elemento errado ou container pai com overflow:hidden.
**Workaround:** Scroll manual na tela.
**Solução planejada:** PROMPT_FIX_CAROUSEL_VIDEO_SCROLL.md
**Status:** ⏳ PENDENTE
