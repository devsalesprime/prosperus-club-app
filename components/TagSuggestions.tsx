// TagSuggestions.tsx
// Component for suggesting popular tags

import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Loader2, Tag, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TagSuggestionsProps {
    currentTags: string[];
    onTagSelect: (tag: string) => void;
}

// Predefined popular tags
const POPULAR_TAGS = [
    'Vendas',
    'Marketing',
    'Tecnologia',
    'Gestão',
    'Finanças',
    'RH',
    'Empreendedorismo',
    'Inovação',
    'Liderança',
    'Estratégia',
    'Networking',
    'Investimentos',
    'E-commerce',
    'SaaS',
    'Consultoria',
    'Coaching',
    'Treinamento',
    'B2B',
    'B2C',
    'Startups'
];

export const TagSuggestions: React.FC<TagSuggestionsProps> = ({ currentTags, onTagSelect }) => {
    const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPopularTags();
    }, []);

    const fetchPopularTags = async () => {
        try {
            // Fetch all profiles with tags
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('tags')
                .not('tags', 'is', null);

            if (error) throw error;

            // Count tag occurrences
            const tagCounts: Record<string, number> = {};

            profiles?.forEach(profile => {
                profile.tags?.forEach((tag: string) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });

            // Convert to array and sort by count
            const sortedTags = Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setPopularTags(sortedTags);
        } catch (error) {
            console.error('Error fetching popular tags:', error);
            // Fallback to predefined tags
            setPopularTags(
                POPULAR_TAGS.slice(0, 10).map(tag => ({ tag, count: 0 }))
            );
        } finally {
            setLoading(false);
        }
    };

    const availableTags = popularTags.filter(
        ({ tag }) => !currentTags.includes(tag)
    );

    if (loading) {
        return (
            <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
            </div>
        );
    }

    if (availableTags.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-yellow-500" size={16} />
                <h4 className="text-sm font-bold text-white">Tags Populares</h4>
            </div>

            <div className="flex flex-wrap gap-2">
                {availableTags.map(({ tag, count }) => (
                    <button
                        key={tag}
                        onClick={() => onTagSelect(tag)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-yellow-600 border border-slate-700 hover:border-yellow-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition group"
                    >
                        <Tag size={12} className="text-slate-500 group-hover:text-white" />
                        {tag}
                        {count > 0 && (
                            <span className="text-xs text-slate-500 group-hover:text-yellow-200">
                                ({count})
                            </span>
                        )}
                        <Plus size={12} className="opacity-0 group-hover:opacity-100 transition" />
                    </button>
                ))}
            </div>

            <p className="text-xs text-slate-500 mt-3">
                Clique para adicionar ao seu perfil
            </p>
        </div>
    );
};
