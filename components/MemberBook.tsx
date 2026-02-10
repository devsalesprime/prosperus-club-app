// ============================================
// MEMBER BOOK - Diretório de Sócios com Filtros
// ============================================
// Lista de membros com filtros avançados por nome, cargo e interesses

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Search,
    Filter,
    X,
    Users,
    Briefcase,
    Tag,
    ChevronDown,
    PlayCircle,
    Gift,
    Linkedin,
    Instagram,
    UserX,
    Ticket,
    Download,
    FileSpreadsheet,
    Contact
} from 'lucide-react';
import { profileService, ProfileData } from '../services/profileService';
import { FavoriteButton } from './FavoriteButton';
import { favoriteService } from '../services/favoriteService';
import { exportMembersCSV, exportMembersVCard } from '../services/exportService';

// Popular tags for quick filtering
const POPULAR_TAGS = [
    'Tecnologia',
    'Vendas',
    'Marketing',
    'Investimentos',
    'Consultoria',
    'Saúde',
    'Educação',
    'Finanças',
    'Imobiliário',
    'Jurídico'
];

interface MemberBookProps {
    onSelectMember: (member: ProfileData) => void;
    currentUserId?: string;
    initialBenefitsFilter?: boolean; // Auto-activate benefits filter on mount
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export const MemberBook: React.FC<MemberBookProps> = ({ onSelectMember, currentUserId, initialBenefitsFilter = false }) => {
    // State
    const [members, setMembers] = useState<ProfileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [benefitsOnly, setBenefitsOnly] = useState(initialBenefitsFilter); // Initialize from prop
    const [favoritedMemberIds, setFavoritedMemberIds] = useState<Set<string>>(new Set());
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Debounced values (500ms delay)
    const debouncedQuery = useDebounce(searchQuery, 500);
    const debouncedRole = useDebounce(roleFilter, 500);


    // Check if any filter is active
    const hasActiveFilters = searchQuery || roleFilter || tagFilter || benefitsOnly;

    // Close export menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch members with filters
    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const filters: { query?: string; role?: string; tag?: string; excludeUserId?: string } = {};
            if (debouncedQuery) filters.query = debouncedQuery;
            if (debouncedRole) filters.role = debouncedRole;
            if (tagFilter) filters.tag = tagFilter;

            // Always exclude current user from listings (networking is about connecting with OTHERS)
            if (currentUserId) filters.excludeUserId = currentUserId;

            const hasFilters = Object.keys(filters).length > 0;
            const data = hasFilters
                ? await profileService.getFilteredProfiles(filters)
                : await profileService.getAllProfiles(currentUserId);
            setMembers(data);
        } catch (error) {
            console.error('Error fetching members:', error);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, debouncedRole, tagFilter, currentUserId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        favoriteService.getFavoritedIds('member').then(setFavoritedMemberIds);
    }, []);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
        setTagFilter('');
        setBenefitsOnly(false);
    };

    // Filter members client-side for benefits filter
    const filteredMembers = useMemo(() => {
        if (!benefitsOnly) return members;
        return members.filter(m => m.exclusive_benefit?.active);
    }, [members, benefitsOnly]);

    // Member count
    const memberCount = filteredMembers.length;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Members' Book</h2>
                    <p className="text-slate-400 text-sm">
                        {loading ? 'Carregando...' : `${memberCount} sócio${memberCount !== 1 ? 's' : ''} encontrado${memberCount !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-800 border-slate-700 text-slate-300 hover:border-yellow-600 hover:text-yellow-500 transition-all"
                            title="Exportar contatos"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline text-sm">Exportar</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in">
                                <div className="px-4 py-2.5 border-b border-slate-700">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Exportar {memberCount} contatos</p>
                                </div>
                                <button
                                    onClick={() => {
                                        exportMembersCSV(filteredMembers);
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
                                >
                                    <FileSpreadsheet size={18} className="text-green-400" />
                                    <div className="text-left">
                                        <p className="font-medium">Exportar CSV</p>
                                        <p className="text-xs text-slate-500">Abre no Excel, Google Sheets</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        exportMembersVCard(filteredMembers);
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition border-t border-slate-700/50"
                                >
                                    <Contact size={18} className="text-blue-400" />
                                    <div className="text-left">
                                        <p className="font-medium">Exportar vCard (.vcf)</p>
                                        <p className="text-xs text-slate-500">Importa nos contatos do celular</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showFilters || hasActiveFilters
                            ? 'bg-yellow-600 border-yellow-600 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                    >
                        <Filter size={18} />
                        Filtrar
                        {hasActiveFilters && (
                            <span className="bg-white text-yellow-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {[searchQuery, roleFilter, tagFilter].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Bar - Desktop always visible, Mobile toggleable */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-4`}>
                {/* Search and Role Inputs Row */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Text Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nome ou empresa..."
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Role/Job Title Filter */}
                    <div className="relative md:w-64">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            placeholder="Cargo (CEO, Diretor...)"
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition-all"
                        />
                        {roleFilter && (
                            <button
                                onClick={() => setRoleFilter('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Clear All Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="h-12 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
                        >
                            <X size={16} />
                            Limpar
                        </button>
                    )}
                </div>

                {/* Tags Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-slate-400 text-sm flex items-center gap-1 mr-2">
                        <Tag size={14} />
                        Interesses:
                    </span>
                    {POPULAR_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tagFilter === tag
                                ? 'bg-yellow-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}

                    {/* Benefits Toggle */}
                    <div className="ml-auto flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
                        <Ticket size={16} className={benefitsOnly ? 'text-yellow-500' : 'text-slate-400'} />
                        <span className={`text-sm font-medium ${benefitsOnly ? 'text-white' : 'text-slate-400'}`}>
                            Com Benefícios
                        </span>
                        <button
                            onClick={() => setBenefitsOnly(!benefitsOnly)}
                            style={{ minHeight: 'auto', minWidth: 'auto' }}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${benefitsOnly ? 'bg-yellow-600' : 'bg-slate-700'
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${benefitsOnly ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Members Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                </div>
            ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-slate-800 rounded-full mb-4">
                        <UserX size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum sócio encontrado</h3>
                    <p className="text-slate-400 max-w-md">
                        Nenhum sócio corresponde aos filtros selecionados. Tente ajustar sua busca.
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-medium transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && onSelectMember(member)}
                            onClick={() => onSelectMember(member)}
                            className={`bg-slate-900 rounded-xl border overflow-hidden ${member.id === currentUserId
                                ? 'border-yellow-600/50 ring-1 ring-yellow-600/20'
                                : 'border-slate-800'
                                } flex flex-col cursor-pointer hover:border-yellow-600 hover:shadow-xl hover:shadow-yellow-900/10 hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-slate-950 group`}
                        >
                            {/* Banner Header */}
                            <div className="relative h-24 w-full">
                                <img
                                    src={(member as any).banner_url || `${import.meta.env.BASE_URL}fundo-prosperus-app.webp`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20" />

                                {/* Favorite Button */}
                                {member.id !== currentUserId && (
                                    <FavoriteButton
                                        entityType="member"
                                        entityId={member.id}
                                        initialFavorited={favoritedMemberIds.has(member.id)}
                                        overlay
                                        size={18}
                                    />
                                )}
                            </div>

                            {/* Content with Avatar overlapping banner */}
                            <div className="flex flex-col items-center text-center px-6 pb-6 -mt-12">
                                {/* Avatar with badges */}
                                <div className="relative mb-4">
                                    <img
                                        src={member.image_url || '/default-avatar.svg'}
                                        alt={member.name}
                                        className="w-24 h-24 rounded-full border-4 border-slate-900 object-cover group-hover:border-yellow-600/50 transition-colors shadow-lg"
                                    />
                                    {/* Online indicator */}
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-slate-900 rounded-full"></div>

                                    {/* Video badge */}
                                    {member.pitch_video_url && (
                                        <div className="absolute -top-1 -left-1 bg-purple-600 text-white p-1.5 rounded-full shadow-lg" title="Tem vídeo de apresentação">
                                            <PlayCircle size={12} />
                                        </div>
                                    )}

                                    {/* Benefit badge - Destaque quando filtro ativo */}
                                    {member.exclusive_benefit?.active && (
                                        <div className={`absolute -top-1 -right-1 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg transition-all ${benefitsOnly
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 ring-2 ring-yellow-400/50 animate-pulse'
                                            : 'bg-yellow-600'
                                            }`}>
                                            <Gift size={10} />
                                            Oferta
                                        </div>
                                    )}

                                    {/* You badge */}
                                    {member.id === currentUserId && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                                            VOCÊ
                                        </div>
                                    )}
                                </div>

                                {/* Member info */}
                                <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                                    {member.name}
                                </h3>
                                <p className="text-yellow-500 font-medium text-sm mb-1">
                                    {member.job_title || 'Sócio'}
                                </p>
                                <p className="text-slate-400 text-sm mb-2">
                                    {member.company && `@${member.company}`}
                                </p>

                                {/* Tags */}
                                {member.tags && member.tags.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1 mb-3">
                                        {member.tags.slice(0, 3).map((tag, i) => (
                                            <span
                                                key={i}
                                                className={`px-2 py-0.5 text-[10px] rounded ${tag === tagFilter
                                                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                                                    : 'bg-slate-800 text-slate-400'
                                                    }`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {member.tags.length > 3 && (
                                            <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-500 rounded">
                                                +{member.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Bio preview */}
                                {member.bio && (
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{member.bio}</p>
                                )}

                                {/* Social links */}
                                <div className="flex gap-3 mt-auto">
                                    {member.socials?.linkedin && (
                                        <a
                                            href={member.socials.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Linkedin size={20} />
                                        </a>
                                    )}
                                    {member.socials?.instagram && (
                                        <a
                                            href={member.socials.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-slate-400 hover:text-pink-500 transition-colors"
                                        >
                                            <Instagram size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemberBook;
