import React, { useState } from 'react';
import { AdminArticleList } from './AdminArticleList';
import { AdminArticleEditor } from './AdminArticleEditor';
import { Article as ServiceArticle } from '../../services/articleService';

export const ArticlesModule = () => {
  const [editingArticle, setEditingArticle] = useState<ServiceArticle | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleEdit = (article: ServiceArticle) => { setEditingArticle(article); setShowEditor(true); };
  const handleNew = () => { setEditingArticle(null); setShowEditor(true); };
  const handleBack = () => { setShowEditor(false); setEditingArticle(null); };
  const handleSaved = () => { setShowEditor(false); setEditingArticle(null); };

  if (showEditor) {
    return <AdminArticleEditor article={editingArticle} onBack={handleBack} onSaved={handleSaved} />;
  }

  return <AdminArticleList onEdit={handleEdit} onNew={handleNew} />;
};
