// ============================================
// DESIGN TOKENS — Prosperus Club App
// ============================================
// Fonte primária: index.css → bloco @theme (Tailwind v4). Ver ADR-007.
// Este arquivo espelha os mesmos valores para uso em casos não-Tailwind:
//   - Gradientes em inline style
//   - Cores no manifest PWA
//   - Strings CSS dinâmicas (ex: cores em chartjs/recharts)
// Mantenha em sincronia com index.css. DESIGN_SYSTEM.md documenta a semântica.

export const DESIGN_TOKENS = {
    colors: {
        // ── Tokens semânticos (Design System) ───────────────────────────────────
        bgPrimary:   '#031A2B',  // = Azul Profundo (brand primária, 80%)
        bgBox:       '#031726',  // Cards, inputs, modais
        stroke:      '#052B48',  // Bordas e separadores
        gold:        '#FFDA71',  // = Ouro Vivo (brand secundária, 25%)
        goldDark:    '#CA9A43',  // = Ouro Nobre (brand primária, 20%)
        textPrimary: '#FCF7F0',  // = Branco Essência (brand complementar, 50%)
        textOff:     '#95A4B4',  // Texto inativo, placeholders
        inactive:    '#152938',  // Botões/opções não selecionados

        // ── Cores oficiais da brand guide (pág. 18) ────────────────────────────
        azulProfundo:      '#031A2B', // Primária 80%
        ouroNobre:         '#CA9A43', // Primária 20%
        ouroVivo:          '#FFDA71', // Secundária 25%
        azulLideranca:     '#123F5B', // Secundária 60%
        ouroClaro:         '#FFE39B', // Secundária 10% — hover/highlight de gold
        brancoVisionario:  '#EDF4F7', // Secundária 5%  — texto sobre fundo claro
        brancoEssencia:    '#FCF7F0', // Complementar 50%
        pretoAbsoluto:     '#080808', // Complementar 50% — overlays/sombras profundas
    },
    gradients: {
        gold: 'linear-gradient(135deg, #FFDA71, #CA9A43)',
        goldClasses: 'from-[#FFDA71] to-[#CA9A43]',
        bg: 'linear-gradient(135deg, #042034, #04253E)',
        bgClasses: 'from-[#042034] to-[#04253E]',
    },
    fonts: {
        // Brand guide pág. 20 — Adobe Garamond Pro (títulos) + Manrope (corpo).
        // Adobe Garamond Pro servido via Adobe Fonts (Typekit kit avz7ism) — family name
        // 'adobe-garamond-pro' segue convenção Typekit. Fallbacks para offline/loading.
        display: "'adobe-garamond-pro', 'Adobe Garamond Pro', 'EB Garamond', Garamond, Georgia, serif",
        body:    "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif",
    }
};
