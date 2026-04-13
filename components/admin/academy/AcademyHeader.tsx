// ============================================
// ACADEMY HEADER — Filter Bar + Stats
// Extracted from AcademyModule.tsx (Operação Estilhaço)
// Presenter component: receives all state via props
// ============================================

import React from 'react';
import { Search, FolderOpen, Clock, Calendar, Filter } from 'lucide-react';
import { VideoCategory } from '../../../types';

export interface AcademyHeaderProps {
    searchTitle: string;
    onSearchChange: (value: string) => void;
    filterCategory: string;
    onFilterCategoryChange: (value: string) => void;
    filterDuration: string;
    onFilterDurationChange: (value: string) => void;
    sortOrder: 'newest' | 'oldest';
    onSortOrderChange: (value: 'newest' | 'oldest') => void;
    pageSize: number;
    onPageSizeChange: (value: number) => void;
    categories: VideoCategory[];
    filteredCount: number;
    totalCount: number;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export const AcademyHeader: React.FC<AcademyHeaderProps> = ({
    searchTitle,
    onSearchChange,
    filterCategory,
    onFilterCategoryChange,
    filterDuration,
    onFilterDurationChange,
    sortOrder,
    onSortOrderChange,
    pageSize,
    onPageSizeChange,
    categories,
    filteredCount,
    totalCount,
    hasActiveFilters,
    onClearFilters,
}) => {
    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 space-y-3">
            {/* Row 1: Search + Category + Duration */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Title search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchTitle}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-yellow-600 outline-none transition"
                    />
                </div>

                {/* Category */}
                <div className="relative">
                    <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                        value={filterCategory}
                        onChange={e => onFilterCategoryChange(e.target.value)}
                        className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-600 outline-none transition appearance-none cursor-pointer min-w-[160px]"
                    >
                        <option value="">Todas categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Duration */}
                <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                        value={filterDuration}
                        onChange={e => onFilterDurationChange(e.target.value)}
                        className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-600 outline-none transition appearance-none cursor-pointer min-w-[150px]"
                    >
                        <option value="">Qualquer duração</option>
                        <option value="short">Até 5 min</option>
                        <option value="medium">5 – 15 min</option>
                        <option value="long">15 – 30 min</option>
                        <option value="extra">Mais de 30 min</option>
                    </select>
                </div>

                {/* Sort */}
                <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                        value={sortOrder}
                        onChange={e => onSortOrderChange(e.target.value as 'newest' | 'oldest')}
                        className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-600 outline-none transition appearance-none cursor-pointer min-w-[140px]"
                    >
                        <option value="newest">Mais recentes</option>
                        <option value="oldest">Mais antigos</option>
                    </select>
                </div>
            </div>

            {/* Row 2: Results count + clear + page size */}
            <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Filter size={12} />
                    <span>
                        {filteredCount} de {totalCount} vídeo{totalCount !== 1 ? 's' : ''}
                        {hasActiveFilters ? ' (filtrado)' : ''}
                    </span>
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="text-yellow-500 hover:text-yellow-400 underline transition text-xs"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* Page size selector */}
                <div className="flex items-center gap-2">
                    <span>Exibir</span>
                    <select
                        value={pageSize}
                        onChange={e => onPageSizeChange(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-yellow-600 outline-none cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                    </select>
                    <span>por página</span>
                </div>
            </div>
        </div>
    );
};
