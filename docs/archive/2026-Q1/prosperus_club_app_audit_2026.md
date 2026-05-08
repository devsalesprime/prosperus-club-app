# Prosperus Club App — Auditoria Completa da Arquitetura
**Data:** 18/03/2026 · **Versão:** v3.0.1

---

## 1. Visão Geral

Aplicativo PWA (Progressive Web App) para clube de negócios. Funciona como plataforma privada para sócios com chat, eventos, vídeos, networking, indicações, negócios auditados e analytics administrativo.

| Aspecto | Detalhe |
|---|---|
| Framework | React 18.2 + TypeScript 5.8 |
| Bundler | Vite 6 + vite-plugin-pwa |
| CSS | Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime) |
| Charts | Recharts 3.7 |
| Calendar | react-big-calendar 1.8.5 |
| Forms | react-hook-form 7 + Zod 4 |
| Icons | lucide-react |
| Toasts | react-hot-toast |
| Rich Text | react-quill (editor de artigos) |
| Data Fetching | @tanstack/react-query 5 |
| Gestures | @use-gesture/react |
| Dates | date-fns 2.30 (com locale ptBR) |
| Testing | Vitest + Testing Library |
| Deploy | VPS Ubuntu + Nginx (prosperusclub.com.br) |

---

## 2. Estrutura de Diretórios

```
prosperus-club-app/
├── index.html              # Entry point PWA (18KB)
├── index.tsx               # React root mount
├── App.tsx                 # Router principal sócio (8.8KB)
├── AdminApp.tsx            # Router admin (46KB)
├── types.ts                # Tipos compartilhados (377 linhas, 20+ interfaces)
├── vite.config.ts          # Build config + PWA manifest
├── package.json            # 17 deps + 13 devDeps
│
├── components/             # 120+ componentes
│   ├── (58 arquivos)       # Componentes do app sócio
│   ├── admin/              # 29 módulos admin + 9 shared + 7 events
│   ├── business/           # 12 componentes Business Core (ROI, deals, rankings)
│   ├── layout/             # 6 componentes (Header, Sidebar, BottomNav, ViewSwitcher)
│   ├── ui/                 # 11 componentes primitivos (Avatar, Button, SwipeableItem...)
│   ├── profile/            # 7 componentes do editor de perfil
│   └── support/            # 5 componentes (FAQ, Termos, Privacidade, DocSheet)
│
├── services/               # 28 services (camada de dados)
├── hooks/                  # 18 custom hooks
├── contexts/               # 3 contextos React (App, Auth, UnreadCount)
├── pages/                  # 4 páginas standalone
├── utils/                  # 15 utilitários
├── lib/                    # supabase.ts + eventConfig.tsx
│
├── supabase/
│   ├── migrations/         # 69 SQL migrations
│   ├── functions/          # 5 Edge Functions (Deno)
│   └── seed-admin.ts       # Seed do admin inicial
│
├── public/                 # Assets estáticos (PWA icons, default-avatar)
├── scripts/                # Scripts auxiliares
├── tests/                  # Testes unitários
└── docs/                   # Documentação
```

---

## 3. Arquitetura do Frontend

### 3.1 Pontos de Entrada

| Arquivo | Papel | Tamanho |
|---|---|---|
| `App.tsx` | Roteador principal (sócio). Decide entre login, onboarding ou app | 8.8KB |
| `AdminApp.tsx` | Roteador admin. Sidebar + switch por AdminViewState | 46KB |
| `ViewSwitcher.tsx` | Renderiza a view atual do sócio (switch por ViewState) | 25.8KB |

### 3.2 Views do Sócio (16 estados)

```
DASHBOARD → Home com carrossel, próximos eventos, perfil
AGENDA → Calendário (react-big-calendar) + lista mobile + modais de detalhes
ACADEMY → Player de vídeos (YouTube, Vimeo, CursEduca) + progresso
PROSPERUS_TOOLS → Hub de ferramentas + soluções + relatórios de progresso
SOLUTIONS → Lista de soluções parceiras
PROGRESS → Relatórios de progresso do sócio
MEMBERS → Livro de sócios com filtros, busca, benefícios exclusivos
GALLERY → Álbuns de fotos (Google Photos embed)
NEWS → Blog/Artigos internos com leitor integrado
MESSAGES → Chat 1-a-1 em tempo real (Supabase Realtime)
NOTIFICATIONS → Central de notificações (in-app + push)
PROFILE → Perfil com edição, preview, histórico
DEALS → Meus Negócios (registrar, confirmar, ver status de auditoria)
REFERRALS → Indicações enviadas/recebidas com funil de conversão
RANKINGS → Rankings de performance (vendas, indicações, ticket médio)
FAVORITES → Sócios, artigos, galerias e vídeos favoritados
```

### 3.3 Views do Admin (16 estados)

```
DASHBOARD → KPIs com trends, últimos membros, negócios recentes
EVENTS → CRUD de eventos + sessões múltiplas + materiais + RSVP + check-in
VIDEOS → CRUD de vídeos + categorias + progresso de sócios + upload materiais
TOOLS_SOLUTIONS → Gerenciar soluções parceiras
TOOLS_PROGRESS → Enviar relatórios de progresso
MEMBERS → Lista de sócios + alterar role + ativar/desativar + preview
ARTICLES → Editor de artigos (react-quill) + publicar/despublicar
GALLERY → Gerenciar álbuns de fotos
BANNERS → Gerenciar banners da home + agendamento
ANALYTICS → Dashboard completo (Recharts) com abas: Visão Geral, Conteúdo, Benefícios, Negócios, Eventos
NOTIFICATIONS → Enviar push/in-app + histórico + agendamento
MESSAGES → Moderação de chat (visualizar, bloquear, restaurar mensagens)
ROI_AUDIT → Auditar negócios + bulk audit + CSV export + detecção de fraude
MEMBER_FILES → Upload/gerenciamento de arquivos para sócios
SETTINGS → Configurações do app (suporte, etc)
```

---

## 4. Camada de Serviços (28 services)

### 4.1 Services de Domínio (sócio)

| Service | Responsabilidade | Tamanho |
|---|---|---|
| `analyticsService.ts` | Tracking de eventos (PAGE_VIEW, VIDEO_START, GALLERY_VIEW, etc) | 37.9KB |
| `conversationService.ts` | Chat 1-a-1 com Realtime subscriptions | 34.6KB |
| `profileService.ts` | CRUD perfil + HubSpot sync + completude | 25.8KB |
| `videoService.ts` | CRUD vídeos + categorias + progresso | 23.4KB |
| `notificationService.ts` | In-app + push + agendamento | 24KB |
| `bannerService.ts` | CRUD banners + agendamento | 21.6KB |
| `businessService.ts` | Deals + referrals + rankings (sócio) | 19.4KB |
| `articleService.ts` | CRUD artigos + incremento de views | 13.6KB |
| `eventService.ts` | CRUD eventos + notificações automáticas | 9.6KB |
| `searchService.ts` | Busca global multi-entity | 9.3KB |
| `toolsService.ts` | Soluções e relatórios de progresso | 9.6KB |
| `roiService.ts` | Cálculo de ROI por sócio | 8.7KB |
| `notificationTriggers.ts` | Triggers automáticos (novo evento, deal auditado, etc) | 11KB |
| `offlineStorage.ts` | Cache offline para PWA | 6.3KB |
| `filesService.ts` | Arquivos do sócio + download tracking | 6.4KB |
| `favoriteService.ts` | Favoritos (sócios, artigos, galerias, vídeos) | 6KB |
| `galleryService.ts` | CRUD álbuns de galeria | 4.3KB |
| `settingsService.ts` | Configurações do app | 5.3KB |
| `uploadService.ts` | Upload de arquivos para Supabase Storage | 5.6KB |
| `rsvpService.ts` | RSVP/check-in de eventos | 2.5KB |
| `badgeService.ts` | Sistema de badges | 2KB |
| `exportService.ts` | Exportação CSV | 4.3KB |
| `unreadMessageService.ts` | Contagem de mensagens não lidas | 4.2KB |
| `mockData.ts` | Dados mock para desenvolvimento | 23.8KB |

### 4.2 Services Admin (3 dedicados)

| Service | Responsabilidade | Tamanho |
|---|---|---|
| `adminBusinessService.ts` | Auditoria, bulk ops, CSV export, detecção fraude | 18.1KB |
| `adminChatService.ts` | Moderação de chat, bloqueio de mensagens | 13.9KB |
| `adminUserService.ts` | Gestão de membros (roles, ativação) | 6.6KB |

---

## 5. Custom Hooks (18)

| Hook | Função |
|---|---|
| `useAnalytics` | Auto-track APP_OPEN + PAGE_VIEW + LOGOUT |
| `useAppTour` | Tour guiado de onboarding |
| `useChatSubscription` | Subscription Realtime do chat |
| `useCursEducaTracker` | Tracking de progresso CursEduca |
| `useGlobalSubscription` | Subscription global de notificações |
| `useLongPress` | Detecção de long press (menu contexto) |
| `useOnlineStatus` | Detecção online/offline |
| `usePagination` | Paginação reusável |
| `useProfileForm` | Estado do formulário de perfil |
| `usePullToRefresh` | Pull-to-refresh nativo |
| `usePushNotifications` | Lifecycle de push notifications |
| `useScrollLock` | Lock de scroll para modais |
| `useSwipeCarousel` | Gesture para carrossel |
| `useSwipeDismiss` | Gesture para dismiss de modais |
| `useTypingIndicator` | Indicador de digitação no chat |
| `useUnreadMessageCount` | Contagem unread com Realtime |
| `gestureConfig` | Configuração de gestos mobile |
| `queries/` | React Query hooks |

---

## 6. Contextos React (3)

| Contexto | Dados Gerenciados |
|---|---|
| `AppContext` | User, view, events, members, selectedEvent/Member, mobile state, isMockMode |
| `AuthContext` | Session, signIn/signOut, HubSpot detection, email debounce |
| `UnreadCountContext` | Contagem global de mensagens não lidas em tempo real |

---

## 7. Componentes Admin — Design System Shared (9)

| Componente | Uso |
|---|---|
| `AdminModal` | Modal padronizado para formulários |
| `AdminPageHeader` | Header com título, descrição e ações |
| `AdminFormInput` | Input/textarea com label, error, tipos |
| `AdminLoadingState` | Spinner de carregamento |
| `AdminEmptyState` | Estado vazio com ícone e mensagem |
| `AdminConfirmDialog` | Diálogo de confirmação (substituiu confirm()) |
| `AdminTable` | Container padronizado para tabelas |
| `AdminActionButton` | Botões de ação padronizados |
| `AdminFileUpload` | Upload com drag-and-drop |

---

## 8. Backend — Supabase

### 8.1 Edge Functions (5)

| Function | Responsabilidade |
|---|---|
| `check-email-exists` | Verificar se email já existe antes do login |
| `hubspot-webhook` | Webhook para sincronização com HubSpot |
| `login-socio` | Fluxo de login customizado (Smart Login Flow) |
| `send-push` | Envio de web push notifications |
| `sync-hubspot` | Sync bi-direcional de perfil com HubSpot |

### 8.2 Migrations SQL (69 arquivos)

Cobertura completa do schema PostgreSQL:

| Range | Área |
|---|---|
| 001-007 | Schema inicial, galeria, vídeos |
| 008-017 | Chat, notificações, perfil, storage |
| 018-022 | HubSpot, analytics, push, devices |
| 023-031 | Fixes de RLS, Realtime, chat admin |
| 032-038 | Business Core (deals, referrals, rankings), benefícios, favoritos |
| 039-049 | Categorias de vídeo, RLS fixes, blocks, artigos, RSVP |
| 050-055 | Termos, push on message, contested referrals, perfil estratégico |
| 056-059 | Analytics RPCs, Business BI RPCs, Member Files, Last Activity |
| 060-067 | Daily access, events crud, solutions, video materials, analytics exclusions, section clicks, universal exclusions |

### 8.3 Tabelas Principais (estimativa por migrations)

```
profiles             → Perfis de sócios (role, company, socials, benefit, tags, etc)
club_events          → Eventos do clube (date, category, sessions, materials)
event_rsvps          → RSVPs e check-ins
videos               → Vídeos da Academy
video_categories     → Categorias de vídeo
video_progress       → Progresso de vídeos por sócio
conversations        → Conversas do chat
conversation_participants → Participantes
messages             → Mensagens do chat
notifications        → Notificações in-app
push_subscriptions   → Inscrições push por device
user_devices         → Dispositivos registrados
analytics_events     → Eventos de analytics (PAGE_VIEW, VIDEO_START, etc)
analytics_excluded_users → Usuários excluídos das métricas
articles             → Artigos/Blog
gallery_albums       → Álbuns de fotos
banners              → Banners da home
member_deals         → Negócios entre sócios
member_referrals     → Indicações
benefit_analytics    → Analytics de benefícios exclusivos
user_favorites       → Favoritos
member_files         → Arquivos do sócio
file_downloads       → Log de downloads
prosperus_tools      → Soluções parceiras
member_progress_reports → Relatórios de progresso
app_settings         → Configurações do app
user_blocks          → Sistema de bloqueio
terms_acceptance     → Aceite de termos
profile_history      → Histórico de alterações de perfil
```

### 8.4 RPCs PostgreSQL (funções server-side)

| RPC | Origem | Descrição |
|---|---|---|
| `get_dashboard_stats_with_trends` | 056 | KPIs com comparação período anterior |
| `get_daily_activity_stats` | 056 | Atividade diária (page views, vídeos, mensagens) |
| `get_top_content` | 056 | Top vídeos/artigos por views |
| `get_event_type_breakdown` | 056 | Breakdown por tipo de evento |
| `get_daily_access_metrics` | 060 | Sessões e usuários únicos por dia |
| `get_benefit_engagement_stats` | 056 | Funil de engajamento de benefícios |
| `get_networking_funnel` | 057 | Funil: indicações → negócios → auditados |
| `get_top_roi_members` | 057 | Top sócios por volume auditado |
| `get_churn_risk_members` | 057 | Sócios inativos em risco de churn |
| `get_academy_completion_rate` | 057 | Taxa conclusão VIDEO_START/COMPLETE |
| `get_event_attendance_rate` | 057 | Taxa presença RSVP/check-in |
| `get_file_download_stats` | 058 | Analytics de downloads por arquivo |
| `get_top_file_downloaders` | 058 | Top downloaders |
| `get_section_click_stats` | 066 | Cliques em galeria, soluções, relatórios, arquivos |
| `get_analytics_excluded_users` | 065 | Usuários excluídos das métricas |
| `add_analytics_exclusion` | 065 | Adicionar exclusão |
| `remove_analytics_exclusion` | 065 | Remover exclusão |
| `get_top_benefits` | 035 | Top benefícios por clicks |
| `get_my_benefit_stats` | 035 | Stats do próprio benefício |
| `increment_file_download` | 058 | Incrementar contador atomic |

> **Nota:** Todas as RPCs de analytics filtram `analytics_excluded_users` (migrations 065-067).

---

## 9. PWA & Mobile

| Feature | Status |
|---|---|
| Service Worker | ✅ via vite-plugin-pwa + Workbox |
| Manifest.json | ✅ Ícones, splash, display: standalone |
| Install Prompt | ✅ Componente `InstallPrompt` com detecção de plataforma |
| Offline Banner | ✅ `OfflineBanner` com `useOnlineStatus` |
| Push Notifications | ✅ Web Push via Edge Function `send-push` |
| Bottom Navigation | ✅ `BottomNav` (mobile) com badge de unread |
| Desktop Sidebar | ✅ `DesktopSidebar` com filtros e navegação |
| Pull-to-Refresh | ✅ `usePullToRefresh` hook |
| Swipe Gestures | ✅ `useSwipeDismiss`, `useSwipeCarousel` |
| App Tour | ✅ `AppTour` → onboarding guiado |

---

## 10. Integrações Externas

| Integração | Via | Uso |
|---|---|---|
| **HubSpot CRM** | Edge Functions (`sync-hubspot`, `hubspot-webhook`) | Sync bi-direcional de perfis. Auto-detection no login |
| **Google Photos** | Embed URL nos álbuns | Galeria de fotos do clube |
| **YouTube** | `YouTubePlayer` component | Player de vídeos da Academy |
| **Vimeo** | `VimeoPlayer` component | Player de vídeos da Academy |
| **CursEduca** | `CursEducaPlayer` + `useCursEducaTracker` | Player + tracking externo |
| **Google Calendar** | `calendarUtils.tsx` | Exportar eventos para Google Calendar |
| **Outlook Calendar** | `calendarUtils.tsx` | Exportar eventos para Outlook |
| **ICS Files** | `calendarUtils.tsx` | Download .ics para qualquer calendário |

---

## 11. Métricas do Codebase

### 11.1 Distribuição por Tamanho (top 15 arquivos)

| Arquivo | Tamanho | Linhas (aprox) |
|---|---|---|
| `AnalyticsDashboard.tsx` | 66KB | ~1600 |
| `EventsModule.tsx` (legado) | 63.8KB | ~1500 |
| `AdminChatManager.tsx` | 52KB | ~1200 |
| `OnboardingWizard.tsx` | 47.7KB | ~1100 |
| `ChatWindow.tsx` | 46.8KB | ~1100 |
| `AdminApp.tsx` | 46KB | ~1050 |
| `AcademyModule.tsx` | 42KB | ~1000 |
| `AdminMemberProgress.tsx` | 42KB | ~950 |
| `MemberBook.tsx` | 41.4KB | ~950 |
| `analyticsService.ts` | 37.9KB | ~900 |
| `AdminNotifications.tsx` (admin) | 37.5KB | ~850 |
| `EventDetailsModal.tsx` | 35.4KB | ~800 |
| `conversationService.ts` | 34.6KB | ~800 |
| `AdminFilesModule.tsx` | 33.1KB | ~750 |
| `EventForm.tsx` | 31.6KB | ~520 |

### 11.2 Totais

| Categoria | Contagem | Tamanho Total (aprox) |
|---|---|---|
| Componentes (todos) | **126** | ~1.3MB |
| Services | **28** | ~350KB |
| Hooks | **18** | ~70KB |
| Utils | **15** | ~40KB |
| Contexts | **3** | ~38KB |
| SQL Migrations | **69** | ~200KB |
| Edge Functions | **5** | N/A (Deno runtime) |
| **TOTAL** | **~264 arquivos** | **~2MB de código fonte** |

---

## 12. Segurança

| Aspecto | Implementação |
|---|---|
| Autenticação | Supabase Auth (email magic link + password) |
| Autorização (RLS) | Row Level Security em todas as tabelas (25+ policies fixadas em migrations) |
| Roles | 3 níveis: `ADMIN`, `TEAM`, `MEMBER` |
| RPCs Security | `SECURITY DEFINER` com check de role em todas as RPCs |
| Chat Blocks | Sistema de bloqueio user-to-user |
| Admin Audit | Logs via `logger` (não persistidos em banco — oportunidade) |
| HubSpot Sync | CORS configurado, header validation |
| Push Auth | Subscription atrelada a `user_id` via `push_subscriptions` |

---

## 13. Dívidas Técnicas Identificadas

### 🔴 Crítico

1. **`alert()`/`confirm()` nativos** — 30+ ocorrências em módulos admin (AcademyModule: 10, ChatModeration: 4, Members: 3). Devem ser substituídos por `toast`/`AdminConfirmDialog`.

2. **Design System ignorado** — Apenas ~30% dos módulos admin usam os shared components. Os outros recriam headers, loading e empty states localmente.

3. **Sem paginação** — `MembersModule` carrega todos os membros de uma vez. Tabelas sem controles de página no frontend.

### 🟡 Importante

4. **Supabase inline** — Módulos como `MembersModule`, `AcademyModule`, `GalleryModule` fazem queries diretas ao Supabase sem service layer.

5. **Arquivos monolíticos** — `AnalyticsDashboard` (66KB), `EventsModule` legado (64KB), `AdminChatManager` (52KB) precisam de decomposição.

6. **Tabelas não-responsivas** — Scroll horizontal no mobile via `overflow-x-auto`.

7. **`mockData.ts`** (24KB) — Ainda presente no bundle, não utilizado em produção.

### 🟢 OK / Boas Práticas

8. `adminBusinessService` é referência (paginação, bulk ops, CSV export, detecção fraude).
9. Sistema de analytics robusto com 20+ RPCs e exclusão de usuários universalizada.
10. Chat com Realtime, typing indicators e unread counts.
11. PWA completa com Push, install prompt e offline support.
12. Smart Login Flow com email debounce e HubSpot auto-detection.

---

## 14. Oportunidades de Evolução

| # | Feature | Complexidade | Impacto |
|---|---|---|---|
| 1 | Exportação CSV/Excel universal | Baixa | Alto |
| 2 | Bulk Actions (checkboxes) em tabelas admin | Média | Alto |
| 3 | Push Notifications segmentadas | Média | Alto |
| 4 | Audit Logs persistentes (tabela `admin_audit_log`) | Média | Médio |
| 5 | Busca global no Admin (typeahead multi-entity) | Alta | Médio |
| 6 | Decomposição de componentes monolíticos (>40KB) | Média | Médio |
| 7 | Service layer para módulos sem (Members, Academy, Gallery) | Média | Médio |
| 8 | Paginação frontend em todas as tabelas | Baixa | Alto |
| 9 | Layout card-based responsivo para tabelas mobile | Média | Médio |
| 10 | Remover mockData.ts do bundle de produção | Baixa | Baixo |

---

*Documento gerado automaticamente a partir da análise estática do codebase em 18/03/2026.*
