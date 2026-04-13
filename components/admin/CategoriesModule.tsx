import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Category } from '../../types';
import { DataTable, Modal, FormInput } from './shared/AdminSharedUI';

export const CategoriesModule = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});

  useEffect(() => {
    // API Call fallback expected
    setCategories([]);
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSave = () => {
    if (!editingCategory.name) return;
    const slug = editingCategory.slug || generateSlug(editingCategory.name);
    const categoryToSave = { ...editingCategory, slug };
    if (editingCategory.id) {
       // update logic fallback
    } else {
       // add logic fallback
    }
    setIsModalOpen(false);
    setEditingCategory({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Categorias de Notícias</h2>
        <button onClick={() => { setEditingCategory({}); setIsModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Nova Categoria
        </button>
      </div>
      <DataTable 
        columns={['Nome', 'Slug']} 
        data={categories} 
        onEdit={(c: Category) => { setEditingCategory(c); setIsModalOpen(true); }} 
        onDelete={(id: string) => { /* logic fallback */}} 
      />
      {isModalOpen && (
        <Modal title={editingCategory.id ? "Editar Categoria" : "Nova Categoria"} onClose={() => setIsModalOpen(false)}>
          <div className="space-y-4">
            <FormInput label="Nome da Categoria" value={editingCategory.name || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, name: v, slug: editingCategory.id ? editingCategory.slug : generateSlug(v) })} />
            <FormInput label="Slug (URL amigável)" value={editingCategory.slug || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, slug: v })} placeholder="gerado-automaticamente" />
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-500 transition shadow-lg shadow-pink-900/20">Salvar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
