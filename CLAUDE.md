# Prosperus Club App — Guia do Agente
## Versão: Abril 2026
## Lido no início de toda sessão de desenvolvimento

---

## Identidade do Projeto

PWA em React 18 + TypeScript + Supabase.
Clube de networking high-ticket — 11 telas + admin panel.
Deployado em: prosperusclub.com.br/app
Banco: ptvsctwwonvirdwprugv.supabase.co

---

## Stack técnica

| Camada | Tecnologia | Arquivo-chave |
|--------|-----------|---------------|
| Frontend | React 18 + TypeScript + Vite | vite.config.ts |
| Estilo | Inline styles + Design Tokens | utils/designTokens.ts |
| Estado | React Context + React Query | contexts/ + hooks/queries/ |
| Backend | Supabase (PostgreSQL) | lib/supabase.ts |
| Realtime | Supabase Realtime + DOM Events | hooks/useUnreadMessageCount.ts |
| Push | Web Push + VAPID + Edge Fn | supabase/functions/send-push/ |
| PWA | Vite PWA Plugin + Workbox | public/sw.js |

---

## Design System — tokens oficiais

```typescript
// Sempre importar de utils/designTokens.ts — nunca hardcodar cores
export const TOKENS = {
  bgPrimary:   '#031A2B',   // fundo base de todas as telas
  bgBox:       '#031726',   // cards, inputs, header, modais, menu
  stroke:      '#052B48',   // bordas e separadores
  gold:        '#FFDA71',   // CTA principal, item ativo, headlines
  goldDark:    '#CA9A43',   // botões pequenos, ícones topo, badges
  textPrimary: '#FCF7F0',   // texto principal
  textOff:     '#95A4B4',   // texto inativo, placeholders
  inactive:    '#152938',   // botões não selecionados (fundo)
}
// Gradientes:
// CTAs grandes: linear-gradient(135deg, #FFDA71, #CA9A43)
// Agenda/Tools/Galeria: linear-gradient(135deg, #042034, #04253E)
```

---

## Arquitetura — 5 regras que NUNCA devem ser quebradas

### Regra 1 — Singleton Supabase
```typescript
// ÚNICO createClient() em: ./lib/supabase.ts
// Em qualquer outro arquivo:
import { supabase } from '../lib/supabase'  // ← sempre assim
// NUNCA: const client = createClient(...)  // em outro arquivo
```

### Regra 2 — Canal único para messages
```typescript
// ÚNICO channel para a tabela messages: hooks/useUnreadMessageCount.ts
// Instanciado APENAS dentro de: contexts/UnreadCountContext.tsx (Provider)
// Componentes NÃO criam channels — consumem via:
const { unreadMessages } = useUnreadCount()  // contexto
window.addEventListener('prosperus:new-message', handler)  // DOM event
// NUNCA: supabase.channel('messages:...') em componente direto
```

### Regra 3 — Guard de execução do PushAutoSubscriber
```typescript
// sessionStorage (NÃO useRef) como guard de execução única
// useRef é resetado pelo React.StrictMode → causa AbortError
const sessionKey = `push-subscribing-${userId}`
if (sessionStorage.getItem(sessionKey)) return
sessionStorage.setItem(sessionKey, '1')
// ...
finally { sessionStorage.removeItem(sessionKey) }
```

### Regra 4 — Nomes de channel FIXOS
```typescript
// NUNCA usar Math.random() em nomes de channel Supabase
// Math.random() causa "mismatch between server and client bindings"
// ❌: `unread-msgs-${userId}-${Math.random().toString(36).slice(2)}`
// ✅: `unread-msgs-${userId}`
```

### Regra 5 — Padrão de notificações
```typescript
// Todas as funções notify* ficam em: services/notificationTriggers.ts
// Estrutura obrigatória:
export async function notifyXxx(id: string, title: string): Promise<void> {
  try {
    const { data: members } = await supabase.from('profiles')
      .select('id').in('role', ['MEMBER','ADMIN','TEAM']).eq('is_active', true)
    if (!members?.length) return
    const BATCH = 20
    for (let i = 0; i < members.length; i += BATCH) {
      const batch = members.slice(i, i + BATCH)
      await supabase.from('user_notifications').insert(batch.map(m => ({...})))
      await Promise.allSettled(batch.map(m => dispatchNotification({...})))
    }
  } catch (err) {
    console.error('[notifyXxx]', err)
    // NUNCA propagar — falha de notificação nunca quebra o caller
  }
}
```

---

## Banco de dados — estado atual

| Tabela | RLS | Realtime | REPLICA IDENTITY | Observação |
|--------|-----|----------|-----------------|------------|
| messages | ✅ | ✅ | FULL | sem SECURITY DEFINER |
| user_notifications | ✅ | ✅ | default | — |
| conversation_participants | ✅ | ✅ | default | — |
| push_subscriptions | ✅ | — | default | 1 por user+platform |
| member_files | ✅ | — | default | migration 058 |
| video_materials | ✅ | — | default | migration 059 |

---

## Mapa de arquivos — responsabilidade de cada um

### Entry points
```
index.tsx        → monta <App> + StrictMode
App.tsx          → guards de autenticação + providers + routing sócios
AdminApp.tsx     → routing admin (lazy-loaded)
```

### Contexts (providers globais)
```
AuthContext.tsx         → sessão + usuário logado + role
UnreadCountContext.tsx  → singleton do realtime de messages + badge do app
```

### Hooks críticos
```
useUnreadMessageCount.ts → canal Supabase para messages (SINGLETON)
usePushNotifications.ts  → subscribe/unsubscribe de push
useProfileForm.ts        → estado e validação do formulário de perfil
useAppTour.ts            → tour pós-onboarding
useSwipeCarousel.ts      → [VERIFICAR se ainda usado após VideoCarousel]
```

### Utils essenciais
```
designTokens.ts → ÚNICA fonte de cores e tokens (criar se não existir)
logger.ts       → usar em vez de console.log
imageUpload.ts  → normalização HEIC/Google Fotos/iCloud
matchEngine.ts  → score de compatibilidade entre sócios
```

---

## O que NÃO fazer (lições aprendidas)

```
❌ Criar channel Supabase em componente diretamente
   → Causa WebSocket mismatch e duplicação de eventos

❌ Usar Math.random() em nomes de channel
   → Causa "mismatch between server and client bindings"

❌ Usar useRef como guard no PushAutoSubscriber
   → StrictMode reseta o ref → AbortError → subscription não salva

❌ Instanciar useUnreadMessageCount em mais de 1 componente
   → Cria múltiplos channels → conflito → realtime quebra

❌ Usar SECURITY DEFINER em funções chamadas pelo Realtime
   → auth.uid() retorna null no contexto Realtime → RLS bloqueia eventos

❌ Propagar erro em funções notify*
   → Falha de notificação nunca deve interromper o fluxo principal

❌ Fatiar arquivos grandes sem Planejamento Master de Code Freeze
   → Causará quebras de props e loops infinitos no rendering (ex: react.lazy)
```
