<div align="center">
  <img src="public/prosperus-icon-512.png" alt="Prosperus Club Logo" width="120" />
  <h1>Prosperus Club App</h1>
  <p><strong>Plataforma Premium e Exclusiva para Membros de Clubes de Negócios</strong></p>
  <p><i>Versão 3.2.0 — "The Golden Crown"</i></p>
</div>

---

## 🌟 Visão Geral

O **Prosperus Club App** é uma Progressive Web App (PWA) de alto nível projetada para proporcionar uma experiência de elite aos seus sócios. Focada em performance, segurança e usabilidade *Mobile-First*, a plataforma engloba desde networking inteligente (Member's Book, Chat Online) até ferramentas financeiras (Calculadora de ROI, Central de Indicações) e gestão da diretoria (Painel Admin).

A arquitetura do projeto é orientada à **Clean Architecture** e ao design **Premium Dark Mode**, pautado no princípio de "Zero Fricção" e *Optimistic UI*.

---

## 🏗️ Stack Tecnológica

* **Frontend:** React 18.2, TypeScript 5.8
* **Styling & UI:** Tailwind CSS v4, Lucide React, React Hot Toast
* **Build Tool:** Vite 6, vite-plugin-pwa
* **State & Data Fetching:** React Context API, React Query v5
* **Backend as a Service:** Supabase (PostgreSQL, Auth, Storage, Realtime)
* **Serverless Functions:** Deno (Supabase Edge Functions)
* **Integrações:** HubSpot CRM (Webhooks), Web Push Notifications, Zoom

---

## 🚀 Novidades da Versão 3.2.0 (The Golden Crown)

Esta versão focou em **Performance Extrema (WPO), Compliance e Experiência do Sócio**.

* **Performance em Escala (FCP e LCP Instantâneos):** 
  Implementação rigorosa de Code Splitting com `React.lazy`, extração de dependências pesadas (`manualChunks` no Rollup/Vite) e *Edge Transformations* do Supabase (conversão on-the-fly para formato `WebP`), mitigando completamente o bloqueio da Main Thread.
* **Sistema de Celebração Premium:** 
  Homenagens automáticas aos sócios na data do aniversário. O *app* apresenta um cartão fullscreen animado de felicitações, perfeitamente sincronizado em tempo real (UTC-safe).
* **Smart Login Flow:** 
  Identificação inteligente no banco nativo utilizando *debounce* associado à sincronização "3-Way" com os pipelines do HubSpot CRM.
* **Architecture Compliance (Zero Type Errors):** 
  Separação estrita de responsabilidades (SoC). Nenhuma *query* ao banco de dados reside na UI; 100% dos fluxos de dados estão isolados em `/services`. Auditoria estrita contra a inferência `any` garantindo robustez de *Enterprise-Grade*.

---

## 💻 Padrões de Desenvolvimento e Engenharia

Para manter a governança arquitetural, todo código desse repositório deve respeitar rigorosamente as seguintes diretrizes documentadas e aplicadas pela nossa IA em contexto portátil (`./.context/*`):

1. **Zero Queries na View:** Todo o código pertencente à manipulação do Supabase localiza-se estritamente na pasta `services/`.
2. **Escrita Typesafe Strict:** É proibida a tipagem `any` global ou bypass estático. 
3. **Design System Source of Truth:** Valores *hardcoded* para cores hexadecimais não são permitidos. Os tokens oficiais via `@theme` no Tailwind (`bg-prosperus-navy`, `text-prosperus-gold`) definem o Dark Mode luxuoso da interface em toda a stack, centralizados através de `docs/DESIGN_SYSTEM.md`.
4. **Mobile-first Nativo:** No Admin, não utilizamos *scroll horizontal* para tabelas. Toda renderização grande (como o `<AdminTable />`) deve colapsar de forma graciosa (responsiva) para interações baseadas no polegar (`Cards`).
5. **UI sem Fricção e Acessível:** Nativos da web como alertas intrusivos (`alert()`, `confirm()`) são vetados, e todos os retornos do sistema fluem a partir do gerenciamento de Toast (*react-hot-toast*) e diálogos em modal desenhados para não interferir na navegação do cliente.

---

## 🚥 Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/prosperus-club-app.git
   cd prosperus-club-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Copie `.env.example` para `.env` e preencha as credenciais do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL="sua-url-do-supabase"
   VITE_SUPABASE_ANON_KEY="sua-chave-anon"
   ```

4. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   *O aplicativo estará disponível em `http://localhost:5173/`.*

---

<div align="center">
    <p>Construído com inteligência, alta performance e <b>Resolução Estruturada</b>. 🌌🪙</p>
</div>
