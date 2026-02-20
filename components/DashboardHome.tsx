// ============================================
// DASHBOARD HOME - Central de Comando do Sócio
// ============================================
// Tela inicial com Grid de Acesso Rápido e Widgets

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    PlayCircle,
    Calendar,
    Users,
    Gem,
    Image as ImageIcon,
    Newspaper,
    ChevronRight,
    MapPin,
    Video as VideoIcon,
    Sparkles,
    Clock,
    ArrowRight,
    Search,
    Loader2,
    X,
    FileText,
    Trophy,
    DollarSign,
    Share2,
    Gift,
    Lightbulb,
    BarChart2
} from 'lucide-react';
import { ViewState, Member, ClubEvent } from '../types';
import { ProfileData } from '../services/profileService';
import { articleService } from '../services/articleService';
import { eventService } from '../services/eventService';
import { searchService, GlobalSearchResults, SearchArticle, SearchVideo, SearchGalleryAlbum } from '../services/searchService';
import { HomeCarousel } from './HomeCarousel';
import { OnboardingBanner } from './OnboardingBanner';
import { CarouselItem, Banner } from '../services/bannerService';
import { Avatar } from './ui/Avatar';
import { ROIDashboardWidget } from './business/ROIDashboardWidget';
import { TopRankingPreview } from './business/TopRankingPreview';
import { EventCard } from './EventCard';
import { EventDetailsModal } from './EventDetailsModal';
import { PullToRefresh } from './ui/PullToRefresh';

interface DashboardHomeProps {
    currentUser: Member | null;
    members: ProfileData[];
    carouselItems: CarouselItem[];
    setView: (view: ViewState) => void;
    onViewProfile: (memberId: string) => void;
    onBannerClick: (banner: Banner) => void;
    onEditProfile: () => void;
    memberToProfileData: (member: Member) => ProfileData;
    onSelectArticle?: (article: SearchArticle) => void;
    onNavigateToBenefits?: () => void; // Custom callback for benefits filter
    onRefresh?: () => Promise<void>; // Pull-to-refresh callback
}

// Quick Access Card Component
const QuickAccessCard = ({
    icon,
    label,
    color,
    onClick,
    badge
}: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
    badge?: string;
}) => (
    <button
        onClick={onClick}
        className="relative p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-yellow-600/50 hover:shadow-lg hover:shadow-yellow-600/5 transition-all duration-300 flex flex-col items-center text-center gap-3 group"
    >
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
            {label}
        </span>
        {badge && (
            <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-yellow-600 text-white text-[10px] font-bold rounded">
                {badge}
            </span>
        )}
    </button>
);

// Next Event Empty State — shown when no upcoming events
const NextEventEmptyState = () => {
    // Empty State - Elegant fallback
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden flex flex-col items-center justify-center p-12 hover:border-slate-600 transition-all">
            <Calendar size={48} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Sem eventos agendados</h3>
            <p className="text-sm text-slate-500">Novos eventos serão exibidos aqui</p>
        </div>
    );
};



// Global Search Bar Component with Dropdown
const GlobalSearchBar = ({
    onSelectMember,
    onSelectEvent,
    onSelectArticle,
    setView
}: {
    onSelectMember: (memberId: string) => void;
    onSelectEvent: () => void;
    onSelectArticle?: (article: SearchArticle) => void;
    setView: (view: ViewState) => void;
}) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<GlobalSearchResults | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search
    useEffect(() => {
        if (query.length < 3) {
            setResults(null);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            const searchResults = await searchService.globalSearch(query);
            setResults(searchResults);
            setShowDropdown(searchService.hasResults(searchResults));
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setQuery('');
        setResults(null);
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleSelectMember = (memberId: string) => {
        setShowDropdown(false);
        setQuery('');
        onSelectMember(memberId);
    };

    const handleSelectEvent = () => {
        setShowDropdown(false);
        setQuery('');
        onSelectEvent();
    };

    const handleSelectArticle = (article: SearchArticle) => {
        setShowDropdown(false);
        setQuery('');
        if (onSelectArticle) {
            onSelectArticle(article);
        } else {
            setView(ViewState.NEWS);
        }
    };

    const formatEventDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input */}
            <div className="relative z-50">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="O que você procura hoje?"
                    className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/50 transition-all"
                />
                {/* Loading Spinner or Clear Button */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isSearching ? (
                        <Loader2 size={18} className="text-yellow-500 animate-spin" />
                    ) : query ? (
                        <button onClick={handleClear} className="text-slate-400 hover:text-white p-1">
                            <X size={16} />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Results Dropdown */}
            {showDropdown && results && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Members Section */}
                    {results.members.length > 0 && (
                        <div className="p-3 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Users size={12} /> Sócios
                            </p>
                            {results.members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelectMember(member.id)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                >
                                    <img
                                        src={member.image_url || '/default-avatar.svg'}
                                        alt={member.name}
                                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{member.name}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {member.job_title}{member.company ? ` @ ${member.company}` : ''}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Events Section */}
                    {results.events.length > 0 && (
                        <div className="p-3 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Calendar size={12} /> Eventos
                            </p>
                            {results.events.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={handleSelectEvent}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-yellow-500">
                                            {formatEventDate(event.date)}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
                                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                                            {event.category === 'PRESENTIAL' ? <MapPin size={10} /> : <VideoIcon size={10} />}
                                            {event.location || 'Online'}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Articles Section */}
                    {results.articles.length > 0 && (
                        <div className="p-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <FileText size={12} /> Notícias
                            </p>
                            {results.articles.map((article) => (
                                <button
                                    key={article.id}
                                    onClick={() => handleSelectArticle(article)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                                        <Newspaper size={20} className="text-emerald-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{article.title}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Videos (Academy) Section */}
                    {results.videos.length > 0 && (
                        <div className="p-3 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <PlayCircle size={12} /> Academy
                            </p>
                            {results.videos.map((video) => (
                                <button
                                    key={video.id}
                                    onClick={() => {
                                        setShowDropdown(false);
                                        setQuery('');
                                        setView(ViewState.ACADEMY);
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                        <VideoIcon size={20} className="text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{video.title}</p>
                                        {video.series_id && (
                                            <p className="text-xs text-slate-400 truncate">{video.series_id}</p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className="text-slate-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Gallery Section */}
                    {results.gallery.length > 0 && (
                        <div className="p-3 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ImageIcon size={12} /> Galeria
                            </p>
                            {results.gallery.map((album) => (
                                <button
                                    key={album.id}
                                    onClick={() => {
                                        setShowDropdown(false);
                                        setQuery('');
                                        setView(ViewState.GALLERY);
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                >
                                    {album.coverImage ? (
                                        <img
                                            src={album.coverImage}
                                            alt={album.title}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                                            <ImageIcon size={16} className="text-emerald-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{album.title}</p>
                                        {album.description && (
                                            <p className="text-xs text-slate-400 truncate">{album.description}</p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className="text-slate-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Total count footer */}
                    <div className="px-3 py-2 bg-slate-800/50 text-center">
                        <p className="text-xs text-slate-500">
                            {searchService.getTotalCount(results)} resultado{searchService.getTotalCount(results) !== 1 ? 's' : ''} encontrado{searchService.getTotalCount(results) !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* No results message */}
            {showDropdown === false && query.length >= 3 && !isSearching && results && !searchService.hasResults(results) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl p-4 text-center shadow-xl">
                    <p className="text-slate-400 text-sm">Nenhum resultado encontrado para "{query}"</p>
                </div>
            )}
        </div>
    );
};

// Section Title Component
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">
        {children}
    </h3>
);

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    currentUser,
    members,
    carouselItems,
    setView,
    onViewProfile,
    onBannerClick,
    onEditProfile,
    memberToProfileData,
    onSelectArticle,
    onNavigateToBenefits,
    onRefresh
}) => {
    const [hasNews, setHasNews] = useState(false);
    const [nextEvent, setNextEvent] = useState<ClubEvent | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null); // Modal state

    // Check if there are published articles
    useEffect(() => {
        articleService.getPublishedArticles().then(result => {
            setHasNews(result.data && result.data.length > 0);
        });
    }, []);


    // Get next event from Supabase
    useEffect(() => {
        const fetchNextEvent = async () => {
            const events = await eventService.getEventsForUser(currentUser?.id || '');
            const upcoming = events
                .filter(e => new Date(e.date) > new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setNextEvent(upcoming[0] || null);
        };
        fetchNextEvent();
    }, [currentUser]);


    // Quick access items - Deep links de valor (ordem definida pelo cliente)
    const quickAccessItems = [
        // 1. Meus Negócios
        {
            id: 'my-deals',
            icon: <DollarSign size={24} className="text-emerald-400" />,
            label: 'Meus Negócios',
            color: 'bg-emerald-500/20',
            view: ViewState.DEALS,
        },
        // 2. Indicações
        {
            id: 'referrals',
            icon: <Share2 size={24} className="text-cyan-400" />,
            label: 'Indicações',
            color: 'bg-cyan-500/20',
            view: ViewState.REFERRALS,
        },
        // 3. Benefícios
        {
            id: 'benefits',
            icon: <Gift size={24} className="text-purple-400" />,
            label: 'Benefícios',
            color: 'bg-purple-500/20',
            view: ViewState.MEMBERS, // Navigate to members filtered by benefits
        },
        // 4. Aulas (Academy)
        {
            id: 'academy',
            icon: <PlayCircle size={24} className="text-violet-400" />,
            label: 'Aulas',
            color: 'bg-violet-500/20',
            view: ViewState.ACADEMY,
        },
        // 5. Soluções
        {
            id: 'solutions',
            icon: <Lightbulb size={24} className="text-amber-400" />,
            label: 'Soluções',
            color: 'bg-amber-500/20',
            view: ViewState.SOLUTIONS,
        },
        // 6. Meu Progresso
        {
            id: 'progress',
            icon: <BarChart2 size={24} className="text-teal-400" />,
            label: 'Meu Progresso',
            color: 'bg-teal-500/20',
            view: ViewState.PROGRESS,
        }
    ];

    // Add News if there are articles
    if (hasNews) {
        quickAccessItems.push({
            id: 'news',
            icon: <Newspaper size={24} className="text-emerald-400" />,
            label: 'Notícias',
            color: 'bg-emerald-500/20',
            view: ViewState.NEWS
        });
    }

    // Helper: Get first name with fallback
    // Prioridade: 1) Nome do currentUser, 2) Busca por ID nos members, 3) Fallback "Sócio"
    const getFirstName = (): string => {
        // Try currentUser.name first
        let name = currentUser?.name;

        // If name looks like email, try to find in members list by ID
        if (!name || name.includes('@')) {
            const memberProfile = members.find(m => m.id === currentUser?.id);
            if (memberProfile?.name && !memberProfile.name.includes('@')) {
                name = memberProfile.name;
            }
        }

        // If still no valid name, return fallback
        if (!name || name.includes('@')) {
            return 'Sócio';
        }

        // Extract first name
        const firstName = name.split(' ')[0];
        return firstName || 'Sócio';
    };

    return (
        <PullToRefresh onRefresh={onRefresh || (async () => { window.location.reload(); })}>
            <div className="space-y-4 animate-in fade-in px-4 pt-4 pb-6 max-w-7xl mx-auto">
                {/* 1. Saudação */}
                {currentUser && (
                    <div>
                        <p className="text-slate-400 text-sm">Olá,</p>
                        <h1 className="text-2xl font-bold text-white">
                            {getFirstName()}
                        </h1>
                    </div>
                )}

                {/* 2. Banners - Carrossel Híbrido */}
                <HomeCarousel
                    items={carouselItems}
                    onViewProfile={onViewProfile}
                    onBannerClick={onBannerClick}
                />

                {/* 3. Busca Global */}
                <GlobalSearchBar
                    onSelectMember={onViewProfile}
                    onSelectEvent={() => setView(ViewState.AGENDA)}
                    onSelectArticle={onSelectArticle}
                    setView={setView}
                />

                {/* 4. ROI Widget - Business Value Showcase */}
                {currentUser && (
                    <ROIDashboardWidget
                        onRegisterDeal={() => setView(ViewState.DEALS)}
                        onNavigateToDeals={() => setView(ViewState.DEALS)}
                    />
                )}

                {/* 5. Ranking Preview */}
                <TopRankingPreview
                    onViewFullRankings={() => setView(ViewState.RANKINGS)}
                    onProfileClick={onViewProfile}
                />

                {/* 6. Próximo Evento */}
                <div>
                    <SectionTitle>🎯 Próximo Encontro</SectionTitle>
                    {nextEvent ? (
                        <EventCard
                            event={nextEvent}
                            variant="HERO"
                            onClick={() => setSelectedEvent(nextEvent)}
                            onViewAgenda={() => setView(ViewState.AGENDA)}
                        />
                    ) : (
                        <NextEventEmptyState />
                    )}
                </div>

                {/* 7. Acesso Rápido */}
                <div>
                    <SectionTitle>⚡ Acesso Rápido</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {quickAccessItems.map(item => (
                            <QuickAccessCard
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                onClick={() => {
                                    // Special handling for benefits - use custom callback if provided
                                    if (item.id === 'benefits' && onNavigateToBenefits) {
                                        onNavigateToBenefits();
                                    } else {
                                        setView(item.view);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* 8. Onboarding Banner (final, apenas para novos usuários) */}
                {currentUser && (
                    <OnboardingBanner
                        currentUser={memberToProfileData(currentUser)}
                        onEditProfile={onEditProfile}
                    />
                )}

                {/* EVENT DETAILS MODAL - Full Featured with RSVP */}
                {selectedEvent && (
                    <EventDetailsModal
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                        userId={currentUser?.id}
                    />
                )}
            </div>
        </PullToRefresh>
    );
};

export default DashboardHome;
