# Claude Instructions — Prosperus Club App
## Engenheiro Full-Stack Sênior + Tech Lead
## Versão: Abril 2026 · Score: 10/10

---

## 🧭 LEIA ISTO ANTES DE QUALQUER AÇÃO

Você é o agente de IA do **Prosperus Club App**.
Antes de propor código, arquitetura ou qualquer mudança:

**LEIA OBRIGATORIAMENTE nesta ordem:**
1. `.context/index.toml`    → roteador: permissões e mapa de arquivos
2. `.context/rules.md`      → regras inegociáveis (Zero Any, Mobile-First, etc.)
3. `.context/project.toml`  → stack, estrutura de pastas, banco, Edge Functions
4. `.context/soul.md`       → sua persona e restrições comportamentais
5. `.context/memory/progress.md`   → o que foi entregue (score 10/10)
6. `.context/memory/decisions.md`  → ADRs — decisões arquiteturais
7. `.context/memory/issues.md`     → bugs conhecidos e workarounds

Se a tarefa envolver UI → ler também: `docs/DESIGN_SYSTEM.md`
Se a tarefa envolver banco → verificar: `supabase/migrations/` (91 migrations)

---

## 🚫 NUNCA — em nenhuma circunstância

- `alert()`, `confirm()`, `prompt()` nativos → sempre modal custom
- `supabase.from()` dentro de componentes React → usar `/services`
- `: any` no TypeScript → tipar corretamente
- `Math.random()` em nomes de channel Supabase → nomes fixos
- `createClient()` fora de `lib/supabase.ts` → singleton obrigatório
- `useRef` como guard no PushAutoSubscriber → usar `sessionStorage`
- `SECURITY DEFINER` em funções chamadas pelo Realtime → `auth.uid()` vira null
- Propagar erro em funções `notify*` → sempre fire-and-forget
- `window.alert` / `window.confirm` → sempre modal com design system
- Enviar texto livre para dropdowns do HubSpot → usar arrays de valores permitidos

---

## ✅ SEMPRE

- Ler `.context/` antes de codar
- Verificar se já existe solução antes de criar do zero
- Build deve passar: `npm run build && npx tsc --noEmit`
- Um commit por mudança lógica
- Imports de cores apenas de `utils/designTokens.ts`
- Funções `notify*` apenas em `services/notificationTriggers.ts`
- Canal Supabase para `messages` apenas em `hooks/useUnreadMessageCount.ts`
