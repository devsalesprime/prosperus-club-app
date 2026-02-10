// AuthContext.tsx
// Centralized authentication and user profile management
// Single source of truth for user data from Supabase profiles table

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ProfileData, profileService } from '../services/profileService';

interface AuthContextType {
    session: Session | null;
    userProfile: ProfileData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const mountedRef = useRef(true);
    const profileCacheRef = useRef<ProfileData | null>(null);

    // Fetch user profile from profiles table
    const fetchProfile = async (userId: string, isInitialLoad = false) => {
        try {
            console.log('🔄 AuthContext: Fetching profile for user:', userId);
            const profile = await profileService.getProfile(userId);

            if (!mountedRef.current) return;

            if (profile) {
                console.log('✅ AuthContext: Profile loaded:', profile.name);
                setUserProfile(profile);
                profileCacheRef.current = profile;
            } else {
                console.warn('⚠️ AuthContext: No profile found for user:', userId);
                // Don't clear profile if we already have one cached (prevents flash)
                if (!profileCacheRef.current) {
                    setUserProfile(null);
                }
            }
        } catch (error: any) {
            console.error('❌ AuthContext: Error fetching profile:', {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                userId
            });

            if (!mountedRef.current) return;

            // If we already have a cached profile, keep using it
            if (profileCacheRef.current) {
                console.log('♻️ AuthContext: Using cached profile after fetch error');
                setUserProfile(profileCacheRef.current);
                return;
            }

            // Only create fallback on initial load when we have no profile at all
            if (isInitialLoad) {
                const currentSession = session;
                if (currentSession?.user) {
                    console.warn('⚠️ AuthContext: Creating fallback profile from session data');
                    const fallbackProfile: ProfileData = {
                        id: currentSession.user.id,
                        email: currentSession.user.email || '',
                        name: currentSession.user.user_metadata?.full_name || currentSession.user.email || 'Usuário',
                        role: 'MEMBER',
                        image_url: currentSession.user.user_metadata?.avatar_url || '/default-avatar.svg',
                        has_completed_onboarding: false
                    };
                    setUserProfile(fallbackProfile);
                    profileCacheRef.current = fallbackProfile;
                    console.log('✅ AuthContext: Fallback profile created:', fallbackProfile.name);
                } else {
                    setUserProfile(null);
                }
            }
        }
    };

    // Public method to refresh profile (called after profile updates)
    const refreshProfile = async () => {
        if (session?.user?.id) {
            console.log('🔄 AuthContext: Refreshing profile...');
            await fetchProfile(session.user.id);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            console.log('👋 AuthContext: Logging out...');
            await supabase.auth.signOut();
            setSession(null);
            setUserProfile(null);
            profileCacheRef.current = null;
        } catch (error) {
            console.error('❌ AuthContext: Error during logout:', error);
        }
    };

    // Initialize auth state and listen for changes
    useEffect(() => {
        console.log('🔌 AuthContext: Initializing...');
        mountedRef.current = true;

        // Safety timeout to prevent infinite loading (20 seconds)
        const safetyTimeout = setTimeout(() => {
            if (mountedRef.current && isLoading) {
                console.warn('⚠️ AuthContext: Loading timeout - forcing isLoading to false');
                setIsLoading(false);
            }
        }, 20000);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mountedRef.current) return;

            console.log('📡 AuthContext: Initial session check:', session ? 'Found' : 'None');
            setSession(session);

            if (session?.user?.id) {
                fetchProfile(session.user.id, true)
                    .catch((error) => {
                        console.error('❌ AuthContext: Error in fetchProfile:', error);
                    })
                    .finally(() => {
                        if (mountedRef.current) {
                            setIsLoading(false);
                            clearTimeout(safetyTimeout);
                        }
                    });
            } else {
                setIsLoading(false);
                clearTimeout(safetyTimeout);
            }
        }).catch((error) => {
            console.error('❌ AuthContext: Error getting session:', error);
            if (mountedRef.current) {
                setIsLoading(false);
                clearTimeout(safetyTimeout);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mountedRef.current) return;

            console.log('🔔 AuthContext: Auth state changed:', event);
            setSession(session);

            // Only re-fetch profile on actual sign-in events, not token refreshes
            if (event === 'SIGNED_IN' && session?.user?.id) {
                try {
                    await fetchProfile(session.user.id);
                } catch (error) {
                    console.error('❌ AuthContext: Error in onAuthStateChange fetchProfile:', error);
                }
            } else if (event === 'SIGNED_OUT') {
                setUserProfile(null);
                profileCacheRef.current = null;
            }
            // TOKEN_REFRESHED: do NOT re-fetch profile, just update session
            // This prevents unnecessary loading states on mobile
        });

        return () => {
            console.log('🧹 AuthContext: Cleaning up subscription');
            mountedRef.current = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        session,
        userProfile,
        isLoading,
        isAuthenticated: !!session && !!userProfile,
        refreshProfile,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
