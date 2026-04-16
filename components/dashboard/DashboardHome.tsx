// ============================================
// DASHBOARD HOME - Central de Comando do Sócio
// ============================================
// Tela inicial com Grid de Acesso Rápido e Widgets

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Gem,
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
    Gift,
    Lightbulb,
    BarChart2,
    Calendar,
    AlertTriangle,
    ChevronUp,
    TrendingUp
} from 'lucide-react';
import {
    IconAgenda,
    IconSocios,
    IconGaleria,
    IconAcademy,
    IconNegocios,
    IconIndicacoes
} from '../ui/icons/CustomIcons';
import { ViewState, Member, ClubEvent } from '../../types';
import { profileService, ProfileData } from '../../services/profileService';
import { articleService } from '../../services/articleService';
import { eventService } from '../../services/eventService';
import { roiService } from '../../services/roiService';
import { searchService, GlobalSearchResults, SearchArticle, SearchVideo, SearchGalleryAlbum } from '../../services/searchService';
import { HomeCarousel } from './HomeCarousel';
import { OnboardingBanner } from './OnboardingBanner';
import { CarouselItem, Banner } from '../../services/bannerService';
import { Avatar } from '../ui/Avatar';
import { ROIDashboardWidget } from '../business/ROIDashboardWidget';
import { RoiDashboard } from '../roi/RoiDashboard';
import { RegistrarFaturamentoModal } from '../roi/RegistrarFaturamentoModal';
import { TopRankingPreview } from '../business/TopRankingPreview';
import { EventCard } from '../events/EventCard';
import { EventDetailsModal } from '../events/EventDetailsModal';
import { PullToRefresh } from '../ui/PullToRefresh';

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
            <IconAgenda size={48} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Novos encontros em breve</h3>
            <p className="text-sm text-slate-500">Você será notificado assim que um evento for publicado.</p>
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 max-h-[60vh] overflow-y-auto">
                    {/* Members Section */}
                    {results.members.length > 0 && (
                        <div className="p-3 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <IconSocios size={12} /> Sócios
                            </p>
                            {results.members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelectMember(member.id)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                                >
                                    <img
                                        src={member.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`}
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
                                <IconAgenda size={12} /> Eventos
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
                                <IconAcademy size={12} /> Academy
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
                                <IconGaleria size={12} /> Galeria
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
                                            <IconGaleria size={16} className="text-emerald-400" />
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

const PremiumNextEventCard = ({ event, onSelect, onViewAgenda }: { event: ClubEvent; onSelect: () => void; onViewAgenda: () => void }) => {
    const eventDate = new Date(event.date);
    const dia = eventDate.getDate().toString().padStart(2, '0');
    const mes = eventDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
    const horario = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const getEventCountdown = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        if (diff <= 0) return 'AGORA';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `FALTAM ${days}D ${hours}H`;
        if (hours > 0) return `FALTAM ${hours}H`;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `FALTAM ${minutes}M`;
    };

    return (
        <div className="bg-prosperus-card rounded-2xl overflow-hidden shadow-lg border border-prosperus-border flex flex-col mt-6">
            <div
                className="bg-prosperus-gold text-prosperus-navy px-6 py-5 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
                onClick={onSelect}
            >
                <div className="flex flex-col items-start gap-1">
                    <span className="text-5xl font-black leading-none">{dia}</span>
                    <span className="text-sm font-bold uppercase tracking-widest leading-none">{mes}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={18} />
                    <span className="text-base font-bold">{horario}</span>
                </div>
            </div>

            <div
                className="bg-prosperus-card p-6 flex flex-col gap-3 cursor-pointer group"
                onClick={onSelect}
            >
                <div className="flex gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-emerald-500/30 bg-emerald-900/20">
                        {event.category === 'ONLINE' ? (
                            <VideoIcon size={12} className="text-emerald-400" />
                        ) : (
                            <MapPin size={12} className="text-emerald-400" />
                        )}
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            {event.category === 'ONLINE' ? 'Online' : 'Presencial'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-yellow-500/30 bg-yellow-900/20">
                        <Sparkles size={12} className="text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                            {getEventCountdown(event.date)}
                        </span>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-prosperus-white mt-1 leading-tight group-hover:text-yellow-500 transition-colors">
                    {event.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-prosperus-grey mt-1">
                    {event.category === 'ONLINE' ? (
                        <VideoIcon size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                        <MapPin size={14} className="text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">
                        {event.location
                            ? event.location
                            : (event.category === 'ONLINE'
                                ? (event.link?.includes('zoom') ? 'Zoom'
                                    : event.link?.includes('meet.google') ? 'Google Meet'
                                        : event.link?.includes('teams') ? 'Microsoft Teams'
                                            : 'Plataforma Online')
                                : 'A definir')}
                    </span>
                </div>
            </div>

            <div
                className="bg-[#02111d] p-5 border-t border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/40 transition-colors group"
                onClick={onViewAgenda}
            >
                <span className="text-xs font-bold text-prosperus-gold uppercase tracking-widest">VER AGENDA</span>
                <Calendar size={22} className="text-prosperus-gold group-hover:scale-110 transition-transform" />
            </div>
        </div>
    );
};

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

    // Novas vars do Roi C-Level:
    const [showRegistrarFaturamento, setShowRegistrarFaturamento] = useState(false);
    const [tipoRegistro, setTipoRegistro] = useState<'onboarding' | 'trimestral' | 'manual'>('manual');
    const [needsRoiUpdate, setNeedsRoiUpdate] = useState(false);
    const [roiRefreshCounter, setRoiRefreshCounter] = useState(0); // State to trigger RoiDashboard refresh
    const [isCLevelOpen, setIsCLevelOpen] = useState(true); // Ocultar/Mostrar ROI

    // Verificação de Cohort (Nudge 90 dias)
    useEffect(() => {
        if (!currentUser) return;

        roiService.getRegistrosFaturamento(currentUser.id).then(registros => {
            if (registros.length === 0) {
                setNeedsRoiUpdate(true);
                return;
            }
            const sorted = [...registros].sort((a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime());
            const last = sorted[0];
            const diffTime = Math.abs(new Date().getTime() - new Date(last.data_registro).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 90) {
                setNeedsRoiUpdate(true);
            }
        });
    }, [currentUser, roiRefreshCounter]);

    // Listener global para deeplink de cadastro de Faturamento (Banners)
    useEffect(() => {
        if (sessionStorage.getItem('pending_roi_modal') === 'true') {
            sessionStorage.removeItem('pending_roi_modal');
            const timer = setTimeout(() => {
                setTipoRegistro('manual');
                setShowRegistrarFaturamento(true);
            }, 300);
            return () => clearTimeout(timer);
        }

        const handleOpenRoi = () => {
            setTipoRegistro('manual');
            setShowRegistrarFaturamento(true);
        };
        window.addEventListener('open-roi-modal', handleOpenRoi);
        return () => window.removeEventListener('open-roi-modal', handleOpenRoi);
    }, []);

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
            icon: <IconNegocios size={24} className="text-emerald-400" />,
            label: 'Meus Negócios',
            color: 'bg-emerald-500/20',
            view: ViewState.DEALS,
        },
        // 2. Indicações
        {
            id: 'referrals',
            icon: <IconIndicacoes size={24} className="text-cyan-400" />,
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
            icon: <IconAcademy size={24} className="text-violet-400" />,
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

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia,';
        if (hour < 18) return 'Boa tarde,';
        return 'Boa noite,';
    };

    return (
        <PullToRefresh onRefresh={onRefresh || (async () => { window.location.reload(); })}>
            <div className="space-y-4 animate-in fade-in px-4 pt-4 pb-8 max-w-7xl mx-auto">
                {/* 1. Saudação */}
                {currentUser && (
                    <div>
                        <p className="text-slate-400 text-sm">{getGreeting()}</p>
                        <h1 className="text-2xl font-bold text-white">
                            {getFirstName()}
                        </h1>
                    </div>
                )}

                {/* NUDGE DE COBRANÇA VIP (Fase 2) */}
                {needsRoiUpdate && (
                    <div onClick={() => setShowRegistrarFaturamento(true)} className="w-full bg-[linear-gradient(145deg,#031726_0%,#052B48_100%)] border border-[#CA9A43] shadow-[0_0_15px_rgba(202,154,67,0.15)] rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:scale-[1.01] transition-all relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#CA9A43]/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="text-[#CA9A43] animate-pulse" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm md:text-base">Ciclo Financeiro Expirado</h3>
                                <p className="text-slate-400 text-xs md:text-sm mt-0.5">Faz mais de 90 dias desde o seu último registro. Atualize agora para calibrar seu Múltiplo.</p>
                            </div>
                        </div>
                        <button className="bg-[#CA9A43] text-[#031726] font-bold px-4 py-2 rounded-lg whitespace-nowrap group-hover:bg-[#FFDA71] transition-colors">Atualizar Agora</button>
                    </div>
                )}

                {/* 2. Banners - Carrossel Híbrido */}
                <div data-tour-id="dashboard">
                    <HomeCarousel
                        items={carouselItems}
                        onViewProfile={onViewProfile}
                        onBannerClick={onBannerClick}
                    />
                </div>

                {/* 3. Busca Global */}
                <GlobalSearchBar
                    onSelectMember={onViewProfile}
                    onSelectEvent={() => setView(ViewState.AGENDA)}
                    onSelectArticle={onSelectArticle}
                    setView={setView}
                />

                {/* 4. ROI Widget - Business Value Showcase (Legado) */}
                {currentUser && (
                    <div data-tour-id="roi-widget">
                        <ROIDashboardWidget
                            onRegisterDeal={() => setView(ViewState.DEALS)}
                            onNavigateToDeals={() => setView(ViewState.DEALS)}
                        />
                    </div>
                )}

                {/* 4.5. Meu ROI (Delta Acumulado) */}
                {currentUser && (
                    <div className={`mt-4 roi-dashboard-widget ${isCLevelOpen ? '' : 'collapsed'}`} key={roiRefreshCounter}>
                        {/* CABEÇALHO CLICÁVEL PADRONIZADO */}
                        <div
                            onClick={() => setIsCLevelOpen(!isCLevelOpen)}
                            className="roi-header"
                        >
                            <TrendingUp className="roi-icon" size={20} />
                            <h3>Meu Crescimento</h3>
                            <ChevronUp
                                size={20}
                                className={`chevron-icon transition-transform ${isCLevelOpen ? 'rotate-0' : 'rotate-180'}`}
                            />
                        </div>

                        {/* WRAPPER ANIMADO (Manteve-se o CSS Grid Trick Premium) */}
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${isCLevelOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="pt-1 pb-4 px-5">
                                    <RoiDashboard
                                        socioId={currentUser.id}
                                        valorPago={currentUser.valor_pago_mentoria ?? null}
                                        onRegistrar={(tipo) => {
                                            setTipoRegistro(tipo || 'manual');
                                            setShowRegistrarFaturamento(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showRegistrarFaturamento && currentUser && (
                    <RegistrarFaturamentoModal
                        socioId={currentUser.id}
                        tipo={tipoRegistro}
                        onClose={() => setShowRegistrarFaturamento(false)}
                        onSuccess={() => {
                            setShowRegistrarFaturamento(false);
                            setNeedsRoiUpdate(false);
                            setRoiRefreshCounter(prev => prev + 1);
                        }}
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
                        <PremiumNextEventCard
                            event={nextEvent}
                            onSelect={() => setSelectedEvent(nextEvent)}
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

                {/* Registrar Faturamento Modal */}
                {showRegistrarFaturamento && currentUser && (
                    <RegistrarFaturamentoModal
                        socioId={currentUser.id}
                        tipo={tipoRegistro}
                        onClose={() => setShowRegistrarFaturamento(false)}
                        onSuccess={() => {
                            // Increment counter to remount / refetch data
                            setRoiRefreshCounter(prev => prev + 1);
                        }}
                    />
                )}
            </div>
        </PullToRefresh>
    );
};

export default DashboardHome;
