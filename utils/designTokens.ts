// ============================================
// DESIGN TOKENS
// ============================================
// Official color palette and gradients for Prosperus Club App

export const DESIGN_TOKENS = {
    colors: {
        // Base backgrounds
        bgPrimary: '#031A2B',  // App root background
        bgBox: '#031726',      // Cards, inputs, modals (Substituiu o antigo #031726)
        
        // Borders and separation
        stroke: '#052B48',     // Borders, dividers (Substituiu o antigo #052B48)
        
        // Accents
        gold: '#FFDA71',       // CTAs, active items
        goldDark: '#CA9A43',   // Small buttons, header icons
        
        // Text
        textPrimary: '#FCF7F0',// Main readable text
        textOff: '#95A4B4',    // Muted text, placeholders (Substituiu o antigo #95A4B4)
        
        // States
        inactive: '#152938',   // Idle states, disabled backgrounds
    },
    gradients: {
        gold: 'linear-gradient(135deg, #FFDA71, #CA9A43)',
        goldClasses: 'from-[#FFDA71] to-[#CA9A43]',
        bg: 'linear-gradient(135deg, #042034, #04253E)',
        bgClasses: 'from-[#042034] to-[#04253E]',
    }
};
