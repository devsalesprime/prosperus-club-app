# Prosperus Club App

[![CI — Build & TypeCheck](https://github.com/seu-org/prosperus-club-app/actions/workflows/main.yml/badge.svg)](https://github.com/seu-org/prosperus-club-app/actions/workflows/main.yml)

> Plataforma exclusiva para sócios do Prosperus Club — PWA com experiência nativa.

---

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 · TypeScript 5.8 · Vite 6 |
| **Styling** | TailwindCSS 4 |
| **Backend** | Supabase (Auth · Database · Edge Functions · Realtime · Storage) |
| **State** | TanStack React Query 5 · React Context |
| **PWA** | Workbox · vite-plugin-pwa · Web Push API |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts 3 |
| **Gestures** | @use-gesture/react |

---

## Setup Local

```bash
# 1. Clone
git clone https://github.com/seu-org/prosperus-club-app.git
cd prosperus-club-app

# 2. Instale as dependências
npm ci

# 3. Configure o ambiente
cp .env.example .env
# Preencha as variáveis do Supabase

# 4. Rode o dev server
npm run dev
```

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run test` | Testes unitários (Vitest) |
| `npm run lint` | Linting (ESLint) |
| `npm run format` | Formatação (Prettier) |

---

## Estrutura de Pastas (DDD)

```
prosperus-club-app/
├── .github/            # CI/CD workflows e PR templates
├── components/         # Componentes React (por domínio)
│   ├── academy/        #   Vídeos e cursos
│   ├── admin/          #   Painel administrativo
│   ├── auth/           #   Login e autenticação
│   ├── business/       #   ROI, indicações, negócios
│   ├── chat/           #   Sistema de mensagens
│   ├── dashboard/      #   Tela inicial do sócio
│   ├── events/         #   Agenda e eventos
│   ├── gallery/        #   Galeria de fotos
│   ├── notifications/  #   Centro de notificações
│   ├── profile/        #   Perfil do sócio
│   ├── push/           #   Push notifications
│   └── ui/             #   Componentes reutilizáveis
├── contexts/           # React Contexts globais
├── docs/               # Documentação técnica e PRDs
├── hooks/              # Custom hooks (gestures, queries, realtime)
├── lib/                # Clientes externos (Supabase)
├── pages/              # Páginas e rotas
├── public/             # Assets estáticos (icons, splashes, SW)
├── scripts/            # Scripts de build, deploy e migrations
├── services/           # Camada de serviço (API calls, business logic)
├── supabase/           # Migrations, Edge Functions, seeds
├── tests/              # Testes unitários e E2E
└── utils/              # Utilitários puros (formatters, validators)
```

---

## CI/CD

O repositório usa **GitHub Actions** para validar automaticamente:

- ✅ `npx tsc --noEmit` — Zero erros de TypeScript
- ✅ `npm run build` — Build de produção completa

Pull Requests para `main` são bloqueados se qualquer check falhar.

---

## Licença

Proprietário — © Prosperus Club. Todos os direitos reservados.
