# Prosperus Club App

> Clube de networking high-ticket para C-Level, fundadores e gestores.
> PWA React 18 + TypeScript + Supabase · Score 10/10 · Abril 2026

---

## Acesso

| Ambiente | URL | Credencial |
|----------|-----|------------|
| Produção | https://ptvsctwwonvirdwprugv.supabase.co | — |
| Admin | Login com role ADMIN | — |
| Supabase Dashboard | https://supabase.com/dashboard/project/ptvsctwwonvirdwprugv | — |

---

## Começar a desenvolver

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Verificar TypeScript
npx tsc --noEmit

# Deploy Edge Functions
npx supabase functions deploy send-push
npx supabase functions deploy sync-hubspot --no-verify-jwt
npx supabase functions deploy hubspot-webhook --no-verify-jwt
npx supabase functions deploy sync-shadow-profiles --no-verify-jwt
```

---

## Variáveis de ambiente (.env.local)

```env
VITE_SUPABASE_URL=https://ptvsctwwonvirdwprugv.supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
VITE_VAPID_PUBLIC_KEY=[VAPID_PUBLIC]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
HUBSPOT_ACCESS_TOKEN=[HUBSPOT_TOKEN]
```

---

## Estrutura de pastas

```
/
├── App.tsx                    → guards auth + routing sócios
├── AdminApp.tsx               → routing admin (lazy)
├── index.tsx                  → entry point + StrictMode
├── types.ts                   → tipos globais
│
├── components/
│   ├── admin/                 → módulos do painel admin (13 módulos)
│   ├── banners/               → NotificationBannerInterstitial
│   ├── business/              → RegisterDealModal, ReferralCard, SmartMemberSelect
│   ├── chat/                  → ChatWindow, ConversationList
│   ├── layout/                → AppHeader, BottomNav, AppLayout
│   ├── onboarding/            → OnboardingWizard (7 steps)
│   ├── profile/               → ProfilePhotoEditor, ProfileBasicFields, ProfileStrategicFields
│   ├── push/                  → PushAutoSubscriber, PermissionPrompt
│   ├── roi/                   → RoiDashboard, RegistrarFaturamentoModal
│   └── ui/                    → Button, ModalWrapper, ProsperusAlert, icons/
│
├── contexts/
│   ├── AuthContext.tsx         → sessão + role
│   └── UnreadCountContext.tsx  → singleton realtime + badge
│
├── hooks/
│   ├── useUnreadMessageCount.ts → SINGLETON canal messages
│   ├── useNotificationBanner.ts → controle interstitial
│   ├── useProfileForm.ts       → estado e validação do perfil
│   └── queries/                → React Query hooks
│
├── services/
│   ├── notificationTriggers.ts → ÚNICO lugar com notify*
│   ├── roiService.ts           → Múltiplo de Crescimento
│   ├── profileService.ts       → CRUD perfis + HubSpot sync trigger
│   ├── adminMemberService.ts   → admin members + Universal Directory
│   ├── analyticsService.ts     → analytics e métricas
│   └── [outros services]
│
├── utils/
│   ├── designTokens.ts         → ÚNICA fonte de cores
│   ├── deepLinks.ts            → 14 destinos de navegação
│   ├── logger.ts               → usar em vez de console.log
│   └── matchEngine.ts          → score de compatibilidade
│
├── lib/
│   └── supabase.ts             → ÚNICO createClient()
│
└── supabase/
    ├── functions/              → 12 Edge Functions (Deno)
    │   ├── send-push/          → Web Push + VAPID
    │   ├── hubspot-webhook/    → CRM webhook (Amount sync)
    │   ├── sync-hubspot/       → Perfil → HubSpot (Contato + Empresa)
    │   ├── sync-shadow-profiles/ → Backfill Shadow Profiles
    │   ├── sync-hubspot-amounts/ → Sync amounts negócios
    │   ├── sync-hubspot-birthdays/ → Sync aniversários
    │   ├── check-email-exists/ → Smart Login
    │   ├── login-socio/        → Login via HubSpot
    │   ├── receive-report/     → Relatórios de membros
    │   ├── roi-coleta-cron/    → Cron job ROI
    │   ├── send-birthday-pushes/ → Push aniversário automático
    │   └── update-hubspot-contact/ → Update contato individual
    └── migrations/             → 91 migrations executadas
```

---

## Regras de desenvolvimento

1. **Singleton Supabase** — `createClient()` apenas em `lib/supabase.ts`
2. **Canal único** — `useUnreadMessageCount` apenas dentro de `UnreadCountContext`
3. **Push guard** — `sessionStorage` no `PushAutoSubscriber`, nunca `useRef`
4. **Channel names** — sempre fixos, nunca `Math.random()`
5. **notify\*** — sempre fire-and-forget em `notificationTriggers.ts`
6. **Sem alert nativo** — sempre modal custom com design system
7. **Cores** — sempre de `utils/designTokens.ts`, nunca hardcoded
8. **HubSpot dropdowns** — sempre traduzir texto livre para opções permitidas
9. **Empresa vs Contato** — website e nome_fantasia são propriedades de Company

---

## Módulos principais

| Módulo | Arquivos-chave | Score |
|--------|---------------|-------|
| Autenticação | App.tsx, AuthContext | 10/10 |
| Onboarding | OnboardingWizard (7 steps) | 10/10 |
| Member Book | MemberBook, matchEngine | 10/10 |
| Chat | ChatWindow, ConversationList, useUnreadMessageCount | 10/10 |
| Academy | Academy, videoService, VideoCarousel | 10/10 |
| Push | PushAutoSubscriber, send-push Edge Fn | 10/10 |
| ROI/Múltiplo | RoiDashboard, roiService | 10/10 |
| Banners | NotificationBannerInterstitial, notificationBannerService | 10/10 |
| HubSpot | sync-hubspot + hubspot-webhook + shadow-profiles | 10/10 |
| Universal Directory | hubspot_directory + SmartMemberSelect | 10/10 |
| Aniversários | birthday_cards + send-birthday-pushes | 10/10 |
| Eventos + QR Tickets | EventDetailsModal + event_tickets | 10/10 |
| Admin | AdminApp + 13 módulos | 10/10 |

---

## Guia para o agente de IA

Ver: `CLAUDE.md` na raiz do projeto.
Documentação completa: `PROSPERUS_10_10.md`

---

## Números do codebase

| Métrica | Valor |
|---------|-------|
| Linhas de código (TS/TSX) | ~59.945 |
| Componentes React | 179 |
| Services | 102 |
| Migrations SQL | 91 |
| Edge Functions | 12 |
| console.log em produção | **0** |

---

*Prosperus Club · Abril 2026 · Score 10/10*
