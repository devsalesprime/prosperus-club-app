// pages/SolutionsListPage.tsx
// List of available solutions/tools for members

import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import { ViewState } from '../types';
import { toolsService, ToolSolution } from '../services/toolsService';

interface SolutionsListPageProps {
    setView: (view: ViewState) => void;
}

export const SolutionsListPage: React.FC<SolutionsListPageProps> = ({ setView }) => {
    const [solutions, setSolutions] = useState<ToolSolution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSolutions();
    }, []);

    const loadSolutions = async () => {
        try {
            const data = await toolsService.getActiveSolutions();
            setSolutions(data);
        } catch (error) {
            console.error('Failed to load solutions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => setView(ViewState.PROSPERUS_TOOLS)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Soluções Prosperus</h1>
                    <p className="text-slate-400">Ferramentas integradas para impulsionar seu negócio</p>
                </div>

                {/* Solutions Grid */}
                {solutions.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-400 text-lg">Nenhuma solução disponível no momento.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {solutions.map(solution => (
                            <a
                                key={solution.id}
                                href={solution.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300"
                            >
                                {solution.banner_url && (
                                    <div className="mb-4 rounded-lg overflow-hidden">
                                        <img
                                            src={solution.banner_url}
                                            alt={solution.title}
                                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                                    {solution.title}
                                </h3>

                                {solution.description && (
                                    <p className="text-slate-400 text-sm mb-4">{solution.description}</p>
                                )}

                                <div className="flex items-center gap-2 text-blue-400 font-medium">
                                    <span>Acessar Ferramenta</span>
                                    <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolutionsListPage;
