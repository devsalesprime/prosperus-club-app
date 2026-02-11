// NewConversationModal.tsx
// Premium modal for starting a new conversation with a member

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, MessageCircle, ArrowRight } from 'lucide-react';
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
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMembers();
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const { supabase } = await import('../lib/supabase');

            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, name, email, company, job_title, image_url, role, tags')
                .neq('id', currentUserId)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching profiles from Supabase:', error);
                return;
            }

            const mappedMembers = (profiles || []).map(p => ({
                id: p.id,
                name: p.name || p.email || 'Sócio',
                email: p.email,
                company: p.company,
                jobTitle: p.job_title,
                image: p.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
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
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={!creating ? onClose : undefined}
            />

            {/* Modal */}
            <div
                className="relative w-full sm:max-w-lg flex flex-col sm:rounded-2xl rounded-t-2xl overflow-hidden"
                style={{
                    maxHeight: '85vh',
                    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid rgba(51,65,85,0.5)',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(51,65,85,0.3)',
                    animation: 'slideUp 0.3s ease-out',
                }}
            >
                {/* Drag handle for mobile */}
                <div className="flex justify-center pt-2 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-slate-700" />
                </div>

                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(217,119,6,0.1))' }}
                        >
                            <MessageCircle className="text-yellow-500" size={16} />
                        </div>
                        Nova Conversa
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={creating}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 active:scale-90"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-5 pb-3">
                    <div className="relative">
                        <Search
                            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchFocused ? 'text-yellow-500' : 'text-slate-500'
                                }`}
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Buscar membros..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            disabled={creating}
                            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder-slate-500 transition-all duration-200 focus:outline-none disabled:opacity-50"
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                border: searchFocused
                                    ? '1px solid rgba(217,119,6,0.4)'
                                    : '1px solid rgba(51,65,85,0.4)',
                                boxShadow: searchFocused
                                    ? '0 0 0 3px rgba(217,119,6,0.08)'
                                    : 'none',
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto px-3 pb-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full border-2 border-yellow-500/20"></div>
                                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
                            </div>
                            <p className="text-slate-500 text-sm">Carregando membros...</p>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                            <div
                                className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'rgba(30,41,59,0.5)',
                                    border: '1px solid rgba(51,65,85,0.3)',
                                }}
                            >
                                <Search className="w-7 h-7 text-slate-600" />
                            </div>
                            <p className="text-slate-500 text-sm">
                                {searchQuery
                                    ? 'Nenhum membro encontrado'
                                    : 'Nenhum membro disponível'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredMembers.map((member, index) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelectMember(member.id)}
                                    disabled={creating}
                                    className="w-full px-3 py-3 rounded-xl transition-all duration-200 text-left flex items-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                                    style={{
                                        background: 'transparent',
                                        animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`,
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(30,41,59,0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                >
                                    {/* Avatar with gradient ring */}
                                    <div
                                        className="w-11 h-11 rounded-full p-[2px] shrink-0 transition-all duration-200"
                                        style={{
                                            background: 'rgba(51,65,85,0.5)',
                                        }}
                                    >
                                        <img
                                            src={member.image || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                            alt={member.name}
                                            className="w-full h-full rounded-full object-cover border-2 border-slate-800"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-slate-200 truncate group-hover:text-white transition-colors duration-200">
                                            {member.name}
                                        </h3>
                                        {member.jobTitle && (
                                            <p className="text-[11px] text-slate-500 truncate">
                                                {member.jobTitle}
                                                {member.company && ` · ${member.company}`}
                                            </p>
                                        )}
                                        {member.tags && member.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {member.tags.slice(0, 2).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] px-1.5 py-0.5 rounded-md text-slate-400"
                                                        style={{
                                                            background: 'rgba(51,65,85,0.4)',
                                                            border: '1px solid rgba(51,65,85,0.3)',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {member.tags.length > 2 && (
                                                    <span className="text-[10px] text-slate-600">
                                                        +{member.tags.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight
                                        className="text-slate-700 group-hover:text-yellow-500 transition-all duration-200 shrink-0 group-hover:translate-x-0.5"
                                        size={16}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800/50">
                    <p className="text-[11px] text-slate-600 text-center">
                        {filteredMembers.length} {filteredMembers.length === 1 ? 'membro disponível' : 'membros disponíveis'}
                    </p>
                </div>

                {/* Creating Overlay */}
                {creating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                        <div
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl"
                            style={{
                                background: 'rgba(30,41,59,0.9)',
                                border: '1px solid rgba(51,65,85,0.5)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full border-2 border-yellow-500/20"></div>
                                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
                            </div>
                            <p className="text-white text-sm font-medium">Criando conversa...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
