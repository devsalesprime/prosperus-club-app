# DESIGN_SYSTEM.md — Fonte da Verdade Visual
# Prosperus Club App · Abril 2026 (atualizado Maio/2026 com brand guide oficial)
# Implementação: index.css (@theme Tailwind v4) + utils/designTokens.ts (espelho TS)
# Brand guide oficial: "Narrativa, Posicionamento e Marca - Prosperus Club.pdf"

## Paleta oficial — brand guide (pág. 18)

### Primária
| Cor | Hex | Proporção | Uso na brand |
|-----|-----|-----------|--------------|
| Azul Profundo | #031A2B | 80% | Fundo base — autoridade, lealdade, credibilidade, inteligência |
| Ouro Nobre | #CA9A43 | 20% | Ícones, badges, traços de autoridade |

### Secundária
| Cor | Hex | Proporção | Uso na brand |
|-----|-----|-----------|--------------|
| Ouro Vivo | #FFDA71 | 25% | CTA principal, item ativo de navegação |
| Azul Liderança | #123F5B | 60% | Superfícies elevadas, headers de seção |
| Ouro Claro | #FFE39B | 10% | Highlight, hover de gold, brilhos sutis |
| Branco Visionário | #EDF4F7 | 5% | Texto sobre fundo claro, contraste alto |

### Complementar
| Cor | Hex | Proporção | Uso |
|-----|-----|-----------|-----|
| Branco Essência | #FCF7F0 | 50% | Texto principal sobre fundo escuro |
| Preto Absoluto | #080808 | 50% | Sombras profundas, overlays modais |

### Tokens semânticos do app (mapeamento)

| Token DS | Valor | Equivalente brand | Uso |
|----------|-------|-------------------|-----|
| bgPrimary | #031A2B | Azul Profundo | Fundo base de todas as telas |
| bgBox | #031726 | derivado | Cards, inputs, header, modais, menu |
| stroke | #052B48 | derivado | Bordas e separadores |
| gold | #FFDA71 | Ouro Vivo | CTA principal, item ativo |
| goldDark | #CA9A43 | Ouro Nobre | Botões pequenos, ícones topo, badges |
| textPrimary | #FCF7F0 | Branco Essência | Texto principal |
| textOff | #95A4B4 | derivado | Texto inativo, placeholders |
| inactive | #152938 | derivado | Botões não selecionados (fundo) |

### Significado das cores (brand guide pág. 19)

- **Tons azuis** — lado **Governante** da marca: peso, sobriedade, autoridade, lealdade, credibilidade, inteligência.
- **Tons dourados** — lado **Sábio** da marca: prosperidade, exclusividade, riqueza, prestígio, alto valor percebido.

## Tipografia oficial — brand guide (pág. 20)

| Uso | Família | Provider | Significado |
|-----|---------|----------|-------------|
| Títulos / Destaques | **Adobe Garamond Pro** | Adobe Fonts (Typekit kit `avz7ism`) | Serifada clássica, atemporal — autoridade, legado, prestígio |
| Corpo / Texto | **Manrope** (Light/Regular/Bold) | Google Fonts | Sem-serifa moderna — clareza estratégica, visão objetiva |

### Carregamento

Em `index.html`:
```html
<link rel="stylesheet" href="https://use.typekit.net/avz7ism.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap">
```

### Tokens (Tailwind v4 `@theme` em `index.css`)

- `font-display` → `'adobe-garamond-pro', 'Adobe Garamond Pro', 'EB Garamond', Garamond, Georgia, serif`
- `font-body` / `font-sans` → `'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif`

`adobe-garamond-pro` (lowercase, hifenado) é a convenção do Typekit para a família servida no kit. Os fallbacks (EB Garamond → Garamond → Georgia → serif) cobrem o tempo de loading e cenários offline.

### Uso

- `<h1>`...`<h6>` recebem `font-display` automaticamente via base layer.
- Em headlines em `<div>`/`<span>`, aplicar `font-display` explicitamente.
- Botões, inputs, labels: `font-sans` (default já é Manrope, mas aplicar explicitamente em descendentes de headings é boa prática).

## Gradientes

```css
/* CTAs grandes — botões primários */
background: linear-gradient(135deg, #FFDA71, #CA9A43);
color: #031A2B;

/* Telas especiais — Agenda, Tools, Galeria */
background: linear-gradient(135deg, #042034, #04253E);

/* Gráficos — área sob a curva */
fill: linear-gradient(to bottom, rgba(255,218,113,0.3), rgba(255,218,113,0));
```

## Tipografia

| Uso | Tamanho | Peso |
|-----|---------|------|
| Label/caption | 11px | 500 |
| Corpo secundário | 12px | 400 |
| Corpo principal | 13-14px | 400-500 |
| Título de card | 15-16px | 600 |
| Título de seção | 18-20px | 700 |
| Headline de destaque | 24px+ | 800 |
| ROI / Métrica grande | 42-52px | 800 |

## Border radius

| Componente | Raio |
|-----------|------|
| Chip / badge | 10px |
| Input / botão pequeno | 8px |
| Card | 12px |
| Modal / bottom sheet | 16-20px |
| Avatar | 50% |

## Espaçamento

- Padding de tela: 16px horizontal
- Gap entre cards: 14px
- Padding interno de card: 14-16px
- Gap entre seções: 24-32px

## Componentes padrão

### Botão primário
```typescript
{
  background: 'linear-gradient(135deg, #FFDA71, #CA9A43)',
  color:      '#031A2B',
  borderRadius: 14,
  padding:    '14px 20px',
  fontWeight: 700,
  fontSize:   15,
  border:     'none',
}
```

### Card padrão
```typescript
{
  background:   '#031726',
  border:       '1px solid #052B48',
  borderRadius: 12,
  padding:      '14px 16px',
}
```

### Input padrão
```typescript
{
  background:  '#031726',
  border:      '1px solid #052B48',
  borderRadius: 10,
  color:       '#FCF7F0',
  padding:     '12px 14px',
  fontSize:    14,
  // placeholder: color #95A4B4
}
```

### Modal overlay
```typescript
{
  position:   'fixed',
  inset:      0,
  zIndex:     200,
  background: 'rgba(0,0,0,0.65)',
  display:    'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding:    '20px',
}
```
