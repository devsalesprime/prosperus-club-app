// pages/ProsperusToolsPage.tsx
// Prosperus Tools Hub - Landing page with 3 main sections

import React from 'react';
import { GraduationCap, Wrench, TrendingUp, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';

interface ProsperusToolsPageProps {
    setView: (view: ViewState) => void;
}

export const ProsperusToolsPage: React.FC<ProsperusToolsPageProps> = ({ setView }) => {
    const sections = [
        {
            id: 'classes',
            title: 'Aulas & Treinamentos',
            subtitle: 'Acesse o conteúdo exclusivo',
            icon: GraduationCap,
            gradient: 'from-blue-900/80 to-indigo-900/80',
            bgImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
            view: ViewState.ACADEMY // Placeholder - will be replaced with actual Academy view
        },
        {
            id: 'solutions',
            title: 'Soluções Prosperus',
            subtitle: 'Ferramentas integradas para seu negócio',
            icon: Wrench,
            gradient: 'from-purple-900/80 to-pink-900/80',
            bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
            view: ViewState.SOLUTIONS
        },
        {
            id: 'progress',
            title: 'Meu Progresso',
            subtitle: 'Relatórios e métricas da sua jornada',
            icon: TrendingUp,
            gradient: 'from-green-900/80 to-emerald-900/80',
            bgImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
            view: ViewState.PROGRESS
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-3">Prosperus Tools</h1>
                    <p className="text-slate-400 text-lg">Seu hub de ferramentas e conteúdo exclusivo</p>
                </div>

                {/* Sections Grid */}
                <div className="space-y-6">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => {
                                    console.log('[ProsperusTools] Clicked section:', section.id, 'navigating to:', section.view);
                                    setView(section.view);
                                }}
                                className="w-full group relative overflow-hidden rounded-2xl h-80 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                                    style={{ backgroundImage: `url(${section.bgImage})` }}
                                />

                                {/* Gradient Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${section.gradient} transition-opacity duration-300 group-hover:opacity-90 pointer-events-none`} />

                                {/* Content */}
                                <div className="relative h-full flex flex-col items-center justify-center text-center px-8 py-8 pointer-events-none">
                                    <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                                        <Icon size={48} className="text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{section.title}</h2>
                                    <p className="text-white/80 text-lg mb-6">{section.subtitle}</p>
                                    <div className="flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                                        <span>Acessar</span>
                                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>

                                {/* Shine Effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center">
                    <p className="text-slate-500 text-sm">
                        💡 Explore todas as ferramentas disponíveis para maximizar seu ROI no clube
                    </p>
                </div>
            </div>


        </div>
    );
};

export default ProsperusToolsPage;
