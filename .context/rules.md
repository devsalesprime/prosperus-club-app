# 🛑 Regras Técnicas Inegociáveis (Hard Rules)

## 1. Código Limpo & TypeScript
- **Zero Any:** É TERMINANTEMENTE PROIBIDO o uso de `: any` ou `as any`. Use interfaces estritas de `types.ts`, `unknown` com type narrowing ou generics. O build falha se `tsc --noEmit` falhar.
- **Sanitização de Logs:** NUNCA use `console.log`, `console.warn` ou `console.error`. Utilize o utilitário centralizado importado de `utils/logger.ts`.

## 2. Arquitetura (SoC - Separation of Concerns)
- **Zero Supabase na UI:** Componentes visuais React (`.tsx`) NÃO FAZEM QUERIES diretas ao Supabase (`supabase.from...`).
- Toda lógica de requisição ao banco deve residir isolada em classes/funções na pasta `services/`.
- Componentes grandes (>300 linhas) devem ser fatiados em submódulos lógicos.

## 3. UI/UX e Design System
- **Zero Native UI:** PROIBIDO o uso de interrupções nativas como `window.alert()` ou `window.confirm()`. Utilize `toast.success/error` (`react-hot-toast`) ou o componente `<AdminConfirmDialog />`.
- **Cores e Tokens:** Proibido uso de hexadecimais soltos (ex: `bg-[#031A2B]`). Use as variáveis do Tailwind v4 (ex: `bg-prosperus-navy`, `text-prosperus-gold`). Consulte `docs/DESIGN_SYSTEM.md`.
- **Painel Admin:** O Admin DEVE utilizar os *Shared Components*: `<AdminPageHeader>`, `<AdminTable>`, `<AdminEmptyState>`.
- **Mobile-First Real:** O componente `<AdminTable>` deve renderizar tabela no desktop e colapsar para `Cards` responsivos em telas menores (`md:hidden`). Scroll horizontal em tabelas é estritamente proibido.
- **Ícones:** Use exclusivamente `lucide-react`. Padrão para ações: `size={20} strokeWidth={1.5}`.

## 4. Performance & Loading
- Módulos pesados (especialmente no Admin) devem ser importados dinamicamente via `React.lazy()`.
- Omitir renders desnecessários usando Optimistic UI para ações de baixo risco.
- O app deve ser resiliente: falhas locais devem ser capturadas por `<ErrorBoundary>`.
