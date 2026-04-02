// React Query hook for articles with pagination support
// Replaces manual useState + useEffect pattern in NewsList.tsx

import { useQuery } from '@tanstack/react-query';
import { articleService, ArticleListResult, ArticleListParams } from '../../services/articleService';
import { QUERY_KEYS } from '../../utils/queryKeys';

export function useArticlesQuery(category?: string, page: number = 1, limit: number = 9) {
    return useQuery<ArticleListResult>({
        queryKey: [...QUERY_KEYS.articles(category), page],
        queryFn: () => {
            const params: ArticleListParams = {
                page,
                limit,
                category: category || undefined,
            };
            return articleService.getPublishedArticles(params);
        },
        staleTime: 10 * 60 * 1000, // 10min — articles change infrequently
        gcTime: 20 * 60 * 1000,
    });
}

export function useArticleCategoriesQuery() {
    return useQuery<string[]>({
        queryKey: QUERY_KEYS.articleCategories(),
        queryFn: () => articleService.getCategories(),
        staleTime: 30 * 60 * 1000, // 30min — categories are very stable
    });
}
