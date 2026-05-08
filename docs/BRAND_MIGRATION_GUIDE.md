# Brand Migration Guide — De Tailwind default → Prosperus tokens

Para migrar componentes legados às cores e fontes da brand guide oficial
(ver `DESIGN_SYSTEM.md` e ADR-007 em `.context/memory/decisions.md`).

## Princípio

A marca é **monocromática**: dois eixos (azul + ouro). Variação visual deve
vir de hierarquia tipográfica e tamanho — não de cores múltiplas como
emerald/purple/amber/blue/teal.

## Mapeamento direto (find → replace)

### Texto

| Tailwind default | Brand token | Uso |
|------------------|-------------|-----|
| `text-white` | `text-prosperus-text` | Texto principal |
| `text-slate-300` | `text-prosperus-text` | Texto secundário forte |
| `text-slate-400` | `text-prosperus-text-off` | Texto inativo, labels |
| `text-slate-500` | `text-prosperus-text-off` | Hint, caption |
| `text-yellow-500` | `text-prosperus-ouro-vivo` | Destaque, ativo |
| `text-yellow-600` | `text-prosperus-ouro-nobre` | Destaque sóbrio |

### Backgrounds

| Tailwind default | Brand token |
|------------------|-------------|
| `bg-slate-950` / `bg-slate-900` | `bg-prosperus-bg-primary` |
| `bg-slate-800` | `bg-prosperus-bg-box` |
| `bg-slate-700` | `bg-prosperus-stroke` |
| `bg-yellow-500/600` (CTA) | `bg-gradient-to-br from-prosperus-ouro-vivo to-prosperus-ouro-nobre` |

### Bordas

| Tailwind default | Brand token |
|------------------|-------------|
| `border-slate-700/800` | `border-prosperus-stroke` |
| `border-yellow-500` | `border-prosperus-ouro-vivo` |

### Cores coloridas (KPIs, stat cards) — **substituir por monocromático**

Não substituir 1-pra-1. **Refatorar a hierarquia visual:**

```tsx
// ❌ Antes — diferenciação por cor
<div className="bg-emerald-500/10 border-emerald-500/20">
  <Users className="text-emerald-400" />

// ✅ Depois — diferenciação por tipografia + ícone
<div className="bg-prosperus-azul-lideranca/20 border-prosperus-stroke">
  <Users className="text-prosperus-ouro-vivo" />
```

Todos os KPIs/cards do mesmo nível usam o **mesmo bg + mesma cor de ícone**.
A diferença entre eles é o ícone (desenho) e o número, não cor de fundo.

### Estados destrutivos

`text-red-*` / `bg-red-*` para botões de delete/destrutivo permanecem
(convenção UX universal). Não migrar.

## Tipografia

### Headings nativos
Já cobertos pelo base layer em `index.css` — `<h1>`...`<h6>` aplicam
`font-display` (EB Garamond) automaticamente.

### Headings em `<div>` ou `<span>`
Adicionar `font-display` explicitamente:
```tsx
<div className="font-display text-3xl">Painel de Controle</div>
```

### Botões e labels
Adicionar `font-sans` explicitamente para evitar herança de display:
```tsx
<button className="font-sans ...">Salvar</button>
```

## Checklist por arquivo

Para cada componente migrado:

- [ ] Substituir cores Tailwind default por tokens `prosperus-*`
- [ ] Aplicar `font-display` em headlines em `<div>`/`<span>`
- [ ] Aplicar `font-sans` em botões, inputs, labels
- [ ] Validar visualmente em mobile (375px) e desktop
- [ ] Rodar `npx tsc --noEmit`
- [ ] Conferir contrast ratio em modo escuro

## Exemplares já migrados

- `components/admin/AdminDashboardHome.tsx` — KPIs, quick actions, nav cards
- `components/ui/Button.tsx` — todas as variants
- `components/ui/Avatar.tsx` — border + bg
- `components/ModalHeader.tsx` — header padrão de modais
