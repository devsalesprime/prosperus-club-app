// NewsList.tsx
// Grid de artigos publicados para leitura dos sócios
// Design: Sharp Luxury (Dark mode, dourado)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Newspaper,
    Calendar,
    Eye,
    ArrowRight,
    Loader2,
    RefreshCw,
    Tag
} from 'lucide-react';
import { Article } from '../services/articleService';
import { FavoriteButton } from './FavoriteButton';
import { favoriteService } from '../services/favoriteService';
import { useArticlesQuery, useArticleCategoriesQuery } from '../hooks/queries/useArticlesQuery';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/queryKeys';

interface NewsListProps {
    onArticleSelect: (article: Article) => void;
}

export const NewsList: React.FC<NewsListProps> = ({ onArticleSelect }) => {
    const queryClient = useQueryClient();

    // Pagination state (kept local — each page is a separate cached query)
    const [page, setPage] = useState(1);
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

    // React Query for current page of articles
    const { data: articlesResult, isLoading: loading, isFetching } = useArticlesQuery(
        selectedCategory || undefined,
        page,
        9
    );

    // React Query for categories (cached 30min)
    const { data: categories = [] } = useArticleCategoriesQuery();

    // Load favorites on mount
    useEffect(() => {
        favoriteService.getFavoritedIds('article').then(setFavoritedIds);
    }, []);

    // Accumulate articles across pages, reset on category change
    useEffect(() => {
        if (!articlesResult) return;
        if (page === 1) {
            setAllArticles(articlesResult.data);
        } else {
            setAllArticles(prev => [...prev, ...articlesResult.data]);
        }
    }, [articlesResult, page]);

    // Reset to page 1 when category changes
    useEffect(() => {
        setPage(1);
        setAllArticles([]);
    }, [selectedCategory]);

    const hasMore = articlesResult?.hasMore ?? false;
    const articles = allArticles;

    const handleLoadMore = useCallback(() => {
        setPage(p => p + 1);
    }, []);

    const handleRefresh = useCallback(() => {
        setPage(1);
        setAllArticles([]);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.articles(selectedCategory || undefined) });
    }, [queryClient, selectedCategory]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-xl">
                        <Newspaper className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">News & Insights</h1>
                        <p className="text-slate-400">Conteúdos exclusivos para sócios</p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    className="btn-sm p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === ''
                            ? 'bg-yellow-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        Todos
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === cat
                                ? 'bg-yellow-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Articles Grid */}
            {articles.length === 0 ? (
                <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
                    <Newspaper className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum artigo ainda</h3>
                    <p className="text-slate-400">Em breve novos conteúdos exclusivos!</p>
                </div>
            ) : (
                <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <article
                                key={article.id}
                                onClick={() => onArticleSelect(article)}
                                className="group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden 
                                         cursor-pointer hover:border-yellow-600/50 transition-all duration-300
                                         hover:transform hover:-translate-y-1"
                            >
                                {/* Cover Image */}
                                <div className="relative h-48 overflow-hidden">
                                    {article.image_url ? (
                                        <img
                                            src={article.image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 
                                                      flex items-center justify-center">
                                            <Newspaper className="w-12 h-12 text-slate-700" />
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {article.category_name && (
                                        <div className="absolute top-3 left-3">
                                            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-600/90 text-white 
                                                          text-xs font-medium rounded-full backdrop-blur-sm">
                                                <Tag size={10} />
                                                {article.category_name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Favorite Button */}
                                    <FavoriteButton
                                        entityType="article"
                                        entityId={article.id}
                                        initialFavorited={favoritedIds.has(article.id)}
                                        overlay
                                        size={18}
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 
                                                 group-hover:text-yellow-500 transition-colors">
                                        {article.title}
                                    </h2>

                                    {article.excerpt && (
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                                            {article.excerpt}
                                        </p>
                                    )}

                                    {/* Meta */}
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{formatDate(article.published_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye size={12} />
                                            <span>{article.views || 0} views</span>
                                        </div>
                                    </div>

                                    {/* Read More */}
                                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium mt-4
                                                  opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ler mais
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleLoadMore}
                                disabled={isFetching}
                                className="px-6 py-3 bg-slate-800 border border-slate-700 text-white 
                                         rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                            >
                                {isFetching ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={16} />
                                        Carregando...
                                    </span>
                                ) : (
                                    'Carregar mais'
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NewsList;
