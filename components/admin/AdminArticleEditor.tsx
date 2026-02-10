// AdminArticleEditor.tsx
// Editor rico de artigos usando React Quill
// Features: Upload de capa, categorias, salvar rascunho, publicar

import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Save,
    Send,
    Loader2,
    Image as ImageIcon,
    AlertTriangle,
    CheckCircle,
    X
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { articleService, Article, ArticleInput } from '../../services/articleService';
import { supabase } from '../../lib/supabase';

interface AdminArticleEditorProps {
    article?: Article | null;
    onBack: () => void;
    onSaved: () => void;
}

const CATEGORIES = [
    { value: 'Notícias', label: 'Notícias' },
    { value: 'Eventos', label: 'Eventos' },
    { value: 'Artigos', label: 'Artigos' },
    { value: 'Comunicados', label: 'Comunicados' }
];

// Quill modules configuration
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        [{ 'align': [] }],
        ['clean']
    ]
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'align'
];

export const AdminArticleEditor: React.FC<AdminArticleEditorProps> = ({
    article,
    onBack,
    onSaved
}) => {
    // Form state
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [category, setCategory] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [author, setAuthor] = useState('');

    // UI state
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showFirstPublishWarning, setShowFirstPublishWarning] = useState(false);
    const [hasPublishedArticles, setHasPublishedArticles] = useState(true);

    // Check if there are published articles (for first publish warning)
    useEffect(() => {
        const checkPublished = async () => {
            const hasArticles = await articleService.hasPublishedArticles();
            setHasPublishedArticles(hasArticles);
        };
        checkPublished();
    }, []);

    // Load article data if editing
    useEffect(() => {
        if (article) {
            setTitle(article.title || '');
            setSlug(article.slug || '');
            setContent(article.content || '');
            setExcerpt(article.excerpt || '');
            setCategory(article.category_name || '');
            setCoverImage(article.image_url || '');
            setAuthor(article.author || '');
        }
    }, [article]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!article && title) {
            const newSlug = title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            setSlug(newSlug);
        }
    }, [title, article]);

    const isEdit = !!article;
    const isDraft = !article || article.status === 'DRAFT';

    // Handle cover image upload
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingCover(true);
            setError(null);

            const fileExt = file.name.split('.').pop();
            const fileName = `article-${Date.now()}.${fileExt}`;
            const filePath = `articles/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setCoverImage(publicUrl);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError('Erro ao fazer upload: ' + errorMessage);
        } finally {
            setUploadingCover(false);
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        if (!title.trim()) {
            setError('Título é obrigatório');
            return false;
        }
        if (!slug.trim()) {
            setError('Slug é obrigatório');
            return false;
        }
        if (!content.trim() || content === '<p><br></p>') {
            setError('Conteúdo é obrigatório');
            return false;
        }
        return true;
    };

    // Save as draft
    const handleSaveDraft = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            setError(null);

            const input: ArticleInput = {
                title: title.trim(),
                slug: slug.trim(),
                content,
                excerpt: excerpt.trim(),
                category_name: category,
                image_url: coverImage,
                author: author.trim()
            };

            if (isEdit && article) {
                await articleService.updateArticle(article.id, input);
            } else {
                await articleService.createArticle(input);
            }

            setSuccess('Rascunho salvo com sucesso!');
            setTimeout(() => {
                onSaved();
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Publish article
    const handlePublish = async () => {
        if (!validateForm()) return;

        // Show warning for first publish
        if (!hasPublishedArticles && !showFirstPublishWarning) {
            setShowFirstPublishWarning(true);
            return;
        }

        try {
            setPublishing(true);
            setError(null);

            const input: ArticleInput = {
                title: title.trim(),
                slug: slug.trim(),
                content,
                excerpt: excerpt.trim(),
                category_name: category,
                image_url: coverImage,
                author: author.trim()
            };

            let articleId: string;

            if (isEdit && article) {
                await articleService.updateArticle(article.id, input);
                articleId = article.id;
            } else {
                const created = await articleService.createArticle(input);
                articleId = created.id;
            }

            await articleService.publishArticle(articleId);

            setSuccess('Artigo publicado com sucesso!');
            setTimeout(() => {
                onSaved();
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao publicar';
            setError(errorMessage);
        } finally {
            setPublishing(false);
            setShowFirstPublishWarning(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="btn-sm p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {isEdit ? 'Editar Artigo' : 'Novo Artigo'}
                            </h1>
                            {isDraft && (
                                <span className="text-xs text-slate-500">Rascunho</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving || publishing}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 
                                     text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Save size={16} />
                            )}
                            Salvar Rascunho
                        </button>

                        <button
                            onClick={handlePublish}
                            disabled={saving || publishing}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 
                                     text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                            {publishing ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Send size={16} />
                            )}
                            PUBLICAR
                        </button>
                    </div>
                </div>
            </div>

            {/* First Publish Warning Modal */}
            {showFirstPublishWarning && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-600/20 rounded-lg">
                                <AlertTriangle className="text-yellow-500" size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Primeiro Artigo!</h2>
                        </div>
                        <p className="text-slate-400 mb-6">
                            Este é o primeiro artigo a ser publicado. Ao publicar, a aba
                            <strong className="text-white"> "News & Insights"</strong> ficará
                            visível para todos os sócios no menu principal.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFirstPublishWarning(false)}
                                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePublish}
                                className="flex-1 px-4 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition"
                            >
                                Publicar Assim Mesmo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Alerts */}
                {error && (
                    <div className="flex items-center justify-between gap-2 p-4 bg-red-900/20 border border-red-900/50 
                                  rounded-lg text-red-400 mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} />
                            {error}
                        </div>
                        <button onClick={() => setError(null)}>
                            <X size={18} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-900/50 
                                  rounded-lg text-green-400 mb-4">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cover Image */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                            <label className="block text-sm text-slate-400 mb-2">Imagem de Capa</label>
                            {coverImage ? (
                                <div className="relative">
                                    <img
                                        src={coverImage}
                                        alt="Cover"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => setCoverImage('')}
                                        className="absolute top-2 right-2 p-2 bg-red-600 rounded-lg text-white hover:bg-red-500"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="block cursor-pointer">
                                    <div className="flex flex-col items-center justify-center h-48 bg-slate-800 border-2 border-dashed 
                                                  border-slate-700 rounded-lg hover:border-yellow-600 transition">
                                        {uploadingCover ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                                                <p className="text-slate-400 text-sm">Clique para upload</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        {/* Title */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título do artigo..."
                                className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-slate-600 
                                         focus:outline-none border-none"
                            />
                            <div className="mt-2 pt-2 border-t border-slate-800">
                                <label className="text-xs text-slate-500">Slug: </label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="bg-transparent text-sm text-slate-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={quillModules}
                                formats={quillFormats}
                                placeholder="Escreva seu artigo aqui..."
                                className="article-editor"
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Category */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                            <label className="block text-sm text-slate-400 mb-2">Categoria</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 
                                         text-white focus:outline-none focus:border-yellow-600"
                            >
                                <option value="">Selecione...</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Author */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                            <label className="block text-sm text-slate-400 mb-2">Autor</label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Nome do autor"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 
                                         text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-600"
                            />
                        </div>

                        {/* Excerpt */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                            <label className="block text-sm text-slate-400 mb-2">Resumo (SEO)</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="Breve descrição do artigo..."
                                rows={4}
                                maxLength={200}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 
                                         text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 resize-none"
                            />
                            <p className="text-xs text-slate-500 mt-1 text-right">{excerpt.length}/200</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quill Custom Styles */}
            <style>{`
                .article-editor .ql-toolbar {
                    background: rgb(30, 41, 59);
                    border: none;
                    border-bottom: 1px solid rgb(51, 65, 85);
                }
                .article-editor .ql-container {
                    background: rgb(15, 23, 42);
                    border: none;
                    min-height: 400px;
                    font-size: 16px;
                }
                .article-editor .ql-editor {
                    color: #e2e8f0;
                    padding: 1.5rem;
                }
                .article-editor .ql-editor.ql-blank::before {
                    color: rgb(71, 85, 105);
                    font-style: normal;
                }
                .article-editor .ql-toolbar .ql-stroke {
                    stroke: rgb(148, 163, 184);
                }
                .article-editor .ql-toolbar .ql-fill {
                    fill: rgb(148, 163, 184);
                }
                .article-editor .ql-toolbar .ql-picker {
                    color: rgb(148, 163, 184);
                }
                .article-editor .ql-toolbar button:hover .ql-stroke,
                .article-editor .ql-toolbar button.ql-active .ql-stroke {
                    stroke: rgb(234, 179, 8);
                }
                .article-editor .ql-toolbar button:hover .ql-fill,
                .article-editor .ql-toolbar button.ql-active .ql-fill {
                    fill: rgb(234, 179, 8);
                }
                .article-editor .ql-toolbar .ql-picker-label:hover,
                .article-editor .ql-toolbar .ql-picker-item:hover {
                    color: rgb(234, 179, 8);
                }
            `}</style>
        </div>
    );
};

export default AdminArticleEditor;
