import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { birthdayService, BirthdayCard } from '../../services/birthdayService';

export const BirthdayGreetingModal: React.FC = () => {
    const [card, setCard] = useState<BirthdayCard | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // Fetch pending card on mount
        const loadCard = async () => {
            const data = await birthdayService.getPendingCard();
            if (data) {
                setCard(data);
                // Pequeno delay para a animação de entrada ficar mais dramática
                setTimeout(() => setIsVisible(true), 500);
            }
        };
        loadCard();
    }, []);

    const handleClose = async () => {
        if (!card) return;
        
        // Optimistic UI Update - animação de saída rápida
        setIsClosing(true);
        
        // Marca como visualizado em background (não precisa do await pra travar a UI)
        birthdayService.markCardAsViewed(card.id);
        
        setTimeout(() => {
            setIsVisible(false);
            setCard(null); // Remove referência apenas DEPOIS da animação
        }, 300); // 300ms de animação out
    };

    if (!isVisible || !card) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md transition-opacity duration-300">
            {/* Dark background is full screen */}
            
            <div 
                className={`relative w-full max-w-sm sm:max-w-md aspect-[9/16] max-h-[90vh] transition-all duration-700
                    ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-in fade-in zoom-in slide-in-from-bottom-8'}
                `}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute -top-4 -right-4 md:-top-6 md:-right-6 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md shadow-xl sm:p-2.5"
                    aria-label="Fechar homenagem"
                >
                    <X size={24} />
                </button>

                {/* The Image Card itself */}
                <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/20 ring-1 ring-yellow-500/20">
                    <img 
                        src={card.image_url} 
                        alt="Feliz Aniversário" 
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    
                    {/* Subtle Overlay to ensure contrast on edges and "premium" feel */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};
