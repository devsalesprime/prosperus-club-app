# Auditoria Completa — Admin Panel Prosperus Club

> **Data:** 2026-03-17 · **Escopo:** Todas as mudanças implementadas no painel administrativo

---

## Resumo Executivo

| Fase | Status | Mudanças Principais |
|---|---|---|
| **Ciclo 1 — Quick Wins** | ✅ | Sidebar agrupado, Dashboard KPIs, feedback padronizado (toast + ConfirmDialog), busca + filtro no módulo de Sócios |
| **Responsividade Mobile** | ✅ | Layout flexbox sem `md:ml-64`, padding mobile, scroll horizontal em tabelas, safe-area-inset-top |
| **Fase 2 — Consistência** | ✅ | Busca + filtro por categoria em Arquivos, AdminMemberProgress migrado para shared components |
| **Fase 3 — Analytics Tabs** | ✅ | Dashboard analytics com 3 tabs (Engajamento · Business · Conteúdo), eliminação do scroll contínuo |
| **Fase 4 — Profundidade** | ✅ | Export CSV nos Sócios, paginação client-side (20/page) |

---

## Componentes Shared Criados

| Componente | Propósito | Adotado por |
|---|---|---|
| [AdminPageHeader](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminPageHeader.tsx) | Header padronizado (title + subtitle + action) | 11 módulos |
| [AdminConfirmDialog](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminConfirmDialog.tsx) | Modal de confirmação (substitui `confirm()`) | 10 módulos |
| [AdminLoadingState](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminLoadingState.tsx) | Loading spinner padronizado | 7 módulos |
| [AdminEmptyState](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminEmptyState.tsx) | Estado vazio com ícone + mensagem | 5 módulos |
| [AdminTable](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminTable.tsx) | Container de tabela com scroll horizontal | 6 módulos |
| [AdminModal](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminModal.tsx) | Modal genérico | 5 módulos |
| [AdminActionButton](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminActionButton.tsx) | Botão de ação com ícone (edit/delete/primary) | 4 módulos |
| [AdminFormInput](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminFormInput.tsx) | Input de formulário | 2 módulos |
| [AdminFileUpload](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/shared/AdminFileUpload.tsx) | Upload de arquivos | 1 módulo |

---

## Matriz de Consistência por Componente

| Módulo | Toast | ConfirmDialog | PageHeader | Observação |
|---|---|---|---|---|
| [MembersModule](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/MembersModule.tsx) | ✅ | ✅ | ✅ | + CSV Export + Paginação |
| [AdminFilesModule](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminFilesModule.tsx) | ✅ | ✅ | ✅ | + Busca + Filtro categorias |
| [AdminMemberProgress](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminMemberProgress.tsx) | ✅ | ✅ | ✅ | Migrado na Fase 2 |
| [AnalyticsDashboard](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AnalyticsDashboard.tsx) | ✅ | N/A | ✅ | + 3 tabs (Fase 3) |
| [GalleryModule](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/GalleryModule.tsx) | ✅ | ✅ | ✅ | |
| [BannersModule](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/BannersModule.tsx) | ✅ | ✅ | ✅ | |
| [AdminSolutions](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminSolutions.tsx) | ✅ | ✅ | N/A | |
| [AdminArticleList](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminArticleList.tsx) | ✅ | ✅ | ✅ | |
| [AcademyModule](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AcademyModule.tsx) | ✅ | ✅ | ✅ | |
| [AppSettingsModule](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AppSettingsModule.tsx) | ✅ | N/A | ✅ | |
| [EventList](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/events/EventList.tsx) | ✅ | ✅ | N/A | |

---

## ⚠️ Pendências de Migração

Componentes que ainda usam `setSuccess`/`setError` custom (não toast):

| Módulo | Padrão Legado | Impacto |
|---|---|---|
| [AdminNotifications](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminNotifications.tsx) | `setSuccess()`, `setError()` com DIVs custom | Baixo — módulo funcional |
| [AdminArticleEditor](file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminArticleEditor.tsx) | `setSuccess()`, `setError()` com DIVs custom | Baixo — editor de artigos |

> [!NOTE]
> Esses 2 módulos funcionam corretamente, apenas não seguem o padrão `react-hot-toast`. Migração é opcional e de baixa prioridade.

---

## Arquivos Modificados (Resumo)

### Fase 4 (mais recente)
```diff:MembersModule.tsx
// ============================================
// MEMBERS MODULE - Admin Component (Refactored)
// ============================================
// Gerenciamento de membros com dados reais do Supabase
// Refatorado: alert→toast, confirm→AdminConfirmDialog, shared components

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2, PlaySquare, RefreshCw, Search, X } from 'lucide-react';
import {
    AdminPageHeader,
    AdminModal,
    AdminLoadingState,
    AdminTable,
    AdminActionButton,
    AdminConfirmDialog,
} from './shared';

interface ProfileRow {
    id: string;
    name: string;
    email: string;
    company: string | null;
    job_title: string | null;
    role: string;
    image_url: string | null;
    created_at: string;
    pitch_video_url?: string | null;
}

export const MembersModule: React.FC = () => {
    const [members, setMembers] = useState<ProfileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'TEAM' | 'MEMBER'>('ALL');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<ProfileRow | null>(null);
    const [editFormData, setEditFormData] = useState({ pitch_video_url: '' });
    const [saving, setSaving] = useState(false);
    const [videoUrlStatus, setVideoUrlStatus] = useState<{ type: 'youtube' | 'vimeo' | 'drive' | 'loom' | 'invalid' | null; message: string }>({ type: null, message: '' });

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        memberName: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, memberName: '', isLoading: false });

    const loadMembers = async () => {
        try {
            setLoading(true);
            setError(null);
            const { supabase } = await import('../../lib/supabase');
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id, name, email, company, job_title, role, image_url, created_at, pitch_video_url')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setMembers(data || []);
        } catch (err: any) {
            if (err?.message?.includes('AbortError') || err?.code === 'ABORT_ERR') return;
            console.error('Error loading members:', err);
            setError(err.message || 'Erro ao carregar membros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMembers(); }, []);

    const detectVideoPlatform = (url: string) => {
        if (!url || url.trim() === '') {
            setVideoUrlStatus({ type: null, message: '' });
            return;
        }
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                setVideoUrlStatus({ type: 'youtube', message: '✓ YouTube detectado' });
            } else if (hostname.includes('vimeo.com')) {
                setVideoUrlStatus({ type: 'vimeo', message: '✓ Vimeo detectado' });
            } else if (hostname.includes('drive.google.com')) {
                setVideoUrlStatus({ type: 'drive', message: '✓ Google Drive detectado' });
            } else if (hostname.includes('loom.com')) {
                setVideoUrlStatus({ type: 'loom', message: '✓ Loom detectado' });
            } else {
                setVideoUrlStatus({ type: 'invalid', message: '⚠ Use YouTube, Vimeo, Drive ou Loom' });
            }
        } catch {
            setVideoUrlStatus({ type: 'invalid', message: '⚠ URL inválida' });
        }
    };

    const handleEditMember = (member: ProfileRow) => {
        setEditingMember(member);
        setEditFormData({ pitch_video_url: member.pitch_video_url || '' });
        detectVideoPlatform(member.pitch_video_url || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingMember) return;
        if (editFormData.pitch_video_url && videoUrlStatus.type === 'invalid') {
            toast.error('Por favor, use uma URL válida do YouTube, Vimeo, Google Drive ou Loom.');
            return;
        }
        try {
            setSaving(true);
            const { supabase } = await import('../../lib/supabase');
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ pitch_video_url: editFormData.pitch_video_url || null, updated_at: new Date().toISOString() })
                .eq('id', editingMember.id);
            if (updateError) throw updateError;
            await loadMembers();
            setIsEditModalOpen(false);
            setEditingMember(null);
            toast.success('Membro atualizado com sucesso!');
        } catch (err: any) {
            console.error('Error saving member:', err);
            toast.error('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const requestDeleteMember = (member: ProfileRow) => {
        setConfirmState({
            isOpen: true,
            id: member.id,
            memberName: member.name || member.email,
            isLoading: false,
        });
    };

    const executeDeleteMember = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            const { supabase } = await import('../../lib/supabase');
            const { error: deleteError } = await supabase.from('profiles').delete().eq('id', confirmState.id);
            if (deleteError) throw deleteError;
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            await loadMembers();
            toast.success('Membro removido com sucesso.');
        } catch (err: any) {
            console.error('Error deleting member:', err);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao remover membro: ' + err.message);
        }
    };

    const formatRole = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="text-red-400 font-bold">Admin</span>;
            case 'TEAM': return <span className="text-blue-400 font-bold">Time</span>;
            case 'MEMBER': return <span className="text-emerald-400 font-bold">Sócio</span>;
            default: return <span className="text-slate-400">{role}</span>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Sócios" subtitle="Gestão de membros do clube" />
                <AdminLoadingState message="Carregando membros do Supabase..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Sócios" subtitle="Gestão de membros do clube" />
                <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={loadMembers} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    const term = searchTerm.toLowerCase().trim();
    const filteredMembers = members.filter(m => {
        const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
        const matchesSearch = !term || [
            m.name, m.email, m.company, m.job_title
        ].some(f => f?.toLowerCase().includes(term));
        return matchesRole && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Sócios"
                subtitle={`${filteredMembers.length} de ${members.length} usuários`}
                action={
                    <button
                        onClick={loadMembers}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                    >
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                }
            />

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, email ou empresa..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 transition"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[140px]"
                >
                    <option value="ALL">Todos os perfis</option>
                    <option value="MEMBER">Sócios</option>
                    <option value="TEAM">Time</option>
                    <option value="ADMIN">Admins</option>
                </select>
            </div>

            <AdminTable>
                <table className="w-full min-w-[800px] text-left text-sm text-slate-400 whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Cargo</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Vídeo Pitch</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={member.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                                        <span className="font-medium text-white">{member.name || 'Sem nome'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{member.email}</td>
                                <td className="px-6 py-4">{member.company || '-'}</td>
                                <td className="px-6 py-4">{member.job_title || '-'}</td>
                                <td className="px-6 py-4">{formatRole(member.role)}</td>
                                <td className="px-6 py-4">
                                    {member.pitch_video_url ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                            <PlaySquare size={14} /> Configurado
                                        </span>
                                    ) : (
                                        <span className="text-slate-600 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <AdminActionButton
                                            icon={Edit}
                                            onClick={() => handleEditMember(member)}
                                            variant="primary"
                                            title="Editar membro"
                                        />
                                        <AdminActionButton
                                            icon={Trash2}
                                            onClick={() => requestDeleteMember(member)}
                                            variant="danger"
                                            title="Remover membro"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-600">
                                    {searchTerm || roleFilter !== 'ALL'
                                        ? 'Nenhum membro encontrado com esses filtros.'
                                        : 'Nenhum membro cadastrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </AdminTable>

            {/* Edit Member Modal */}
            {isEditModalOpen && editingMember && (
                <AdminModal title={`Editar: ${editingMember.name}`} onClose={() => setIsEditModalOpen(false)}>
                    <div className="space-y-4">
                        {/* Member Info (Read-only) */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <img src={editingMember.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={editingMember.name} className="w-12 h-12 rounded-full object-cover border border-slate-600" />
                                <div>
                                    <p className="font-bold text-white">{editingMember.name}</p>
                                    <p className="text-sm text-slate-400">{editingMember.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-slate-500">Empresa: <span className="text-slate-300">{editingMember.company || '-'}</span></p>
                                <p className="text-slate-500">Cargo: <span className="text-slate-300">{editingMember.job_title || '-'}</span></p>
                            </div>
                        </div>

                        {/* Pitch Video URL Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <PlaySquare size={14} className="text-yellow-500" />
                                URL do Vídeo Pitch
                            </label>
                            <input
                                type="text"
                                value={editFormData.pitch_video_url}
                                onChange={(e) => { setEditFormData({ ...editFormData, pitch_video_url: e.target.value }); detectVideoPlatform(e.target.value); }}
                                placeholder="Link do YouTube, Vimeo, Google Drive ou Loom"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-yellow-600 transition"
                            />
                            {videoUrlStatus.message && (
                                <p className={`text-xs flex items-center gap-1 ${videoUrlStatus.type === 'invalid' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {videoUrlStatus.message}
                                </p>
                            )}
                            <p className="text-xs text-slate-500">Cole aqui o link do vídeo de pitch do sócio.</p>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={saving}>
                                Cancelar
                            </button>
                            <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20 disabled:opacity-50 flex items-center gap-2">
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Salvar
                            </button>
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
                onConfirm={executeDeleteMember}
                title="Remover Membro"
                message={`Tem certeza que deseja remover "${confirmState.memberName}"? Esta ação não pode ser desfeita.`}
                confirmText="Remover"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};

export default MembersModule;
===
// ============================================
// MEMBERS MODULE - Admin Component (Refactored)
// ============================================
// Gerenciamento de membros com dados reais do Supabase
// Refatorado: alert→toast, confirm→AdminConfirmDialog, shared components

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2, PlaySquare, RefreshCw, Search, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    AdminPageHeader,
    AdminModal,
    AdminLoadingState,
    AdminTable,
    AdminActionButton,
    AdminConfirmDialog,
} from './shared';

interface ProfileRow {
    id: string;
    name: string;
    email: string;
    company: string | null;
    job_title: string | null;
    role: string;
    image_url: string | null;
    created_at: string;
    pitch_video_url?: string | null;
}

export const MembersModule: React.FC = () => {
    const [members, setMembers] = useState<ProfileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'TEAM' | 'MEMBER'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<ProfileRow | null>(null);
    const [editFormData, setEditFormData] = useState({ pitch_video_url: '' });
    const [saving, setSaving] = useState(false);
    const [videoUrlStatus, setVideoUrlStatus] = useState<{ type: 'youtube' | 'vimeo' | 'drive' | 'loom' | 'invalid' | null; message: string }>({ type: null, message: '' });

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        memberName: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, memberName: '', isLoading: false });

    const loadMembers = async () => {
        try {
            setLoading(true);
            setError(null);
            const { supabase } = await import('../../lib/supabase');
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id, name, email, company, job_title, role, image_url, created_at, pitch_video_url')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setMembers(data || []);
        } catch (err: any) {
            if (err?.message?.includes('AbortError') || err?.code === 'ABORT_ERR') return;
            console.error('Error loading members:', err);
            setError(err.message || 'Erro ao carregar membros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMembers(); }, []);

    const detectVideoPlatform = (url: string) => {
        if (!url || url.trim() === '') {
            setVideoUrlStatus({ type: null, message: '' });
            return;
        }
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                setVideoUrlStatus({ type: 'youtube', message: '✓ YouTube detectado' });
            } else if (hostname.includes('vimeo.com')) {
                setVideoUrlStatus({ type: 'vimeo', message: '✓ Vimeo detectado' });
            } else if (hostname.includes('drive.google.com')) {
                setVideoUrlStatus({ type: 'drive', message: '✓ Google Drive detectado' });
            } else if (hostname.includes('loom.com')) {
                setVideoUrlStatus({ type: 'loom', message: '✓ Loom detectado' });
            } else {
                setVideoUrlStatus({ type: 'invalid', message: '⚠ Use YouTube, Vimeo, Drive ou Loom' });
            }
        } catch {
            setVideoUrlStatus({ type: 'invalid', message: '⚠ URL inválida' });
        }
    };

    const handleEditMember = (member: ProfileRow) => {
        setEditingMember(member);
        setEditFormData({ pitch_video_url: member.pitch_video_url || '' });
        detectVideoPlatform(member.pitch_video_url || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingMember) return;
        if (editFormData.pitch_video_url && videoUrlStatus.type === 'invalid') {
            toast.error('Por favor, use uma URL válida do YouTube, Vimeo, Google Drive ou Loom.');
            return;
        }
        try {
            setSaving(true);
            const { supabase } = await import('../../lib/supabase');
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ pitch_video_url: editFormData.pitch_video_url || null, updated_at: new Date().toISOString() })
                .eq('id', editingMember.id);
            if (updateError) throw updateError;
            await loadMembers();
            setIsEditModalOpen(false);
            setEditingMember(null);
            toast.success('Membro atualizado com sucesso!');
        } catch (err: any) {
            console.error('Error saving member:', err);
            toast.error('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const requestDeleteMember = (member: ProfileRow) => {
        setConfirmState({
            isOpen: true,
            id: member.id,
            memberName: member.name || member.email,
            isLoading: false,
        });
    };

    const executeDeleteMember = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            const { supabase } = await import('../../lib/supabase');
            const { error: deleteError } = await supabase.from('profiles').delete().eq('id', confirmState.id);
            if (deleteError) throw deleteError;
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            await loadMembers();
            toast.success('Membro removido com sucesso.');
        } catch (err: any) {
            console.error('Error deleting member:', err);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao remover membro: ' + err.message);
        }
    };

    const formatRole = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="text-red-400 font-bold">Admin</span>;
            case 'TEAM': return <span className="text-blue-400 font-bold">Time</span>;
            case 'MEMBER': return <span className="text-emerald-400 font-bold">Sócio</span>;
            default: return <span className="text-slate-400">{role}</span>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Sócios" subtitle="Gestão de membros do clube" />
                <AdminLoadingState message="Carregando membros do Supabase..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Sócios" subtitle="Gestão de membros do clube" />
                <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={loadMembers} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    const term = searchTerm.toLowerCase().trim();
    const filteredMembers = members.filter(m => {
        const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
        const matchesSearch = !term || [
            m.name, m.email, m.company, m.job_title
        ].some(f => f?.toLowerCase().includes(term));
        return matchesRole && matchesSearch;
    });

    // ─── CSV Export ────────────────────────────────────────
    const exportToCsv = () => {
        const headers = ['Nome', 'Email', 'Empresa', 'Cargo', 'Perfil', 'Cadastro'];
        const rows = filteredMembers.map(m => [
            m.name || '',
            m.email || '',
            m.company || '',
            m.job_title || '',
            m.role || '',
            m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''
        ]);
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `socios_prosperus_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${filteredMembers.length} membros exportados!`);
    };

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Sócios"
                subtitle={`${filteredMembers.length} de ${members.length} usuários`}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToCsv}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                            title="Exportar CSV"
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            onClick={loadMembers}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                        >
                            <RefreshCw size={16} />
                            Atualizar
                        </button>
                    </div>
                }
            />

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, email ou empresa..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 transition"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[140px]"
                >
                    <option value="ALL">Todos os perfis</option>
                    <option value="MEMBER">Sócios</option>
                    <option value="TEAM">Time</option>
                    <option value="ADMIN">Admins</option>
                </select>
            </div>

            <AdminTable>
                <table className="w-full min-w-[800px] text-left text-sm text-slate-400 whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Cargo</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Vídeo Pitch</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {paginatedMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={member.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                                        <span className="font-medium text-white">{member.name || 'Sem nome'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{member.email}</td>
                                <td className="px-6 py-4">{member.company || '-'}</td>
                                <td className="px-6 py-4">{member.job_title || '-'}</td>
                                <td className="px-6 py-4">{formatRole(member.role)}</td>
                                <td className="px-6 py-4">
                                    {member.pitch_video_url ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                            <PlaySquare size={14} /> Configurado
                                        </span>
                                    ) : (
                                        <span className="text-slate-600 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <AdminActionButton
                                            icon={Edit}
                                            onClick={() => handleEditMember(member)}
                                            variant="primary"
                                            title="Editar membro"
                                        />
                                        <AdminActionButton
                                            icon={Trash2}
                                            onClick={() => requestDeleteMember(member)}
                                            variant="danger"
                                            title="Remover membro"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-600">
                                    {searchTerm || roleFilter !== 'ALL'
                                        ? 'Nenhum membro encontrado com esses filtros.'
                                        : 'Nenhum membro cadastrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </AdminTable>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-slate-500">
                        {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} de {filteredMembers.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm text-slate-400 px-3">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {isEditModalOpen && editingMember && (
                <AdminModal title={`Editar: ${editingMember.name}`} onClose={() => setIsEditModalOpen(false)}>
                    <div className="space-y-4">
                        {/* Member Info (Read-only) */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <img src={editingMember.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={editingMember.name} className="w-12 h-12 rounded-full object-cover border border-slate-600" />
                                <div>
                                    <p className="font-bold text-white">{editingMember.name}</p>
                                    <p className="text-sm text-slate-400">{editingMember.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-slate-500">Empresa: <span className="text-slate-300">{editingMember.company || '-'}</span></p>
                                <p className="text-slate-500">Cargo: <span className="text-slate-300">{editingMember.job_title || '-'}</span></p>
                            </div>
                        </div>

                        {/* Pitch Video URL Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <PlaySquare size={14} className="text-yellow-500" />
                                URL do Vídeo Pitch
                            </label>
                            <input
                                type="text"
                                value={editFormData.pitch_video_url}
                                onChange={(e) => { setEditFormData({ ...editFormData, pitch_video_url: e.target.value }); detectVideoPlatform(e.target.value); }}
                                placeholder="Link do YouTube, Vimeo, Google Drive ou Loom"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-yellow-600 transition"
                            />
                            {videoUrlStatus.message && (
                                <p className={`text-xs flex items-center gap-1 ${videoUrlStatus.type === 'invalid' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {videoUrlStatus.message}
                                </p>
                            )}
                            <p className="text-xs text-slate-500">Cole aqui o link do vídeo de pitch do sócio.</p>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={saving}>
                                Cancelar
                            </button>
                            <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20 disabled:opacity-50 flex items-center gap-2">
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Salvar
                            </button>
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
                onConfirm={executeDeleteMember}
                title="Remover Membro"
                message={`Tem certeza que deseja remover "${confirmState.memberName}"? Esta ação não pode ser desfeita.`}
                confirmText="Remover"
                isDestructive
                isLoading={confirmState.isLoading}
            />
        </div>
    );
};

export default MembersModule;
```

### Fase 3
```diff:AnalyticsDashboard.tsx
// ============================================
// AnalyticsDashboard.tsx
// ============================================
// Painel executivo para a diretoria do Prosperus Club
// ✅ Fase A.2: Shared components, trends reais, filtro 7/30/90d
// ✅ Fase B.2: Funil Networking, Top ROI, Churn Risk, Academy, Events
// ✅ Fase B.3: Patch WhatsApp + last_access corrigido
// Usa: AdminPageHeader, AdminLoadingState, AdminEmptyState,
//      AdminTable, AdminActionButton de shared/

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import {
    Users,
    UserPlus,
    MessageCircle,
    PlayCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Activity,
    RefreshCw,
    FileText,
    Video,
    BarChart3,
    ArrowRight,
    DollarSign,
    AlertTriangle,
    GraduationCap,
    CalendarCheck,
    Crown,
    UserX,
    CheckCircle2,
    Download
} from 'lucide-react';
import {
    analyticsService,
    DashboardStats,
    DailyActivity,
    TopContent,
    EventBreakdown,
    NetworkingFunnel,
    TopRoiMember,
    ChurnRiskMember,
    AcademyCompletion,
    EventAttendance
} from '../../services/analyticsService';
import {
    AdminLoadingState,
    AdminEmptyState,
    AdminPageHeader,
    AdminTable,
    AdminActionButton
} from './shared';
import { AdminBenefitKpiCards } from './AdminBenefitKpiCards';
import { TopBenefitsTable } from './TopBenefitsTable';
import { getFileDownloadStats, FileDownloadStat, getTopFileDownloaders, TopDownloader } from '../../services/filesService';

// ============================================
// CHART COLORS
// ============================================

const CHART_COLORS = {
    primary: '#eab308',
    secondary: '#3b82f6',
    tertiary: '#22c55e',
    quaternary: '#a855f7',
    grid: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8'
};

const PIE_COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ============================================
// PERIOD HELPERS
// ============================================

type Period = '7d' | '30d' | '90d';

const periodToDays = (p: Period): number =>
    p === '7d' ? 7 : p === '90d' ? 90 : 30;

const periodLabel = (p: Period): string =>
    p === '7d' ? '7 dias' : p === '90d' ? '90 dias' : '30 dias';

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

// ============================================
// WHATSAPP HELPER
// ============================================

const openWhatsApp = (member: ChurnRiskMember) => {
    if (!member.phone) {
        toast.error('Sócio não possui telefone cadastrado');
        return;
    }

    let cleaned = member.phone.replace(/\D/g, '');

    // Adicionar DDI 55 (Brasil) caso o número tenha 10-11 dígitos e não comece com 55
    if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
    }

    const message = encodeURIComponent(
        `Olá ${member.memberName}, tudo bem? Notamos sua ausência no Prosperus Club e gostaríamos de saber como podemos te ajudar a gerar mais negócios. Conte conosco! 🤝`
    );

    window.open(`https://wa.me/${cleaned}?text=${message}`, '_blank');
};

// ============================================
// TREND BADGE
// ============================================

const TrendBadge: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (value === null || value === undefined) return null;

    if (value === 0) {
        return (
            <div className="flex items-center gap-1 text-slate-400">
                <Minus size={14} />
                <span className="text-xs font-bold">0%</span>
            </div>
        );
    }

    const isPositive = value > 0;
    return (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold">{Math.abs(value)}%</span>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AnalyticsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<Period>('30d');
    const [isLoading, setIsLoading] = useState(true);

    // Fase A states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [topVideos, setTopVideos] = useState<TopContent[]>([]);
    const [topArticles, setTopArticles] = useState<TopContent[]>([]);
    const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);

    // Fase B states
    const [funnel, setFunnel] = useState<NetworkingFunnel | null>(null);
    const [topRoi, setTopRoi] = useState<TopRoiMember[]>([]);
    const [churnRisk, setChurnRisk] = useState<ChurnRiskMember[]>([]);
    const [academy, setAcademy] = useState<AcademyCompletion | null>(null);
    const [attendance, setAttendance] = useState<EventAttendance | null>(null);
    const [fileStats, setFileStats] = useState<FileDownloadStat[]>([]);
    const [topDownloaders, setTopDownloaders] = useState<TopDownloader[]>([]);

    const days = periodToDays(period);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [
                statsData, activityData, videosData, articlesData, breakdownData,
                funnelData, roiData, churnData, academyData, attendanceData
            ] = await Promise.all([
                analyticsService.getDashboardStats(period),
                analyticsService.getActivityByDay(days),
                analyticsService.getTopVideos(5, days),
                analyticsService.getTopArticles(5, days),
                analyticsService.getEventBreakdown(days),
                analyticsService.getNetworkingFunnel(days),
                analyticsService.getTopRoiMembers(days, 5),
                analyticsService.getChurnRiskMembers(14),
                analyticsService.getAcademyCompletionRate(days),
                analyticsService.getEventAttendanceRate(days)
            ]);

            // Load file stats separately (non-blocking)
            getFileDownloadStats(period).then(setFileStats).catch(console.error);
            getTopFileDownloaders(period).then(setTopDownloaders).catch(console.error);

            setStats(statsData);
            setDailyActivity(activityData);
            setTopVideos(videosData);
            setTopArticles(articlesData);
            setEventBreakdown(breakdownData);
            setFunnel(funnelData);
            setTopRoi(roiData);
            setChurnRisk(churnData);
            setAcademy(academyData);
            setAttendance(attendanceData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    // ─── Full-page loading (first load only) ─────────────────────────
    if (isLoading && !stats) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <AdminLoadingState message="Carregando métricas..." />
            </div>
        );
    }

    // ─── Period filter buttons ───────────────────────────────────────
    const PeriodFilter = (
        <div className="flex items-center gap-3">
            <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-white transition disabled:opacity-50"
                title="Atualizar dados"
            >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-slate-800 rounded-lg p-1">
                {(['7d', '30d', '90d'] as Period[]).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            period === p
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {periodLabel(p)}
                    </button>
                ))}
            </div>
        </div>
    );

    // ─── Funnel chart data ───────────────────────────────────────────
    const funnelChartData = funnel ? [
        { name: 'Indicações', value: funnel.totalReferrals, fill: '#3b82f6' },
        { name: 'Negócios', value: funnel.totalDeals, fill: '#eab308' },
        { name: 'Auditados', value: funnel.auditedDeals, fill: '#22c55e' },
    ] : [];

    return (
        <div className="space-y-8">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER                                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AdminPageHeader
                title="Analytics Dashboard"
                subtitle="Métricas de engajamento e inteligência de negócios"
                action={PeriodFilter}
            />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ENGAGEMENT KPIs (Fase A)                               */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Usuários Ativos Hoje */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <Users size={24} className="text-yellow-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Usuários Ativos (Hoje)</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.activeUsersToday || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 2: Novos Sócios */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <UserPlus size={24} className="text-blue-500" />
                        </div>
                        <TrendBadge value={stats?.trendNewMembers} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Novos Sócios ({periodLabel(period)})</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.newMembersMonth || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 3: Mensagens Trocadas */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                            <MessageCircle size={24} className="text-emerald-500" />
                        </div>
                        <TrendBadge value={stats?.trendMessages} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Mensagens Trocadas</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.messagesSent || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 4: Vídeos Assistidos */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <PlayCircle size={24} className="text-purple-500" />
                        </div>
                        <TrendBadge value={stats?.trendVideos} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Vídeos Assistidos</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.videosCompleted || 0).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BUSINESS INTELLIGENCE KPIs (Fase B)                    */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* BI KPI 1: Volume ROI Auditado */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                            <DollarSign size={24} className="text-emerald-500" />
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">ROI Auditado</p>
                    <p className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(funnel?.auditedVolume || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {funnel?.auditedDeals || 0} negócios fechados
                    </p>
                </div>

                {/* BI KPI 2: Taxa de Conversão do Funil */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <ArrowRight size={24} className="text-blue-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Conversão do Funil</p>
                    <p className="text-2xl font-bold text-blue-400">
                        {funnel?.conversionRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {funnel?.totalReferrals || 0} indicações → {funnel?.auditedDeals || 0} fechados
                    </p>
                </div>

                {/* BI KPI 3: Academy Completion */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <GraduationCap size={24} className="text-purple-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Conclusão Academy</p>
                    <p className="text-2xl font-bold text-purple-400">
                        {academy?.completionRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {academy?.videosCompleted || 0} de {academy?.videosStarted || 0} concluídos
                    </p>
                </div>

                {/* BI KPI 4: Event Attendance */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-cyan-500/10">
                            <CalendarCheck size={24} className="text-cyan-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Presença em Eventos</p>
                    <p className="text-2xl font-bold text-cyan-400">
                        {attendance?.attendanceRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {attendance?.totalCheckins || 0} check-ins · {attendance?.noShowCount || 0} no-shows
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* NETWORKING FUNNEL + TOP ROI (side-by-side)             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Networking Funnel Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <ArrowRight size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Funil de Networking</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {funnelChartData.some(d => d.value > 0) ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={funnelChartData} layout="vertical" barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        stroke={CHART_COLORS.text}
                                        tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke={CHART_COLORS.text}
                                        tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {funnelChartData.map((entry, index) => (
                                            <Cell key={`funnel-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Volume auditado</span>
                                    <span className="text-emerald-400 font-bold">
                                        {formatCurrency(funnel?.auditedVolume || 0)}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState
                            icon={<ArrowRight size={36} />}
                            message="Nenhuma indicação ou negócio no período"
                        />
                    )}
                </div>

                {/* 🏆 Top ROI Members — usando AdminTable */}
                <AdminTable
                    title="🏆 Top Performers — ROI"
                    subtitle={`Sócios com maior volume auditado (${periodLabel(period)})`}
                >
                    {topRoi.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">#</th>
                                    <th className="text-left text-xs text-slate-500 font-medium py-3">Sócio</th>
                                    <th className="text-center text-xs text-slate-500 font-medium py-3">Negócios</th>
                                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Volume (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRoi.map((member, index) => (
                                    <tr key={member.memberId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                index === 2 ? 'bg-orange-600/20 text-orange-400' :
                                                'bg-slate-700/50 text-slate-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                {member.memberImage ? (
                                                    <img
                                                        src={member.memberImage}
                                                        alt={member.memberName}
                                                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                        <Users size={14} className="text-slate-400" />
                                                    </div>
                                                )}
                                                <span className="text-white font-medium truncate max-w-[160px]">
                                                    {member.memberName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-slate-400">
                                                {member.dealCount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="text-emerald-400 font-bold">
                                                {formatCurrency(member.totalVolume)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <AdminEmptyState
                            icon={<Crown size={36} />}
                            message="Nenhum negócio auditado no período"
                        />
                    )}
                </AdminTable>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ⚠️ CHURN RISK TABLE — usando AdminTable + WhatsApp     */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AdminTable
                title="⚠️ Sócios em Risco de Churn"
                subtitle="Inativos há 14+ dias e sem negócios nos últimos 60 dias"
                headerAction={
                    <span className="text-xs text-red-400/70 bg-red-500/10 px-3 py-1 rounded-full font-medium">
                        {churnRisk.length} sócio{churnRisk.length !== 1 ? 's' : ''} em risco
                    </span>
                }
            >
                {churnRisk.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Sócio</th>
                                <th className="text-left text-xs text-slate-500 font-medium py-3">E-mail</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Dias Inativo</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Último Acesso</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Deals (60d)</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Risco</th>
                                <th className="text-center text-xs text-slate-500 font-medium px-5 py-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {churnRisk.slice(0, 15).map((member) => {
                                const riskLevel = member.daysInactive >= 30 ? 'high' : member.daysInactive >= 21 ? 'medium' : 'low';
                                return (
                                    <tr key={member.memberId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                {member.memberImage ? (
                                                    <img src={member.memberImage} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                        <UserX size={14} className="text-slate-500" />
                                                    </div>
                                                )}
                                                <span className="text-white font-medium truncate max-w-[140px]">
                                                    {member.memberName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-slate-400 truncate max-w-[180px]">
                                            {member.memberEmail}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`font-bold ${
                                                riskLevel === 'high' ? 'text-red-400' :
                                                riskLevel === 'medium' ? 'text-orange-400' :
                                                'text-yellow-400'
                                            }`}>
                                                {member.daysInactive}d
                                            </span>
                                        </td>
                                        <td className="py-3 text-center text-slate-400">
                                            {member.lastAccess
                                                ? new Date(member.lastAccess).toLocaleDateString('pt-BR')
                                                : `Há ${member.daysInactive} dias`
                                            }
                                        </td>
                                        <td className="py-3 text-center text-slate-500">
                                            {member.dealsLast60d}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                                                riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {riskLevel === 'high' ? 'ALTO' : riskLevel === 'medium' ? 'MÉDIO' : 'BAIXO'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <AdminActionButton
                                                icon={MessageCircle}
                                                variant="primary"
                                                title={`Enviar WhatsApp para ${member.memberName}`}
                                                onClick={() => openWhatsApp(member)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={<CheckCircle2 size={48} className="text-emerald-500" />}
                        message="Nenhum sócio em risco de churn!"
                        description="Todos os sócios ativos se logaram nos últimos 14 dias ou possuem negócios recentes."
                    />
                )}
                {churnRisk.length > 15 && (
                    <div className="px-5 py-3 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">
                            Mostrando 15 de {churnRisk.length} sócios em risco
                        </p>
                    </div>
                )}
            </AdminTable>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BENEFIT ANALYTICS (Fase A)                             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="space-y-6">
                <AdminBenefitKpiCards period={days} />
                <TopBenefitsTable limit={10} />
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ACTIVITY CHART (Fase A)                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Atividade por Dia</h2>
                        <p className="text-sm text-slate-400">Últimos {periodLabel(period)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-400">Total</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-slate-400">Page Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-400">Mensagens</span>
                        </div>
                    </div>
                </div>

                {dailyActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyActivity}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                            <XAxis
                                dataKey="label"
                                stroke={CHART_COLORS.text}
                                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={CHART_COLORS.text}
                                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke={CHART_COLORS.primary}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                strokeWidth={2}
                                name="Total"
                            />
                            <Area
                                type="monotone"
                                dataKey="pageViews"
                                stroke={CHART_COLORS.secondary}
                                fillOpacity={1}
                                fill="url(#colorPageViews)"
                                strokeWidth={2}
                                name="Page Views"
                            />
                            <Area
                                type="monotone"
                                dataKey="messages"
                                stroke={CHART_COLORS.tertiary}
                                fillOpacity={0}
                                strokeWidth={2}
                                name="Mensagens"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <AdminEmptyState
                        icon={<BarChart3 size={48} />}
                        message="Nenhum dado de atividade disponível"
                        description="Os dados aparecerão aqui quando houver eventos registrados no período selecionado."
                    />
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BOTTOM GRID: Top Content + Event Breakdown (Fase A)    */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Videos */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Video size={20} className="text-purple-500" />
                        <h3 className="font-bold text-white">Top Vídeos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {topVideos.length > 0 ? (
                        <div className="space-y-3">
                            {topVideos.map((video, index) => (
                                <div key={video.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{video.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                        {video.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState
                            icon={<Video size={36} />}
                            message="Nenhum vídeo assistido"
                        />
                    )}
                </div>

                {/* Top Articles */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Top Artigos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {topArticles.length > 0 ? (
                        <div className="space-y-3">
                            {topArticles.map((article, index) => (
                                <div key={article.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{article.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                                        {article.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState
                            icon={<FileText size={36} />}
                            message="Nenhum artigo lido"
                        />
                    )}
                </div>

                {/* Event Breakdown - Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={20} className="text-emerald-500" />
                        <h3 className="font-bold text-white">Tipos de Evento</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {eventBreakdown.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={eventBreakdown.slice(0, 5)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {eventBreakdown.slice(0, 5).map((_entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 space-y-1">
                                {eventBreakdown.slice(0, 5).map((event, index) => (
                                    <div key={event.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                            />
                                            <span className="text-slate-400">{event.name.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-white font-bold">{event.value.toLocaleString('pt-BR')}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState
                            icon={<Activity size={36} />}
                            message="Nenhum evento registrado"
                        />
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FILE DOWNLOADS SECTION                                  */}
            {/* ═══════════════════════════════════════════════════════ */}
            {fileStats.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Download size={20} className="text-teal-500" />
                        <h3 className="font-bold text-white">Downloads de Arquivos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {fileStats.filter(s => s.total_downloads > 0).slice(0, 10).map((stat, index) => (
                            <div key={stat.file_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-xs font-bold text-slate-500 w-5 text-right">
                                    #{index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{stat.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {stat.file_type.toUpperCase()} · {stat.unique_downloaders} sócio{Number(stat.unique_downloaders) !== 1 ? 's' : ''} único{Number(stat.unique_downloaders) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-teal-400">
                                        {stat.total_downloads}
                                    </span>
                                    <p className="text-[10px] text-slate-500">downloads</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {fileStats.filter(s => s.total_downloads > 0).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">Nenhum download no período.</p>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TOP DOWNLOADERS SECTION                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            {topDownloaders.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-yellow-500" />
                        <h3 className="font-bold text-white">Sócios Mais Engajados (Downloads)</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {topDownloaders.slice(0, 10).map((user, index) => (
                            <div key={user.user_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className={`text-xs font-bold w-5 text-right ${
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-slate-300' :
                                    index === 2 ? 'text-amber-600' :
                                    'text-slate-500'
                                }`}>
                                    #{index + 1}
                                </span>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 shrink-0">
                                    {user.user_image ? (
                                        <img src={user.user_image} alt={user.user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                            {user.user_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate font-medium">{user.user_name}</p>
                                    {user.user_company && (
                                        <p className="text-xs text-slate-500 truncate">{user.user_company}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-yellow-400">
                                        {user.total_downloads}
                                    </span>
                                    <p className="text-[10px] text-slate-500">
                                        {user.unique_files} arquivo{Number(user.unique_files) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TOTAL EVENTS FOOTER (Fase A)                           */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-r from-yellow-600/10 to-yellow-600/5 border border-yellow-600/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Total de eventos registrados</p>
                        <p className="text-3xl font-bold text-white">
                            {(stats?.totalEvents || 0).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Período</p>
                        <p className="text-lg font-bold text-yellow-500">
                            Últimos {periodLabel(period)}
                        </p>
                        {stats?.trendEvents !== null && stats?.trendEvents !== undefined && (
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                                stats.trendEvents > 0
                                    ? 'text-emerald-500'
                                    : stats.trendEvents < 0
                                        ? 'text-red-500'
                                        : 'text-slate-400'
                            }`}>
                                {stats.trendEvents > 0 ? (
                                    <TrendingUp size={14} />
                                ) : stats.trendEvents < 0 ? (
                                    <TrendingDown size={14} />
                                ) : (
                                    <Minus size={14} />
                                )}
                                <span className="text-xs font-bold">
                                    {Math.abs(stats.trendEvents)}% vs período anterior
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
===
// ============================================
// AnalyticsDashboard.tsx
// ============================================
// Painel executivo para a diretoria do Prosperus Club
// ✅ Fase A.2: Shared components, trends reais, filtro 7/30/90d
// ✅ Fase B.2: Funil Networking, Top ROI, Churn Risk, Academy, Events
// ✅ Fase B.3: Patch WhatsApp + last_access corrigido
// Usa: AdminPageHeader, AdminLoadingState, AdminEmptyState,
//      AdminTable, AdminActionButton de shared/

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import {
    Users,
    UserPlus,
    MessageCircle,
    PlayCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Activity,
    RefreshCw,
    FileText,
    Video,
    BarChart3,
    ArrowRight,
    DollarSign,
    AlertTriangle,
    GraduationCap,
    CalendarCheck,
    Crown,
    UserX,
    CheckCircle2,
    Download
} from 'lucide-react';
import {
    analyticsService,
    DashboardStats,
    DailyActivity,
    TopContent,
    EventBreakdown,
    NetworkingFunnel,
    TopRoiMember,
    ChurnRiskMember,
    AcademyCompletion,
    EventAttendance
} from '../../services/analyticsService';
import {
    AdminLoadingState,
    AdminEmptyState,
    AdminPageHeader,
    AdminTable,
    AdminActionButton
} from './shared';
import { AdminBenefitKpiCards } from './AdminBenefitKpiCards';
import { TopBenefitsTable } from './TopBenefitsTable';
import { getFileDownloadStats, FileDownloadStat, getTopFileDownloaders, TopDownloader } from '../../services/filesService';

// ============================================
// CHART COLORS
// ============================================

const CHART_COLORS = {
    primary: '#eab308',
    secondary: '#3b82f6',
    tertiary: '#22c55e',
    quaternary: '#a855f7',
    grid: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8'
};

const PIE_COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ============================================
// PERIOD HELPERS
// ============================================

type Period = '7d' | '30d' | '90d';

const periodToDays = (p: Period): number =>
    p === '7d' ? 7 : p === '90d' ? 90 : 30;

const periodLabel = (p: Period): string =>
    p === '7d' ? '7 dias' : p === '90d' ? '90 dias' : '30 dias';

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

// ============================================
// WHATSAPP HELPER
// ============================================

const openWhatsApp = (member: ChurnRiskMember) => {
    if (!member.phone) {
        toast.error('Sócio não possui telefone cadastrado');
        return;
    }

    let cleaned = member.phone.replace(/\D/g, '');

    // Adicionar DDI 55 (Brasil) caso o número tenha 10-11 dígitos e não comece com 55
    if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
    }

    const message = encodeURIComponent(
        `Olá ${member.memberName}, tudo bem? Notamos sua ausência no Prosperus Club e gostaríamos de saber como podemos te ajudar a gerar mais negócios. Conte conosco! 🤝`
    );

    window.open(`https://wa.me/${cleaned}?text=${message}`, '_blank');
};

// ============================================
// TREND BADGE
// ============================================

const TrendBadge: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (value === null || value === undefined) return null;

    if (value === 0) {
        return (
            <div className="flex items-center gap-1 text-slate-400">
                <Minus size={14} />
                <span className="text-xs font-bold">0%</span>
            </div>
        );
    }

    const isPositive = value > 0;
    return (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold">{Math.abs(value)}%</span>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AnalyticsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<Period>('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'engajamento' | 'business' | 'conteudo'>('engajamento');

    // Fase A states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [topVideos, setTopVideos] = useState<TopContent[]>([]);
    const [topArticles, setTopArticles] = useState<TopContent[]>([]);
    const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);

    // Fase B states
    const [funnel, setFunnel] = useState<NetworkingFunnel | null>(null);
    const [topRoi, setTopRoi] = useState<TopRoiMember[]>([]);
    const [churnRisk, setChurnRisk] = useState<ChurnRiskMember[]>([]);
    const [academy, setAcademy] = useState<AcademyCompletion | null>(null);
    const [attendance, setAttendance] = useState<EventAttendance | null>(null);
    const [fileStats, setFileStats] = useState<FileDownloadStat[]>([]);
    const [topDownloaders, setTopDownloaders] = useState<TopDownloader[]>([]);

    const days = periodToDays(period);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [
                statsData, activityData, videosData, articlesData, breakdownData,
                funnelData, roiData, churnData, academyData, attendanceData
            ] = await Promise.all([
                analyticsService.getDashboardStats(period),
                analyticsService.getActivityByDay(days),
                analyticsService.getTopVideos(5, days),
                analyticsService.getTopArticles(5, days),
                analyticsService.getEventBreakdown(days),
                analyticsService.getNetworkingFunnel(days),
                analyticsService.getTopRoiMembers(days, 5),
                analyticsService.getChurnRiskMembers(14),
                analyticsService.getAcademyCompletionRate(days),
                analyticsService.getEventAttendanceRate(days)
            ]);

            // Load file stats separately (non-blocking)
            getFileDownloadStats(period).then(setFileStats).catch(console.error);
            getTopFileDownloaders(period).then(setTopDownloaders).catch(console.error);

            setStats(statsData);
            setDailyActivity(activityData);
            setTopVideos(videosData);
            setTopArticles(articlesData);
            setEventBreakdown(breakdownData);
            setFunnel(funnelData);
            setTopRoi(roiData);
            setChurnRisk(churnData);
            setAcademy(academyData);
            setAttendance(attendanceData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    // ─── Full-page loading (first load only) ─────────────────────────
    if (isLoading && !stats) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <AdminLoadingState message="Carregando métricas..." />
            </div>
        );
    }

    // ─── Period filter buttons ───────────────────────────────────────
    const PeriodFilter = (
        <div className="flex items-center gap-3">
            <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-white transition disabled:opacity-50"
                title="Atualizar dados"
            >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-slate-800 rounded-lg p-1">
                {(['7d', '30d', '90d'] as Period[]).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            period === p
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {periodLabel(p)}
                    </button>
                ))}
            </div>
        </div>
    );

    // ─── Funnel chart data ───────────────────────────────────────────
    const funnelChartData = funnel ? [
        { name: 'Indicações', value: funnel.totalReferrals, fill: '#3b82f6' },
        { name: 'Negócios', value: funnel.totalDeals, fill: '#eab308' },
        { name: 'Auditados', value: funnel.auditedDeals, fill: '#22c55e' },
    ] : [];

    return (
        <div className="space-y-8">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER                                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AdminPageHeader
                title="Analytics Dashboard"
                subtitle="Métricas de engajamento e inteligência de negócios"
                action={PeriodFilter}
            />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TAB NAVIGATION                                          */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
                {([
                    { id: 'engajamento' as const, label: 'Engajamento', icon: <Activity size={16} /> },
                    { id: 'business' as const, label: 'Business', icon: <DollarSign size={16} /> },
                    { id: 'conteudo' as const, label: 'Conteúdo', icon: <Video size={16} /> },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition ${
                            activeTab === tab.id
                                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TAB: ENGAJAMENTO                                        */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'engajamento' && (<>
            {/* ═══════════════════════════════════════════════════════ */}
            {/* ENGAGEMENT KPIs (Fase A)                               */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Usuários Ativos Hoje */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <Users size={24} className="text-yellow-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Usuários Ativos (Hoje)</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.activeUsersToday || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 2: Novos Sócios */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <UserPlus size={24} className="text-blue-500" />
                        </div>
                        <TrendBadge value={stats?.trendNewMembers} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Novos Sócios ({periodLabel(period)})</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.newMembersMonth || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 3: Mensagens Trocadas */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                            <MessageCircle size={24} className="text-emerald-500" />
                        </div>
                        <TrendBadge value={stats?.trendMessages} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Mensagens Trocadas</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.messagesSent || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 4: Vídeos Assistidos */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <PlayCircle size={24} className="text-purple-500" />
                        </div>
                        <TrendBadge value={stats?.trendVideos} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Vídeos Assistidos</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.videosCompleted || 0).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* ACTIVITY CHART */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Atividade por Dia</h2>
                        <p className="text-sm text-slate-400">Últimos {periodLabel(period)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-400">Total</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-slate-400">Page Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-400">Mensagens</span>
                        </div>
                    </div>
                </div>

                {dailyActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyActivity}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                            <XAxis dataKey="label" stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} />
                            <YAxis stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} labelStyle={{ color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="total" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} name="Total" />
                            <Area type="monotone" dataKey="pageViews" stroke={CHART_COLORS.secondary} fillOpacity={1} fill="url(#colorPageViews)" strokeWidth={2} name="Page Views" />
                            <Area type="monotone" dataKey="messages" stroke={CHART_COLORS.tertiary} fillOpacity={0} strokeWidth={2} name="Mensagens" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <AdminEmptyState icon={<BarChart3 size={48} />} message="Nenhum dado de atividade disponível" description="Os dados aparecerão aqui quando houver eventos registrados no período selecionado." />
                )}
            </div>

            {/* TOTAL EVENTS FOOTER */}
            <div className="bg-gradient-to-r from-yellow-600/10 to-yellow-600/5 border border-yellow-600/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Total de eventos registrados</p>
                        <p className="text-3xl font-bold text-white">{(stats?.totalEvents || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Período</p>
                        <p className="text-lg font-bold text-yellow-500">Últimos {periodLabel(period)}</p>
                        {stats?.trendEvents !== null && stats?.trendEvents !== undefined && (
                            <div className={`flex items-center justify-end gap-1 mt-1 ${stats.trendEvents > 0 ? 'text-emerald-500' : stats.trendEvents < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {stats.trendEvents > 0 ? <TrendingUp size={14} /> : stats.trendEvents < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="text-xs font-bold">{Math.abs(stats.trendEvents)}% vs período anterior</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </>)}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TAB: BUSINESS                                          */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'business' && (<>
            {/* BI KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* BI KPI 1: Volume ROI Auditado */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                            <DollarSign size={24} className="text-emerald-500" />
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">ROI Auditado</p>
                    <p className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(funnel?.auditedVolume || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {funnel?.auditedDeals || 0} negócios fechados
                    </p>
                </div>

                {/* BI KPI 2: Taxa de Conversão do Funil */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <ArrowRight size={24} className="text-blue-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Conversão do Funil</p>
                    <p className="text-2xl font-bold text-blue-400">
                        {funnel?.conversionRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {funnel?.totalReferrals || 0} indicações → {funnel?.auditedDeals || 0} fechados
                    </p>
                </div>

                {/* BI KPI 3: Academy Completion */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <GraduationCap size={24} className="text-purple-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Conclusão Academy</p>
                    <p className="text-2xl font-bold text-purple-400">
                        {academy?.completionRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {academy?.videosCompleted || 0} de {academy?.videosStarted || 0} concluídos
                    </p>
                </div>

                {/* BI KPI 4: Event Attendance */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-cyan-500/10">
                            <CalendarCheck size={24} className="text-cyan-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Presença em Eventos</p>
                    <p className="text-2xl font-bold text-cyan-400">
                        {attendance?.attendanceRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {attendance?.totalCheckins || 0} check-ins · {attendance?.noShowCount || 0} no-shows
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* NETWORKING FUNNEL + TOP ROI (side-by-side)             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Networking Funnel Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <ArrowRight size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Funil de Networking</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {funnelChartData.some(d => d.value > 0) ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={funnelChartData} layout="vertical" barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        stroke={CHART_COLORS.text}
                                        tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke={CHART_COLORS.text}
                                        tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {funnelChartData.map((entry, index) => (
                                            <Cell key={`funnel-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Volume auditado</span>
                                    <span className="text-emerald-400 font-bold">
                                        {formatCurrency(funnel?.auditedVolume || 0)}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState
                            icon={<ArrowRight size={36} />}
                            message="Nenhuma indicação ou negócio no período"
                        />
                    )}
                </div>

                {/* 🏆 Top ROI Members — usando AdminTable */}
                <AdminTable
                    title="🏆 Top Performers — ROI"
                    subtitle={`Sócios com maior volume auditado (${periodLabel(period)})`}
                >
                    {topRoi.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">#</th>
                                    <th className="text-left text-xs text-slate-500 font-medium py-3">Sócio</th>
                                    <th className="text-center text-xs text-slate-500 font-medium py-3">Negócios</th>
                                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Volume (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRoi.map((member, index) => (
                                    <tr key={member.memberId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                index === 2 ? 'bg-orange-600/20 text-orange-400' :
                                                'bg-slate-700/50 text-slate-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                {member.memberImage ? (
                                                    <img
                                                        src={member.memberImage}
                                                        alt={member.memberName}
                                                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                        <Users size={14} className="text-slate-400" />
                                                    </div>
                                                )}
                                                <span className="text-white font-medium truncate max-w-[160px]">
                                                    {member.memberName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-slate-400">
                                                {member.dealCount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="text-emerald-400 font-bold">
                                                {formatCurrency(member.totalVolume)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <AdminEmptyState
                            icon={<Crown size={36} />}
                            message="Nenhum negócio auditado no período"
                        />
                    )}
                </AdminTable>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ⚠️ CHURN RISK TABLE — usando AdminTable + WhatsApp     */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AdminTable
                title="⚠️ Sócios em Risco de Churn"
                subtitle="Inativos há 14+ dias e sem negócios nos últimos 60 dias"
                headerAction={
                    <span className="text-xs text-red-400/70 bg-red-500/10 px-3 py-1 rounded-full font-medium">
                        {churnRisk.length} sócio{churnRisk.length !== 1 ? 's' : ''} em risco
                    </span>
                }
            >
                {churnRisk.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Sócio</th>
                                <th className="text-left text-xs text-slate-500 font-medium py-3">E-mail</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Dias Inativo</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Último Acesso</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Deals (60d)</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Risco</th>
                                <th className="text-center text-xs text-slate-500 font-medium px-5 py-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {churnRisk.slice(0, 15).map((member) => {
                                const riskLevel = member.daysInactive >= 30 ? 'high' : member.daysInactive >= 21 ? 'medium' : 'low';
                                return (
                                    <tr key={member.memberId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                {member.memberImage ? (
                                                    <img src={member.memberImage} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                        <UserX size={14} className="text-slate-500" />
                                                    </div>
                                                )}
                                                <span className="text-white font-medium truncate max-w-[140px]">
                                                    {member.memberName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-slate-400 truncate max-w-[180px]">
                                            {member.memberEmail}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`font-bold ${
                                                riskLevel === 'high' ? 'text-red-400' :
                                                riskLevel === 'medium' ? 'text-orange-400' :
                                                'text-yellow-400'
                                            }`}>
                                                {member.daysInactive}d
                                            </span>
                                        </td>
                                        <td className="py-3 text-center text-slate-400">
                                            {member.lastAccess
                                                ? new Date(member.lastAccess).toLocaleDateString('pt-BR')
                                                : `Há ${member.daysInactive} dias`
                                            }
                                        </td>
                                        <td className="py-3 text-center text-slate-500">
                                            {member.dealsLast60d}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                                                riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {riskLevel === 'high' ? 'ALTO' : riskLevel === 'medium' ? 'MÉDIO' : 'BAIXO'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <AdminActionButton
                                                icon={MessageCircle}
                                                variant="primary"
                                                title={`Enviar WhatsApp para ${member.memberName}`}
                                                onClick={() => openWhatsApp(member)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={<CheckCircle2 size={48} className="text-emerald-500" />}
                        message="Nenhum sócio em risco de churn!"
                        description="Todos os sócios ativos se logaram nos últimos 14 dias ou possuem negócios recentes."
                    />
                )}
                {churnRisk.length > 15 && (
                    <div className="px-5 py-3 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">
                            Mostrando 15 de {churnRisk.length} sócios em risco
                        </p>
                    </div>
                )}
            </AdminTable>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BENEFIT ANALYTICS (Fase A)                             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="space-y-6">
                <AdminBenefitKpiCards period={days} />
                <TopBenefitsTable limit={10} />
            </div>
            </>)}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TAB: CONTEÚDO                                          */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'conteudo' && (<>

            {/* Top Content + Event Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Videos */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Video size={20} className="text-purple-500" />
                        <h3 className="font-bold text-white">Top Vídeos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {topVideos.length > 0 ? (
                        <div className="space-y-3">
                            {topVideos.map((video, index) => (
                                <div key={video.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{video.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                        {video.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState
                            icon={<Video size={36} />}
                            message="Nenhum vídeo assistido"
                        />
                    )}
                </div>

                {/* Top Articles */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Top Artigos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {topArticles.length > 0 ? (
                        <div className="space-y-3">
                            {topArticles.map((article, index) => (
                                <div key={article.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{article.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                                        {article.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState
                            icon={<FileText size={36} />}
                            message="Nenhum artigo lido"
                        />
                    )}
                </div>

                {/* Event Breakdown - Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={20} className="text-emerald-500" />
                        <h3 className="font-bold text-white">Tipos de Evento</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {eventBreakdown.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={eventBreakdown.slice(0, 5)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {eventBreakdown.slice(0, 5).map((_entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 space-y-1">
                                {eventBreakdown.slice(0, 5).map((event, index) => (
                                    <div key={event.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                            />
                                            <span className="text-slate-400">{event.name.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-white font-bold">{event.value.toLocaleString('pt-BR')}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState
                            icon={<Activity size={36} />}
                            message="Nenhum evento registrado"
                        />
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FILE DOWNLOADS SECTION                                  */}
            {/* ═══════════════════════════════════════════════════════ */}
            {fileStats.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Download size={20} className="text-teal-500" />
                        <h3 className="font-bold text-white">Downloads de Arquivos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {fileStats.filter(s => s.total_downloads > 0).slice(0, 10).map((stat, index) => (
                            <div key={stat.file_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-xs font-bold text-slate-500 w-5 text-right">
                                    #{index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{stat.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {stat.file_type.toUpperCase()} · {stat.unique_downloaders} sócio{Number(stat.unique_downloaders) !== 1 ? 's' : ''} único{Number(stat.unique_downloaders) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-teal-400">
                                        {stat.total_downloads}
                                    </span>
                                    <p className="text-[10px] text-slate-500">downloads</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {fileStats.filter(s => s.total_downloads > 0).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">Nenhum download no período.</p>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TOP DOWNLOADERS SECTION                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            {topDownloaders.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-yellow-500" />
                        <h3 className="font-bold text-white">Sócios Mais Engajados (Downloads)</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {topDownloaders.slice(0, 10).map((user, index) => (
                            <div key={user.user_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className={`text-xs font-bold w-5 text-right ${
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-slate-300' :
                                    index === 2 ? 'text-amber-600' :
                                    'text-slate-500'
                                }`}>
                                    #{index + 1}
                                </span>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 shrink-0">
                                    {user.user_image ? (
                                        <img src={user.user_image} alt={user.user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                            {user.user_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate font-medium">{user.user_name}</p>
                                    {user.user_company && (
                                        <p className="text-xs text-slate-500 truncate">{user.user_company}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-yellow-400">
                                        {user.total_downloads}
                                    </span>
                                    <p className="text-[10px] text-slate-500">
                                        {user.unique_files} arquivo{Number(user.unique_files) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            </>)}
        </div>
    );
};

export default AnalyticsDashboard;
```

### Fase 2
render_diffs(file:///c:/xampp/htdocs/prosperus-club-app/components/admin/AdminFilesModule.tsx)
```diff:AdminMemberProgress.tsx
// components/admin/AdminMemberProgress.tsx
// Admin panel for uploading and managing member progress reports
// Supports: Single upload and Bulk upload by email (multiple files)

import React, { useEffect, useState, useRef } from 'react';
import {
    Upload,
    Trash2,
    Loader2,
    FileText,
    Download,
    Search,
    RefreshCw,
    FileCode,
    FileSpreadsheet,
    File,
    Eye,
    X,
    Users,
    BarChart3,
    AlertCircle,
    Layers
} from 'lucide-react';
import { toolsService, MemberProgressFile } from '../../services/toolsService';
import { supabase } from '../../lib/supabase';

interface Member {
    id: string;
    name: string;
    email: string;
}

interface BulkResult {
    filename: string;
    email: string;
    memberName: string;
    success: boolean;
    error?: string;
}

type UploadMode = 'single' | 'bulk';

export const AdminMemberProgress: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload mode
    const [uploadMode, setUploadMode] = useState<UploadMode>('bulk');

    // Single upload form state
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [fileTitle, setFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bulk upload state
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);
    const [bulkTitle, setBulkTitle] = useState('Relatório de Progresso - Fev/2026');
    const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    const bulkInputRef = useRef<HTMLInputElement>(null);

    // Filter/search state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMemberId, setFilterMemberId] = useState('');

    // Preview state (blob-based for correct HTML rendering)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewMemberName, setPreviewMemberName] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Feedback state
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Auto-dismiss feedback
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .order('name');
            setMembers(membersData || []);

            const filesData = await toolsService.getAllProgressFiles();
            setFiles(filesData);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Falha ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // SINGLE UPLOAD
    // ========================================
    const handleSingleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !fileTitle || !selectedFile) {
            setError('Preencha todos os campos');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            await toolsService.uploadProgressFile({
                member_id: selectedMemberId,
                title: fileTitle,
                file: selectedFile
            });

            const memberName = members.find(m => m.id === selectedMemberId)?.name || 'Sócio';
            setSuccess(`Arquivo enviado para ${memberName}!`);
            setSelectedMemberId('');
            setFileTitle('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadData();
        } catch (err) {
            console.error('Failed to upload file:', err);
            setError('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    // ========================================
    // BULK UPLOAD BY EMAIL
    // ========================================
    const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList) {
            const arr = Array.from(fileList).filter(f =>
                f.name.endsWith('.html') || f.name.endsWith('.htm') ||
                f.name.endsWith('.pdf') || f.name.endsWith('.xlsx') ||
                f.name.endsWith('.xls') || f.name.endsWith('.doc') ||
                f.name.endsWith('.docx') || f.name.endsWith('.csv')
            );
            setBulkFiles(arr);
            setBulkResults([]);
        }
    };

    const handleBulkUpload = async () => {
        if (bulkFiles.length === 0 || !bulkTitle.trim()) {
            setError('Selecione os arquivos e defina o título');
            return;
        }

        setUploading(true);
        setError(null);
        setBulkResults([]);
        setBulkProgress({ current: 0, total: bulkFiles.length });

        const results: BulkResult[] = [];

        for (let i = 0; i < bulkFiles.length; i++) {
            const file = bulkFiles[i];
            const email = file.name.replace(/\.(html|htm|pdf|xlsx|xls|doc|docx|csv)$/i, '').toLowerCase().trim();

            setBulkProgress({ current: i + 1, total: bulkFiles.length });

            // Validate email format
            if (!email.includes('@') || !email.includes('.')) {
                results.push({
                    filename: file.name,
                    email,
                    memberName: '-',
                    success: false,
                    error: 'Nome do arquivo não é um e-mail válido'
                });
                continue;
            }

            // Find member by email
            const member = members.find(m => m.email.toLowerCase() === email);
            if (!member) {
                results.push({
                    filename: file.name,
                    email,
                    memberName: '-',
                    success: false,
                    error: 'Sócio não encontrado'
                });
                continue;
            }

            // Upload
            try {
                await toolsService.uploadProgressFile({
                    member_id: member.id,
                    title: bulkTitle,
                    file: file
                });

                results.push({
                    filename: file.name,
                    email,
                    memberName: member.name,
                    success: true
                });
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
                results.push({
                    filename: file.name,
                    email,
                    memberName: member.name,
                    success: false,
                    error: errMsg
                });
            }
        }

        setBulkResults(results);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
            setSuccess(`${successCount} arquivo(s) enviado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falha(s)` : ''}!`);
        } else {
            setError(`Nenhum arquivo foi enviado. ${errorCount} falha(s).`);
        }

        setUploading(false);
        loadData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
        try {
            await toolsService.deleteProgressFile(id);
            setSuccess('Arquivo excluído');
            loadData();
        } catch (err) {
            console.error('Failed to delete file:', err);
            setError('Erro ao excluir arquivo');
        }
    };

    const getFileIcon = (fileType: string) => {
        const type = fileType.toLowerCase();
        if (type === 'html' || type === 'htm') return <FileCode size={20} className="text-orange-400" />;
        if (type === 'pdf') return <FileText size={20} className="text-red-400" />;
        if (['xlsx', 'xls', 'csv', 'excel'].includes(type)) return <FileSpreadsheet size={20} className="text-green-400" />;
        if (['doc', 'docx'].includes(type)) return <FileText size={20} className="text-blue-400" />;
        return <File size={20} className="text-slate-400" />;
    };

    const getFileTypeBadge = (fileType: string) => {
        const type = fileType.toUpperCase();
        const colorMap: Record<string, string> = {
            'HTML': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            'HTM': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            'PDF': 'bg-red-900/30 text-red-400 border-red-800/50',
            'XLSX': 'bg-green-900/30 text-green-400 border-green-800/50',
            'XLS': 'bg-green-900/30 text-green-400 border-green-800/50',
            'DOC': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
            'DOCX': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
        };
        const color = colorMap[type] || 'bg-slate-700 text-slate-300 border-slate-600';
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${color}`}>
                {type}
            </span>
        );
    };

    // Filtered files
    const filteredFiles = files.filter(file => {
        const matchesMember = !filterMemberId || file.member_id === filterMemberId;
        const matchesSearch = !searchQuery ||
            file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (file.member?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMember && matchesSearch;
    });

    // Stats
    const uniqueMembers = new Set(files.map(f => f.member_id)).size;
    const htmlCount = files.filter(f => f.file_type.toLowerCase() === 'html').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-xl">
                    <BarChart3 className="text-white" size={24} />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Relatórios de Progresso</h1>
                    <p className="text-slate-400 text-sm">Envie relatórios HTML, PDFs e planilhas para os sócios</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    title="Atualizar"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Total de Arquivos</p>
                    <p className="text-2xl font-bold text-white">{files.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Sócios com Relatório</p>
                    <p className="text-2xl font-bold text-yellow-500">{uniqueMembers}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Relatórios HTML</p>
                    <p className="text-2xl font-bold text-orange-400">{htmlCount}</p>
                </div>
            </div>

            {/* Feedback Messages */}
            {success && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-green-900/20 border border-green-900/50 rounded-lg text-green-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Upload Form - Left Column (2/5) */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 sticky top-6">
                        {/* Mode Tabs */}
                        <div className="flex gap-1 mb-5 bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setUploadMode('bulk')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition ${uploadMode === 'bulk'
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Layers size={14} />
                                Em Massa
                            </button>
                            <button
                                onClick={() => setUploadMode('single')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition ${uploadMode === 'single'
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Upload size={14} />
                                Individual
                            </button>
                        </div>

                        {uploadMode === 'bulk' ? (
                            /* ====== BULK UPLOAD ====== */
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layers size={18} className="text-yellow-500" />
                                    Upload em Massa
                                </h2>

                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        📋 <strong className="text-slate-300">Como funciona:</strong> Renomeie cada arquivo com o <strong className="text-yellow-500">e-mail do sócio</strong>.
                                        Ex: <code className="text-orange-400 text-[10px]">joao@email.com.html</code>
                                    </p>
                                </div>

                                {/* Bulk Title */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">
                                        Título <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={bulkTitle}
                                        onChange={e => setBulkTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                 placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition text-sm"
                                        placeholder="Ex: Relatório de Progresso - Fev/2026"
                                    />
                                </div>

                                {/* Bulk Files */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">
                                        Arquivos <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        ref={bulkInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleBulkFilesSelect}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                                 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0
                                                 file:text-sm file:font-medium file:bg-yellow-600 file:text-white
                                                 file:cursor-pointer hover:file:bg-yellow-500"
                                        accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        Selecione vários arquivos nomeados com e-mail
                                    </p>
                                </div>

                                {/* Selected files preview */}
                                {bulkFiles.length > 0 && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {bulkFiles.length} arquivo(s) selecionado(s):
                                        </p>
                                        {bulkFiles.map((f, i) => {
                                            const email = f.name.replace(/\.(html|htm|pdf|xlsx|xls|doc|docx|csv)$/i, '').toLowerCase();
                                            const member = members.find(m => m.email.toLowerCase() === email);
                                            return (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-xs">
                                                    {member ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Sócio encontrado" />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Sócio não encontrado" />
                                                    )}
                                                    <span className="text-slate-300 truncate flex-1">{f.name}</span>
                                                    {member && (
                                                        <span className="text-green-400 truncate text-[10px]">{member.name}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Progress bar */}
                                {uploading && bulkProgress.total > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Enviando...</span>
                                            <span>{bulkProgress.current}/{bulkProgress.total}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleBulkUpload}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                             rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2"
                                    disabled={uploading || bulkFiles.length === 0}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Enviando {bulkProgress.current}/{bulkProgress.total}...
                                        </>
                                    ) : (
                                        <>
                                            <Layers size={18} />
                                            Enviar {bulkFiles.length > 0 ? `${bulkFiles.length} Arquivo(s)` : 'em Massa'}
                                        </>
                                    )}
                                </button>

                                {/* Bulk Results */}
                                {bulkResults.length > 0 && (
                                    <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-3">
                                        <p className="text-xs font-bold text-slate-300 mb-2">Resultado do Upload:</p>
                                        {bulkResults.map((r, i) => (
                                            <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs ${r.success ? 'bg-green-900/10' : 'bg-red-900/10'
                                                }`}>
                                                <span>{r.success ? '✅' : '❌'}</span>
                                                <span className="text-slate-300 flex-1 truncate">{r.email}</span>
                                                <span className={`truncate ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    {r.success ? r.memberName : r.error}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ====== SINGLE UPLOAD ====== */
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Upload size={18} className="text-yellow-500" />
                                    Upload Individual
                                </h2>
                                <form onSubmit={handleSingleUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Sócio <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={selectedMemberId}
                                            onChange={e => setSelectedMemberId(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                     focus:outline-none focus:border-yellow-600 transition text-sm"
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Título <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fileTitle}
                                            onChange={e => setFileTitle(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                     placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition text-sm"
                                            placeholder="Ex: Relatório - Fev/2026"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Arquivo <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                                     file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0
                                                     file:text-sm file:font-medium file:bg-yellow-600 file:text-white
                                                     file:cursor-pointer hover:file:bg-yellow-500"
                                            accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                            required
                                        />
                                    </div>
                                    {selectedFile && (
                                        <div className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            {getFileIcon(selectedFile.name.split('.').pop() || '')}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                                 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                                 flex items-center justify-center gap-2"
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Enviar Arquivo
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Files List - Right Column (3/5) */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-yellow-500" />
                                Histórico
                                <span className="text-sm font-normal text-slate-500">
                                    ({filteredFiles.length})
                                </span>
                            </h2>
                        </div>

                        {/* Search & Filter */}
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm
                                             placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <select
                                value={filterMemberId}
                                onChange={e => setFilterMemberId(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                         focus:outline-none focus:border-yellow-600 transition"
                            >
                                <option value="">Todos os sócios</option>
                                {members
                                    .filter(m => files.some(f => f.member_id === m.id))
                                    .map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Files */}
                        {filteredFiles.length === 0 ? (
                            <div className="py-12 text-center">
                                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                                <p className="text-slate-500 text-sm">
                                    {files.length === 0 ? 'Nenhum arquivo enviado' : 'Nenhum resultado'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="group flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
                                    >
                                        <div className="shrink-0">{getFileIcon(file.file_type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-medium text-sm text-white truncate">{file.title}</p>
                                                {getFileTypeBadge(file.file_type)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={12} className="text-slate-500 shrink-0" />
                                                <span className="text-xs text-slate-400 truncate">
                                                    {file.member?.name || 'Desconhecido'}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                            {(file.file_type.toLowerCase() === 'html' || file.file_type.toLowerCase() === 'htm') && (
                                                <button
                                                    onClick={async () => {
                                                        setLoadingPreview(true);
                                                        setPreviewTitle(file.title);
                                                        setPreviewMemberName(file.member?.name || '');
                                                        try {
                                                            const response = await fetch(file.file_url);
                                                            const text = await response.text();
                                                            const blob = new Blob([text], { type: 'text/html' });
                                                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                            setPreviewUrl(URL.createObjectURL(blob));
                                                        } catch (err) {
                                                            console.error('Preview failed:', err);
                                                            window.open(file.file_url, '_blank');
                                                        } finally {
                                                            setLoadingPreview(false);
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-yellow-900/30 text-yellow-500 rounded-lg transition"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-blue-900/30 text-blue-400 rounded-lg transition"
                                                title="Abrir"
                                            >
                                                <Download size={16} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading overlay for preview */}
            {loadingPreview && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="animate-spin text-yellow-500 mx-auto mb-3" size={32} />
                        <p className="text-white text-sm">Carregando relatório...</p>
                    </div>
                </div>
            )}

            {/* HTML Preview Modal - uses blob URL with correct MIME type */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <FileCode size={20} className="text-orange-400" />
                                <div>
                                    <h3 className="font-bold text-white">{previewTitle}</h3>
                                    <p className="text-xs text-slate-400">{previewMemberName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                    setPreviewTitle('');
                                    setPreviewMemberName('');
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={previewUrl}
                                className="w-full h-full min-h-[60vh] bg-white rounded-b-xl"
                                title={previewTitle}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMemberProgress;
===
// components/admin/AdminMemberProgress.tsx
// Admin panel for uploading and managing member progress reports
// Supports: Single upload and Bulk upload by email (multiple files)

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
    Upload,
    Trash2,
    Loader2,
    FileText,
    Download,
    Search,
    RefreshCw,
    FileCode,
    FileSpreadsheet,
    File,
    Eye,
    X,
    Users,
    Layers
} from 'lucide-react';
import { toolsService, MemberProgressFile } from '../../services/toolsService';
import { supabase } from '../../lib/supabase';
import { AdminPageHeader, AdminConfirmDialog } from './shared';

interface Member {
    id: string;
    name: string;
    email: string;
}

interface BulkResult {
    filename: string;
    email: string;
    memberName: string;
    success: boolean;
    error?: string;
}

type UploadMode = 'single' | 'bulk';

export const AdminMemberProgress: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [files, setFiles] = useState<MemberProgressFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload mode
    const [uploadMode, setUploadMode] = useState<UploadMode>('bulk');

    // Single upload form state
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [fileTitle, setFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bulk upload state
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);
    const [bulkTitle, setBulkTitle] = useState('Relatório de Progresso - Fev/2026');
    const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    const bulkInputRef = useRef<HTMLInputElement>(null);

    // Filter/search state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMemberId, setFilterMemberId] = useState('');

    // Preview state (blob-based for correct HTML rendering)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewMemberName, setPreviewMemberName] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Confirm delete state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);



    const loadData = async () => {
        try {
            setLoading(true);
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .order('name');
            setMembers(membersData || []);

            const filesData = await toolsService.getAllProgressFiles();
            setFiles(filesData);
        } catch (err) {
            console.error('Failed to load data:', err);
            toast.error('Falha ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // SINGLE UPLOAD
    // ========================================
    const handleSingleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !fileTitle || !selectedFile) {
            toast.error('Preencha todos os campos');
        }

        setUploading(true);
        try {
            await toolsService.uploadProgressFile({
                member_id: selectedMemberId,
                title: fileTitle,
                file: selectedFile
            });

            const memberName = members.find(m => m.id === selectedMemberId)?.name || 'Sócio';
            toast.success(`Arquivo enviado para ${memberName}!`);
            setSelectedMemberId('');
            setFileTitle('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadData();
        } catch (err) {
            console.error('Failed to upload file:', err);
            toast.error('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    // ========================================
    // BULK UPLOAD BY EMAIL
    // ========================================
    const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList) {
            const arr = Array.from(fileList).filter(f =>
                f.name.endsWith('.html') || f.name.endsWith('.htm') ||
                f.name.endsWith('.pdf') || f.name.endsWith('.xlsx') ||
                f.name.endsWith('.xls') || f.name.endsWith('.doc') ||
                f.name.endsWith('.docx') || f.name.endsWith('.csv')
            );
            setBulkFiles(arr);
            setBulkResults([]);
        }
    };

    const handleBulkUpload = async () => {
        if (bulkFiles.length === 0 || !bulkTitle.trim()) {
            toast.error('Selecione os arquivos e defina o título');
            return;
        }

        setUploading(true);

        setBulkResults([]);
        setBulkProgress({ current: 0, total: bulkFiles.length });

        const results: BulkResult[] = [];

        for (let i = 0; i < bulkFiles.length; i++) {
            const file = bulkFiles[i];
            const email = file.name.replace(/\.(html|htm|pdf|xlsx|xls|doc|docx|csv)$/i, '').toLowerCase().trim();

            setBulkProgress({ current: i + 1, total: bulkFiles.length });

            // Validate email format
            if (!email.includes('@') || !email.includes('.')) {
                results.push({
                    filename: file.name,
                    email,
                    memberName: '-',
                    success: false,
                    error: 'Nome do arquivo não é um e-mail válido'
                });
                continue;
            }

            // Find member by email
            const member = members.find(m => m.email.toLowerCase() === email);
            if (!member) {
                results.push({
                    filename: file.name,
                    email,
                    memberName: '-',
                    success: false,
                    error: 'Sócio não encontrado'
                });
                continue;
            }

            // Upload
            try {
                await toolsService.uploadProgressFile({
                    member_id: member.id,
                    title: bulkTitle,
                    file: file
                });

                results.push({
                    filename: file.name,
                    email,
                    memberName: member.name,
                    success: true
                });
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
                results.push({
                    filename: file.name,
                    email,
                    memberName: member.name,
                    success: false,
                    error: errMsg
                });
            }
        }

        setBulkResults(results);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
            toast.success(`${successCount} arquivo(s) enviado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falha(s)` : ''}!`);
        } else {
            toast.error(`Nenhum arquivo foi enviado. ${errorCount} falha(s).`);
        }

        setUploading(false);
        loadData();
    };

    const handleDelete = async (id: string) => {
        try {
            await toolsService.deleteProgressFile(id);
            toast.success('Arquivo excluído');
            loadData();
        } catch (err) {
            console.error('Failed to delete file:', err);
            toast.error('Erro ao excluir arquivo');
        }
    };

    const getFileIcon = (fileType: string) => {
        const type = fileType.toLowerCase();
        if (type === 'html' || type === 'htm') return <FileCode size={20} className="text-orange-400" />;
        if (type === 'pdf') return <FileText size={20} className="text-red-400" />;
        if (['xlsx', 'xls', 'csv', 'excel'].includes(type)) return <FileSpreadsheet size={20} className="text-green-400" />;
        if (['doc', 'docx'].includes(type)) return <FileText size={20} className="text-blue-400" />;
        return <File size={20} className="text-slate-400" />;
    };

    const getFileTypeBadge = (fileType: string) => {
        const type = fileType.toUpperCase();
        const colorMap: Record<string, string> = {
            'HTML': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            'HTM': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            'PDF': 'bg-red-900/30 text-red-400 border-red-800/50',
            'XLSX': 'bg-green-900/30 text-green-400 border-green-800/50',
            'XLS': 'bg-green-900/30 text-green-400 border-green-800/50',
            'DOC': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
            'DOCX': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
        };
        const color = colorMap[type] || 'bg-slate-700 text-slate-300 border-slate-600';
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${color}`}>
                {type}
            </span>
        );
    };

    // Filtered files
    const filteredFiles = files.filter(file => {
        const matchesMember = !filterMemberId || file.member_id === filterMemberId;
        const matchesSearch = !searchQuery ||
            file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (file.member?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMember && matchesSearch;
    });

    // Stats
    const uniqueMembers = new Set(files.map(f => f.member_id)).size;
    const htmlCount = files.filter(f => f.file_type.toLowerCase() === 'html').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <AdminPageHeader
                title="Relatórios de Progresso"
                subtitle="Envie relatórios HTML, PDFs e planilhas para os sócios"
                action={
                    <button
                        onClick={loadData}
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        title="Atualizar"
                    >
                        <RefreshCw size={18} />
                    </button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Total de Arquivos</p>
                    <p className="text-2xl font-bold text-white">{files.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Sócios com Relatório</p>
                    <p className="text-2xl font-bold text-yellow-500">{uniqueMembers}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Relatórios HTML</p>
                    <p className="text-2xl font-bold text-orange-400">{htmlCount}</p>
                </div>
            </div>



            <div className="grid lg:grid-cols-5 gap-6">
                {/* Upload Form - Left Column (2/5) */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 sticky top-6">
                        {/* Mode Tabs */}
                        <div className="flex gap-1 mb-5 bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setUploadMode('bulk')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition ${uploadMode === 'bulk'
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Layers size={14} />
                                Em Massa
                            </button>
                            <button
                                onClick={() => setUploadMode('single')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition ${uploadMode === 'single'
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Upload size={14} />
                                Individual
                            </button>
                        </div>

                        {uploadMode === 'bulk' ? (
                            /* ====== BULK UPLOAD ====== */
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layers size={18} className="text-yellow-500" />
                                    Upload em Massa
                                </h2>

                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        📋 <strong className="text-slate-300">Como funciona:</strong> Renomeie cada arquivo com o <strong className="text-yellow-500">e-mail do sócio</strong>.
                                        Ex: <code className="text-orange-400 text-[10px]">joao@email.com.html</code>
                                    </p>
                                </div>

                                {/* Bulk Title */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">
                                        Título <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={bulkTitle}
                                        onChange={e => setBulkTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                 placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition text-sm"
                                        placeholder="Ex: Relatório de Progresso - Fev/2026"
                                    />
                                </div>

                                {/* Bulk Files */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">
                                        Arquivos <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        ref={bulkInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleBulkFilesSelect}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                                 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0
                                                 file:text-sm file:font-medium file:bg-yellow-600 file:text-white
                                                 file:cursor-pointer hover:file:bg-yellow-500"
                                        accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        Selecione vários arquivos nomeados com e-mail
                                    </p>
                                </div>

                                {/* Selected files preview */}
                                {bulkFiles.length > 0 && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {bulkFiles.length} arquivo(s) selecionado(s):
                                        </p>
                                        {bulkFiles.map((f, i) => {
                                            const email = f.name.replace(/\.(html|htm|pdf|xlsx|xls|doc|docx|csv)$/i, '').toLowerCase();
                                            const member = members.find(m => m.email.toLowerCase() === email);
                                            return (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-xs">
                                                    {member ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Sócio encontrado" />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Sócio não encontrado" />
                                                    )}
                                                    <span className="text-slate-300 truncate flex-1">{f.name}</span>
                                                    {member && (
                                                        <span className="text-green-400 truncate text-[10px]">{member.name}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Progress bar */}
                                {uploading && bulkProgress.total > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Enviando...</span>
                                            <span>{bulkProgress.current}/{bulkProgress.total}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleBulkUpload}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                             rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2"
                                    disabled={uploading || bulkFiles.length === 0}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Enviando {bulkProgress.current}/{bulkProgress.total}...
                                        </>
                                    ) : (
                                        <>
                                            <Layers size={18} />
                                            Enviar {bulkFiles.length > 0 ? `${bulkFiles.length} Arquivo(s)` : 'em Massa'}
                                        </>
                                    )}
                                </button>

                                {/* Bulk Results */}
                                {bulkResults.length > 0 && (
                                    <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-3">
                                        <p className="text-xs font-bold text-slate-300 mb-2">Resultado do Upload:</p>
                                        {bulkResults.map((r, i) => (
                                            <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs ${r.success ? 'bg-green-900/10' : 'bg-red-900/10'
                                                }`}>
                                                <span>{r.success ? '✅' : '❌'}</span>
                                                <span className="text-slate-300 flex-1 truncate">{r.email}</span>
                                                <span className={`truncate ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    {r.success ? r.memberName : r.error}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ====== SINGLE UPLOAD ====== */
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Upload size={18} className="text-yellow-500" />
                                    Upload Individual
                                </h2>
                                <form onSubmit={handleSingleUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Sócio <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={selectedMemberId}
                                            onChange={e => setSelectedMemberId(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                     focus:outline-none focus:border-yellow-600 transition text-sm"
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Título <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fileTitle}
                                            onChange={e => setFileTitle(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white 
                                                     placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition text-sm"
                                            placeholder="Ex: Relatório - Fev/2026"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">
                                            Arquivo <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                                     file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0
                                                     file:text-sm file:font-medium file:bg-yellow-600 file:text-white
                                                     file:cursor-pointer hover:file:bg-yellow-500"
                                            accept=".html,.htm,.pdf,.xlsx,.xls,.doc,.docx,.csv"
                                            required
                                        />
                                    </div>
                                    {selectedFile && (
                                        <div className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            {getFileIcon(selectedFile.name.split('.').pop() || '')}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold 
                                                 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                                 flex items-center justify-center gap-2"
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Enviar Arquivo
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Files List - Right Column (3/5) */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-yellow-500" />
                                Histórico
                                <span className="text-sm font-normal text-slate-500">
                                    ({filteredFiles.length})
                                </span>
                            </h2>
                        </div>

                        {/* Search & Filter */}
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm
                                             placeholder:text-slate-500 focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <select
                                value={filterMemberId}
                                onChange={e => setFilterMemberId(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                                         focus:outline-none focus:border-yellow-600 transition"
                            >
                                <option value="">Todos os sócios</option>
                                {members
                                    .filter(m => files.some(f => f.member_id === m.id))
                                    .map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Files */}
                        {filteredFiles.length === 0 ? (
                            <div className="py-12 text-center">
                                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                                <p className="text-slate-500 text-sm">
                                    {files.length === 0 ? 'Nenhum arquivo enviado' : 'Nenhum resultado'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="group flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
                                    >
                                        <div className="shrink-0">{getFileIcon(file.file_type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-medium text-sm text-white truncate">{file.title}</p>
                                                {getFileTypeBadge(file.file_type)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={12} className="text-slate-500 shrink-0" />
                                                <span className="text-xs text-slate-400 truncate">
                                                    {file.member?.name || 'Desconhecido'}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                            {(file.file_type.toLowerCase() === 'html' || file.file_type.toLowerCase() === 'htm') && (
                                                <button
                                                    onClick={async () => {
                                                        setLoadingPreview(true);
                                                        setPreviewTitle(file.title);
                                                        setPreviewMemberName(file.member?.name || '');
                                                        try {
                                                            const response = await fetch(file.file_url);
                                                            const text = await response.text();
                                                            const blob = new Blob([text], { type: 'text/html' });
                                                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                            setPreviewUrl(URL.createObjectURL(blob));
                                                        } catch (err) {
                                                            console.error('Preview failed:', err);
                                                            window.open(file.file_url, '_blank');
                                                        } finally {
                                                            setLoadingPreview(false);
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-yellow-900/30 text-yellow-500 rounded-lg transition"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-blue-900/30 text-blue-400 rounded-lg transition"
                                                title="Abrir"
                                            >
                                                <Download size={16} />
                                            </a>
                                            <button
                                                onClick={() => setConfirmDeleteId(file.id)}
                                                className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading overlay for preview */}
            {loadingPreview && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="animate-spin text-yellow-500 mx-auto mb-3" size={32} />
                        <p className="text-white text-sm">Carregando relatório...</p>
                    </div>
                </div>
            )}

            {/* HTML Preview Modal - uses blob URL with correct MIME type */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <FileCode size={20} className="text-orange-400" />
                                <div>
                                    <h3 className="font-bold text-white">{previewTitle}</h3>
                                    <p className="text-xs text-slate-400">{previewMemberName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                    setPreviewTitle('');
                                    setPreviewMemberName('');
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={previewUrl}
                                className="w-full h-full min-h-[60vh] bg-white rounded-b-xl"
                                title={previewTitle}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Confirm Delete Dialog */}
            <AdminConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={async () => {
                    if (!confirmDeleteId) return;
                    await handleDelete(confirmDeleteId);
                    setConfirmDeleteId(null);
                }}
                title="Excluir Arquivo"
                message="Tem certeza que deseja excluir este arquivo? Essa ação não pode ser desfeita."
                confirmText="Excluir"
                isDestructive
            />
        </div>
    );
};

export default AdminMemberProgress;
```
