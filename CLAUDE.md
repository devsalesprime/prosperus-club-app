# Prosperus Club App — Contexto do Projeto
## Atualizado: 09/04/2026
## Para: Antigravity / Claude / qualquer agente de código

---

## O que é este projeto

PWA em React + TypeScript + Supabase. Clube de networking de alto ticket.
11 telas principais + admin panel completo.
Publicado em: https://prosperusclub.com.br/app (ou URL real)

## Stack

```
Frontend:  React 18 + TypeScript + Vite + Tailwind (parcial)
Backend:   Supabase (PostgreSQL + Realtime + Storage + Edge Functions)
Push:      Web Push API + VAPID + Edge Function send-push
PWA:       Vite PWA Plugin + Workbox + Service Worker
```

## Design System — cores oficiais

```
bgPrimary:   #031A2B  → fundo base de todas as telas
bgBox:       #031726  → cards, inputs, header, modais
stroke:      #052B48  → bordas, separadores
gold:        #FFDA71  → CTA principal, item ativo nav
goldDark:    #CA9A43  → botões pequenos, ícones topo
textPrimary: #FCF7F0  → texto principal
textOff:     #95A4B4  → texto inativo, placeholders
inactive:    #152938  → botões não selecionados (fundo)
gradGold:    linear-gradient(135deg, #FFDA71, #CA9A43)  → CTAs grandes
gradBg:      linear-gradient(135deg, #042034, #04253E)  → Agenda/Tools/Galeria
```

## Arquitetura crítica — regras que NÃO devem ser quebradas

```
1. SINGLETON SUPABASE
   Um único createClient() em ./lib/supabase.ts
   Todos os outros arquivos importam: import { supabase } from '../lib/supabase'

2. REALTIME DE MENSAGENS — CANAL ÚNICO
   O hook useUnreadMessageCount.ts é o ÚNICO que cria channel para a tabela messages
   Instanciado APENAS dentro do UnreadCountProvider (contexts/UnreadCountContext.tsx)
   AppHeader e ChatIconWithBadge consomem via useUnreadCount() do contexto
   ChatWindow, ConversationList, AdminChatManager escutam via DOM events:
     window.addEventListener('prosperus:new-message', handler)
     window.addEventListener('prosperus:message-updated', handler)

3. PUSH NOTIFICATIONS
   PushAutoSubscriber usa sessionStorage (NÃO useRef) como guard de execução
   → React.StrictMode reseta useRef entre ciclos, causando AbortError
   sessionStorage persiste entre ciclos e resolve o problema

4. CHANNEL NAMES — NUNCA usar Math.random()
   Math.random() nos nomes de channel causa WebSocket mismatch no Supabase
   Usar sempre: `unread-msgs-${userId}` (fixo e determinístico)

5. NOTIFICAÇÕES — PADRÃO ÚNICO
   Todas as funções notify* ficam em ./services/notificationTriggers.ts
   Padrão: buscar sócios → insert user_notifications → send-push → batch 20
   Sempre fire-and-forget: nunca propagar erro de notificação para o caller
```

## Banco de dados — estado

```
messages: REPLICA IDENTITY FULL ✅ · RLS sem SECURITY DEFINER ✅
Realtime: messages, user_notifications, conversation_participants, conversations
Migrations: 058 (member_files), 059 (video_materials)
push_subscriptions: 1 ativa por usuário por plataforma
```

## Prompts disponíveis em /mnt/user-data/outputs/

```
PRONTOS PARA APLICAR:
PROMPT_PHOTO_EDITOR_PRO.md          ← photo editor circular profissional
PROMPT_DESIGN_SYSTEM_UPDATE.md      ← padronizar todas as cores
PROMPT_FIX_ACADEMY_CAROUSEL.md      ← setas no carrossel desktop
PROMPT_FIX_REPORTS_LAYOUT.md        ← overflow horizontal relatórios
PROMPT_NOTIFY_NEW_SOLUTION.md       ← push ao adicionar nova solução
PROMPT_IMPL_NOTIFICATION_GAPS.md    ← notifyNewArticle + notifyEventUpdated
PROMPT_IMPL_ANALYTICS_TRACKING.md   ← 4 plugs de analytics
PROMPT_PERFORMANCE_OPTIMIZATION.md  ← Lighthouse 29 → 80+

AUDITORIA:
PROMPT_AUDITORIA_MESTRE_2026.md     ← auditoria completa 7 fases

REFERÊNCIA (já aplicados):
PROMPT_FIX_REALTIME_MISMATCH.md
PROMPT_FIX_UNREAD_SINGLETON.md
PROMPT_FIX_WEBSOCKET_DOM_EVENTS.md
PROMPT_FIX_PUSH_STRICTMODE.md
PROMPT_FIX_PUSH_IOS.md
```

## Pendentes por prioridade

```
CRÍTICO:
- Performance Lighthouse 29 → 80+ (code splitting)

ALTA:
- Design tokens padronizados (10 cores + 2 gradientes)
- Photo editor profissional (crop circular)
- Fix carrossel Academy desktop

MÉDIA:
- Notificação nova Solução
- "Matches Forte" → "Conexão Estratégica" no código
- notifyNewArticle + notifyEventUpdated
- 4 plugs de analytics

BAIXA:
- Sistema de ingressos QR code
- Publicação App Stores (burocracia pronta, assets pendentes)
- Export CSV/PDF AnalyticsDashboard
```

## Histórico resumido

```
Fev 2026: Smart Login, Member Book, Business Core, Agenda, Chat
Mar 2026: Academy, Galeria, Tools, Push, Realtime, Admin completo
Abr 2026: fixes UX, design system, performance plan, photo editor
89+ prompts gerados, todas as funcionalidades core implementadas
```
