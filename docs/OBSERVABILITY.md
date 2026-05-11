# Observability — Prosperus Club App

**Stack:** Sentry React SDK (`@sentry/react`) + source maps via `@sentry/vite-plugin`.
**ADR:** [ADR-014 em `.context/memory/decisions.md`](../.context/memory/decisions.md)
**Setup inicial:** 2026-05-11

Este documento cobre como acessar, manter e estender a camada de observabilidade do app.

---

## 1. Como acessar

| Recurso | URL | Quem tem acesso |
|---|---|---|
| Dashboard Sentry | https://sentry.io/organizations/prosperus-club/issues/ | Tech lead + admins do projeto |
| Configuração do projeto | https://sentry.io/settings/prosperus-club/projects/prosperus-club-app/ | Tech lead |
| Auth Tokens (build) | https://sentry.io/settings/account/api/auth-tokens/ | Owner Sentry |

Convidar membros: Sentry → Settings → Team → Members → Invite.

---

## 2. Variáveis de ambiente

| Variável | Onde | Escopo |
|---|---|---|
| `VITE_SENTRY_DSN` | `.env.local` / `.env.production` / host de deploy | **Público** (vai pro bundle) |
| `VITE_SENTRY_ORG` | `.env.production` | Build-time só |
| `VITE_SENTRY_PROJECT` | `.env.production` | Build-time só |
| `SENTRY_AUTH_TOKEN` | **CI secret** (GitHub Actions) ou `.env.local` em builds manuais | **Secret** — nunca commitar |

Sem `SENTRY_AUTH_TOKEN`, o `@sentry/vite-plugin` desativa gracefully — build não falha, mas source maps não são uploadadas (erros em prod virão minificados).

Sem `VITE_SENTRY_DSN` ou em modo dev (`import.meta.env.PROD === false`), o SDK **não inicializa** — zero overhead local.

Setup CI sugerido (`.github/workflows/main.yml`, próxima sprint):
```yaml
- name: Production build
  env:
    VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
    VITE_SENTRY_ORG: ${{ vars.SENTRY_ORG }}
    VITE_SENTRY_PROJECT: ${{ vars.SENTRY_PROJECT }}
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: npm run build
```

---

## 3. Decisões de design

### 3.1. Por que NÃO usamos `Sentry.ErrorBoundary` nativo

Mantemos o `components/ui/ErrorBoundary.tsx` próprio porque ele tem **auto-reload de `ChunkLoadError`** após deploy (sessão stale tenta carregar chunk que não existe mais — recarregamos uma vez automaticamente). Trocar pelo `Sentry.ErrorBoundary` perderia essa UX crítica em deploys frequentes.

O boundary próprio integra ao Sentry via `Sentry.captureException(error, { contexts: { react: { componentStack } }, tags })` no `componentDidCatch`. Resultado: melhor dos dois mundos.

### 3.2. Por que `enabled: import.meta.env.PROD`

Em dev, Sentry causa ruído (HMR errors, StrictMode duplicações). Filtragem seria pesada. Mais simples: **off em dev, on em prod**. Para testar manualmente, ver seção "Smoke test" abaixo.

### 3.3. Por que `replaysSessionSampleRate: 0` e `replaysOnErrorSampleRate: 1.0`

Replay de sessão é caro em armazenamento (5 minutos de DOM por sessão). 100% é insustentável no Free tier. Mas quando há **erro**, queremos sempre o replay para debug. Configuração balanceia custo × utilidade.

### 3.4. Por que release `${version}-${git sha}` em vez de só version

`package.json#version` muda raramente (semver). Git SHA muda a cada commit. Combinação: erros do Dashboard correlacionam com commit exato. Pre-fix: erros de `1.2.3-abc1234` (commit antigo) vs `1.2.3-def5678` (commit novo) ficam separados.

### 3.5. Por que filtramos 4 ruídos no `beforeSend`

Lista em `lib/sentry.ts` na função `filterKnownNoise`:

| Filtro | Razão |
|---|---|
| `AbortError` com `aborted/signal is aborted` | React.StrictMode mount/unmount/remount em dev. AuthContext já trata silenciosamente. |
| HTTP `410 Gone` | Push subscriptions stale. `send-push` faz auto-cleanup (ADR-013). Comportamento esperado. |
| `ResizeObserver loop` | Bug conhecido de browser, sem ação possível. |
| `Non-Error promise rejection captured` sem stack útil | Vem de extensões do browser, zero contexto de debug. |

Para adicionar novo filtro: editar `filterKnownNoise` em `lib/sentry.ts` e documentar aqui.

---

## 4. Tags e contextos

### 4.1. Tags por role (User Context)

Setado em `contexts/AuthContext.tsx` via `useEffect` que reage a `userProfile`:

```typescript
Sentry.setUser({
  id: userProfile.id,
  email: userProfile.email,
  role: userProfile.role,  // ADMIN/TEAM/CEO/MANAGER/ACCOUNT_MANAGER/MEMBER
});
```

**Como priorizar no Dashboard:**
- Filtros: `user.role:ADMIN` → erros de admins (alta prioridade)
- Filtros: `user.role:MEMBER` → erros de sócios (maior volume, menor prioridade individual)

### 4.2. Tags por ErrorBoundary

Erros capturados pelo boundary global vêm com:
- `boundary: app-root`
- `module: aplicativo` (ou o `moduleName` passado pra boundary aninhada)
- `error_type: chunk-load` (apenas para ChunkLoadError persistente)

### 4.3. Breadcrumbs categorizados

Categorias definidas em `lib/sentry.ts → BreadcrumbCategory`:

| Categoria | Onde é emitida | Exemplos |
|---|---|---|
| `auth` | AuthContext (login, logout, user identified) | "SIGNED_OUT", "user identified { role }" |
| `push` | notificationService (subscribe/unsubscribe) | "subscription registered { platform }", "registerPushToken failed" |
| `notification` | notificationTriggers (todos notify*) | "notifyNewArticle started", "notifyColetaFaturamento started { target }" |
| `realtime` | useUnreadMessageCount, useNotificationsSubscription | "messages channel SUBSCRIBED", "notifications CHANNEL_ERROR" |
| `hubspot` | useProfileForm, adminBirthdayService | "invoke sync-hubspot", "sync-hubspot-birthdays failed" |

---

## 5. Adicionando novos breadcrumbs (template)

```typescript
import { addBreadcrumb } from '../lib/sentry'; // ajustar path relativo

// No início de uma operação crítica:
addBreadcrumb('hubspot', 'invoke update-hubspot-contact', { contactId });

// Em erro recuperável (vira warning):
addBreadcrumb('realtime', 'channel reconnect attempt', { attempt: 2 }, 'warning');

// Em erro (vira error breadcrumb):
addBreadcrumb('push', 'registerPushToken failed', { error: message.slice(0, 200) }, 'error');
```

**Regras:**
- **Categoria** SEMPRE da lista `BreadcrumbCategory` (não inventar novas sem documentar)
- **Mensagem** curta, ação no presente ("invoke X", "X started", "X failed")
- **Data** só com IDs e statuses — **NUNCA email, telefone, valores de deal, tokens**
- **Truncar strings** longas com `.slice(0, 200)` para não inflar o payload
- **Nível default** é `info`. Use `warning` para retry/reconnect, `error` para falha real
- **Em dev**, `addBreadcrumb` é no-op (zero overhead)

---

## 6. Como validar em produção

Como `enabled: import.meta.env.PROD`, não dá pra testar no `npm run dev`. Para validar:

### 6.1. Build local + preview

```bash
# 1. Garanta que .env.local tem VITE_SENTRY_DSN configurado
# 2. Build de produção
npm run build

# 3. Servir o build localmente
npm run preview
# Abre em http://localhost:4173/app/
```

### 6.2. Smoke test — forçar erro proposital

Com o app rodando no preview, abre o DevTools console e cola:

```js
// Provoca erro JS — Sentry deve capturar e mandar para o Dashboard
throw new Error('sentry-smoke-test ' + new Date().toISOString());
```

Em ~30 segundos, esse erro aparece em https://sentry.io/organizations/prosperus-club/issues/

### 6.3. Smoke test — validar source maps

No erro capturado, abrir o "Stack trace":
- ✅ **Stack frames mostram caminhos `.tsx`** (ex: `App.tsx:42`) → source maps OK
- ❌ Stack frames mostram caminhos `.js` minificados (ex: `index-abc123.js:1`) → source maps não foram uploadadas. Verificar `SENTRY_AUTH_TOKEN` no build.

### 6.4. Smoke test — validar ErrorBoundary

Forçar erro de render em algum componente (temporariamente, sem commitar):

```tsx
// Em qualquer componente
if (true) throw new Error('ErrorBoundary test');
```

Deve aparecer:
- Fallback UI com fundo `bg-prosperus-azul-profundo`, título em `font-display` + Ouro Vivo + Ouro Nobre
- Erro capturado pelo Sentry com tag `boundary: app-root`

### 6.5. Smoke test — validar setUser

Fazer login no app, depois abrir DevTools → Network → procurar request a `ingest.sentry.io`. Body deve conter `user: { id, email, role }`. Após logout, próximo erro tem `user: null`.

---

## 7. Política de retenção

| Plano Sentry | Retenção | Eventos/mês |
|---|---|---|
| **Free** (atual) | 30 dias | 5.000 |
| Team | 90 dias | 50.000 |
| Business | 90 dias + replay | 100.000+ |

Volume atual: imprevisto. Em 30 dias monitorar quantidade total de eventos no Dashboard. Se chegar perto do limite Free, considerar:
1. Ajustar filtros no `beforeSend` para reduzir ruído
2. Subir `tracesSampleRate` para menos que 0.1
3. Upgrade para Team

---

## 8. Pendências externas (operacional)

- [ ] Criar projeto Sentry `prosperus-club-app` em https://sentry.io
- [ ] Obter DSN + criar `SENTRY_AUTH_TOKEN` com scopes `project:read`, `project:releases`, `org:read`
- [ ] Adicionar variáveis ao ambiente de produção (Vercel/Netlify/host)
- [ ] Adicionar `SENTRY_AUTH_TOKEN` como secret no GitHub Actions
- [ ] Atualizar `.github/workflows/main.yml` para passar as 4 vars no build step

---

## 9. Histórico

- **2026-05-11:** Setup inicial. ADR-014 criada. SDK instalado, source maps via Vite plugin, ErrorBoundary integrado, setUser via AuthContext, breadcrumbs em 6 zonas críticas (push/notification/realtime/hubspot/auth). Smoke tests pendentes — requer DSN real configurado no host de prod.
