// pages/ProsperusToolsPage.tsx
// Prosperus Tools Hub - Premium Glassmorphism Cards
// Prosperus Club App v3.0

import React from 'react';
import { GraduationCap, Wrench, TrendingUp, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';
import { logger } from '../utils/logger';
import { analyticsService } from '../services/analyticsService';
import { useApp } from '../contexts/AppContext';

interface ProsperusToolsPageProps {
    setView: (view: ViewState) => void;
}

export const ProsperusToolsPage: React.FC<ProsperusToolsPageProps> = ({ setView }) => {
    const { currentUser } = useApp();
    const userId = currentUser?.id || null;

    const sections = [
        {
            id: 'classes',
            title: 'Aulas & Treinamentos',
            subtitle: 'Acesse o conteúdo exclusivo',
            icon: GraduationCap,
            gradient: 'from-[#1e3a8a] to-[#0f172a]',
            bgImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
            view: ViewState.ACADEMY
        },
        {
            id: 'solutions',
            title: 'Soluções Prosperus',
            subtitle: 'Ferramentas integradas para o seu negócio',
            icon: Wrench,
            gradient: 'from-[#881337] to-[#4c0519]',
            bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
            view: ViewState.SOLUTIONS
        },
        {
            id: 'progress',
            title: 'Meu Progresso',
            subtitle: 'Relatórios e métricas da sua jornada',
            icon: TrendingUp,
            gradient: 'from-[#064e3b] to-[#022c22]',
            bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
            view: ViewState.PROGRESS
        }
    ];

    return (
        <div className="bg-gradient-to-b from-prosperus-dark-start to-prosperus-dark-end min-h-screen px-4 pt-8 pb-24">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
                <h1 className="text-3xl font-bold text-prosperus-white tracking-tight mb-2">Prosperus Tools</h1>
                <p className="text-sm text-prosperus-grey">Seu hub de ferramentas e conteúdo exclusivo.</p>
            </div>

            {/* Cards Stack */}
            <div className="flex flex-col gap-5">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div
                            key={section.id}
                            onClick={() => {
                                logger.debug('[ProsperusTools] Clicked section:', section.id, 'navigating to:', section.view);
                                analyticsService.trackToolView(userId, section.id, section.title);
                                setView(section.view);
                            }}
                            className="relative w-full h-[140px] rounded-[20px] overflow-hidden group cursor-pointer shadow-xl active:scale-[0.98] transition-all duration-300"
                        >
                            {/* CAMADA 1: Foto Fotográfica Texturizada (Z-0) */}
                            <img
                                src={section.bgImage}
                                className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity group-hover:scale-110 transition-transform duration-700 z-0"
                                alt=""
                            />

                            {/* CAMADA 2: Gradiente Translúcido Tingindo a Foto (Z-0) */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${section.gradient} opacity-75 z-0`} />



                            {/* Content */}
                            <div className="relative z-10 p-5 flex items-center h-full w-full">
                                {/* Icon Block */}
                                <div className="w-[60px] h-[60px] shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md mr-4 shadow-inner">
                                    <Icon size={28} className="text-white drop-shadow-md" strokeWidth={1.5} />
                                </div>

                                {/* Text Block */}
                                <div className="flex flex-col flex-1 pr-16 justify-center">
                                    <h3 className="text-[17px] sm:text-[19px] font-bold text-white leading-tight mb-1">{section.title}</h3>
                                    <p className="text-xs text-white/80 line-clamp-2 leading-snug">{section.subtitle}</p>
                                </div>
                            </div>

                            {/* "Acesse" CTA */}
                            <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className="text-[11px] font-bold text-white uppercase tracking-widest">Acesse</span>
                                <ArrowRight size={14} className="text-white group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProsperusToolsPage;
