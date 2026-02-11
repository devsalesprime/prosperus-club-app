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
import { dataService } from '../services/mockData';
import { searchService, GlobalSearchResults, SearchArticle, SearchVideo, SearchGalleryAlbum } from '../services/searchService';
import { HomeCarousel } from './HomeCarousel';
import { OnboardingBanner } from './OnboardingBanner';
import { CarouselItem, Banner } from '../services/bannerService';
import { Avatar } from './ui/Avatar';
import { ROIDashboardWidget } from './business/ROIDashboardWidget';
import { TopRankingPreview } from './business/TopRankingPreview';

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

// Next Event Widget Component - Sharp Luxury Design with Dual Actions
const NextEventWidget = ({
    event,
    onViewDetails,
    onViewAgenda
}: {
    event: ClubEvent | null;
    onViewDetails: () => void;
    onViewAgenda: () => void;
}) => {
    // Empty State - Elegant fallback
    if (!event) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden flex flex-col items-center justify-center p-12 hover:border-slate-600 transition-all">
                <Calendar size={48} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">Sem eventos agendados</h3>
                <p className="text-sm text-slate-500">Novos eventos serão exibidos aqui</p>
            </div>
        );
    }

    const eventDate = new Date(event.date);
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));

    // Check if event is today
    const isToday = eventDate.toDateString() === now.toDateString();

    // Category styling - Exact colors
    const categoryConfig = {
        ONLINE: {
            bg: 'bg-[#10b981]/10',
            text: 'text-[#10b981]',
            border: 'border-[#10b981]/30',
            icon: <VideoIcon size={12} className="text-[#10b981]" />,
            label: 'Online'
        },
        PRESENTIAL: {
            bg: 'bg-[#9333ea]/10',
            text: 'text-[#9333ea]',
            border: 'border-[#9333ea]/30',
            icon: <MapPin size={12} className="text-[#9333ea]" />,
            label: 'Presencial'
        },
        RECORDED: {
            bg: 'bg-orange-500/10',
            text: 'text-orange-500',
            border: 'border-orange-500/30',
            icon: <PlayCircle size={12} className="text-orange-500" />,
            label: 'Gravado'
        }
    };

    const config = categoryConfig[event.category as keyof typeof categoryConfig] || categoryConfig.ONLINE;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden flex flex-col md:flex-row hover:border-yellow-600/50 transition-all group shadow-xl hover:shadow-2xl hover:shadow-yellow-600/10">
            {/* Date Block - Sharp Luxury Golden - Clickable for Quick View */}
            <div
                className="md:w-32 bg-gradient-to-br from-[#FFDA71] to-[#D4AF37] p-6 flex flex-col items-center justify-center text-center shrink-0 relative overflow-hidden cursor-pointer"
                onClick={onViewDetails}
                title="Clique para ver detalhes"
            >
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 transform rotate-45 translate-x-8 -translate-y-8"></div>

                <span className="text-5xl font-black text-slate-900 leading-none mb-1 relative z-10">
                    {eventDate.getDate().toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 relative z-10">
                    {eventDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}
                </span>
                <div className="flex items-center gap-1 text-slate-700 relative z-10">
                    <Clock size={12} />
                    <span className="text-xs font-bold">
                        {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Content - Clickable for Quick View */}
            <div
                className="p-5 flex-1 flex flex-col justify-center min-w-0 bg-slate-900/50 cursor-pointer"
                onClick={onViewDetails}
                title="Clique para ver detalhes"
            >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {/* Category Badge - Exact colors */}
                    <span className={`px-2.5 py-1 ${config.bg} ${config.text} border ${config.border} text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5`}>
                        {config.icon}
                        {config.label}
                    </span>

                    {/* Countdown - Enhanced */}
                    {timeDiff > 0 && (
                        <span className={`px-2.5 py-1 ${isToday ? 'bg-yellow-500 text-slate-900 animate-pulse' : 'bg-yellow-500/10 text-[#FFDA71]'} border border-yellow-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5`}>
                            <Sparkles size={12} className={isToday ? 'text-slate-900' : 'text-[#FFDA71]'} />
                            {isToday ? 'É HOJE!' : `Faltam ${days > 0 ? `${days}d ` : ''}${hours}h`}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-black text-white mb-2 line-clamp-2 group-hover:text-[#FFDA71] transition-colors leading-tight">
                    {event.title}
                </h3>

                <div className="flex items-center text-slate-400 text-sm">
                    {event.category === 'PRESENTIAL' ? (
                        <MapPin size={14} className="mr-1.5 shrink-0 text-[#9333ea]" />
                    ) : event.category === 'ONLINE' ? (
                        <VideoIcon size={14} className="mr-1.5 shrink-0 text-[#10b981]" />
                    ) : (
                        <PlayCircle size={14} className="mr-1.5 shrink-0 text-orange-500" />
                    )}
                    <span className="truncate font-medium">
                        {event.location || event.link || 'Link disponível após inscrição'}
                    </span>
                </div>
            </div>

            {/* CTA Button - Navigate to Full Agenda */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent click
                    onViewAgenda();
                }}
                className="p-5 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-700/50 bg-slate-800/50 md:w-32 hover:bg-yellow-600/10 transition-all"
                title="Ver calendário completo"
            >
                <div className="flex flex-col md:flex-col items-center gap-2 text-[#FFDA71] hover:text-yellow-400 transition-colors">
                    <span className="text-xs font-bold uppercase tracking-wider text-center">Ver Agenda</span>
                    <Calendar size={24} className="group-hover:scale-110 transition-transform" />
                </div>
            </button>
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
        <div ref={containerRef} className="relative z-50">
            {/* Search Input */}
            <div className="relative">
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
    onNavigateToBenefits
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


    // Get next event
    useEffect(() => {
        const events = dataService.getClubEvents()
            .filter(e => new Date(e.date) > new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setNextEvent(events[0] || null);
    }, []);


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
        <div className="space-y-8 animate-in fade-in pb-10 max-w-7xl mx-auto">
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
            />

            {/* 6. Próximo Evento */}
            {nextEvent && (
                <div>
                    <SectionTitle>🎯 Próximo Encontro</SectionTitle>
                    <NextEventWidget
                        event={nextEvent}
                        onViewDetails={() => setSelectedEvent(nextEvent)}
                        onViewAgenda={() => setView(ViewState.AGENDA)}
                    />
                </div>
            )}

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

            {/* EVENT DETAILS MODAL - Quick View */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-slate-900 border border-slate-700 w-[95%] md:w-full md:max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
                        <div className="h-32 bg-gradient-to-r from-yellow-600 to-yellow-800 relative rounded-t-2xl overflow-hidden shrink-0">
                            {selectedEvent.bannerUrl && (
                                <img src={selectedEvent.bannerUrl} alt={selectedEvent.title} className="w-full h-full object-cover opacity-50" />
                            )}
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition z-10"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 md:p-6 overflow-y-auto flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedEvent.category === 'ONLINE'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                                    }`}>
                                    {selectedEvent.category === 'PRESENTIAL' ? 'Presencial' : 'Online'}
                                </span>
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(selectedEvent.date).toLocaleDateString('pt-BR')} às {new Date(selectedEvent.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4">{selectedEvent.title}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                                    </div>

                                    {selectedEvent.category === 'PRESENTIAL' && selectedEvent.location && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <MapPin size={14} />
                                                Localização
                                            </h3>
                                            <p className="text-slate-300 mb-2">{selectedEvent.location}</p>
                                            {selectedEvent.mapLink && (
                                                <a
                                                    href={selectedEvent.mapLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 text-sm font-medium transition"
                                                >
                                                    <MapPin size={14} />
                                                    Ver no Mapa
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {selectedEvent.category === 'ONLINE' && selectedEvent.link && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <VideoIcon size={14} />
                                                Link da Reunião
                                            </h3>
                                            <a
                                                href={selectedEvent.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-500 hover:text-yellow-400 text-sm break-all transition"
                                            >
                                                {selectedEvent.link}
                                            </a>
                                            {selectedEvent.meetingPassword && (
                                                <div className="mt-2">
                                                    <span className="text-slate-400 text-sm">Senha: </span>
                                                    <span className="text-white font-mono">{selectedEvent.meetingPassword}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Detalhes</h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-slate-500">Início:</span>
                                                <p className="text-white font-medium">
                                                    {new Date(selectedEvent.date).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-white font-medium">
                                                    {new Date(selectedEvent.date).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {selectedEvent.endDate && (
                                                <div>
                                                    <span className="text-slate-500">Término:</span>
                                                    <p className="text-white font-medium">
                                                        {new Date(selectedEvent.endDate).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedEvent(null);
                                            setView(ViewState.AGENDA);
                                        }}
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Calendar size={18} />
                                        Ver Calendário Completo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardHome;
