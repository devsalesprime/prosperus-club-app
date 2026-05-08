# 🔍 Auditoria Completa — Prosperus Club App

**Data:** 24/02/2026  
**Auditor:** Senior Technical Architect + UX Strategist  
**Escopo:** Full-Stack Audit (Código + UX + Escalabilidade)

---

## SEÇÃO 1 — INVENTÁRIO DO SISTEMA

### 1.1 Stack Técnica Identificada

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend Framework | React | 18.2.0 |
| Linguagem | TypeScript | ~5.8.2 |
| Build Tool | Vite | ^6.2.0 |
| CSS Framework | Tailwind CSS | ^4.1.18 |
| Backend (BaaS) | Supabase | ^2.93.1 |
| Autenticação | Supabase Auth (email/password) | — |
| Storage | Supabase Storage (avatares, thumbnails) | — |
| Real-time | Supabase Realtime (4 canais) | — |
| PWA | vite-plugin-pwa + custom sw.js | ^1.2.0 |
| Forms | react-hook-form + zod | ^7.55.0 / ^4.3.5 |
| Charts | recharts | ^3.7.0 |
| Calendar | react-big-calendar | 1.8.5 |
| Icons | lucide-react | 0.294.0 |
| Rich Editor | react-quill | ^2.0.0 |
| Testes | Vitest + Testing Library | ^3.0.0 |
| Deployment | MAMP / Static build (`dist/`) | — |

### 1.2 Módulos Identificados

| Módulo | Status | Arquivos Principais | Complexidade | Débito Técnico |
|--------|--------|---------------------|--------------|----------------|
| Auth/Login | ✅ Completo | [LoginModal.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/LoginModal.tsx), [AuthContext.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/contexts/AuthContext.tsx), [UpdatePasswordModal.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/UpdatePasswordModal.tsx) | Alta | Médio — lógica duplicada em App.tsx |
| Onboarding | ✅ Completo | [OnboardingWizard.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/OnboardingWizard.tsx) (728 LOC) | Alta | Baixo |
| Dashboard | ✅ Completo | [DashboardHome.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/DashboardHome.tsx) (623 LOC), [HomeCarousel.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/HomeCarousel.tsx) | Alta | Baixo |
| Agenda/Eventos | ✅ Completo | [EventDetailsModal.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/EventDetailsModal.tsx), [MobileAgendaView.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/MobileAgendaView.tsx), [EventsModule.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/admin/EventsModule.tsx) | Alta | Médio — calendário inline no App.tsx |
| Academy (Vídeos) | ✅ Completo | [Academy.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/Academy.tsx), [VideoPlayer.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/VideoPlayer.tsx), [AcademyModule.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/admin/AcademyModule.tsx) | Média | Baixo |
| Member Book | ✅ Completo | [MemberBook.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/MemberBook.tsx) (687 LOC), [ProfilePreview.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfilePreview.tsx) | Alta | Médio — matchEngine não paginado |
| Perfil | ✅ Completo | [ProfileEdit.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfileEdit.tsx) (1078 LOC), [ProfileSection.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfileSection.tsx), [ProfileHistory.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfileHistory.tsx) | Muito Alta | Alto — God Component |
| Chat/Mensagens | ✅ Completo | [ChatWindow.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ChatWindow.tsx) (805 LOC), [ConversationList.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ConversationList.tsx), [MessagesView.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/MessagesView.tsx) | Muito Alta | Médio |
| Notificações | ✅ Completo | [NotificationCenter.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/NotificationCenter.tsx), [NotificationsPage.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/NotificationsPage.tsx), [AdminNotifications.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/AdminNotifications.tsx) | Alta | Baixo |
| Galeria | ✅ Completo | [Gallery.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/Gallery.tsx), [GalleryModule.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/admin/GalleryModule.tsx) | Baixa | Baixo |
| News/Blog | ✅ Completo | [NewsList.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/NewsList.tsx), [ArticleReader.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ArticleReader.tsx), [AdminArticleEditor.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/admin/AdminArticleEditor.tsx) | Média | Baixo |
| Business Core (ROI) | ✅ Completo | `MyDealsScreen`, `ReferralsScreen`, `RankingsScreen`, `RegisterDealModal` | Muito Alta | Médio |
| Admin Panel | ✅ Completo | [AdminApp.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/AdminApp.tsx) (732 LOC) + 23 componentes admin | Alta | Médio — shared components dentro de AdminApp.tsx |
| Prosperus Tools | ✅ Completo | `ProsperusToolsPage`, `SolutionsListPage`, `ProgressListPage` | Média | Baixo |
| Push Notifications | ✅ Completo | [usePushNotifications.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/hooks/usePushNotifications.ts), Edge Function `send-push` | Alta | Baixo |
| Busca Global | ✅ Completo | [GlobalSearchBar.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/GlobalSearchBar.tsx), [searchService.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/searchService.ts) | Média | Baixo |
| Favoritos | ✅ Completo | [FavoritesPage.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/FavoritesPage.tsx), [FavoriteButton.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/FavoriteButton.tsx), [favoriteService.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/favoriteService.ts) | Média | Baixo |

### 1.3 Contagem de Componentes

| Métrica | Quantidade |
|---------|-----------|
| Total de componentes React | ~87 |
| Componentes admin | 23 (+6 shared) |
| Componentes member-facing | ~54 |
| Componentes business | 11 |
| Componentes UI reusáveis | 4 |
| Hooks customizados | 13 |
| Serviços/APIs | 24 |
| Tabelas Supabase | 15 |
| Edge Functions | 4 |
| Testes | ~8 arquivos |
| Total de linhas (tsx+ts, sem node_modules) | ~38.000 |

---

## SEÇÃO 2 — AUDITORIA DE CÓDIGO

### 2.1 Problemas Críticos 🔴

#### 1. God Component: [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx) — 1.597 linhas
- **Arquivo:** [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx)
- **Problema:** Contém TODA a navegação, a lógica de autenticação duplicada, o calendário desktop inline (200+ linhas de JSX), e a renderização condicional de todas as views.
- **Impacto:** Qualquer mudança de UI pode quebrar fluxos não relacionados. Re-renders desnecessários em todo o app.
- **Solução:** Extrair navegação para um Router (react-router ou custom), mover o calendário para componente dedicado, criar um Layout Shell.

#### 2. God Component: [ProfileEdit.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfileEdit.tsx) — 1.078 linhas
- **Arquivo:** [ProfileEdit.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfileEdit.tsx)
- **Problema:** Maior componente do app. Mistura lógica de formulário, upload de imagem, crop, validação, e salvamento.
- **Impacto:** Manutenção extremamente difícil. Risco de regressão em edições.
- **Solução:** Decompor em: `ProfileForm`, `AvatarUpload`, `SocialLinksEditor`, `TagsEditor`, `StrategicProfileEditor`.

#### 3. ProfileEdit renderizado 2x no [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx)
- **Arquivo:** [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx) — linhas 1521-1528 e 1577-1591
- **Problema:** `<ProfileEdit>` é renderizado duas vezes — uma dentro do `<main>` e outra no final do JSX.
- **Impacto:** Comportamento imprevisível. Dois modais podem abrir simultaneamente.
- **Solução:** Remover a segunda instância (linhas 1577-1591).

#### 4. Queries `select('*')` em 12 locais
- **Arquivos:** [adminBusinessService.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/adminBusinessService.ts), [videoService.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/videoService.ts), [eventService.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/eventService.ts), [favoriteService.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/favoriteService.ts), [ProfileHistory.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/components/ProfileHistory.tsx), [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx)
- **Problema:** Buscar todas as colunas é anti-pattern para performance e segurança.
- **Impacto:** Dados desnecessários trafegam pela rede. Colunas sensíveis podem vazar para o client.
- **Solução:** Substituir por `.select('id, title, ...)` especificando apenas as colunas necessárias.

#### 5. Lógica de Auth duplicada entre [AuthContext.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/contexts/AuthContext.tsx) e [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx)
- **Arquivos:** [AuthContext.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/contexts/AuthContext.tsx) e [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx) linhas 395-464
- **Problema:** App.tsx ainda mantém `supabase.auth.getSession()` e `supabase.auth.onAuthStateChange()` independentes, apesar de AuthContext já gerenciar tudo. Os handlers no App.tsx estão parcialmente desabilitados com comentários `⚠️ REMOVED/DISABLED`.
- **Impacto:** Dois listeners de auth criando race conditions. Sessão sendo setada em dois lugares: `AuthContext.session` e `App.session` (local state).
- **Solução:** Remover TODA a lógica de auth de App.tsx. Usar exclusivamente [useAuth()](file:///Applications/MAMP/htdocs/prosperus-club-app/contexts/AuthContext.tsx#272-280).

#### 6. `session: any` em App.tsx
- **Arquivo:** [App.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/App.tsx) — linha 157
- **Problema:** `const [session, setSession] = useState<any>(null)` — tipo any em estado crítico de autenticação.
- **Impacto:** Sem type-safety em toda a lógica de sessão.
- **Solução:** Tipar como `Session | null` do `@supabase/supabase-js`.

#### 7. Dois Supabase Clients ([lib/supabase.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/lib/supabase.ts) e [services/supabaseClient.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/supabaseClient.ts))
- **Arquivos:** [lib/supabase.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/lib/supabase.ts) e [services/supabaseClient.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/supabaseClient.ts)
- **Problema:** Dois clientes Supabase são criados — o de `lib/` com auth config (persistSession, storageKey) e o de `services/` sem config.
- **Impacto:** Serviços que importam de [services/supabaseClient.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/supabaseClient.ts) não terão persistência de sessão correta.
- **Solução:** Eliminar [services/supabaseClient.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/services/supabaseClient.ts) e usar apenas [lib/supabase.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/lib/supabase.ts) em todo o projeto.

#### 8. `@supabase/auth-helpers-nextjs` como dependência
- **Arquivo:** [package.json](file:///Applications/MAMP/htdocs/prosperus-club-app/package.json) — linha 16
- **Problema:** Pacote de Next.js instalado num projeto Vite. Não é usado em lugar nenhum.
- **Impacto:** Aumenta bundle size e confusão para devs.
- **Solução:** Remover `@supabase/auth-helpers-nextjs` do package.json.

### 2.2 Débitos Técnicos 🟡

| # | Problema | Arquivos | Impacto |
|---|---------|----------|---------|
| 1 | **30+ arquivos com console.log em produção** | Todos listados acima | Poluição do console, potencial leak de dados |
| 2 | **20+ arquivos com `: any`** | App.tsx, AdminApp.tsx, services, hooks | Perda de type-safety |
| 3 | **8 TODOs pendentes** | ProfileEdit.tsx, profileService.ts, useCursEducaTracker.ts | Campo `phone` comentado esperando migration 011 |
| 4 | **Componentes com 600-1000+ linhas** | ChatWindow (805), EventsModule (816), AdminMemberProgress (798), OnboardingWizard (728), MemberBook (687) | Difíceis de manter |
| 5 | **mockData.ts (662 LOC) ainda em uso** | [AdminApp.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/AdminApp.tsx) importa `dataService` para Notifications e Categories | Mock misturado com dados reais |
| 6 | **calendarUtils duplicado** | [calendarUtils.ts](file:///Applications/MAMP/htdocs/prosperus-club-app/utils/calendarUtils.ts) e [calendarUtils.tsx](file:///Applications/MAMP/htdocs/prosperus-club-app/utils/calendarUtils.tsx) em `/utils` | Arquivo .ts e .tsx com funcionalidade similar |
| 7 | **Shared admin components dentro de AdminApp.tsx** | `DataTable`, `Modal`, `FormInput`, `RichTextEditor` definidos no AdminApp.tsx | Não reusáveis fora do admin |
| 8 | **`fetchAndSetUserProfile` morta em App.tsx** | Linhas 266-393 | Função desabilitada mas não removida (140 linhas de dead code) |

### 2.3 Boas Práticas Identificadas ✅

| Prática | Onde |
|---------|-----|
| **Code splitting com React.lazy** | App.tsx — 15 componentes lazy loaded |
| **AuthContext centralizado** | `contexts/AuthContext.tsx` — padrão sólido com cleanup |
| **Safety timeout para loading** | AuthContext com 20s timeout para evitar loading infinito |
| **TOKEN_REFRESHED handling** | AuthContext previne re-renders quando browser retoma foco |
| **Supabase client com auth persistence** | `lib/supabase.ts` com storageKey customizado |
| **PWA completo** | vite.config.ts com manifest, icons, shortcuts, share_target |
| **Custom sw.js versioning** | Plugin `swVersionStamp()` para cache busting automático |
| **Safe area insets** | CSS variables `--header-h` e `--nav-h` com env() |
| **Realtime cleanup** | Todos os 4 hooks de realtime fazem `removeChannel` no cleanup |
| **Testes estruturados** | Vitest + Testing Library com mocks de Supabase |
| **Zod + react-hook-form** | Validação robusta onde implementado |
| **Match Engine** | `utils/matchEngine.ts` para networking inteligente entre sócios |
| **Hook de pull-to-refresh** | `usePullToRefresh.ts` para UX mobile nativa |
| **Offline Storage** | `offlineStorage.ts` com cache e expiração |

### 2.4 Análise de Performance

| Item | Status | Detalhe |
|------|--------|--------|
| Queries com select(*) | 🔴 12 ocorrências | Dados desnecessários trafegam |
| Realtime subscriptions | ✅ 4 canais com cleanup | Notifications, chat messages, unread count, typing |
| Lazy loading | ✅ 15 componentes | Bom code splitting |
| Bundle: dependência desnecessária | 🟡 `@supabase/auth-helpers-nextjs` | Não utilizado |
| Bundle: `react-quill` | 🟡 Pesado (~300KB) | Usado apenas no admin |
| useMemo/useCallback | 🟡 Não usado sistematicamente | Listas grandes (MemberBook 687 LOC) sem memoização |
| Paginação em listas | 🔴 Ausente | Members, deals, referrals carregam tudo |
| Imagens otimizadas | 🟡 Parcial | Logo externo (salesprime.com.br), avatares via Supabase Storage |

---

## SEÇÃO 3 — AUDITORIA DE UX/UI

### 3.1 Fluxos Críticos

#### Fluxo: Login / Primeiro Acesso
- **Passos:** Login com email/senha → Auth → Role check → RoleSelector (admin/team) → Dashboard
- **Problemas:** Sem login social (Google/Apple). Password recovery funcional. Recovery modal aparece durante login flow normal (se URL contém hash token).
- **Recomendações:** Adicionar login social. Implementar "remember me".

#### Fluxo: Onboarding do Novo Sócio
- **Passos:** Login → `has_completed_onboarding=false` → OnboardingWizard (multi-step) → Profile creation
- **Problemas:** Onboarding wizard tem 728 linhas. Se o usuário fecha o app durante onboarding, perde progresso.
- **Recomendações:** Salvar progresso parcial. Decompor wizard em steps menores.

#### Fluxo: Agenda → Ver Evento → RSVP
- **Passos:** Tab Agenda → Lista/Calendário → Click evento → EventDetailsModal
- **Problemas:** RSVP não implementado no PRD. Modal de 708 linhas com materiais, export para Google Calendar funcional.
- **Recomendações:** Implementar RSVP com confirmação de presença.

#### Fluxo: Member Book → Ver Perfil → Contato
- **Passos:** Tab Sócios → Grid/Search → Click → ProfilePreview → WhatsApp/Chat
- **Problemas:** Todos os profiles carregados de uma vez (sem paginação). Match engine roda no client.
- **Recomendações:** Paginação + busca server-side.

#### Fluxo: Chat → Nova Conversa → Mensagem
- **Passos:** Tab Chat → ConversationList → NewConversationModal → ChatWindow
- **Problemas:** ChatWindow (805 LOC) funcional. Typing indicator implementado. Sem suporte a mídia (apenas texto).
- **Recomendações:** Adicionar envio de imagens. Implementar read receipts visuais.

#### Fluxo: Admin → Gestão de Sócios
- **Passos:** Login → RoleSelector → Admin → Members → Block/Unblock
- **Problemas:** Role check é feito client-side (`alert + onLogout`). Sem middleware server-side.
- **Recomendações:** Implementar RLS policies que verifiquem role para operações admin.

### 3.2 Inconsistências de Design System

| Problema | Detalhes |
|----------|---------|
| **Cores customizadas vs. Tailwind** | Usa `prosperus-gold`, `prosperus-navy` (customizadas) mas também `slate-800`, `yellow-500` (padrão Tailwind) misturados |
| **Múltiplas implementações de Modal** | `Modal` em AdminApp.tsx, `ModalWrapper` em components/ui, `EventDetailsModal` usa modal próprio |
| **Componentes UI limitados** | Apenas 4 componentes em `/components/ui` (Avatar, Button, ModalWrapper, PullToRefresh) |
| **Ícones** | Consistente — usa apenas `lucide-react` ✅ |
| **Dark mode** | 100% dark mode — consistente ✅ |

### 3.3 Acessibilidade

| Item | Status | Detalhes |
|------|--------|---------|
| aria-labels | 🔴 Apenas 9 em todo o projeto | Maioria dos botões icon-only sem aria-label |
| Touch targets | 🟡 Parcial | Botões de nav mobile são pequenos (text-[9px]) |
| Contraste | ✅ Bom | Text branco/gold sobre fundo escuro |
| Alt text em imagens | 🟡 Parcial | Logo tem alt, avatares têm, mas muitas imagens sem |
| Focus management em modais | 🔴 Ausente | Modais não fazem focus trap |
| Labels em forms | 🟡 Parcial | FormInput tem labels, mas selects avulsos não |

### 3.4 Mobile UX

| Item | Status | Detalhes |
|------|--------|---------|
| Safe area insets | ✅ Implementado | CSS variables com env() |
| Keyboard avoidance (iOS) | 🟡 Não verificável sem teste real | Sem código específico para isso |
| Loading states | ✅ Implementado | LazyFallback + spinner em AuthContext |
| Empty states | 🟡 Parcial | DataTable tem empty state, mas listas de members/events não |
| Error states | 🟡 Parcial | Errors logados no console, nem sempre exibidos para o user |
| Pull-to-refresh | ✅ Implementado | `usePullToRefresh.ts` + `PullToRefresh.tsx` |
| Bottom nav | ✅ 5 itens | Início, Agenda, P.Tools, Sócios, Galeria — fixo no bottom |
| Gestures | ✅ | `@use-gesture/react` para carousel swipe |

---

## SEÇÃO 4 — AUDITORIA DE ESCALABILIDADE

### 4.1 Banco de Dados (Supabase)

| Item | Status | Detalhes |
|------|--------|---------|
| Tabelas com RLS | 🟡 Provável | 16 SQL de fix_rls no diretório `/sql` indica problemas passados |
| Índices | 🟡 Desconhecido | Schema não mostra índices além de PKs |
| Paginação | 🔴 Ausente | Nenhum `.range()` ou `.limit()` nos services principais |
| Soft delete | ✅ Parcial | Messages tem `is_deleted` + `deleted_at`. Profiles não. |
| Timestamps | ✅ | Todas as tabelas têm `created_at`, maioria tem `updated_at` |
| Campos JSONB tipados | 🟡 | `socials`, `exclusive_benefit`, `metadata`, `device_info` são JSONB |
| N+1 Queries | 🟡 | Não observado padrão extremo, mas `profileService.getProfile()` chamado em loop no DashboardHome |

### 4.2 Arquitetura de Estado

| Item | Status | Detalhes |
|------|--------|---------|
| Cache de dados | 🔴 Ausente | Cada view faz fetch novo. Sem react-query/SWR |
| Context Providers | ✅ Correto | Apenas 2: AuthProvider e UnreadCountContext |
| Realtime cleanup | ✅ | Todos os 4 hooks fazem cleanup correto |
| Optimistic UI | 🔴 Ausente | Ações como RSVP, deal registration, chat message esperam resposta do server |

### 4.3 Autenticação e Segurança

| Item | Status | Detalhes |
|------|--------|---------|
| Rotas admin sem verificação server-side | 🔴 | AdminApp.tsx verifica role no client. RLS pode não cobrir todas as operações. |
| `.env` commitado no git | ✅ Seguro | `.env` está no `.gitignore` |
| Service Role Key no `.env` | 🟡 Risco | Presente no `.env` local. Se o `.env` vazar, acesso total ao Supabase. |
| Upload sem validação | 🟡 | `ImageUpload.tsx` valida tipo (imagem), mas não há validação server-side de tamanho |
| Rate limiting | 🔴 Ausente | Sem rate limiting em send-push, chat, deal registration |
| 2FA | 🔴 Ausente | Sem autenticação de dois fatores |

### 4.4 Escalabilidade para 1.000+ Sócios

| Cenário | Risco | Detalhes |
|---------|-------|---------|
| Member Book com 1.000 profiles | 🔴 Alto | `getAllProfiles()` carrega TODOS sem paginação. Match engine roda no client. |
| Chat com 100+ conversas | 🟡 Médio | Subscriptions são por conversa (1 canal por vez). Mas ConversationList carrega todas. |
| Agenda com 100+ eventos/mês | 🟡 Médio | Calendário carrega todos os eventos no mount. |
| Vídeos Academy | 🟡 Médio | `select('*')` em videoService. CursEduca player funcional. |
| Notificações push em massa | 🟡 Médio | Edge Function `send-push` existe mas não há batch processing visível. |

---

## SEÇÃO 5 — FUNCIONALIDADES: ROADMAP vs. IMPLEMENTADO

### 5.1 Gap Analysis

| Feature do PRD/Roadmap | Status | % Completo | Bloqueadores |
|-----------------------|--------|------------|--------------|
| Login email/senha | ✅ | 100% | — |
| Password recovery | ✅ | 100% | — |
| Onboarding wizard | ✅ | 95% | Campo phone comentado (migration 011) |
| Dashboard com feed híbrido | ✅ | 100% | — |
| Agenda de eventos | ✅ | 100% | — |
| Academy (vídeos) | ✅ | 100% | — |
| CursEduca integration | ✅ | 90% | `TODO: Uncomment after discovering correct origin` |
| Member Book + Match Engine | ✅ | 100% | Sem paginação |
| Chat entre membros | ✅ | 95% | Sem envio de mídia |
| Notificações push | ✅ | 90% | Rate limiting ausente |
| Notification Center in-app | ✅ | 100% | — |
| Galeria multi-álbum | ✅ | 100% | — |
| News/Blog | ✅ | 100% | — |
| Banners gerenciáveis | ✅ | 100% | — |
| ROI entre sócios (Deals) | ✅ | 100% | — |
| Rankings de indicações | ✅ | 100% | — |
| Referrals (indicações) | ✅ | 100% | — |
| Admin Panel completo | ✅ | 100% | — |
| Analytics Dashboard | ✅ | 100% | — |
| PWA com install prompt | ✅ | 100% | — |
| Offline support | ✅ | 80% | Cache limitado, sem sync |
| Favoritos | ✅ | 100% | — |
| Busca global | ✅ | 100% | — |
| Prosperus Tools (Soluções/Progresso) | ✅ | 100% | — |
| Integração HubSpot | 🔄 | 40% | Edge Function existe, mas sync bidirecional incompleto |
| Login social (Google/Apple) | ❌ | 0% | Não implementado |
| 2FA/MFA | ❌ | 0% | Não implementado |
| RSVP para eventos | ❌ | 0% | Não implementado |
| Envio de mídia no chat | ❌ | 0% | Apenas texto |

### 5.2 Features Não Documentadas no Roadmap

| Feature | Arquivo | Descrição |
|---------|---------|-----------|
| Profile History | `ProfileHistory.tsx` | Histórico de alterações de perfil com audit trail |
| User blocking | `profiles.is_blocked`, SQL files | Admin pode bloquear/desbloquear sócios |
| Image Crop | `ImageCrop.tsx` | Crop de avatar antes de upload |
| Export Service | `exportService.ts` | Exportação de dados |
| Profile Completion Widget | `ProfileCompletionWidget.tsx` | Barra de progresso do perfil |
| Settings Module | `AppSettingsModule.tsx`, `settingsService.ts` | Configurações do app |
| Badge Service | `badgeService.ts` | Sistema de badges (provavelmente incompleto) |

### 5.3 TODOs com Impacto de Negócio

| Local | TODO | Impacto |
|-------|------|---------|
| `ProfileEdit.tsx:65` | Phone field comentado espera migration 011 | Sócios não podem adicionar telefone no perfil |
| `profileService.ts:32,64` | Phone field comentado | Idem |
| `useCursEducaTracker.ts:141` | Origin correto do CursEduca desconhecido | Tracking de progresso de vídeos pode não funcionar |

---

## SEÇÃO 6 — PLANO DE MELHORIAS PRIORIZADAS

### 6.1 Matriz de Prioridade

| # | Melhoria | Impacto | Esforço | Prioridade |
|---|---------|---------|---------|------------|
| 1 | Remover ProfileEdit duplicado no App.tsx | Alto | Baixo | 🔴 |
| 2 | Limpar lógica de auth duplicada do App.tsx | Alto | Médio | 🔴 |
| 3 | Eliminar `services/supabaseClient.ts` duplicado | Alto | Baixo | 🔴 |
| 4 | Substituir `select('*')` por selects específicos | Alto | Médio | 🔴 |
| 5 | Tipar `session: any` em App.tsx | Médio | Baixo | 🔴 |
| 6 | Remover `@supabase/auth-helpers-nextjs` | Baixo | Baixo | 🔴 |
| 7 | Adicionar paginação ao Member Book | Alto | Médio | 🟡 |
| 8 | Remover console.logs de produção | Médio | Médio | 🟡 |
| 9 | Decompor App.tsx em Router + Layout | Alto | Alto | 🟡 |
| 10 | Decompor ProfileEdit.tsx | Médio | Alto | 🟡 |
| 11 | Remover dead code (fetchAndSetUserProfile) | Baixo | Baixo | 🟡 |
| 12 | Adicionar aria-labels a icon buttons | Médio | Baixo | 🟡 |
| 13 | Implementar focus trap nos modais | Médio | Médio | 🟡 |
| 14 | Rodar migration 011 (campo phone) | Médio | Baixo | 🟡 |
| 15 | Implementar cache layer (react-query/SWR) | Alto | Alto | 🟢 |
| 16 | Implementar login social | Alto | Médio | 🟢 |
| 17 | Extrair shared admin components | Médio | Médio | 🟢 |
| 18 | Implementar RSVP para eventos | Médio | Médio | 🟢 |
| 19 | Implementar envio de imagens no chat | Médio | Alto | 🟢 |
| 20 | Implementar rate limiting | Alto | Médio | 🟢 |

### 6.2 Quick Wins (< 2 horas cada)

1. **Remover ProfileEdit duplicado** (linhas 1577-1591 de App.tsx) — 10 min
2. **Eliminar `services/supabaseClient.ts`** e atualizar imports — 30 min
3. **Remover `@supabase/auth-helpers-nextjs`** do package.json — 5 min
4. **Tipar `session` como `Session | null`** — 15 min
5. **Remover dead code (`fetchAndSetUserProfile`)** ~140 linhas — 15 min
6. **Rodar migration 011 e descomentar campo phone** — 30 min
7. **Remover `calendarUtils.ts` duplicado** (manter apenas .tsx) — 10 min
8. **Adicionar aria-labels** nos 30+ botões icon-only — 1h

### 6.3 Iniciativas Estratégicas (médio-longo prazo)

| Iniciativa | Complexidade | Dependências |
|-----------|-------------|--------------|
| **Refatorar App.tsx em Router + Layout** | Alta (3-5 dias) | Nenhuma. Base para tudo. |
| **Implementar react-query para cache** | Alta (2-3 dias) | Router pronto |
| **Server-side pagination** | Média (2 dias) | Supabase RPC ou views |
| **Migrar mock data para Supabase** | Média (2 dias) | Categories e Notifications ainda usam mockData |
| **CI/CD pipeline** | Média (1-2 dias) | GitHub Actions ou similar |
| **Teste de integração E2E** | Alta (3-5 dias) | Playwright ou Cypress |

### 6.4 Sugestões de Features Novas

| Feature | Justificativa de Negócio | Complexidade | Dependências |
|---------|-------------------------|-------------|--------------|
| **Check-in em eventos** | Comprova presença, gera dados de engajamento para sponsors | Média | RSVP implementado |
| **Sistema de grupos/comitês** | Sócios se organizam em subgrupos temáticos — facilita networking | Alta | Chat + roles |
| **Marketplace de serviços** | Sócios publicam ofertas exclusivas para a comunidade | Alta | Profiles + search |
| **NPS/satisfaction surveys** | Admin mede satisfação periodicamente — retém sócios | Média | Notifications |
| **Integração com calendário nativo** | Deep link para Google Calendar / Apple Calendar | Baixa | Já parcialmente existe |
| **Dashboard de ROI pessoal** | Cada sócio vê seu impacto no clube (negócios, indicações, presença) | Média | Business Core dados |

---

## SEÇÃO 7 — SAÚDE GERAL DO SISTEMA

### 7.1 Score por Dimensão

| Dimensão | Score | Justificativa |
|----------|-------|---------------|
| Qualidade de Código | **6/10** | TypeScript bem usado na maioria, mas God Components, dead code e `: any` reduzem nota |
| Cobertura de Testes | **3/10** | Apenas ~8 arquivos de teste. Sem E2E. Sem CI. |
| Segurança | **5/10** | RLS existente mas com histórico de fixes. Rate limiting ausente. Admin check client-side. |
| Performance | **5/10** | Code splitting bom, mas sem paginação, sem cache, select(*) abundante |
| UX/Usabilidade | **7/10** | Fluxos completos, mobile-first, PWA funcional. Faltam RSVP, empty states e error states |
| Design Consistency | **7/10** | Dark mode 100% consistente. Lucide-react uniform. Mas modais duplicados e UI components genéricos ausentes |
| Escalabilidade | **4/10** | Sem paginação, sem cache, member book carrega tudo, sem rate limiting |
| Documentação | **8/10** | 73 documentos no `/docs`. PRD detalhado. Mas muitos são fixes históricos, sem docs de API |
| **MÉDIA GERAL** | **5.6/10** | |

### 7.2 Resumo Executivo

O **Prosperus Club App é um produto funcional e impressionantemente completo** para o estágio em que se encontra. Todas as features principais do PRD estão implementadas: login, onboarding, chat, agenda, academy, member book, business core (ROI + indicações + rankings), galeria, news, admin panel com analytics. O app é uma PWA com install prompt, push notifications e offline support. O design visual é consistente, 100% dark mode, com identidade visual profissional.

**O risco mais importante é escalabilidade.** O app funciona bem para 50-100 sócios, mas vai degradar significativamente com 500+. A ausência de paginação no Member Book, a falta de cache de dados, e as 12 queries `select('*')` criam um cenário onde o app ficará lento à medida que a base crescer. Em paralelo, a arquitetura de estado centralizada em `App.tsx` (1.597 linhas) torna manutenção arriscada.

**A próxima ação mais valiosa** é um sprint de "housekeeping" focado em: (1) eliminar as duplicações críticas (ProfileEdit 2x, supabase client 2x, auth logic 2x), (2) implementar paginação nos endpoints principais, e (3) refatorar App.tsx em um Router + Layout pattern. Estas 3 iniciativas reduzem risco de bugs, melhoram performance e preparam o terreno para escalar.
