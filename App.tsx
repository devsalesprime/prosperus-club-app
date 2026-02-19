import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Calendar, Views, View, Navigate } from 'react-big-calendar';
import { localizer, YearView, generateGoogleCalendarUrl, generateOutlookCalendarUrl, downloadIcsFile } from './utils/calendarUtils.tsx';
import {
    LayoutDashboard,
    Calendar as CalendarIcon,
    PlaySquare,
    Users,
    Newspaper,
    Menu,
    Bell,
    Search,
    ChevronRight,
    ChevronLeft,
    Play,
    MapPin,
    Clock,
    Linkedin,
    Instagram,
    Globe,
    Phone,
    Lock,
    X,
    CheckCircle,
    Filter,
    Video as VideoIcon,
    Link as LinkIcon,
    CalendarPlus,
    FastForward,
    User,
    Zap,
    Briefcase,
    GraduationCap,
    Settings,
    Download,
    ExternalLink,
    Mail,
    Eye,
    Share2,
    MessageCircle,
    Send,
    MoreVertical,
    Trash2,
    BookOpen,
    List,
    Image as ImageIcon,
    FileText,
    LogOut,
    Gift,
    PlayCircle,
    TrendingUp,
    Trophy,
    Lightbulb,
    BarChart2,
    ChevronDown,
    Heart
} from 'lucide-react';
import { ViewState, Member, Video, ClubEvent as Event, Article, Category, EventCategory, Conversation, Message, UserNotification } from './types';
import { dataService } from './services/mockData.ts';
import { eventService } from './services/eventService';
import { profileService } from './services/profileService.ts';
import { cleanExpiredCache } from './services/offlineStorage';
import { SupportWidget } from './components/SupportWidget';
// --- STATIC IMPORTS (Critical Path — always needed) ---
import { articleService, Article as ServiceArticle } from './services/articleService';
import { NewsList } from './components/NewsList.tsx';
import { ArticleReader } from './components/ArticleReader.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';
import { ChatIconWithBadge } from './components/ChatIconWithBadge';
import { ProfilePreview } from './components/ProfilePreview.tsx';
import { ProfileData } from './services/profileService.ts';
import { OnboardingBanner } from './components/OnboardingBanner.tsx';
import { DashboardHome } from './components/DashboardHome';
import { MemberBook } from './components/MemberBook';
import { MobileAgendaView } from './components/MobileAgendaView';
import { EventDetailsModal } from './components/EventDetailsModal';
import { useAuth } from './contexts/AuthContext';
import { BenefitStatsCard } from './components/BenefitStatsCard';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { InstallPromptIOS } from './components/InstallPromptIOS';
import ProfileSection from './components/ProfileSection';

// --- LAZY IMPORTS (Code Splitting — loaded on demand) ---
const AdminApp = React.lazy(() => import('./AdminApp.tsx').then(m => ({ default: m.AdminApp })));
const Academy = React.lazy(() => import('./components/Academy.tsx').then(m => ({ default: m.Academy })));
const ProsperusToolsPage = React.lazy(() => import('./pages/ProsperusToolsPage').then(m => ({ default: m.ProsperusToolsPage })));
const SolutionsListPage = React.lazy(() => import('./pages/SolutionsListPage').then(m => ({ default: m.SolutionsListPage })));
const ProgressListPage = React.lazy(() => import('./pages/ProgressListPage').then(m => ({ default: m.ProgressListPage })));
const MessagesView = React.lazy(() => import('./components/MessagesView.tsx').then(m => ({ default: m.MessagesView })));
const NotificationsPage = React.lazy(() => import('./components/NotificationsPage.tsx').then(m => ({ default: m.NotificationsPage })));
const FavoritesPage = React.lazy(() => import('./components/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ProfileEdit = React.lazy(() => import('./components/ProfileEdit.tsx').then(m => ({ default: m.ProfileEdit })));
const OnboardingWizard = React.lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const Gallery = React.lazy(() => import('./components/Gallery').then(m => ({ default: m.Gallery })));
const MyDealsScreen = React.lazy(() => import('./components/business/MyDealsScreen').then(m => ({ default: m.default })));
const ReferralsScreen = React.lazy(() => import('./components/business/ReferralsScreen').then(m => ({ default: m.default })));
const RankingsScreen = React.lazy(() => import('./components/business/RankingsScreen').then(m => ({ default: m.default })));
const ROIDashboardWidget = React.lazy(() => import('./components/business/ROIDashboardWidget').then(m => ({ default: m.default })));

// --- Lazy Loading Fallback ---
const LazyFallback = () => (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-slate-400">Carregando...</span>
        </div>
    </div>
);

import 'react-big-calendar/lib/css/react-big-calendar.css';

// Calendar utilities imported from utils/calendarUtils.ts

// --- APP COMPONENT ---

// --- APP COMPONENT ---
// (Import fix for HomeCarousel - Feed Híbrido)
import { HomeCarousel } from './components/HomeCarousel';
import { bannerService, CarouselItem } from './services/bannerService';
import { LoginModal } from './components/LoginModal';
import { UpdatePasswordModal } from './components/UpdatePasswordModal';
import { RoleSelector } from './components/RoleSelector';

import { supabase } from './lib/supabase';


const App = () => {
    // 🔄 Use AuthContext for centralized user data
    const { userProfile, session: authSession, isLoading: authContextLoading, isAuthenticated, refreshProfile, isPasswordRecovery } = useAuth();

    // Helper: Convert ProfileData to Member format for backward compatibility
    const profileToMember = (profile: ProfileData | null): Member | null => {
        if (!profile) return null;
        return {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            company: profile.company || '',
            jobTitle: profile.job_title, // Convert job_title -> jobTitle
            image: profile.image_url || '/default-avatar.svg', // Convert image_url -> image
            description: profile.bio || '', // Convert bio -> description
            socials: profile.socials || {},
            tags: profile.tags || []
        };
    };

    // Create alias for backward compatibility (currentUser now points to AuthContext.userProfile)
    const currentUser = profileToMember(userProfile);

    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
    const [showBenefitsFilter, setShowBenefitsFilter] = useState(false); // Track if benefits filter should be active
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['prosperus-tools'])); // Accordion state, default open
    // DEPRECATED: Replaced by AuthContext.userProfile
    // const [currentUser, setCurrentUser] = useState<Member | null>(null);
    const [session, setSession] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [selectedMember, setSelectedMember] = useState<ProfileData | null>(null); // Changed to ProfileData for full pitch_video_url support
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showPreviewProfile, setShowPreviewProfile] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
    const [carouselLoading, setCarouselLoading] = useState(true);
    // ⚠️ REMOVED: Use authContextLoading from AuthContext instead
    // const [authLoading, setAuthLoading] = useState(true);
    const [isMockMode, setIsMockMode] = useState(false); // Track if we're in mock/demo mode
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [pendingUser, setPendingUser] = useState<any>(null);
    const [showOnboarding, setShowOnboarding] = useState(true); // Onboarding wizard visibility

    // Responsive calendar default view: 'agenda' for mobile, 'month' for desktop
    const [calendarDefaultView, setCalendarDefaultView] = useState<View>(() => {
        return typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'month';
    });

    // Mobile detection for agenda view split
    const [isMobile, setIsMobile] = useState(() => {
        return typeof window !== 'undefined' && window.innerWidth < 768;
    });

    // Mobile view toggle: LIST (timeline) or MONTH (calendar grid)
    const [mobileView, setMobileView] = useState<'LIST' | 'MONTH'>('LIST');

    // Update calendar view and mobile state on window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setCalendarDefaultView(mobile ? 'agenda' : 'month');
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clean expired offline cache on startup
    useEffect(() => {
        cleanExpiredCache();
    }, []);

    // Fetch events from Supabase
    useEffect(() => {
        if (userProfile?.id) {
            eventService.getEventsForUser(userProfile.id).then(setClubEvents);
        }
    }, [userProfile?.id]);

    // Members list from Supabase (real data)
    const [members, setMembers] = useState<ProfileData[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);

    // Events from Supabase (replaces mockData localStorage)
    const [clubEvents, setClubEvents] = useState<Event[]>([]);

    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const profileFetchedRef = useRef(false); // Track if we've already fetched the profile

    // News visibility state
    const [hasNews, setHasNews] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ServiceArticle | null>(null);

    // Reset benefits filter when leaving MEMBERS view
    useEffect(() => {
        if (view !== ViewState.MEMBERS) {
            setShowBenefitsFilter(false);
        }
    }, [view]);

    /**
     * Universal notification URL handler
     * Handles: external URLs (new tab), ViewState values, and internal paths
     */
    const handleNotificationNavigate = (url: string) => {
        if (!url) return;

        // External URLs → open in new tab
        if (url.startsWith('http://') || url.startsWith('https://')) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        // Direct ViewState match (e.g. "DEALS")
        if (Object.values(ViewState).includes(url as ViewState)) {
            setView(url as ViewState);
            return;
        }

        // Parse internal paths (e.g. "/deals?tab=sales" → "DEALS")
        const pathMatch = url.match(/^\/?([a-zA-Z_-]+)/);
        if (pathMatch) {
            const viewKey = pathMatch[1].toUpperCase().replace(/-/g, '_');
            if (Object.values(ViewState).includes(viewKey as ViewState)) {
                setView(viewKey as ViewState);
                return;
            }
        }

        // Last resort: try navigating to the URL directly
        console.warn('Notification URL did not match any ViewState:', url);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Helper function to fetch and set user profile
    const fetchAndSetUserProfile = async (userId: string) => {
        // Check if already fetched or currently loading
        if (profileFetchedRef.current || isLoadingProfile) {
            console.log('⏭️ Profile already fetched or loading, skipping...');
            return;
        }

        setIsLoadingProfile(true);

        try {
            console.log('📡 Fetching user profile for:', userId);

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Profile fetch timeout')), 15000);
            });

            // Race between fetch and timeout
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data: profile, error } = await Promise.race([
                fetchPromise,
                timeoutPromise.then(() => ({ data: null, error: { code: 'TIMEOUT', message: 'Profile fetch timeout' } }))
            ]) as any;

            if (error) {
                // If profile not found (404), create it
                if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
                    console.log('📝 Profile not found, creating new profile...');

                    try {
                        // Get user data from auth
                        const { data: { user }, error: userError } = await supabase.auth.getUser();

                        console.log('🔍 User data from auth:', {
                            hasUser: !!user,
                            userId: user?.id,
                            userEmail: user?.email,
                            userError
                        });

                        if (user) {
                            console.log('🔨 Calling profileService.createProfile...');

                            // Create profile using profileService
                            const newProfile = await profileService.createProfile(userId, {
                                email: user.email || '',
                                name: user.user_metadata?.full_name || 'Novo Sócio',
                                role: 'MEMBER',
                                company: user.user_metadata?.company || '',
                                job_title: user.user_metadata?.job_title || '',
                                image_url: user.user_metadata?.avatar_url || '/default-avatar.svg'
                            });

                            if (newProfile) {
                                console.log('✅ Profile created successfully in App.tsx:', newProfile);
                                profileFetchedRef.current = true; // Mark as fetched on success
                                const mappedUser = {
                                    id: newProfile.id,
                                    name: newProfile.name,
                                    email: newProfile.email,
                                    role: newProfile.role,
                                    company: newProfile.company,
                                    jobTitle: newProfile.job_title,
                                    image: newProfile.image_url,
                                    description: newProfile.bio,
                                    socials: newProfile.socials,
                                    tags: newProfile.tags
                                };
                                handleLoginSuccess(mappedUser);
                                return;
                            } else {
                                console.error('❌ createProfile returned null');
                            }
                        } else {
                            console.error('❌ No user data from auth.getUser()');
                        }
                    } catch (createError) {
                        console.error('❌ Error creating profile in App.tsx:', createError);
                        console.error('Full error details:', {
                            message: createError instanceof Error ? createError.message : 'Unknown error',
                            stack: createError instanceof Error ? createError.stack : undefined
                        });
                    }
                }

                console.error('❌ Error fetching profile:', error);
                // DO NOT fallback to mock admin - this causes ID confusion
                // Instead, trigger logout so user can re-authenticate properly
                console.error('🚫 Profile fetch failed - clearing session');
                setSession(null);
                // ⚠️ REMOVED: AuthContext handles cleanup automatically
                // setCurrentUser(null);
                setIsLoginOpen(true);
            } else if (profile) {
                console.log('✅ Profile fetched:', profile);
                profileFetchedRef.current = true; // Mark as fetched on success
                // Map profile to Member format
                const user = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: profile.role,
                    company: profile.company,
                    jobTitle: profile.job_title,
                    image: profile.image_url,
                    description: profile.bio,
                    socials: profile.socials,
                    tags: profile.tags
                };
                handleLoginSuccess(user);
            }
        } catch (err) {
            console.error('❌ Exception fetching profile:', err);
            // DO NOT fallback to mock admin - this causes ID confusion
            console.error('🚫 Profile fetch exception - clearing session');
            setSession(null);
            // ⚠️ REMOVED: AuthContext handles cleanup automatically
            // setCurrentUser(null);
            setIsLoginOpen(true);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        // ⚠️ REMOVED: AuthContext handles loading timeout
        // Safety timeout to prevent infinite loading
        // const safetyTimeout = setTimeout(() => {
        //     if (mounted && authContextLoading) {
        //         console.warn('⚠️ Auth timeout - forcing authLoading to false');
        //     }
        // }, 5000); // 5 second timeout

        // Check active session
        supabase.auth.getSession()
            .then(async ({ data: { session } }) => {
                if (!mounted) return;

                setSession(session);
                if (session) {
                    // ⚠️ DISABLED: AuthContext now handles profile fetching
                    // await fetchAndSetUserProfile(session.user.id);
                    setIsLoginOpen(false);
                    // Check if there are published articles for News menu
                    articleService.hasPublishedArticles().then(setHasNews);
                } else {
                    setIsLoginOpen(true);
                }
                // ⚠️ REMOVED: AuthContext handles loading state
                // setAuthLoading(false);
            })
            .catch((error) => {
                console.error('❌ Error getting session:', error);
                if (mounted) {
                    // ⚠️ REMOVED: AuthContext handles loading state
                    // setAuthLoading(false);
                    setIsLoginOpen(true);
                }
            });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setSession(session);
            if (session) {
                console.log('📡 Auth state changed, session exists');
                // ⚠️ DISABLED: AuthContext now handles profile fetching
                // Only fetch profile if we don't have a currentUser yet
                // if (!currentUser) {
                //     await fetchAndSetUserProfile(session.user.id);
                // }
                setIsLoginOpen(false);
            } else {
                // ⚠️ REMOVED: AuthContext handles logout cleanup automatically
                // setCurrentUser(null);
                setPendingUser(null);
                setShowRoleSelector(false);
                profileFetchedRef.current = false; // Reset on logout
                setIsLoginOpen(true);
            }
        });

        return () => {
            mounted = false;
            // ⚠️ REMOVED: safetyTimeout was removed
            // clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    // Fetch all members from Supabase (real data)
    useEffect(() => {
        const fetchMembers = async () => {
            setMembersLoading(true);
            try {
                const profiles = await profileService.getAllProfiles();
                setMembers(profiles);
            } catch (error) {
                console.error('Error fetching members:', error);
            } finally {
                setMembersLoading(false);
            }
        };

        fetchMembers();
    }, []);

    // Monitor userProfile from AuthContext and show RoleSelector for ADMIN/TEAM
    useEffect(() => {
        if (userProfile && !showRoleSelector && !pendingUser) {
            console.log('🔍 Checking user role:', userProfile.role);

            if (userProfile.role === 'ADMIN' || userProfile.role === 'TEAM') {
                console.log('🎯 ADMIN/TEAM detected - showing RoleSelector');
                const memberUser = {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                    role: userProfile.role,
                    company: userProfile.company || '',
                    jobTitle: userProfile.job_title || '',
                    phone: '',
                    image: userProfile.image_url || '/default-avatar.svg',
                    description: userProfile.bio || '',
                    socials: userProfile.socials || {},
                    tags: userProfile.tags || []
                };
                setPendingUser(memberUser);
                setShowRoleSelector(true);
            }
        }
    }, [userProfile, showRoleSelector, pendingUser]);

    // Fetch carousel items (Hybrid Feed: Banners + Member Suggestions)
    useEffect(() => {
        const fetchCarouselItems = async () => {
            setCarouselLoading(true);
            try {
                // Se tiver usuário logado, busca feed híbrido (com sugestões personalizadas)
                // Caso contrário, apenas banners públicos
                const userId = currentUser?.id || session?.user?.id;

                if (userId) {
                    const items = await bannerService.getHomeCarouselItems(userId);
                    console.log('🎠 Carousel items loaded:', items.length, items);
                    setCarouselItems(items);
                } else {
                    // Usuário não logado: só banners
                    const banners = await bannerService.getActiveBanners('HOME');
                    const items = banners.map(b => ({ type: 'PROMO' as const, data: b }));
                    setCarouselItems(items);
                }
            } catch (error) {
                console.error('Error fetching carousel items:', error);
                // Fallback vazio - o HomeCarousel já lida com array vazio
            } finally {
                setCarouselLoading(false);
            }
        };

        fetchCarouselItems();
    }, [currentUser?.id, session?.user?.id]);

    const handleLoginSuccess = async (user: any) => {
        // Manually handle login success (needed for Mock Mode or if AuthStateChange lags)
        console.log('🔐 Login Success - Raw User:', user);

        // Check if we already have a real Supabase session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Mock a session object ONLY if:
        // 1. No session parameter was passed AND
        // 2. No current session exists in Supabase
        if (!session && !currentSession) {
            const mockSession = {
                user: user,
                access_token: 'mock-token',
                expires_in: 3600
            };
            setSession(mockSession);
            setIsMockMode(true); // Mark as mock mode
            console.log('📝 Created mock session - MOCK MODE ENABLED');
        } else {
            // We have a real session - use it!
            if (currentSession) {
                setSession(currentSession);
                setIsMockMode(false);
                console.log('✅ Using real Supabase session');
            } else if (session) {
                setSession(session);
                setIsMockMode(false);
                console.log('✅ Using provided session');
            }
        }

        // Check if this is a valid UUID (Supabase user ID format)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

        // Check if user already has all Member properties (came from Supabase profile)
        const isFromSupabase = user.role && user.company !== undefined && isValidUUID;

        let memberUser;

        // Debug: log what we received
        console.log('🔍 handleLoginSuccess received user:', {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            hasUserMetadata: !!user.user_metadata,
            isFromSupabase
        });

        if (isFromSupabase) {
            // User came from Supabase profile - use it directly WITHOUT any mock data lookup
            console.log('✅ User from Supabase profile with valid UUID - using directly');
            memberUser = user;
        } else if (isValidUUID) {
            // Check if this user came from fetchAndSetUserProfile (has email, role, etc)
            // or from user_metadata (only has id and user_metadata)
            if (user.email && user.role && user.role !== 'authenticated') {
                // User came from fetchAndSetUserProfile - already has correct data
                console.log('✅ User from fetchAndSetUserProfile - has correct role:', user.role);
                memberUser = user;
            } else {
                // User came from user_metadata - need to construct Member object
                console.log('⚠️ User from user_metadata - constructing Member object');
                memberUser = {
                    id: user.id,
                    name: user.user_metadata?.full_name || 'Novo Sócio',
                    role: 'MEMBER' as const,
                    company: user.user_metadata?.company || '',
                    jobTitle: user.user_metadata?.job_title || '',
                    phone: user.user_metadata?.phone || '',
                    image: user.user_metadata?.avatar_url || '/default-avatar.svg',
                    description: '',
                    socials: {},
                    tags: []
                };
            }
        } else {
            // Not a valid UUID - this is mock mode, try to find in mock data
            console.log('⚠️ Non-UUID ID detected - looking up in mock data');
            const members = dataService.getMembers();
            memberUser = members.find(m => m.id === user.id);

            if (!memberUser) {
                // User not in mock data - create Member from user_metadata
                console.log('🆕 Creating Member from user_metadata for mock user');
                const mockMemberTemplate = members.find(m => m.role === 'MEMBER') || members[0];
                memberUser = {
                    id: user.id,
                    name: user.user_metadata?.full_name || 'Usuário',
                    role: 'MEMBER' as const,
                    company: user.user_metadata?.company || '',
                    jobTitle: user.user_metadata?.job_title || '',
                    phone: user.user_metadata?.phone || '',
                    image: user.user_metadata?.avatar_url || mockMemberTemplate.image,
                    description: '',
                    socials: {},
                    tags: []
                };
            }
        }

        console.log('✅ Final member user:', { id: memberUser.id, name: memberUser.name, role: memberUser.role });

        // Check role and decide routing
        if (memberUser.role === 'ADMIN' || memberUser.role === 'TEAM') {
            // Show role selector for admin/team
            console.log('🎯 ADMIN/TEAM detected - showing RoleSelector');
            setPendingUser(memberUser);
            setShowRoleSelector(true);
            console.log('🔔 RoleSelector state set to TRUE');
        } else {
            // Direct access for members
            console.log('👤 MEMBER detected - direct access');
            // ⚠️ REMOVED: AuthContext handles user state automatically
            // setCurrentUser(memberUser);
            setIsLoginOpen(false);
        }
    };

    const handleRoleSelection = (selectedRole: 'MEMBER' | 'ADMIN') => {
        if (!pendingUser) return;

        console.log('🎭 Role selected:', selectedRole);
        // ⚠️ REMOVED: AuthContext handles user state automatically
        // setCurrentUser(pendingUser);
        setShowRoleSelector(false);
        setIsLoginOpen(false);

        if (selectedRole === 'ADMIN') {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

    // Logout function - clears all auth state
    const handleLogout = async () => {
        console.log('🚪 Logging out...');

        try {
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('❌ Logout error:', error);
            }
        } catch (err) {
            console.error('❌ Logout exception:', err);
        } finally {
            // Clear all local state regardless of Supabase response
            setSession(null);
            // ⚠️ REMOVED: AuthContext.logout() handles this
            // setCurrentUser(null);
            setPendingUser(null);
            setShowRoleSelector(false);
            setIsAdmin(false);
            setIsMockMode(false);
            profileFetchedRef.current = false;
            setIsLoginOpen(true);
            setView(ViewState.DASHBOARD);

            console.log('✅ Logged out successfully');
        }
    };

    // Handle profile save from ProfileEdit component
    const handleProfileSave = (updatedProfile: ProfileData) => {
        console.log('💾 Profile saved:', updatedProfile);

        // Convert ProfileData to Member format and update currentUser
        const updatedMember: Member = {
            id: updatedProfile.id,
            name: updatedProfile.name,
            role: updatedProfile.role,
            company: updatedProfile.company || '',
            jobTitle: updatedProfile.job_title || '',
            image: updatedProfile.image_url || '',
            description: updatedProfile.bio || '',
            socials: updatedProfile.socials || {},
            tags: updatedProfile.tags || []
        };

        // ⚠️ REMOVED: AuthContext.refreshProfile() handles this in ProfileEdit
        // setCurrentUser(updatedMember);
        setIsEditingProfile(false);
        console.log('✅ CurrentUser updated with new profile data');
    };

    // Convert Member to ProfileData for ProfileEdit/ProfilePreview
    const memberToProfileData = (member: Member): ProfileData => {
        // Calculate if onboarding is complete based on required fields
        const hasRequiredFields = !!(
            member.description &&
            member.company &&
            member.jobTitle &&
            member.image &&
            member.tags && member.tags.length > 0
        );

        return {
            id: member.id,
            email: session?.user?.email || '',
            name: member.name,
            role: member.role as 'ADMIN' | 'TEAM' | 'MEMBER',
            company: member.company || '',
            job_title: member.jobTitle || '',
            image_url: member.image || '',
            bio: member.description || '',
            socials: member.socials || {},
            tags: member.tags || [],
            has_completed_onboarding: hasRequiredFields
        };
    };

    // Use AuthContext loading state instead of local authLoading
    if (authContextLoading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;
    }

    // Show Update Password modal if recovery flow is active
    if (isPasswordRecovery) {
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-prosperus-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-prosperus-gold-dark/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                <UpdatePasswordModal />
            </div>
        );
    }

    // Show login screen if no session
    if (!session) {
        console.log('🖥️ Rendering login screen - no session');
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-prosperus-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-prosperus-gold-dark/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                <LoginModal
                    isOpen={true}
                    onClose={() => { }}
                    onLoginSuccess={handleLoginSuccess}
                />
            </div>
        );
    }

    // Show RoleSelector if pending user (ADMIN/TEAM)
    if (showRoleSelector && pendingUser) {
        console.log('🎭 Rendering RoleSelector for user:', pendingUser.name);
        return (
            <div className="min-h-screen bg-prosperus-navy flex items-center justify-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-prosperus-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-prosperus-gold-dark/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                <RoleSelector
                    isOpen={true}
                    onClose={() => setShowRoleSelector(false)}
                    onSelectRole={handleRoleSelection}
                    userName={pendingUser.name}
                />
            </div>
        );
    }

    // Don't render main app if currentUser is not set yet
    if (!currentUser) {
        console.log('⏳ Waiting for currentUser to be set...');
        return <div className="min-h-screen bg-prosperus-navy flex items-center justify-center text-prosperus-white">Carregando perfil...</div>;
    }

    // Show Onboarding Wizard for new users
    if (showOnboarding && userProfile && !userProfile.has_completed_onboarding) {
        return (
            <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><LazyFallback /></div>}>
                <>
                    <div className="min-h-screen bg-slate-950" />
                    <OnboardingWizard
                        currentUser={userProfile}
                        onComplete={() => {
                            setShowOnboarding(false);
                            if (refreshProfile) refreshProfile();
                        }}
                        onProfileUpdate={(updatedProfile) => {
                            if (refreshProfile) refreshProfile();
                        }}
                    />
                </>
            </Suspense>
        );
    }

    // Route Guard: Prevent MEMBER from accessing AdminApp
    if (isAdmin && currentUser && currentUser.role === 'MEMBER') {
        setIsAdmin(false);
    }

    if (isAdmin && currentUser) {
        return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><LazyFallback /></div>}><AdminApp currentUser={currentUser} onLogout={() => { setIsAdmin(false); setSession(null); /* AuthContext handles cleanup */ }} /></Suspense>;
    }

    // Toggle accordion menu
    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    };

    // Hierarchical menu structure
    const navItems = [
        { id: ViewState.DASHBOARD, label: 'Início', icon: <LayoutDashboard size={20} /> },
        { id: ViewState.AGENDA, label: 'Agenda', icon: <CalendarIcon size={20} /> },

        // Prosperus Tools - Hierarchical Group
        {
            id: 'prosperus-tools' as any,
            label: 'Prosperus Tools',
            icon: <Briefcase size={20} />,
            view: ViewState.PROSPERUS_TOOLS, // Navigate to hub when clicked
            children: [
                { id: ViewState.ACADEMY, label: 'Aulas', icon: <PlayCircle size={18} /> },
                { id: ViewState.SOLUTIONS, label: 'Soluções', icon: <Lightbulb size={18} /> },
                { id: ViewState.PROGRESS, label: 'Meu Progresso', icon: <BarChart2 size={18} /> },
            ]
        },

        { id: ViewState.MEMBERS, label: 'Sócios', icon: <Users size={20} /> },
        { id: ViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={20} /> },
        ...(hasNews ? [{ id: ViewState.NEWS, label: 'News', icon: <Newspaper size={20} /> }] : []),
        { id: ViewState.DEALS, label: 'Negócios', icon: <TrendingUp size={20} /> },
        { id: ViewState.REFERRALS, label: 'Indicações', icon: <Send size={20} /> },
        { id: ViewState.RANKINGS, label: 'Rankings', icon: <Trophy size={20} /> },
        { id: ViewState.MESSAGES, label: 'Chat', icon: <MessageCircle size={20} /> },
        { id: ViewState.PROFILE, label: 'Perfil', icon: <User size={20} /> },
    ];

    return (
        <div className="bg-prosperus-navy min-h-screen text-prosperus-white font-sans flex flex-col md:flex-row overflow-hidden">
            {/* Offline Status Banner */}
            <OfflineBanner />
            <InstallPrompt />
            <InstallPromptIOS />
            {/* Sidebar (Desktop) */}
            <div className="hidden md:flex w-64 flex-col border-r border-prosperus-navy-light bg-prosperus-navy">
                <div className="p-6 border-b border-prosperus-navy-light">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => setView(ViewState.DASHBOARD)}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            title="Ir para Home"
                        >
                            <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus" className="h-8 w-auto" />
                        </button>
                        {currentUser && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setView(ViewState.FAVORITES)}
                                    className="p-2 text-prosperus-grey hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                                    title="Meus Favoritos"
                                >
                                    <Heart size={20} />
                                </button>
                                <ChatIconWithBadge
                                    userId={currentUser.id}
                                    onClick={() => setView(ViewState.MESSAGES)}
                                />
                                <NotificationCenter currentUserId={currentUser.id} onNavigate={handleNotificationNavigate} />
                            </div>
                        )}
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map(item => {
                        // Check if item has children (hierarchical menu)
                        if ('children' in item && item.children) {
                            const isExpanded = expandedMenus.has(item.id);

                            return (
                                <div key={item.id}>
                                    {/* Parent Item */}
                                    <button
                                        onClick={() => {
                                            toggleMenu(item.id);
                                            // If parent has a view, navigate to it
                                            if ('view' in item && item.view) {
                                                setView(item.view as ViewState);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-prosperus-grey hover:bg-prosperus-navy-light hover:text-prosperus-white"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {item.icon}
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {/* Children Items */}
                                    {isExpanded && (
                                        <div className="mt-1 ml-4 space-y-1 border-l-2 border-prosperus-gold/30 pl-2">
                                            {item.children.map((child: any) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => setView(child.id)}
                                                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${view === child.id
                                                        ? 'bg-gradient-to-r from-prosperus-gold to-prosperus-gold-light text-prosperus-navy shadow-lg font-semibold'
                                                        : 'text-prosperus-grey hover:bg-prosperus-navy-light/50 hover:text-prosperus-white'
                                                        }`}
                                                >
                                                    {child.icon}
                                                    <span className="font-medium">{child.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Regular item (no children)
                        return (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === item.id
                                    ? 'bg-gradient-to-r from-prosperus-gold to-prosperus-gold-light text-prosperus-navy shadow-lg font-semibold'
                                    : 'text-prosperus-grey hover:bg-prosperus-navy-light hover:text-prosperus-white'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
                {currentUser && (
                    <div className="p-4 border-t border-prosperus-navy-light">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-prosperus-navy-light/50">
                            <img src={currentUser.image || '/default-avatar.svg'} alt={currentUser.name} className="w-8 h-8 rounded-full border border-prosperus-gold-dark object-cover" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-prosperus-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-prosperus-grey truncate">{currentUser.jobTitle || currentUser.role}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden overflow-x-hidden bg-prosperus-navy">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-prosperus-navy border-b border-prosperus-navy-light mobile-header">
                    <button onClick={() => setView(ViewState.DASHBOARD)} className="hover:opacity-80 transition-opacity" title="Ir para Home">
                        <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus" className="h-6 w-auto" />
                    </button>
                    <div className="flex items-center gap-2">
                        {currentUser && (
                            <>
                                <button
                                    onClick={() => setView(ViewState.FAVORITES)}
                                    className="p-2 text-prosperus-grey hover:text-red-400 transition-colors"
                                    title="Meus Favoritos"
                                >
                                    <Heart size={22} />
                                </button>
                                <button
                                    onClick={() => setView(ViewState.MESSAGES)}
                                    className="p-2 text-prosperus-grey hover:text-prosperus-gold transition-colors"
                                    title="Chat"
                                >
                                    <MessageCircle size={22} />
                                </button>
                                <NotificationCenter currentUserId={currentUser.id} onNavigate={handleNotificationNavigate} />
                            </>
                        )}
                        <button onClick={() => setView(ViewState.PROFILE)} className="p-2 text-prosperus-grey">
                            {currentUser ? <img src={currentUser.image || '/default-avatar.svg'} className="w-8 h-8 rounded-full object-cover" /> : <User size={24} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    <Suspense fallback={<LazyFallback />}>
                        {view === ViewState.DASHBOARD && (
                            <DashboardHome
                                currentUser={currentUser}
                                members={members}
                                carouselItems={carouselItems}
                                setView={setView}
                                onViewProfile={(memberId) => {
                                    profileService.getProfile(memberId).then(profile => {
                                        if (profile) {
                                            setSelectedMember(profile);
                                            setView(ViewState.MEMBERS);
                                        }
                                    });
                                }}
                                onBannerClick={(banner) => {
                                    if (banner.link_url) {
                                        if (banner.link_type === 'EXTERNAL') {
                                            window.open(banner.link_url, '_blank');
                                        } else {
                                            window.location.href = banner.link_url;
                                        }
                                    }
                                }}
                                onEditProfile={() => setIsEditingProfile(true)}
                                memberToProfileData={memberToProfileData}
                                onNavigateToBenefits={() => {
                                    setShowBenefitsFilter(true);
                                    setView(ViewState.MEMBERS);
                                }}
                            />
                        )}

                        {view === ViewState.AGENDA && (
                            <div className="h-[calc(100dvh-140px)] bg-slate-900 border border-slate-800 p-2 md:p-4 animate-in fade-in overflow-y-auto overflow-x-hidden">
                                {/* Filter and Legend Bar */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 p-3 bg-slate-800/50 border border-slate-700">
                                    {/* Legend - Only ONLINE and PRESENTIAL */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Legenda:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 bg-[#9333ea]"></span>
                                            <span className="text-sm text-slate-300 font-medium">Presencial</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 bg-[#10b981]"></span>
                                            <span className="text-sm text-slate-300 font-medium">Online</span>
                                        </div>
                                    </div>

                                    {/* Filters - Functional toggles */}
                                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM') && (
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Filtrar:</span>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="w-4 h-4 border-slate-600 bg-slate-700 text-yellow-500 focus:ring-yellow-500/50"
                                                />
                                                <span className="text-sm text-slate-300 font-medium">Eventos do Clube</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="w-4 h-4 border-slate-600 bg-slate-700 text-yellow-500 focus:ring-yellow-500/50"
                                                />
                                                <span className="text-sm text-slate-300 font-medium">Eventos do Time</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Conditional Rendering: Mobile Hybrid vs Desktop Full Calendar */}
                                {isMobile ? (
                                    <>
                                        {/* Mobile Header with View Toggle */}
                                        <div className="sticky top-0 bg-slate-900 z-30 px-4 py-3 border-b border-slate-800 mb-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <CalendarIcon size={20} className="text-yellow-500" />
                                                    Agenda
                                                </h2>

                                                {/* Segmented Control Toggle */}
                                                <div className="flex bg-slate-800 p-1 rounded-lg gap-1">
                                                    <button
                                                        onClick={() => setMobileView('LIST')}
                                                        className={`px-4 py-2 text-xs font-bold rounded transition-all ${mobileView === 'LIST'
                                                            ? 'bg-yellow-600 text-white shadow-lg'
                                                            : 'text-slate-400 hover:text-white'
                                                            }`}
                                                    >
                                                        <List size={14} className="inline mr-1" />
                                                        Lista
                                                    </button>
                                                    <button
                                                        onClick={() => setMobileView('MONTH')}
                                                        className={`px-4 py-2 text-xs font-bold rounded transition-all ${mobileView === 'MONTH'
                                                            ? 'bg-yellow-600 text-white shadow-lg'
                                                            : 'text-slate-400 hover:text-white'
                                                            }`}
                                                    >
                                                        <CalendarIcon size={14} className="inline mr-1" />
                                                        Mês
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile View Content */}
                                        {mobileView === 'LIST' ? (
                                            <MobileAgendaView
                                                events={clubEvents}
                                                onSelectEvent={(event) => setSelectedEvent(event)}
                                            />
                                        ) : (
                                            <div className="mobile-calendar-month px-2 overflow-hidden">
                                                <style>{`
                                                .mobile-calendar-month .rbc-header {
                                                    font-size: 0.8rem;
                                                }
                                                .mobile-calendar-month .rbc-month-view {
                                                    max-width: 100%;
                                                    overflow: hidden;
                                                }
                                            `}</style>
                                                <Calendar
                                                    localizer={localizer}
                                                    culture="pt-BR"
                                                    events={clubEvents}
                                                    startAccessor={(event: Event) => {
                                                        const date = new Date(event.date);
                                                        return isNaN(date.getTime()) ? new Date() : date;
                                                    }}
                                                    endAccessor={(event: Event) => {
                                                        if (event.endDate) {
                                                            const endDate = new Date(event.endDate);
                                                            return isNaN(endDate.getTime()) ? new Date(new Date(event.date).getTime() + 3600000) : endDate;
                                                        }
                                                        return new Date(new Date(event.date).getTime() + 3600000);
                                                    }}
                                                    defaultView="month"
                                                    views={['month']}
                                                    style={{ height: 'calc(100vh - 250px)' }}
                                                    formats={{
                                                        weekdayFormat: (date, culture, localizer) => {
                                                            const fullDay = localizer?.format(date, 'EEEE', culture) || '';
                                                            return fullDay.substring(0, 3).toLowerCase();
                                                        }
                                                    }}
                                                    messages={{
                                                        next: "Próximo",
                                                        previous: "Anterior",
                                                        today: "Hoje",
                                                        month: "Mês",
                                                        noEventsInRange: "Sem eventos",
                                                    }}
                                                    onSelectEvent={(event) => setSelectedEvent(event)}
                                                    eventPropGetter={(event) => {
                                                        let backgroundColor = '#10b981';
                                                        let borderColor = '#059669';

                                                        if (event.category === 'PRESENTIAL') {
                                                            backgroundColor = '#9333ea';
                                                            borderColor = '#7c3aed';
                                                        }

                                                        return {
                                                            style: {
                                                                backgroundColor,
                                                                borderColor,
                                                                color: 'white',
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                fontWeight: '600',
                                                                fontSize: '11px'
                                                            }
                                                        };
                                                    }}
                                                    components={{
                                                        toolbar: (props) => (
                                                            <div className="flex justify-between items-center mb-3 px-2">
                                                                <button
                                                                    onClick={() => props.onNavigate(Navigate.PREVIOUS)}
                                                                    className="p-2 hover:bg-slate-800 rounded transition-colors"
                                                                >
                                                                    <ChevronLeft size={20} />
                                                                </button>
                                                                <span className="text-base font-bold text-white capitalize">
                                                                    {props.label}
                                                                </span>
                                                                <button
                                                                    onClick={() => props.onNavigate(Navigate.NEXT)}
                                                                    className="p-2 hover:bg-slate-800 rounded transition-colors"
                                                                >
                                                                    <ChevronRight size={20} />
                                                                </button>
                                                            </div>
                                                        )
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full w-full overflow-hidden rounded-xl">
                                        <Calendar
                                            localizer={localizer}
                                            culture="pt-BR"
                                            events={clubEvents}
                                            startAccessor={(event: Event) => {
                                                // Ensure proper Date object with local time
                                                const date = new Date(event.date);
                                                return isNaN(date.getTime()) ? new Date() : date;
                                            }}
                                            endAccessor={(event: Event) => {
                                                // Ensure proper Date object with local time
                                                if (event.endDate) {
                                                    const endDate = new Date(event.endDate);
                                                    return isNaN(endDate.getTime()) ? new Date(new Date(event.date).getTime() + 3600000) : endDate;
                                                }
                                                // Default to 1 hour duration
                                                return new Date(new Date(event.date).getTime() + 3600000);
                                            }}
                                            defaultView={calendarDefaultView}
                                            style={{ height: 'calc(100% - 80px)' }}
                                            messages={{
                                                next: "Próximo",
                                                previous: "Anterior",
                                                today: "Hoje",
                                                month: "Mês",
                                                week: "Semana",
                                                day: "Dia",
                                                agenda: "Lista",
                                                date: "Data",
                                                time: "Hora",
                                                event: "Evento",
                                                noEventsInRange: "Não há eventos neste período.",
                                                showMore: (total) => `+ ${total} mais`
                                            }}
                                            views={{ agenda: true, day: true, week: true, month: true }}
                                            onSelectEvent={(event) => setSelectedEvent(event)}
                                            eventPropGetter={(event) => {
                                                // Only ONLINE (green) and PRESENTIAL (purple)
                                                let backgroundColor = '#10b981'; // Default: ONLINE (Verde)
                                                let borderColor = '#059669';

                                                if (event.category === 'PRESENTIAL') {
                                                    backgroundColor = '#9333ea'; // Roxo
                                                    borderColor = '#7c3aed';
                                                }

                                                return {
                                                    style: {
                                                        backgroundColor,
                                                        borderColor,
                                                        color: 'white',
                                                        borderWidth: '1px',
                                                        borderStyle: 'solid',
                                                        fontWeight: '600'
                                                    }
                                                };
                                            }}
                                            components={{
                                                toolbar: (props) => (
                                                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 p-2">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => props.onNavigate(Navigate.PREVIOUS)}
                                                                className="p-2 hover:bg-slate-800 transition-colors"
                                                                title="Anterior"
                                                            >
                                                                <ChevronLeft size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => props.onNavigate(Navigate.TODAY)}
                                                                className="px-3 py-1 text-sm font-bold text-yellow-500 hover:text-yellow-400 transition-colors"
                                                            >
                                                                Hoje
                                                            </button>
                                                            <span className="text-lg font-bold text-white capitalize min-w-[200px] text-center">
                                                                {props.label}
                                                            </span>
                                                            <button
                                                                onClick={() => props.onNavigate(Navigate.NEXT)}
                                                                className="p-2 hover:bg-slate-800 transition-colors"
                                                                title="Próximo"
                                                            >
                                                                <ChevronRight size={20} />
                                                            </button>
                                                        </div>
                                                        <div className="flex bg-slate-800 p-1 gap-1">
                                                            {/* ORDER: Lista (Agenda) -> Dia -> Semana -> Mês */}
                                                            {['agenda', 'day', 'week', 'month'].map(v => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => props.onView(v as any)}
                                                                    className={`px-4 py-2 text-sm font-bold transition-all ${props.view === v
                                                                        ? 'bg-yellow-600 text-white shadow-lg'
                                                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                                        }`}
                                                                >
                                                                    {v === 'agenda' ? 'Lista' : v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {view === ViewState.PROSPERUS_TOOLS && currentUser && (
                            <div className="animate-in fade-in">
                                <ProsperusToolsPage setView={setView} />
                            </div>
                        )}

                        {/* Academy - Video List */}
                        {view === ViewState.ACADEMY && currentUser && (
                            <div className="animate-in fade-in">
                                <Academy userId={currentUser.id} />
                            </div>
                        )}

                        {view === ViewState.SOLUTIONS && currentUser && (
                            <div className="animate-in fade-in">
                                <SolutionsListPage setView={setView} />
                            </div>
                        )}

                        {view === ViewState.PROGRESS && currentUser && (
                            <div className="animate-in fade-in">
                                <ProgressListPage setView={setView} />
                            </div>
                        )}

                        {/* EVENT DETAILS MODAL */}
                        {selectedEvent && (
                            <EventDetailsModal
                                event={selectedEvent}
                                onClose={() => setSelectedEvent(null)}
                                userId={userProfile?.id}
                            />
                        )}



                        {view === ViewState.MEMBERS && (
                            <MemberBook
                                onSelectMember={setSelectedMember}
                                currentUserId={currentUser?.id}
                                initialBenefitsFilter={showBenefitsFilter}
                            />
                        )}

                        {/* MEMBER DETAILS MODAL - Using ProfilePreview for complete data display */}
                        {selectedMember && (
                            <ProfilePreview
                                profile={selectedMember}
                                onClose={() => setSelectedMember(null)}
                                currentUserId={currentUser?.id}
                                onStartChat={() => {
                                    setSelectedMember(null);
                                    setView(ViewState.MESSAGES);
                                }}
                            />
                        )}

                        {view === ViewState.GALLERY && (
                            <div className="animate-in fade-in h-full">
                                <Gallery />
                            </div>
                        )}





                        {view === ViewState.NEWS && (
                            <div className="animate-in fade-in h-full">
                                {selectedArticle ? (
                                    <ArticleReader
                                        article={selectedArticle}
                                        onBack={() => setSelectedArticle(null)}
                                    />
                                ) : (
                                    <NewsList
                                        onArticleSelect={(article) => setSelectedArticle(article)}
                                    />
                                )}
                            </div>
                        )}

                        {view === ViewState.DEALS && currentUser && (
                            <div className="animate-in fade-in">
                                <MyDealsScreen />
                            </div>
                        )}

                        {view === ViewState.REFERRALS && currentUser && (
                            <div className="animate-in fade-in">
                                <ReferralsScreen />
                            </div>
                        )}

                        {view === ViewState.RANKINGS && currentUser && (
                            <div className="animate-in fade-in">
                                <RankingsScreen />
                            </div>
                        )}

                        {view === ViewState.MESSAGES && currentUser && (
                            <div className="h-full animate-in fade-in">
                                <MessagesView currentUserId={currentUser.id} />
                            </div>
                        )}

                        {view === ViewState.NOTIFICATIONS && currentUser && (
                            <div className="animate-in fade-in">
                                <NotificationsPage
                                    currentUserId={currentUser.id}
                                    onNavigate={handleNotificationNavigate}
                                />
                            </div>
                        )}

                        {view === ViewState.FAVORITES && currentUser && (
                            <div className="animate-in fade-in">
                                <FavoritesPage
                                    setView={setView}
                                    currentUserId={currentUser.id}
                                />
                            </div>
                        )}

                        {view === ViewState.PROFILE && currentUser && (
                            <ProfileSection
                                currentUser={currentUser}
                                setView={setView}
                                setIsEditingProfile={setIsEditingProfile}
                                setShowPreviewProfile={setShowPreviewProfile}
                                onLogout={handleLogout}
                            />
                        )}

                        {/* PROFILE EDIT MODAL - Using Advanced ProfileEdit Component */}
                        {isEditingProfile && currentUser && (
                            <ProfileEdit
                                currentUser={memberToProfileData(currentUser)}
                                supabase={supabase}
                                isMockMode={isMockMode}
                                onSave={handleProfileSave}
                                onCancel={() => setIsEditingProfile(false)}
                            />
                        )}

                        {/* PROFILE PREVIEW MODAL */}
                        {showPreviewProfile && currentUser && (
                            <ProfilePreview
                                profile={memberToProfileData(currentUser)}
                                onClose={() => setShowPreviewProfile(false)}
                                currentUserId={currentUser.id}
                            />
                        )}

                    </Suspense>
                </div>

                {/* Mobile Bottom Nav */}
                <div className="md:hidden bg-prosperus-navy border-t border-prosperus-navy-light flex justify-around items-center p-2 pb-4 safe-area-bottom fixed bottom-0 w-full z-40">
                    {navItems.slice(0, 5).map(item => {
                        // Use item.view if available (for hierarchical items), otherwise use item.id
                        const targetView = ('view' in item && item.view) ? item.view : item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setView(targetView as ViewState)}
                                className={`mobile-nav-item flex flex-col items-center rounded-lg transition ${view === targetView ? 'text-prosperus-gold' : 'text-prosperus-grey'}`}
                            >
                                {item.icon}
                                <span className="text-[10px] mt-1">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {view !== ViewState.MESSAGES && <SupportWidget />}
            </div>

            {/* Role Selector Modal - Shows when admin/team logs in */}
            {showRoleSelector && pendingUser && (
                <RoleSelector
                    isOpen={showRoleSelector}
                    onClose={() => setShowRoleSelector(false)}
                    onSelectRole={handleRoleSelection}
                    userName={pendingUser.name}
                />
            )}

            {/* Profile Edit Modal */}
            {isEditingProfile && currentUser && (
                <Suspense fallback={null}>
                    <ProfileEdit
                        currentUser={memberToProfileData(currentUser)}
                        supabase={supabase}
                        isMockMode={isMockMode}
                        onSave={(updatedProfile) => {
                            // ⚠️ REMOVED: AuthContext.refreshProfile() handles this in ProfileEdit
                            // Update current user with new data
                            // setCurrentUser({ ... });
                            setIsEditingProfile(false);
                        }}
                        onCancel={() => setIsEditingProfile(false)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default App;