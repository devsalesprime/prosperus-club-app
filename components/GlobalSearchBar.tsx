// ============================================
// GLOBAL SEARCH BAR - Omnisearch Component
// ============================================
// Barra de busca global com debounce, dropdown categorizado e atalhos de navegação

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Search,
    Users,
    Calendar,
    Video,
    Image as ImageIcon,
    Briefcase,
    UserPlus,
    Gem,
    Newspaper,
    X,
    Loader2,
    Trophy,
    ChevronRight,
    LucideIcon
} from 'lucide-react';
import { searchService, GlobalSearchResults, SearchDeal, SearchReferral, SearchVideo, SearchBenefit, SearchArticle, SearchGalleryAlbum } from '../services/searchService';
import { ViewState, ClubEvent } from '../types';
import { ProfileData } from '../services/profileService';

interface GlobalSearchBarProps {
    currentUserId: string;
    onNavigate: (view: ViewState) => void;
    onViewProfile: (memberId: string) => void;
    onSelectEvent?: (event: ClubEvent) => void;
    className?: string;
}

// Navigation shortcuts based on keywords
const NAVIGATION_SHORTCUTS: Record<string, { view: ViewState; label: string; icon: LucideIcon }> = {
    'ranking': { view: ViewState.RANKINGS, label: 'Ir para Rankings', icon: Trophy },
    'agenda': { view: ViewState.AGENDA, label: 'Ir para Agenda', icon: Calendar },
    'academy': { view: ViewState.ACADEMY, label: 'Ir para Academy', icon: Video },
    'galeria': { view: ViewState.GALLERY, label: 'Ir para Galeria', icon: ImageIcon },
    'socios': { view: ViewState.MEMBERS, label: 'Ir para Sócios', icon: Users },
    'negocios': { view: ViewState.DEALS, label: 'Ir para Meus Negócios', icon: Briefcase },
};

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
    currentUserId,
    onNavigate,
    onViewProfile,
    onSelectEvent,
    className = ''
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalSearchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search function (300ms)
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 3) {
            setResults(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const searchResults = await searchService.globalSearch(searchQuery);
            setResults(searchResults);
            setIsOpen(true);
        } catch (error) {
            console.error('Search error:', error);
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer (300ms debounce)
        debounceTimerRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear search
    const handleClear = () => {
        setQuery('');
        setResults(null);
        setIsOpen(false);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    };

    // Check for navigation shortcuts
    const getNavigationShortcut = () => {
        const lowerQuery = query.toLowerCase().trim();
        return NAVIGATION_SHORTCUTS[lowerQuery];
    };

    const shortcut = getNavigationShortcut();
    const hasResults = results && searchService.hasResults(results);

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Busque por sócios, eventos, vídeos, negócios..."
                    className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600/50 focus:ring-2 focus:ring-yellow-600/20 transition-all"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
                {isLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400 animate-spin" size={20} />
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && query.trim().length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[500px] overflow-y-auto z-50">
                    {/* Navigation Shortcut */}
                    {shortcut && (
                        <div className="p-2 border-b border-slate-800">
                            <button
                                onClick={() => {
                                    onNavigate(shortcut.view);
                                    handleClear();
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                            >
                                <shortcut.icon size={20} className="text-yellow-400" />
                                <span className="flex-1 text-white font-medium">{shortcut.label}</span>
                                <ChevronRight size={16} className="text-slate-500" />
                            </button>
                        </div>
                    )}

                    {/* Results Sections */}
                    {hasResults ? (
                        <div className="p-2">
                            {/* Sócios */}
                            {results.members.length > 0 && (
                                <SearchSection
                                    icon={<Users size={18} className="text-blue-400" />}
                                    title="Sócios"
                                    items={results.members}
                                    renderItem={(member: ProfileData) => (
                                        <button
                                            key={member.id}
                                            onClick={() => {
                                                onViewProfile(member.id);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <img
                                                src={member.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                                alt={member.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{member.name}</div>
                                                <div className="text-sm text-slate-400 truncate">{member.company}</div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Eventos */}
                            {results.events.length > 0 && (
                                <SearchSection
                                    icon={<Calendar size={18} className="text-green-400" />}
                                    title="Eventos"
                                    items={results.events}
                                    renderItem={(event: ClubEvent) => (
                                        <button
                                            key={event.id}
                                            onClick={() => {
                                                if (onSelectEvent) onSelectEvent(event);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-green-500/20 rounded-lg">
                                                <Calendar size={20} className="text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{event.title}</div>
                                                <div className="text-sm text-slate-400">
                                                    {new Date(event.date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Vídeos (Academy) */}
                            {results.videos.length > 0 && (
                                <SearchSection
                                    icon={<Video size={18} className="text-purple-400" />}
                                    title="Academy"
                                    items={results.videos}
                                    renderItem={(video: SearchVideo) => (
                                        <button
                                            key={video.id}
                                            onClick={() => {
                                                onNavigate(ViewState.ACADEMY);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                                <Video size={20} className="text-purple-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{video.title}</div>
                                                {video.description && (
                                                    <div className="text-sm text-slate-400 truncate">{video.description}</div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Galeria */}
                            {results.gallery.length > 0 && (
                                <SearchSection
                                    icon={<ImageIcon size={18} className="text-pink-400" />}
                                    title="Galeria"
                                    items={results.gallery}
                                    renderItem={(album: SearchGalleryAlbum) => (
                                        <button
                                            key={album.id}
                                            onClick={() => {
                                                onNavigate(ViewState.GALLERY);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                                <ImageIcon size={20} className="text-pink-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{album.title}</div>
                                                {album.description && (
                                                    <div className="text-sm text-slate-400 truncate">{album.description}</div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Meus Negócios */}
                            {results.deals.length > 0 && (
                                <SearchSection
                                    icon={<Briefcase size={18} className="text-yellow-400" />}
                                    title="Meus Negócios"
                                    items={results.deals}
                                    renderItem={(deal: SearchDeal) => (
                                        <button
                                            key={deal.id}
                                            onClick={() => {
                                                onNavigate(ViewState.DEALS);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                                <Briefcase size={20} className="text-yellow-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{deal.description}</div>
                                                <div className="text-sm text-green-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.amount)}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Indicações */}
                            {results.referrals.length > 0 && (
                                <SearchSection
                                    icon={<UserPlus size={18} className="text-cyan-400" />}
                                    title="Indicações"
                                    items={results.referrals}
                                    renderItem={(referral: SearchReferral) => (
                                        <button
                                            key={referral.id}
                                            onClick={() => {
                                                onNavigate(ViewState.REFERRALS);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                                <UserPlus size={20} className="text-cyan-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{referral.lead_name}</div>
                                                {referral.lead_company && (
                                                    <div className="text-sm text-slate-400 truncate">{referral.lead_company}</div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Benefícios */}
                            {results.benefits.length > 0 && (
                                <SearchSection
                                    icon={<Gem size={18} className="text-amber-400" />}
                                    title="Benefícios"
                                    items={results.benefits}
                                    renderItem={(benefit: SearchBenefit) => (
                                        <button
                                            key={benefit.id}
                                            onClick={() => {
                                                onNavigate(ViewState.PROFILE);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                                <Gem size={20} className="text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{benefit.title}</div>
                                                {benefit.description && (
                                                    <div className="text-sm text-slate-400 truncate">{benefit.description}</div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}

                            {/* Artigos */}
                            {results.articles.length > 0 && (
                                <SearchSection
                                    icon={<Newspaper size={18} className="text-emerald-400" />}
                                    title="Notícias"
                                    items={results.articles}
                                    renderItem={(article: SearchArticle) => (
                                        <button
                                            key={article.id}
                                            onClick={() => {
                                                onNavigate(ViewState.NEWS);
                                                handleClear();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                <Newspaper size={20} className="text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{article.title}</div>
                                                {article.category && (
                                                    <div className="text-sm text-slate-400 truncate">{article.category}</div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-500" />
                                        </button>
                                    )}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            <Search size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Nenhum resultado encontrado</p>
                        </div>
                    )}
                </div>
            )}

            {/* Minimum Characters Message */}
            {isOpen && query.trim().length > 0 && query.trim().length < 3 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 text-center text-slate-400 z-50">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Digite pelo menos 3 caracteres para buscar</p>
                </div>
            )}
        </div>
    );
};

// Search Section Component
const SearchSection = <T,>({
    icon,
    title,
    items,
    renderItem
}: {
    icon: React.ReactNode;
    title: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}) => {
    if (items.length === 0) return null;

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-400">
                {icon}
                <span>{title}</span>
                <span className="ml-auto text-xs bg-slate-800 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-1">
                {items.map(renderItem)}
            </div>
        </div>
    );
};

export default GlobalSearchBar;
