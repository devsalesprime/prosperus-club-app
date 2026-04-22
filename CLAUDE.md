# Prosperus Club App — Guia do Agente
## Versão definitiva · Abril 2026 · Score 10/10
## Lido no início de TODA sessão de desenvolvimento

---

## Identidade do projeto

PWA React 18 + TypeScript + Supabase.
Clube de networking high-ticket. Score: 10/10.
Banco: ptvsctwwonvirdwprugv.supabase.co

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 (v6.4.1) |
| Estilo | Inline styles + utils/designTokens.ts |
| Backend | Supabase (PostgreSQL 15 + Realtime + Storage) |
| Push | Web Push + VAPID + send-push Edge Fn |
| CRM | HubSpot (webhook + sync-hubspot + shadow profiles) |
| PWA | Vite PWA v1.2.0 + Workbox + sw.js |

---

## Design Tokens — ÚNICA fonte de cores

```typescript
import { TOKENS } from './utils/designTokens'
// bgPrimary:#031A2B · bgBox:#031726 · stroke:#052B48
// gold:#FFDA71 · goldDark:#CA9A43 · textPrimary:#FCF7F0 · textOff:#95A4B4
// gradGold: linear-gradient(135deg,#FFDA71,#CA9A43)
// gradBg:   linear-gradient(135deg,#042034,#04253E)
```

---

## 5 Regras que NUNCA quebram

### 1 Singleton Supabase
```typescript
// ÚNICO createClient() em: lib/supabase.ts
import { supabase } from '../lib/supabase'  // sempre assim
```

### 2 Canal único para messages
```typescript
// ÚNICO channel: hooks/useUnreadMessageCount.ts
// Instanciado APENAS em: contexts/UnreadCountContext.tsx
// Componentes escutam via DOM:
window.addEventListener('prosperus:new-message', handler)
window.addEventListener('prosperus:message-updated', handler)
```

### 3 Guard do PushAutoSubscriber
```typescript
// sessionStorage — NÃO useRef (StrictMode reseta useRef → AbortError)
const sessionKey = `push-subscribing-${userId}`
if (sessionStorage.getItem(sessionKey)) return
sessionStorage.setItem(sessionKey, '1')
```

### 4 Nomes de channel fixos
```typescript
// NUNCA Math.random() → causa mismatch
`unread-msgs-${userId}`  // ← sempre assim
```

### 5 Padrão notify*
```typescript
// ÚNICO lugar: services/notificationTriggers.ts
// SEMPRE fire-and-forget — nunca propagar erro
try { /* batch 20, insert + push */ } catch(e) { console.error(e) }
```

---

## Banco — estado atual

```
messages: REPLICA IDENTITY FULL ✅ · RLS sem SECURITY DEFINER ✅
Realtime: messages · user_notifications · conversation_participants · conversations
Migrations executadas: 001-080 + 20260331_* (91 total) ✅
push_subscriptions: 1 ativa por user+platform ✅
hubspot_directory: Shadow Profiles para Universal Directory ✅
```

---

## Edge Functions deployadas (12 total)

```
send-push             → push para dispositivos (com JWT)
hubspot-webhook       → webhook de negócios CRM (--no-verify-jwt)
sync-hubspot          → perfil → HubSpot Contato + Empresa (--no-verify-jwt)
sync-hubspot-amounts  → sync amounts de negócios (--no-verify-jwt)
sync-hubspot-birthdays→ sync datas de aniversário (--no-verify-jwt)
sync-shadow-profiles  → backfill Shadow Profiles (--no-verify-jwt)
update-hubspot-contact→ atualiza contato individual (--no-verify-jwt)
check-email-exists    → Smart Login verificação email (com JWT)
login-socio           → login do sócio via HubSpot (--no-verify-jwt)
receive-report        → recebe relatórios de membros (com JWT)
roi-coleta-cron       → cron job coleta ROI (--no-verify-jwt)
send-birthday-pushes  → push automático aniversário (--no-verify-jwt)
```

---

## HubSpot — Regras de sincronização

### Cargo (job_title → cargo_na_empresa_2_)
O campo `cargo_na_empresa_2_` é DROPDOWN no HubSpot. O sync-hubspot traduz automaticamente:
```
"CEO" | "Diretor" | "Gerente" | "Sócio/Fundador" | "Vendedor" → opção exata
Texto livre ("Desenvolvedor Front-End") → "Outro"
Vazio → "Não Informado"
```

### Tags e Setores (tags / partnership_interests)
HubSpot usa `" e "` nos nomes internos, app usa `" & "`. Tradução automática:
```
"Tecnologia & Inovação" → "Tecnologia e Inovação"
```
Tags não reconhecidas pelo HubSpot são silenciosamente filtradas (ALLOWED_HUBSPOT_OPTIONS).

### Website e Nome Fantasia
São propriedades de **Empresa** (Company), NÃO de Contato.
O sync-hubspot busca a empresa associada ao contato e atualiza lá.
**Pré-requisito**: scope `crm.objects.companies.write` habilitado no Private App.

---

## Prompts pendentes (backlog)

```
CRÍTICO:
PROMPT_PERFORMANCE_OPTIMIZATION.md   → Lighthouse 29→80+ (code splitting)

ALTA:
PROMPT_PHOTO_EDITOR_PRO.md           → crop circular Canvas API
PROMPT_DESIGN_SYSTEM_UPDATE.md       → tokens em todo o app
PROMPT_FIX_CAROUSEL_VIDEO_SCROLL.md  → carrossel Academy + sidebar vídeo

MÉDIA:
PROMPT_NOTIFY_NEW_SOLUTION.md        → push nova solução
PROMPT_IMPL_NOTIFICATION_GAPS.md     → notifyNewArticle + notifyEventUpdated
PROMPT_IMPL_ANALYTICS_TRACKING.md    → 4 plugs de analytics
```

---

## O que NÃO fazer

```
❌ channel Supabase em componente direto
❌ Math.random() em nomes de channel
❌ useRef no PushAutoSubscriber (usar sessionStorage)
❌ useUnreadMessageCount fora do UnreadCountContext
❌ SECURITY DEFINER em funções do Realtime
❌ Propagar erro em notify*
❌ window.alert / window.confirm (sempre modal custom)
❌ Texto livre em propriedades dropdown do HubSpot (traduzir antes)
❌ Website/nome_fantasia no Contato HubSpot (são propriedades de Empresa)
❌ Criar usuários em auth.users para Shadow Profiles (usar hubspot_directory)
```
