// ArticleReader.tsx
// Tela de leitura de artigo com Hero Image e conteúdo HTML
// Design: Sharp Luxury (Dark mode, dourado)

import React, { useEffect } from 'react';
import {
    ArrowLeft,
    Calendar,
    Eye,
    User,
    Tag,
    Share2,
    Clock
} from 'lucide-react';
import { Article, articleService } from '../services/articleService';

interface ArticleReaderProps {
    article: Article;
    onBack: () => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onBack }) => {
    // Increment views on mount
    useEffect(() => {
        if (article.id) {
            articleService.incrementViews(article.id);
        }
    }, [article.id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const estimateReadTime = (content?: string) => {
        if (!content) return '1 min';
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min de leitura`;
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt || '',
                    url: window.location.href
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copiado!');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Hero Section */}
            <div className="relative">
                {/* Back Button (Floating) */}
                <button
                    onClick={onBack}
                    className="fixed top-4 left-4 z-30 p-3 bg-slate-900/80 backdrop-blur-sm 
                             rounded-full text-white hover:bg-slate-800 transition shadow-lg"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* Share Button (Floating) */}
                <button
                    onClick={handleShare}
                    className="fixed top-4 right-4 z-30 p-3 bg-slate-900/80 backdrop-blur-sm 
                             rounded-full text-white hover:bg-slate-800 transition shadow-lg"
                >
                    <Share2 size={20} />
                </button>

                {/* Hero Image */}
                {article.image_url ? (
                    <div className="relative h-64 md:h-80 lg:h-96">
                        <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                    </div>
                ) : (
                    <div className="h-32 bg-gradient-to-b from-slate-900 to-slate-950" />
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Category */}
                        {article.category_name && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600 
                                           text-white text-sm font-medium rounded-full mb-4">
                                <Tag size={12} />
                                {article.category_name}
                            </span>
                        )}

                        {/* Title */}
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                            {article.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-slate-800">
                    {article.author && (
                        <div className="flex items-center gap-2 text-slate-400">
                            <User size={16} className="text-yellow-500" />
                            <span>{article.author}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={16} className="text-yellow-500" />
                        <span>{formatDate(article.published_date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={16} className="text-yellow-500" />
                        <span>{estimateReadTime(article.content)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                        <Eye size={16} className="text-yellow-500" />
                        <span>{(article.views || 0) + 1} visualizações</span>
                    </div>
                </div>

                {/* Excerpt */}
                {article.excerpt && (
                    <p className="text-xl text-slate-300 leading-relaxed mb-8 font-light italic border-l-4 border-yellow-600 pl-4">
                        {article.excerpt}
                    </p>
                )}

                {/* Content */}
                <article
                    className="article-content prose prose-invert prose-lg max-w-none
                             prose-headings:text-white prose-headings:font-bold
                             prose-p:text-slate-300 prose-p:leading-relaxed
                             prose-a:text-yellow-500 prose-a:no-underline hover:prose-a:underline
                             prose-strong:text-white
                             prose-blockquote:border-yellow-600 prose-blockquote:text-slate-400
                             prose-code:text-yellow-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded
                             prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
                             prose-img:rounded-xl prose-img:shadow-lg
                             prose-ul:text-slate-300 prose-ol:text-slate-300
                             prose-li:marker:text-yellow-500"
                    dangerouslySetInnerHTML={{ __html: article.content || '' }}
                />

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft size={18} />
                            Voltar para News
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 
                                     rounded-lg text-white hover:bg-slate-700 transition"
                        >
                            <Share2 size={16} />
                            Compartilhar
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom prose styles for Quill content */}
            <style>{`
                .article-content h1 { font-size: 2rem; margin-top: 2rem; margin-bottom: 1rem; }
                .article-content h2 { font-size: 1.5rem; margin-top: 1.75rem; margin-bottom: 0.75rem; }
                .article-content h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                .article-content p { margin-bottom: 1.25rem; }
                .article-content ul, .article-content ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
                .article-content li { margin-bottom: 0.5rem; }
                .article-content img { max-width: 100%; height: auto; margin: 1.5rem 0; }
                .article-content blockquote {
                    padding: 1rem 1.5rem;
                    margin: 1.5rem 0;
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 0.5rem;
                }
                .article-content a {
                    color: rgb(234, 179, 8);
                    transition: opacity 0.2s;
                }
                .article-content a:hover {
                    opacity: 0.8;
                }
                .article-content iframe {
                    max-width: 100%;
                    border-radius: 0.75rem;
                    margin: 1.5rem 0;
                }
            `}</style>
        </div>
    );
};

export default ArticleReader;
