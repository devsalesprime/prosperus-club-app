// NewConversationModal.tsx
// Modal for starting a new conversation with a member

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, MessageCircle } from 'lucide-react';
import { Member } from '../types';
import { conversationService } from '../services/conversationService';

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onConversationCreated: (conversationId: string) => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
    isOpen,
    onClose,
    currentUserId,
    onConversationCreated
}) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMembers();
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadMembers = async () => {
        try {
            setLoading(true);

            // Import supabase
            const { supabase } = await import('../lib/supabase');

            // Fetch real members from Supabase profiles table
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, name, email, company, job_title, image_url, role, tags')
                .neq('id', currentUserId) // Exclude current user
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching profiles from Supabase:', error);
                return;
            }

            // Map profiles to Member format
            const mappedMembers = (profiles || []).map(p => ({
                id: p.id,
                name: p.name || p.email || 'Sócio',
                email: p.email,
                company: p.company,
                jobTitle: p.job_title,
                image: p.image_url || '/default-avatar.svg',
                role: p.role,
                tags: p.tags || [],
                description: '',
                socials: {}
            })) as Member[];

            setMembers(mappedMembers);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(member => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            member.name.toLowerCase().includes(query) ||
            member.company?.toLowerCase().includes(query) ||
            member.jobTitle?.toLowerCase().includes(query)
        );
    });

    const handleSelectMember = async (memberId: string) => {
        try {
            setCreating(true);
            const conversationId = await conversationService.getOrCreateConversation(
                currentUserId,
                memberId
            );
            onConversationCreated(conversationId);
            onClose();
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Erro ao criar conversa. Tente novamente.');
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="text-yellow-500" size={24} />
                        Nova Conversa
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={creating}
                        className="btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar membros..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={creating}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-600 transition disabled:opacity-50"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400">
                                {searchQuery
                                    ? 'Nenhum membro encontrado'
                                    : 'Nenhum membro disponível'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {filteredMembers.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelectMember(member.id)}
                                    disabled={creating}
                                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-600 rounded-lg transition text-left flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {/* Avatar */}
                                    <img
                                        src={member.image || '/default-avatar.svg'}
                                        alt={member.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 group-hover:border-yellow-600 transition"
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate group-hover:text-yellow-500 transition">
                                            {member.name}
                                        </h3>
                                        {member.jobTitle && (
                                            <p className="text-sm text-slate-400 truncate">
                                                {member.jobTitle}
                                                {member.company && ` @ ${member.company}`}
                                            </p>
                                        )}
                                        {member.tags && member.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {member.tags.slice(0, 3).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <MessageCircle
                                        className="text-slate-600 group-hover:text-yellow-500 transition shrink-0"
                                        size={20}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <p className="text-xs text-slate-500 text-center">
                        {filteredMembers.length} {filteredMembers.length === 1 ? 'membro' : 'membros'} disponível
                        {filteredMembers.length !== 1 ? 'is' : ''}
                    </p>
                </div>
            </div>

            {/* Loading Overlay */}
            {creating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        <p className="text-white font-medium">Criando conversa...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
