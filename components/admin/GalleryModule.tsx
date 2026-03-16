// ============================================
// GALLERY MODULE - Admin Component (Refactored)
// ============================================
// Gerenciamento de galerias/álbuns de fotos
// Refatorado: alert→toast, confirm→AdminConfirmDialog, shared components

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Image as ImageIcon } from 'lucide-react';
import {
    AdminPageHeader,
    AdminModal,
    AdminFormInput,
    AdminTable,
    AdminLoadingState,
    AdminEmptyState,
    AdminConfirmDialog,
} from './shared';

interface GalleryModuleProps {
    DataTable: React.FC<any>;
}

export const GalleryModule: React.FC<GalleryModuleProps> = ({ DataTable }) => {
    const [albums, setAlbums] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        isLoading: boolean;
    }>({ isOpen: false, id: null, isLoading: false });

    const loadAlbums = async () => {
        try {
            const { galleryService } = await import('../../services/galleryService');
            setAlbums(await galleryService.getAllAlbums());
        } catch (error: any) {
            if (error?.message?.includes('AbortError') || error?.code === 'ABORT_ERR') return;
            console.error('Error loading albums:', error);
            toast.error('Erro ao carregar galerias.');
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => { loadAlbums(); }, []);

    const openModal = (album?: any) => { setEditingAlbum(album || {}); setIsModalOpen(true); };

    const handleSave = async () => {
        if (!editingAlbum.title || !editingAlbum.embedUrl) {
            toast.error('Título e Link do Embed são obrigatórios.');
            return;
        }
        try {
            setIsLoading(true);
            const { galleryService } = await import('../../services/galleryService');
            const payload = {
                title: editingAlbum.title,
                description: editingAlbum.description || '',
                embedUrl: editingAlbum.embedUrl,
                coverImage: editingAlbum.coverImage || undefined,
            };
            if (editingAlbum.id) {
                await galleryService.updateAlbum(editingAlbum.id, payload);
            } else {
                const newAlbum = await galleryService.createAlbum(payload);
                // 🔔 Notificar todos os sócios sobre nova galeria (fire-and-forget)
                import('../../services/notificationTriggers').then(({ notifyNewGallery }) => {
                    notifyNewGallery(payload.title, newAlbum?.id || '').catch(() => { });
                });
            }
            setIsModalOpen(false);
            setEditingAlbum({});
            await loadAlbums();
            toast.success('Galeria salva com sucesso!');
        } catch (error) {
            console.error('Error saving album:', error);
            toast.error('Erro ao salvar galeria.');
        } finally {
            setIsLoading(false);
        }
    };

    const requestDelete = (id: string) => {
        setConfirmState({
            isOpen: true,
            id,
            isLoading: false,
        });
    };

    const executeDelete = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            const { galleryService } = await import('../../services/galleryService');
            await galleryService.deleteAlbum(confirmState.id);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            await loadAlbums();
            toast.success('Galeria excluída com sucesso!');
        } catch (error) {
            console.error('Error deleting album:', error);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir galeria.');
        }
    };

    if (initialLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Gerenciar Galerias" subtitle="Cadastre álbuns de fotos dos eventos do clube" />
                <AdminLoadingState message="Carregando galerias..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gerenciar Galerias"
                subtitle={`${albums.length} galeria(s) cadastrada(s)`}
                action={
                    <button
                        onClick={() => openModal()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition"
                    >
                        <Plus size={18} /> Adicionar Nova Galeria
                    </button>
                }
            />

            {albums.length === 0 ? (
                <AdminEmptyState
                    icon={<ImageIcon size={48} />}
                    message="Nenhuma galeria criada ainda."
                    description="Adicione galerias de fotos dos eventos do clube."
                    action={
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition text-sm font-medium"
                        >
                            <Plus size={16} className="inline mr-1" />
                            Criar Galeria
                        </button>
                    }
                />
            ) : (
                <AdminTable title="Galerias" subtitle={`${albums.length} álbum(ns)`}>
                    <DataTable
                        columns={['Título', 'Data']}
                        data={albums.map(a => ({ ...a, data: a.createdAt }))}
                        onEdit={(a: any) => openModal(a)}
                        onDelete={(id: string) => requestDelete(id)}
                    />
                </AdminTable>
            )}

            {/* Gallery Modal */}
            {isModalOpen && (
                <AdminModal title={editingAlbum.id ? "Editar Galeria" : "Nova Galeria"} onClose={() => setIsModalOpen(false)}>
                    <div className="space-y-4">
                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg">
                            <p className="text-xs text-blue-400 flex gap-2">
                                <ImageIcon size={14} className="shrink-0 mt-0.5" />
                                <span><strong>Dica:</strong> Use Pixellu, Google Photos ou qualquer plataforma com link de embed para galerias.</span>
                            </p>
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

            {/* ============================================ */}
            {/* CONFIRM DIALOG */}
            {/* ============================================ */}
            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title="Excluir Galeria"
                message="Tem certeza que deseja excluir esta galeria? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};

export default GalleryModule;
