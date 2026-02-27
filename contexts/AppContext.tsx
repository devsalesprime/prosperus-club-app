// ============================================
// APP CONTEXT — Centralized Application State
// ============================================
// Migrated from App.tsx during God Component decomposition.
// Provides useApp() hook for all descendant components.

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { ViewState, Member, Video, ClubEvent as Event, Article } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/mockData';
import { eventService } from '../services/eventService';
import { profileService, ProfileData } from '../services/profileService';
import { articleService, Article as ServiceArticle } from '../services/articleService';
import { bannerService, CarouselItem } from '../services/bannerService';
import { cleanExpiredCache } from '../services/offlineStorage';
import { useAppTour } from '../hooks/useAppTour';
import { buildTourSteps } from '../components/AppTourSteps';

// ─── Types ───────────────────────────────────────────
export interface AppContextType {
    // Navigation
    view: ViewState;
    setView: (v: ViewState) => void;
    isAdmin: boolean;
    setIsAdmin: (v: boolean) => void;
    isMobile: boolean;
    mobileView: 'LIST' | 'MONTH';
    setMobileView: (v: 'LIST' | 'MONTH') => void;

    // User
    currentUser: Member | null;
    userProfile: ProfileData | null;
    session: any;
    setSession: (s: any) => void;
    isMockMode: boolean;

    // Data
    members: ProfileData[];
    membersLoading: boolean;
    clubEvents: Event[];
    setClubEvents: (e: Event[]) => void;
    carouselItems: CarouselItem[];
    hasNews: boolean;
    selectedArticle: ServiceArticle | null;
    setSelectedArticle: (a: ServiceArticle | null) => void;

    // UI Modals
    selectedEvent: Event | null;
    setSelectedEvent: (e: Event | null) => void;
    selectedMember: ProfileData | null;
    setSelectedMember: (m: ProfileData | null) => void;
    isEditingProfile: boolean;
    setIsEditingProfile: (v: boolean) => void;
    showPreviewProfile: boolean;
    setShowPreviewProfile: (v: boolean) => void;
    showBenefitsFilter: boolean;
    setShowBenefitsFilter: (v: boolean) => void;

    // Auth/Login flow
    isLoginOpen: boolean;
    setIsLoginOpen: (v: boolean) => void;
    showRoleSelector: boolean;
    pendingUser: any;
    showOnboarding: boolean;
    setShowOnboarding: (v: boolean) => void;

    // Nav
    navItems: any[];
    expandedMenus: Set<string>;
    toggleMenu: (menuId: string) => void;

    // Handlers
    handleLoginSuccess: (user: any) => Promise<void>;
    handleLogout: () => Promise<void>;
    handleRoleSelection: (role: 'MEMBER' | 'ADMIN') => void;
    handleProfileSave: (profile: ProfileData) => void;
    handleNotificationNavigate: (url: string) => void;
    memberToProfileData: (member: Member) => ProfileData;
    profileToMember: (profile: ProfileData | null) => Member | null;

    // Calendar
    calendarDefaultView: any;

    // Tour
    tour: ReturnType<typeof useAppTour>;
    tourSteps: any[];

    // Auth context passthrough
    authContextLoading: boolean;
    isAuthenticated: boolean;
    isPasswordRecovery: boolean;
    refreshProfile: (() => Promise<void>) | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Hook ────────────────────────────────────────────
export const useApp = (): AppContextType => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};

// ─── Provider ────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        userProfile,
        session: authSession,
        isLoading: authContextLoading,
        isAuthenticated,
        refreshProfile,
        isPasswordRecovery
    } = useAuth();

    // ─── Profile Conversion ──────────────────────────
    const profileToMember = (profile: ProfileData | null): Member | null => {
        if (!profile) return null;
        return {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            company: profile.company || '',
            jobTitle: profile.job_title,
            phone: profile.phone || '',
            image: profile.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
            description: profile.bio || '',
            socials: profile.socials || {},
            tags: profile.tags || [],
            what_i_sell: profile.what_i_sell,
            what_i_need: profile.what_i_need,
            partnership_interests: profile.partnership_interests,
            pitch_video_url: profile.pitch_video_url,
            exclusiveBenefit: profile.exclusive_benefit || undefined,
        };
    };

    const currentUser = profileToMember(userProfile);

    // ─── Navigation State ────────────────────────────
    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
    const [showBenefitsFilter, setShowBenefitsFilter] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['prosperus-tools']));

    // ─── Session / Auth State ────────────────────────
    const [session, setSession] = useState<any>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [pendingUser, setPendingUser] = useState<any>(null);
    const [showOnboarding, setShowOnboarding] = useState(true);

    // ─── UI Modal State ──────────────────────────────
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedMember, setSelectedMember] = useState<ProfileData | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showPreviewProfile, setShowPreviewProfile] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ServiceArticle | null>(null);

    // ─── Data State ──────────────────────────────────
    const [members, setMembers] = useState<ProfileData[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [clubEvents, setClubEvents] = useState<Event[]>([]);
    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
    const [carouselLoading, setCarouselLoading] = useState(true);
    const [hasNews, setHasNews] = useState(false);

    // ─── Responsive State ────────────────────────────
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' && window.innerWidth < 768
    );
    const [mobileView, setMobileView] = useState<'LIST' | 'MONTH'>('LIST');
    const [calendarDefaultView, setCalendarDefaultView] = useState(() =>
        typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'month'
    );

    // ─── Refs ────────────────────────────────────────
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const profileFetchedRef = useRef(false);

    // ─── App Tour ────────────────────────────────────
    const tour = useAppTour();
    const tourSteps = useMemo(() => buildTourSteps(setView), []);

    // ─── Effects ─────────────────────────────────────

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setCalendarDefaultView(mobile ? 'agenda' : 'month');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clean expired offline cache
    useEffect(() => { cleanExpiredCache(); }, []);

    // Fetch events
    useEffect(() => {
        if (userProfile?.id) {
            eventService.getEventsForUser(userProfile.id).then(setClubEvents);
        }
    }, [userProfile?.id]);

    // Reset benefits filter when leaving MEMBERS view
    useEffect(() => {
        if (view !== ViewState.MEMBERS) setShowBenefitsFilter(false);
    }, [view]);

    // Fetch members
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

    // Monitor userProfile for admin/team role selector
    useEffect(() => {
        if (userProfile && !showRoleSelector && !pendingUser) {
            if (userProfile.role === 'ADMIN' || userProfile.role === 'TEAM') {
                const memberUser = {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                    role: userProfile.role,
                    company: userProfile.company || '',
                    jobTitle: userProfile.job_title || '',
                    phone: userProfile.phone || '',
                    image: userProfile.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
                    description: userProfile.bio || '',
                    socials: userProfile.socials || {},
                    tags: userProfile.tags || []
                };
                setPendingUser(memberUser);
                setShowRoleSelector(true);
            }
        }
    }, [userProfile, showRoleSelector, pendingUser]);

    // Fetch carousel items
    useEffect(() => {
        const fetchCarouselItems = async () => {
            setCarouselLoading(true);
            try {
                const userId = currentUser?.id || session?.user?.id;
                if (userId) {
                    const items = await bannerService.getHomeCarouselItems(userId);
                    setCarouselItems(items);
                } else {
                    const banners = await bannerService.getActiveBanners('HOME');
                    const items = banners.map(b => ({ type: 'PROMO' as const, data: b }));
                    setCarouselItems(items);
                }
            } catch (error) {
                console.error('Error fetching carousel items:', error);
            } finally {
                setCarouselLoading(false);
            }
        };
        fetchCarouselItems();
    }, [currentUser?.id, session?.user?.id]);

    // Session management
    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession()
            .then(async ({ data: { session } }) => {
                if (!mounted) return;
                setSession(session);
                if (session) {
                    setIsLoginOpen(false);
                    articleService.hasPublishedArticles().then(setHasNews);
                } else {
                    setIsLoginOpen(true);
                }
            })
            .catch((error) => {
                console.error('Error getting session:', error);
                if (mounted) setIsLoginOpen(true);
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            setSession(session);
            if (session) {
                setIsLoginOpen(false);
            } else {
                setPendingUser(null);
                setShowRoleSelector(false);
                profileFetchedRef.current = false;
                setIsLoginOpen(true);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // ─── Handlers ────────────────────────────────────

    const handleNotificationNavigate = (url: string) => {
        if (!url) return;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        if (Object.values(ViewState).includes(url as ViewState)) {
            setView(url as ViewState);
            return;
        }
        const pathMatch = url.match(/^\/?([a-zA-Z_-]+)/);
        if (pathMatch) {
            const viewKey = pathMatch[1].toUpperCase().replace(/-/g, '_');
            if (Object.values(ViewState).includes(viewKey as ViewState)) {
                setView(viewKey as ViewState);
                return;
            }
        }
        console.warn('Notification URL did not match any ViewState:', url);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleLoginSuccess = async (user: any) => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!session && !currentSession) {
            const mockSession = { user, access_token: 'mock-token', expires_in: 3600 };
            setSession(mockSession);
            setIsMockMode(true);
        } else {
            if (currentSession) { setSession(currentSession); setIsMockMode(false); }
            else if (session) { setSession(session); setIsMockMode(false); }
        }

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        const isFromSupabase = user.role && user.company !== undefined && isValidUUID;

        let memberUser;

        if (isFromSupabase) {
            memberUser = user;
        } else if (isValidUUID) {
            if (user.email && user.role && user.role !== 'authenticated') {
                memberUser = user;
            } else {
                memberUser = {
                    id: user.id,
                    name: user.user_metadata?.full_name || 'Novo Sócio',
                    role: 'MEMBER' as const,
                    company: user.user_metadata?.company || '',
                    jobTitle: user.user_metadata?.job_title || '',
                    phone: user.user_metadata?.phone || '',
                    image: user.user_metadata?.avatar_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
                    description: '',
                    socials: {},
                    tags: []
                };
            }
        } else {
            const members = dataService.getMembers();
            memberUser = members.find(m => m.id === user.id);
            if (!memberUser) {
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

        if (memberUser.role === 'ADMIN' || memberUser.role === 'TEAM') {
            setPendingUser(memberUser);
            setShowRoleSelector(true);
        } else {
            setIsLoginOpen(false);
        }
    };

    const handleRoleSelection = (selectedRole: 'MEMBER' | 'ADMIN') => {
        if (!pendingUser) return;
        setShowRoleSelector(false);
        setIsLoginOpen(false);
        setIsAdmin(selectedRole === 'ADMIN');
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout exception:', err);
        } finally {
            setSession(null);
            setPendingUser(null);
            setShowRoleSelector(false);
            setIsAdmin(false);
            setIsMockMode(false);
            profileFetchedRef.current = false;
            setIsLoginOpen(true);
            setView(ViewState.DASHBOARD);
        }
    };

    const handleProfileSave = (updatedProfile: ProfileData) => {
        setIsEditingProfile(false);
    };

    const memberToProfileData = (member: Member): ProfileData => {
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
            phone: member.phone || '',
            image_url: member.image || '',
            bio: member.description || '',
            socials: member.socials || {},
            tags: member.tags || [],
            has_completed_onboarding: hasRequiredFields,
            exclusive_benefit: member.exclusiveBenefit ? { ...member.exclusiveBenefit, active: member.exclusiveBenefit.active ?? false } : undefined,
            pitch_video_url: member.pitch_video_url || undefined,
            what_i_sell: member.what_i_sell || undefined,
            what_i_need: member.what_i_need || undefined,
            partnership_interests: member.partnership_interests || undefined
        };
    };

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) newSet.delete(menuId);
            else newSet.add(menuId);
            return newSet;
        });
    };

    // ─── Nav Items ───────────────────────────────────
    // Import icons inline to avoid circular dependencies
    const navItems = useMemo(() => {
        // These are defined in the provider to avoid import issues
        // Icons are passed as JSX from the consuming components
        return []; // Will be populated by AppLayout which has access to icons
    }, []);

    // ─── Context Value ───────────────────────────────
    const value: AppContextType = {
        view, setView,
        isAdmin, setIsAdmin,
        isMobile, mobileView, setMobileView,
        currentUser, userProfile: userProfile || null,
        session, setSession, isMockMode,
        members, membersLoading,
        clubEvents, setClubEvents,
        carouselItems, hasNews,
        selectedArticle, setSelectedArticle,
        selectedEvent, setSelectedEvent,
        selectedMember, setSelectedMember,
        isEditingProfile, setIsEditingProfile,
        showPreviewProfile, setShowPreviewProfile,
        showBenefitsFilter, setShowBenefitsFilter,
        isLoginOpen, setIsLoginOpen,
        showRoleSelector, pendingUser,
        showOnboarding, setShowOnboarding,
        navItems, expandedMenus, toggleMenu,
        handleLoginSuccess, handleLogout, handleRoleSelection,
        handleProfileSave, handleNotificationNavigate,
        memberToProfileData, profileToMember,
        calendarDefaultView,
        tour, tourSteps,
        authContextLoading, isAuthenticated,
        isPasswordRecovery, refreshProfile
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
