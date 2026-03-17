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
