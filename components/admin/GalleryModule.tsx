// ============================================
// GALLERY MODULE - Admin Component (Extracted)
// ============================================

import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { AdminPageHeader, AdminModal, AdminFormInput } from './shared';

interface GalleryModuleProps {
    DataTable: React.FC<any>;
}

export const GalleryModule: React.FC<GalleryModuleProps> = ({ DataTable }) => {
    const [albums, setAlbums] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    const loadAlbums = async () => {
        try {
            const { galleryService } = await import('../../services/galleryService');
            setAlbums(await galleryService.getAllAlbums());
        } catch (error) {
            console.error('Error loading albums:', error);
        }
    };

    useEffect(() => { loadAlbums(); }, []);

    const openModal = (album?: any) => { setEditingAlbum(album || {}); setIsModalOpen(true); };

    const handleSave = async () => {
        if (!editingAlbum.title || !editingAlbum.embedUrl) { alert('Título e Link do Embed são obrigatórios.'); return; }
        try {
            setIsLoading(true);
            const { galleryService } = await import('../../services/galleryService');
            const payload = { title: editingAlbum.title, description: editingAlbum.description || '', embedUrl: editingAlbum.embedUrl, coverImage: editingAlbum.coverImage || undefined };
            if (editingAlbum.id) await galleryService.updateAlbum(editingAlbum.id, payload);
            else await galleryService.createAlbum(payload);
            setIsModalOpen(false); setEditingAlbum({}); await loadAlbums();
        } catch (error) { console.error('Error saving album:', error); alert('Erro ao salvar galeria.'); } finally { setIsLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta galeria?')) return;
        try { const { galleryService } = await import('../../services/galleryService'); await galleryService.deleteAlbum(id); await loadAlbums(); } catch (error) { console.error('Error deleting album:', error); }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Gerenciar Galerias" subtitle="Cadastre álbuns de fotos dos eventos do clube" action={
                <button onClick={() => openModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition"><Plus size={18} /> Adicionar Nova Galeria</button>
            } />
            <DataTable columns={['Título', 'Data']} data={albums.map(a => ({ ...a, data: a.createdAt }))} onEdit={(a: any) => openModal(a)} onDelete={(id: string) => handleDelete(id)} />
            {isModalOpen && (
                <AdminModal title={editingAlbum.id ? "Editar Galeria" : "Nova Galeria"} onClose={() => setIsModalOpen(false)}>
                    <div className="space-y-4">
                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg">
                            <p className="text-xs text-blue-400 flex gap-2"><ImageIcon size={14} className="shrink-0 mt-0.5" /><span><strong>Dica:</strong> Use Pixellu, Google Photos ou qualquer plataforma com link de embed para galerias.</span></p>
                        </div>
                        <AdminFormInput label="Título do Evento/Álbum" value={editingAlbum.title || ''} onChange={(v) => setEditingAlbum({ ...editingAlbum, title: v })} placeholder="Ex: Encontro Anual 2024" />
                        <AdminFormInput label="Descrição" textarea value={editingAlbum.description || ''} onChange={(v) => setEditingAlbum({ ...editingAlbum, description: v })} />
                        <AdminFormInput label="Imagem de Destaque" value={editingAlbum.coverImage || ''} onChange={(v) => setEditingAlbum({ ...editingAlbum, coverImage: v })} placeholder="https://..." />
                        {editingAlbum.coverImage && (
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 mb-2"><strong>Preview:</strong></p>
                                <img src={editingAlbum.coverImage} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-slate-600" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23334155" width="400" height="200"/%3E%3C/svg%3E'; }} />
                            </div>
                        )}
                        <AdminFormInput label="Link do Embed (URL da Galeria)" value={editingAlbum.embedUrl || ''} onChange={(v) => setEditingAlbum({ ...editingAlbum, embedUrl: v })} placeholder="https://..." />
                        <div className="flex justify-end pt-4 gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={isLoading}>Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition disabled:opacity-50" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Galeria'}</button>
                        </div>
                    </div>
                </AdminModal>
            )}
        </div>
    );
};

export default GalleryModule;
