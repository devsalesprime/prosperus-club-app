# .context/rules.md — Regras Inegociáveis
# Prosperus Club App · Abril 2026

## Zero Regras que Nunca Quebram

### R1 — Singleton Supabase
```typescript
// ÚNICO createClient() em: lib/supabase.ts
import { supabase } from '../lib/supabase'  // sempre assim
// NUNCA: const client = createClient() em outro arquivo
```

### R2 — Canal único para messages
```typescript
// ÚNICO channel para messages: hooks/useUnreadMessageCount.ts
// Instanciado APENAS em: contexts/UnreadCountContext.tsx
// Componentes escutam via DOM events:
window.addEventListener('prosperus:new-message', handler)
window.addEventListener('prosperus:message-updated', handler)
// NUNCA: supabase.channel('messages:...') em componente direto
```

### R3 — Guard do PushAutoSubscriber
```typescript
// sessionStorage — NÃO useRef (StrictMode reseta useRef → AbortError)
const sessionKey = `push-subscribing-${userId}`
if (sessionStorage.getItem(sessionKey)) return
sessionStorage.setItem(sessionKey, '1')
// finally { sessionStorage.removeItem(sessionKey) }
```

### R4 — Nomes de channel fixos
```typescript
// NUNCA: `channel-${Math.random()}` → causa mismatch
// SEMPRE: `unread-msgs-${userId}` — determinístico
```

### R5 — Padrão notify*
```typescript
// ÚNICO lugar: services/notificationTriggers.ts
// SEMPRE fire-and-forget — nunca propagar erro
// Estrutura: buscar sócios → batch 20 → insert + push
try { ... } catch(e) { console.error('[notifyX]', e) /* não jogar */ }
```

### R6 — Zero any
```typescript
// Proibido: : any · as any · <any>
// Usar tipos do banco: import type { Database } from './types'
// Para payloads Supabase: tipar o retorno do .select()
```

### R7 — Services para banco
```typescript
// PROIBIDO em componentes React:
// supabase.from('tabela').select()  ← direto no componente
// OBRIGATÓRIO: chamar via /services
import { profileService } from '../services/profileService'
await profileService.getProfile(userId)
```

### R8 — Sem alert nativo
```typescript
// NUNCA: window.alert() · window.confirm() · window.prompt()
// SEMPRE: modal custom com design system (Navy + Gold)
```

### R9 — Cores de designTokens
```typescript
// NUNCA: color: '#031A2B' hardcoded no componente
// SEMPRE: import { TOKENS } from '../utils/designTokens'
//         color: TOKENS.bgPrimary
```

### R10 — HubSpot dropdowns
```typescript
// NUNCA enviar texto livre para propriedades dropdown do HubSpot
// SEMPRE usar o array de valores permitidos (ALLOWED_JOBS, ALLOWED_HUBSPOT_OPTIONS)
// HubSpot aborta o pacote inteiro se um valor for inválido
```

## Mobile-First
- Toda tela funciona em 375px de largura
- Scroll vertical, nunca horizontal
- Toques mínimos de 44×44px
- Safe area iOS: usar CSS env(safe-area-inset-*)
- Testar em dispositivo real antes de fechar

## TypeScript Estrito
- Zero `any` (183 instâncias legadas em backlog — não aumentar)
- Tipar todos os retornos de função
- Interfaces explícitas para Props de componentes
- Nunca `!` (non-null assertion) sem comentário justificando

## Performance
- Nunca importar estaticamente telas que não são usadas no primeiro render
- Imagens: `loading="lazy"` + dimensões explícitas + WebP quando possível
- Listas > 50 itens: virtualizar
