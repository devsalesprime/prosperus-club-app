// ============================================
// MEMBER BOOK - Diretório de Sócios com Filtros
// ============================================
// Lista de membros com filtros avançados, matching empresarial inteligente

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePagination } from '../hooks/usePagination';
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
    Flame,
    Zap,
    ShoppingBag,
    HeartHandshake,
    Layers,
    Star
} from 'lucide-react';
import { profileService, ProfileData } from '../services/profileService';
import { FavoriteButton } from './FavoriteButton';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../contexts/AuthContext';
import { calculateMatch, MatchResult } from '../utils/matchEngine';
import { COPY } from '../utils/copy';
import { CardSkeleton } from './ui/CardSkeleton';
import { getOptimizedImageUrl } from '../utils/imageUtils';

// ─── Match Badge Config ───────────────────────────────────────────
const MATCH_CONFIG = {
    STRONG: {
        label: '🔥 Alta Conexão',
        className: 'bg-yellow-600/15 border-yellow-600/30 text-yellow-400',
        borderClass: 'border-yellow-600/25',
    },
    COMMON: {
        label: '🤝 Interesse Comum',
        className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        borderClass: 'border-blue-500/20',
    },
    POTENTIAL: {
        label: '💡 Potencial',
        className: 'bg-slate-700/50 border-slate-600/30 text-slate-400',
        borderClass: 'border-slate-700',
    },
} as const;

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
    const { userProfile } = useAuth();

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [benefitsOnly, setBenefitsOnly] = useState(initialBenefitsFilter);
    const [matchesOnly, setMatchesOnly] = useState(false);
    const [favoritedMemberIds, setFavoritedMemberIds] = useState<Set<string>>(new Set());
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Debounced values (500ms delay)
    const debouncedQuery = useDebounce(searchQuery, 500);
    const debouncedRole = useDebounce(roleFilter, 500);

    // ─── Build filters object ─────────────────────────────────────
    const filters = useMemo(() => {
        const f: { query?: string; role?: string; tag?: string; excludeUserId?: string } = {};
        if (debouncedQuery) f.query = debouncedQuery;
        if (debouncedRole) f.role = debouncedRole;
        if (tagFilter) f.tag = tagFilter;
        if (currentUserId) f.excludeUserId = currentUserId;
        return f;
    }, [debouncedQuery, debouncedRole, tagFilter, currentUserId]);

    // ─── Paginated Fetch ──────────────────────────────────────────
    const fetcher = useCallback(
        (page: number, pageSize: number) =>
            profileService.getProfilesPaginated(page, pageSize, filters),
        [filters]
    );

    const {
        items: members,
        isLoading: loading,
        isLoadingMore,
        hasMore,
        totalCount,
        loadMore,
        reset: resetPagination,
    } = usePagination<ProfileData>({ fetcher, pageSize: 20, autoFetch: false });

    // Reset pagination when filters change
    useEffect(() => {
        resetPagination();
    }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Match Engine (Incremental) ───────────────────────────────
    const [matchMap, setMatchMap] = useState<Map<string, MatchResult>>(new Map());

    useEffect(() => {
        if (!userProfile || members.length === 0) return;
        // Only score profiles not yet in the map
        const newProfiles = members.filter(p => !matchMap.has(p.id));
        if (newProfiles.length === 0) return;
        const newMatches = newProfiles
            .map(p => calculateMatch(userProfile, p))
            .filter(r => r.matchType !== 'NONE');
        setMatchMap(prev => {
            const updated = new Map(prev);
            newMatches.forEach(m => updated.set(m.profile.id, m));
            return updated;
        });
    }, [members, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset match map when filters change
    useEffect(() => {
        setMatchMap(new Map());
    }, [filters]);

    const matches = useMemo(() => {
        return Array.from(matchMap.values()).sort((a, b) => b.score - a.score);
    }, [matchMap]);

    const strongMatches = useMemo(
        () => matches.filter(m => m.matchType === 'STRONG'),
        [matches]
    );

    // Check if any filter is active
    const hasActiveFilters = searchQuery || roleFilter || tagFilter || benefitsOnly || matchesOnly;

    useEffect(() => {
        favoriteService.getFavoritedIds('member').then(setFavoritedMemberIds);
    }, []);

    // ─── Infinite Scroll Observer ─────────────────────────────────
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
                    loadMore();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loading, loadMore]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
        setTagFilter('');
        setBenefitsOnly(false);
        setMatchesOnly(false);
    };

    // Filter members client-side (benefits/matches are client toggles)
    const filteredMembers = useMemo(() => {
        let list = members;
        if (benefitsOnly) {
            list = list.filter(m => m.exclusive_benefit?.active && m.benefit_status === 'approved');
        }
        if (matchesOnly) {
            const matchIds = new Set(matches.map(m => m.profile.id));
            list = list.filter(m => matchIds.has(m.id));
        }
        // Ordenar por score de match: maior pontuação primeiro, sem match por último
        return [...list].sort((a, b) => {
            const scoreA = matchMap.get(a.id)?.score ?? 0;
            const scoreB = matchMap.get(b.id)?.score ?? 0;
            return scoreB - scoreA;
        });
    }, [members, benefitsOnly, matchesOnly, matches, matchMap]);

    // Member count — prefer server total when no client filters active
    const memberCount = (benefitsOnly || matchesOnly) ? filteredMembers.length : (totalCount ?? filteredMembers.length);

    return (
        <div className="space-y-6 animate-in fade-in px-4 pt-4 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-1 mt-1">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-600 shrink-0 mt-0.5">
                            <path d="M8.5 22C12.0899 22 15 19.0899 15 15.5C15 11.9101 12.0899 9 8.5 9C4.91015 9 2 11.9101 2 15.5C2 19.0899 4.91015 22 8.5 22Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" />
                            <path d="M18 14.5C20.35 13.52 22 11.2 22 8.5C22 4.91 19.09 2 15.5 2C12.8 2 10.48 3.65 9.5 6" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white">Members Book</h2>
                    </div>
                    <p className="text-slate-400 text-sm ml-10">
                        {loading ? COPY.loading.members : (
                            <>
                                {memberCount} sócio{memberCount !== 1 ? 's' : ''}
                                {matches.length > 0 && (
                                    <span className="text-yellow-500"> · {matches.length} compatíve{matches.length !== 1 ? 'is' : 'l'}</span>
                                )}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">

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
                            placeholder="Buscar por nome, empresa ou setor"
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

            {/* ── Matches Filter Toggle ── */}
            {matches.length > 0 && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMatchesOnly(false)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!matchesOnly
                            ? 'bg-yellow-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        type="button"
                        onClick={() => setMatchesOnly(true)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${matchesOnly
                            ? 'bg-yellow-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                    >
                        <Flame size={14} />
                        Matches ({matches.length})
                    </button>
                </div>
            )}

            {/* ── Strong Matches Carousel ── */}
            {!searchQuery && !matchesOnly && strongMatches.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Flame size={15} className="text-yellow-500" />
                            <span className="text-sm font-semibold text-white">Alta Conexão</span>
                        </div>
                        <span className="text-xs text-slate-500">
                            {strongMatches.length} {strongMatches.length === 1 ? 'conexão potencial' : 'conexões potenciais'}
                        </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`.match-carousel::-webkit-scrollbar { display: none; }`}</style>
                        {strongMatches.slice(0, 6).map(match => {
                            const { profile, score, reasons } = match;
                            const topReason = reasons[0];
                            return (
                                <div
                                    key={profile.id}
                                    onClick={() => onSelectMember(profile)}
                                    className="flex-shrink-0 w-52 snap-start bg-slate-900 border border-yellow-600/30 rounded-2xl p-4 hover:border-yellow-500/50 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <img
                                            src={getOptimizedImageUrl(profile.image_url, 96) || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                            alt={profile.name}
                                            loading="lazy"
                                            decoding="async"
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-xl object-cover bg-slate-800"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-600/15 border border-yellow-600/30">
                                            <Zap size={10} className="text-yellow-500" />
                                            <span className="text-xs font-bold text-yellow-400">{score}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-white leading-tight mb-0.5 truncate">{profile.name}</p>
                                    <p className="text-xs text-slate-500 truncate mb-3">
                                        {profile.job_title}{profile.company && ` · ${profile.company}`}
                                    </p>
                                    {topReason && (
                                        <div className="bg-yellow-600/[0.08] border border-yellow-600/15 rounded-lg px-2.5 py-2">
                                            <p className="text-[10px] font-semibold text-yellow-500 mb-0.5">{topReason.label}</p>
                                            <p className="text-[10px] text-slate-500 line-clamp-2">{topReason.detail}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Members Grid */}
            {loading ? (
                <CardSkeleton count={6} variant="card" />
            ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-slate-800 rounded-full mb-4">
                        <UserX size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum sócio encontrado</h3>
                    <p className="text-slate-400 max-w-md">
                        {COPY.empty.members}
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
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMembers.map((member) => {
                            const matchResult = matchMap.get(member.id);
                            const matchConfig = matchResult ? MATCH_CONFIG[matchResult.matchType] : null;
                            const isExpanded = expandedMatchId === member.id;

                            return (
                                <div
                                    key={member.id}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && onSelectMember(member)}
                                    onClick={() => onSelectMember(member)}
                                    className={`bg-slate-900 rounded-xl border overflow-hidden ${member.id === currentUserId
                                        ? 'border-yellow-600/50 ring-1 ring-yellow-600/20'
                                        : matchConfig ? matchConfig.borderClass : 'border-slate-800'
                                        } flex flex-col cursor-pointer hover:border-yellow-600 hover:shadow-xl hover:shadow-yellow-900/10 hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-slate-950 group`}
                                >
                                    {/* Banner Header */}
                                    <div className="relative h-24 w-full">
                                        <img
                                            src={getOptimizedImageUrl((member as any).banner_url, 800) || `${import.meta.env.BASE_URL}fundo-prosperus-app.webp`}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover bg-prosperus-navy"
                                        />
                                        <div className="absolute inset-0 bg-black/20" />

                                        {/* Match Badge — top-left overlay */}
                                        {matchConfig && matchResult && (
                                            <div className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${matchConfig.className}`}>
                                                {matchConfig.label}
                                            </div>
                                        )}

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
                                                src={getOptimizedImageUrl(member.image_url, 200) || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                                alt={member.name}
                                                loading="lazy"
                                                decoding="async"
                                                width={96}
                                                height={96}
                                                className="w-24 h-24 rounded-full border-4 border-slate-900 object-cover group-hover:border-yellow-600/50 transition-colors shadow-lg bg-slate-800"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                            {/* Online indicator */}
                                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-slate-900 rounded-full"></div>

                                            {/* Video badge */}
                                            {member.pitch_video_url && (
                                                <div className="absolute -top-1 -left-1 bg-purple-600 text-white p-1.5 rounded-full shadow-lg" title="Tem vídeo de apresentação">
                                                    <PlayCircle size={12} />
                                                </div>
                                            )}

                                            {/* Benefit badge */}
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
                                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors flex items-center justify-center gap-2">
                                            {member.name}
                                            {member.role === 'ACCOUNT_MANAGER' && (
                                                <span className="inline-flex items-center gap-1 bg-yellow-600/15 border border-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded-full text-[10px] font-bold" title="Account Manager">
                                                    <Star size={10} className="fill-yellow-400" />
                                                    AM
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-yellow-500 font-medium text-sm mb-1">
                                            {member.job_title || (member.role === 'ACCOUNT_MANAGER' ? 'Account Manager' : 'Sócio')}
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
                                        <div className="flex justify-center gap-4 mt-auto pt-4 pb-5">
                                            {member.socials?.linkedin && (
                                                <a
                                                    href={member.socials.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-slate-500 hover:text-blue-500 transition-colors"
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
                                                    className="text-slate-500 hover:text-pink-500 transition-colors"
                                                >
                                                    <Instagram size={20} />
                                                </a>
                                            )}
                                        </div>

                                        {/* ── Match Compatibility Section (Footer) ── */}
                                        {matchResult && matchResult.reasons.length > 0 && (
                                            <div className="w-full border-t border-slate-800/80 pt-3 pb-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedMatchId(isExpanded ? null : member.id);
                                                    }}
                                                    className="flex items-center justify-between w-full text-slate-500 hover:text-slate-300 transition-colors group"
                                                >
                                                    <span className="text-yellow-600 font-extrabold text-[13px]">
                                                        {matchResult.score} pts
                                                    </span>
                                                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                                                        <ChevronDown
                                                            size={14}
                                                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                        />
                                                        <span className="text-[11px] font-medium tracking-wide">
                                                            {isExpanded ? 'Ocultar compatibilidade' : 'Ver compatibilidade'}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-4 space-y-2 animate-in fade-in duration-200 pb-2">
                                                        {matchResult.reasons.map((reason, i) => (
                                                            <div key={i} className="flex gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left">
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${reason.type === 'SELLS_NEEDS' ? 'bg-yellow-600/15' :
                                                                    reason.type === 'NEEDS_SELLS' ? 'bg-blue-500/15' :
                                                                        reason.type === 'SECTOR' ? 'bg-purple-500/15' :
                                                                            'bg-emerald-500/15'
                                                                    }`}>
                                                                    {reason.type === 'SELLS_NEEDS' && <ShoppingBag size={12} className="text-yellow-500" />}
                                                                    {reason.type === 'NEEDS_SELLS' && <HeartHandshake size={12} className="text-blue-400" />}
                                                                    {reason.type === 'SECTOR' && <Layers size={12} className="text-purple-400" />}
                                                                    {reason.type === 'TAG' && <Tag size={12} className="text-emerald-400" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-semibold text-slate-300">{reason.label}</p>
                                                                    <p className="text-[10px] text-slate-500 mt-0.5">{reason.detail}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={sentinelRef} className="h-1" />

                    {/* Loading More Indicator */}
                    {isLoadingMore && (
                        <div className="flex items-center justify-center py-8 gap-3">
                            <div className="animate-spin w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full" />
                            <span className="text-sm text-slate-400">Buscando mais sócios...</span>
                        </div>
                    )}

                    {/* End of List */}
                    {!hasMore && filteredMembers.length > 0 && (
                        <div className="text-center py-6">
                            <p className="text-xs text-slate-600">Todos os {memberCount} sócios carregados</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MemberBook;

