// ============================================
// PremiumLoader.tsx (WPO Fallback)
// ============================================
// Fallback otimizado (zero libs) para exibir durante o Code Splitting (React.lazy).
// Previne "Flash of Unstyled Content" e quebra de TTI.

export const PremiumLoader = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] bg-[#031A2B] animate-in fade-in duration-300">
            {/* Wrapper pulsante */}
            <div className="relative flex items-center justify-center animate-pulse">
                {/* Spinner simplificado dourado */}
                <div className="w-12 h-12 rounded-full border-2 border-[#152938] border-t-[#CA9A43] animate-[spin_1s_linear_infinite]" />
                {/* Ponto central (sutil logo abstrata) */}
                <div className="absolute w-2 h-2 bg-[#FFDA71] rounded-full shadow-[0_0_10px_#CA9A43]" />
            </div>
            <p className="mt-4 text-[#95A4B4] text-[11px] uppercase tracking-[0.2em] font-semibold">
                Carregando a experiência...
            </p>
        </div>
    );
};
