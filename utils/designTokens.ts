/**
 * ============================================================
 * PROSPERUS CLUB — DESIGN SYSTEM TOKENS
 * Versão: Abril 2026
 * ============================================================
 * Fonte única de verdade para todas as cores do app.
 * Os valores CSS estão declarados em index.css @theme e são
 * consumidos automaticamente pelo Tailwind via classes como
 * `bg-prosperus-box`, `text-prosperus-gold`, etc.
 *
 * Use este arquivo para valores inline (style={{}}) ou
 * lógica condicional de cores em JavaScript.
 * ============================================================
 */

export const TOKENS = {

    // ─── FUNDOS ────────────────────────────────────────────────────────
    bgPrimary:    '#031A2B',  // fundo base de todas as telas → bg-prosperus-navy
    bgBox:        '#031726',  // cards, inputs, header, modais → bg-prosperus-box
    bgGradientStart: '#042034',  // gradiente Agenda/Tools/Galeria
    bgGradientEnd:   '#04253E',  // gradiente Agenda/Tools/Galeria

    // ─── GOLD ──────────────────────────────────────────────────────────
    gold:         '#FFDA71',  // CTA principal, item ativo nav, headlines
    goldDark:     '#CA9A43',  // botões pequenos, ícones topo, badges

    // ─── BORDAS ────────────────────────────────────────────────────────
    stroke:       '#052B48',  // bordas, separadores, outlines

    // ─── TEXTO / ESTADOS ───────────────────────────────────────────────
    textPrimary:  '#FCF7F0',  // texto principal
    inactive:     '#152938',  // fundo botões/opções não selecionadas
    textInactive: '#95A4B4',  // texto inativo, ícones off, placeholders

    // ─── SEMÂNTICAS ────────────────────────────────────────────────────
    success:  '#22C55E',
    danger:   '#EF4444',
    warning:  '#F97316',
    info:     '#3B82F6',

} as const;

// ─── Helpers CSS ─────────────────────────────────────────────────────────────

/** Gradiente gold para botões CTA grandes */
export const goldGradientCSS = 'linear-gradient(135deg, #FFDA71, #CA9A43)';

/** Gradiente gold em 93.9° (padrão botão Galeria/Academy) */
export const goldGradient939CSS = 'linear-gradient(93.9deg, #FFDA71 0%, #CA9A43 100%)';

/** Gradiente navy para Agenda, Tools e Galeria */
export const bgGradientCSS = 'linear-gradient(135deg, #042034, #04253E)';

/** Gradiente navy vertical (Tools full-screen) */
export const bgGradientVerticalCSS = 'linear-gradient(180deg, #042034 0%, #04253E 100%)';

// ─── Estilos reutilizáveis ──────────────────────────────────────────────────

/** Card padrão: fundo escuro + borda definida */
export const cardStyle: React.CSSProperties = {
    background:   TOKENS.bgBox,
    border:       `1px solid ${TOKENS.stroke}`,
    borderRadius: 12,
};

/** Input padrão */
export const inputStyle: React.CSSProperties = {
    background: TOKENS.bgBox,
    border:     `1px solid ${TOKENS.stroke}`,
    color:      TOKENS.textPrimary,
};

/** Chip/badge inativo */
export const chipInactiveStyle: React.CSSProperties = {
    background: TOKENS.inactive,
    color:      TOKENS.textInactive,
    border:     `1px solid ${TOKENS.stroke}`,
};

/** Chip/badge ativo */
export const chipActiveStyle: React.CSSProperties = {
    background: `${TOKENS.gold}20`,   // gold 12% opacidade
    color:      TOKENS.gold,
    border:     `1px solid ${TOKENS.goldDark}`,
};

/** Container de tela com gradiente navy (Agenda, Tools, Galeria) */
export const screenGradientStyle: React.CSSProperties = {
    background: bgGradientCSS,
    minHeight:  '100dvh',
};
