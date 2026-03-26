<div align="center">

# 👑 Prosperus Club App

**Plataforma Digital Premium e Exclusiva para Membros de Clubes de Negócios**

[![Version](https://img.shields.io/badge/version-3.2.0-CA9A43?style=for-the-badge&logo=rocket&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-031A2B?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-031A2B?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-031A2B?style=for-the-badge&logo=tailwindcss&logoColor=38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

O **Prosperus Club App** é um *Progressive Web App* (PWA) de alto padrão, arquitetado para orquestrar o ecossistema de um clube de negócios fechado. A plataforma resolve a dor da fragmentação corporativa, centralizando networking, consumo de conteúdo, eventos e rastreabilidade financeira em um ambiente unificado, seguro e com design *premium*.

</div>

---

## 📱 1. Visão Geral do Produto

O sistema é estruturado em duas frentes com controles estritos de acesso via *Row-Level Security* (RLS) e hierarquia de papéis (`MEMBER`, `TEAM`, `ADMIN`):

### 🤵 Experiência do Sócio (Member App)
* **Hub de Negócios (Business Core):** Funil completo para envio/recebimento de Indicações (*Referrals*) e registro de Negócios Fechados (*Deals*) auditados, gerando Rankings de performance em tempo real.
* **Networking Premium:** Diretório de membros com busca avançada, perfis ricos e Chat 1-a-1 em tempo real com *typing indicators* e recibos de leitura.
* **Eventos & Agenda:** Calendário interativo com RSVP de um clique, ingressos digitais via QR Code e check-in silencioso integrado ao Zoom para eventos virtuais.
* **Academy & Conteúdo:** Player multimídia nativo (YouTube, Vimeo, CursEduca) com tracking de progresso, biblioteca de arquivos e portal de Artigos.
* **Aha Moments (UX Emocional):** Homenagens de aniversário em *Full-Screen* (Formato Stories) com transições *Optimistic UI*, sincronizadas nativamente com o CRM.

### 🛡️ Experiência da Diretoria (Admin Dashboard)
* **Smart Login & Compliance:** Acesso validado em tempo real com o CRM (HubSpot). Sócios inativos ou inadimplentes perdem acesso automaticamente (`situacao_do_negocio`).
* **Analytics & BI Avançado:** Painéis interativos construídos com `Recharts` detalhando engajamento por benefício, ROI auditado, taxa de *churn*, acessos diários e funil de vendas.
* **Gestão em Massa (Bulk Actions):** Produtividade multiplicada em 10x com ações em lote para alterar cargos, ativar ou inativar dezenas de usuários simultaneamente.
* **Exportação Universal:** Geração de relatórios CSV nativos com codificação UTF-8 BOM (garantindo 100% de compatibilidade com acentuação no MS Excel).
* **Comunicação Direcionada:** Motor de envio de *Push Notifications* segmentadas por comportamento (ex: "Apenas Ativos", "Risco de Churn") ou cargo.
* **Trilha de Auditoria:** Tabela persistente de logs (`admin_audit_log`) rastreando todas as ações críticas da equipe para compliance absoluto.
* **Omnisearch:** Busca global no cabeçalho (*Typeahead*) para localizar rapidamente Sócios, Negócios e Eventos.

---

## 🏗️ 2. Arquitetura de Software (Clean Architecture)

A base de código foi refatorada para seguir rigorosamente o princípio de **Separação de Conceitos (Separation of Concerns - SoC)**. A regra de ouro do repositório é: **A camada visual (UI) não possui conhecimento sobre a infraestrutura de dados ou queries de banco.**

### 📂 Estrutura de Diretórios

```text
prosperus-club-app/
├── 📁 .context/            # 🤖 DOTCONTEXT: Memória e regras persistentes para IAs
├── 📁 docs/                # 📄 Documentação (DESIGN_SYSTEM.md etc)
├── 📁 src/                 # Código Fonte Frontend principal
│   ├── 📁 components/      # 🧩 Camada de Apresentação (UI Layer). Nenhuma regra de DB aqui.
│   │   ├── 📁 admin/       # Telas exclusivas da administração (Lazy Loaded)
│   │   ├── 📁 chat/        # Chat online Realtime
│   │   ├── 📁 financeiro/  # Relatórios Financeiros e Calculadoras
│   │   ├── 📁 layout/      # Estruturas base (Sidebar, BottomNav, ViewSwitcher)
│   │   └── 📁 ui/          # Primitivos padronizados, Error Boundaries e Modais
│   ├── 📁 contexts/        # 📦 Estado Global (Auth, App, UnreadCount)
│   ├── 📁 hooks/           # 🎣 Custom Hooks (React Query, Gestures, Realtime, Paginação)
│   ├── 📁 services/        # ⚙️ Camada de Dados (APIs). Interação EXCLUSIVA com o Supabase
│   ├── 📁 utils/           # 🧰 Utilitários genéricos e formatações
│   └── 📄 types.ts         # 🏷️ Interfaces Estritas do TypeScript (Zero `any`)
├── 📁 scripts/             # Ferramentas autônomas e scripts de build
├── 📁 supabase/            # Infraestrutura Backend-as-a-Code
│   ├── 📁 functions/       # 🌩️ Edge Functions Serverless em Deno
│   └── 📁 migrations/      # 🗄️ Controle rigoroso de versão do banco de dados (schema)
└── 📄 vite.config.ts       # ⚡ Configuração de Build, PWA e Otimização
```

### 🧠 Padrões Técnicos Inegociáveis (ADRs)

*   **Zero Queries na UI:** É estritamente proibido utilizar `supabase.from()` dentro de arquivos `.tsx`. Toda a comunicação com o banco reside na pasta `services/`.
*   **Zero any:** O projeto opera com tipagem estrita. O build exige validação `tsc --noEmit` sem erros.
*   **Design System & Tailwind v4:** As cores oficiais (Navy, Card, Border, Gold) estão mapeadas via tokens CSS na diretiva `@theme`. O uso de hexadecimais soltos é proibido.
*   **Mobile-First Real:** O scroll horizontal é proibido. O painel administrativo colapsa tabelas (`<AdminTable>`) em estruturas flexíveis de Cards em resoluções mobile (`md:hidden`).
*   **Zero Alertas Nativos:** Interrupções como `window.alert()` ou `window.confirm()` são banidas. A plataforma utiliza `react-hot-toast` e modais padronizados (`<AdminConfirmDialog>`).
*   **Sanitização de Logs:** É proibido o uso de `console.log`/`error` no frontend de produção. Todo log passa pelo utilitário `utils/logger.ts`.

---

## ⚡ 3. Web Performance Optimization (WPO)

O aplicativo foi agressivamente otimizado (Fases 1, 2 e 4 de WPO) para atingir pontuações máximas no Lighthouse, mitigando o TBT (*Total Blocking Time*) e o FCP (*First Contentful Paint*):

*   **Code Splitting & Lazy Loading:** O roteador administrativo (`AdminApp.tsx`) importa dinamicamente suas 17+ rotas via `React.lazy()` e `<Suspense>`, garantindo um bundle inicial microscópico.
*   **Isolamento de Vendors (`manualChunks`):** Bibliotecas pesadas e imutáveis (React, Supabase, Lucide, Recharts) são extraídas no build do Vite, permitindo cache de longo prazo na CDN e aliviando a Main Thread.
*   **Anti-FOUC (Flash of Unstyled Content):** Injeção de Resource Hints (`preconnect`, `dns-prefetch`) e tokens nativos diretamente no `index.html` para zerar a tela branca de carregamento.
*   **Edge Image Transformation (LCP):** Imagens e avatares hospedados no Supabase Storage são transformados dinamicamente no servidor em formato WebP com dimensões exatas (ex: `48x48`), combinados com `loading="lazy"`.
*   **Resiliência (Error Boundaries):** Falhas isoladas de renderização são capturadas por `<ErrorBoundary>` class-based, oferecendo opções de *fallback* (Tentar Novamente / Recarregar) em vez de crashar a aplicação inteira.

---

## 🔄 4. Integração CRM & Backend (Supabase + HubSpot)

A plataforma opera sob os preceitos de Zero Trust e sincronização 3-Way:

*   **Smart Login Flow:** Toda tentativa de login consulta a API do HubSpot. Se o campo `situacao_do_negocio` constar inativo, o acesso é bloqueado em tempo real (com bypass para admins).
*   **Webhooks Real-Time:** Alterações no CRM (ex: alteração de data de nascimento) disparam webhooks que atualizam o banco do app em milissegundos. Tratamento UTC-Safe implementado para evitar bugs de *day-shift* (fuso horário).
*   **Supabase Edge Functions:** Scripts Serverless em TypeScript/Deno garantem a execução segura de disparos de Push, Webhooks e validação de email sem expor chaves ao frontend.
*   **Row-Level Security (RLS):** Banco de dados PostgreSQL protegido por dezenas de políticas rigorosas, garantindo que membros só vejam o que lhes é permitido e blindando as rotas da Diretoria.

---

## 🛠️ 5. Stack Tecnológica

| Categoria | Tecnologia |
| :--- | :--- |
| **Frontend Core** | React 18.2, TypeScript 5.8, Vite 6 |
| **Estilização & UI** | Tailwind CSS v4, Lucide React (Ícones), React Hot Toast |
| **PWA & Offline** | vite-plugin-pwa, Workbox, Web Push API |
| **Data Fetching** | React Query v5 (`@tanstack/react-query`) |
| **Backend (BaaS)** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Serverless** | Supabase Edge Functions (Deno) |
| **Bibliotecas** | `react-hook-form` + zod, `recharts`, `react-big-calendar`, `date-fns` |
| **Integrações** | HubSpot CRM, Zoom, CursEduca |

---

## 🚀 6. Setup e Desenvolvimento Local

### Pré-requisitos
*   Node.js (v18+)
*   NPM ou Yarn
*   Supabase CLI instalado globalmente (`npm i -g supabase`)

### Passos de Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/sua-org/prosperus-club-app.git
    cd prosperus-club-app
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` (ou `.env.local`) na raiz do projeto baseado no `.env.example`:
    ```env
    VITE_SUPABASE_URL=sua_url_do_projeto
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    ```

4.  **Inicie o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
    O aplicativo estará rodando em `http://localhost:5173`.

### Comandos Úteis e Deploy

```bash
# Verifica tipagem estrita (Garante Zero Erros TypeScript)
npx tsc --noEmit

# Gera o build otimizado para produção (Nginx/VPS)
npm run build

# Deploy das Edge Functions (Supabase)
supabase login
supabase functions deploy hubspot-webhook --no-verify-jwt
supabase functions deploy login-socio --no-verify-jwt
supabase functions deploy check-email-exists --no-verify-jwt
supabase functions deploy send-push --no-verify-jwt
```

---

## 🤖 7. AI Context Ready (DotContext)

Este repositório está instrumentado com o padrão **DotContext** através da pasta oculta `.context/`. 

Ao abrir este projeto em IDEs assistidas por IA (Cursor, Windsurf, GitHub Copilot), o agente inteligente lerá automaticamente as regras arquiteturais (`rules.md`), a identidade visual (`DESIGN_SYSTEM.md`), a persona do Tech Lead (`soul.md`) e o estado atual do progresso (`progress.md`). 

Isso garante que novos códigos gerados sigam estritamente o princípio de Clean Architecture, utilizem os componentes compartilhados corretos e não introduzam dívidas técnicas ou alucinações.

---

<div align="center">
  <p><em>Proprietário — © Prosperus Club. Todos os direitos reservados.</em></p>
</div>
