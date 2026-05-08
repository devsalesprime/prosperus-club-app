# .context/memory/decisions.md — ADRs (Architectural Decision Records)
# Prosperus Club App · Abril 2026
# Consultar antes de tomar decisões arquiteturais

## ADR-001 · Singleton Supabase
**Decisão:** Um único `createClient()` em `lib/supabase.ts`.
**Contexto:** Múltiplos `createClient()` causavam AbortError no PushAutoSubscriber.
**Consequência:** Todos os arquivos importam `{ supabase }` de `../lib/supabase`.
**Status:** IMUTÁVEL

## ADR-002 · Canal único Realtime para messages
**Decisão:** `useUnreadMessageCount.ts` é o único canal. Componentes usam DOM events.
**Contexto:** Múltiplos channels causavam `mismatch between server and client bindings`.
**Consequência:** ChatWindow, ConversationList, AdminChatManager escutam `window.addEventListener('prosperus:new-message')`.
**Status:** IMUTÁVEL

## ADR-003 · sessionStorage no PushAutoSubscriber
**Decisão:** `sessionStorage` (não `useRef`) como guard de execução única.
**Contexto:** React.StrictMode monta/desmonta/remonta → `useRef` reseta → AbortError → subscription não salva.
**Consequência:** `const sessionKey = \`push-subscribing-\${userId}\``
**Status:** IMUTÁVEL

## ADR-004 · Nomes de channel fixos
**Decisão:** Channel names sempre determinísticos, sem `Math.random()`.
**Contexto:** `Math.random()` causava `mismatch between server and client bindings`.
**Consequência:** Padrão: `` `unread-msgs-${userId}` ``
**Status:** IMUTÁVEL

## ADR-005 · messages sem SECURITY DEFINER
**Decisão:** RLS de `messages` usa subquery direta, sem `SECURITY DEFINER`.
**Contexto:** `SECURITY DEFINER` faz `auth.uid()` retornar null no contexto Realtime → eventos bloqueados.
**Consequência:** SELECT policy usa `conversation_id IN (SELECT ... WHERE user_id = auth.uid())`.
**Status:** IMUTÁVEL

## ADR-006 · messages REPLICA IDENTITY FULL
**Decisão:** `ALTER TABLE messages REPLICA IDENTITY FULL`.
**Contexto:** Filtros no Realtime (ex: `filter: conversation_id=eq.X`) exigem FULL para funcionar.
**Consequência:** Todos os campos são enviados no payload do evento Realtime.
**Status:** IMUTÁVEL

## ADR-007 · Tailwind v4 + @theme como camada de estilo oficial
**Decisão:** Tailwind v4 (via `@tailwindcss/vite`) é a camada de estilo oficial. Os design tokens vivem em `index.css` no bloco `@theme` (equivalente v4 do antigo `tailwind.config.ts`). `utils/designTokens.ts` permanece como fonte para casos não-Tailwind (gradientes inline, manifest PWA, valores CSS-puros). As duas fontes devem manter os mesmos valores.
**Contexto:** ADR-007 original previa "inline styles + designTokens (sem Tailwind)" porque o setup PostCSS+JIT v3 era frágil. Tailwind v4 resolveu isso (plugin Vite + `@theme` em CSS) e o codebase migrou de fato — 2.765+ usos de `className=` em 100+ arquivos, 246 usos de `prosperus-*` tokens. Manter o ADR antigo deixava a documentação contradizendo o código.
**Consequência:**
- Componentes podem usar classes Tailwind. Quando referenciarem cores do clube, devem usar tokens `prosperus-*` definidos em `@theme`, nunca hex hardcoded nem cores default do Tailwind (`bg-emerald-400` etc.).
- `utils/designTokens.ts` é mantido sincronizado com os valores do `@theme`.
- ESLint deve ser configurado para bloquear hex literal em `className` (próxima sprint).
**Status:** ATIVO (substituído em 2026-05-08 — versão original arquivada abaixo)

### ADR-007 (versão original, arquivada)
> Decisão: Inline styles com tokens centralizados em `utils/designTokens.ts`. Sem Tailwind.
> Motivo da revogação: a justificativa técnica (compilador Tailwind indisponível) deixou de existir com Tailwind v4. O codebase nunca seguiu a regra na prática.

## ADR-008 · HubSpot dropdowns (ALLOWED values)
**Decisão:** Sempre validar valores antes de enviar para propriedades dropdown do HubSpot.
**Contexto:** HubSpot aborta o pacote inteiro com `INVALID_OPTION` se um valor não estiver no enum.
**Consequência:** Arrays `ALLOWED_JOBS`, `ALLOWED_HUBSPOT_OPTIONS` — traduzir antes de enviar.
**Status:** ATIVO

## ADR-009 · Shadow Profiles (hubspot_directory)
**Decisão:** Sócios que não fizeram onboarding existem como Shadow Profiles em `hubspot_directory`.
**Contexto:** SmartMemberSelect precisa incluir todos os contatos do HubSpot, não só os com conta ativa.
**Consequência:** `profiles + hubspot_directory = Universal Directory`.
**Status:** ATIVO

## ADR-010 · --no-verify-jwt nas Edge Functions externas
**Decisão:** Edge Functions acionadas por webhooks externos usam `--no-verify-jwt`.
**Contexto:** HubSpot não consegue enviar JWT do Supabase. Segurança garantida por HMAC.
**Consequência:** hubspot-webhook usa HMAC V3 + fallback V1 para ambiente de testes.
**Status:** ATIVO

## ADR-011 · fire-and-forget em notify*
**Decisão:** Funções `notify*` nunca propagam erro para o caller.
**Contexto:** Falha de notificação nunca deve interromper o fluxo principal (salvar deal, criar evento etc.).
**Consequência:** `try { ... } catch(e) { console.error(e) }` — sem `throw`.
**Status:** IMUTÁVEL
