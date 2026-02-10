// AuthContext.tsx
// Centralized authentication and user profile management
// Single source of truth for user data from Supabase profiles table

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

    // Fetch user profile from profiles table
    const fetchProfile = async (userId: string) => {
        try {
            console.log('🔄 AuthContext: Fetching profile for user:', userId);
            const profile = await profileService.getProfile(userId);

            if (profile) {
                console.log('✅ AuthContext: Profile loaded:', profile.name);
                setUserProfile(profile);
            } else {
                console.warn('⚠️ AuthContext: No profile found for user:', userId);
                setUserProfile(null);
            }
        } catch (error: any) {
            console.error('❌ AuthContext: Error fetching profile:', {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                userId
            });

            // Determine error type for better logging
            if (error?.message?.includes('timeout')) {
                console.error('🕐 AuthContext: Profile fetch TIMEOUT - Query took > 5 seconds');
            } else if (error?.code === 'PGRST116') {
                console.error('🔍 AuthContext: Profile NOT FOUND in database');
            } else if (error?.code?.startsWith('PGRST')) {
                console.error('🔒 AuthContext: Possible RLS policy issue');
            } else {
                console.error('🌐 AuthContext: Network or connection error');
            }

            // Create fallback profile from session data to allow user access
            if (session?.user) {
                console.warn('⚠️ AuthContext: Creating fallback profile from session data');
                const fallbackProfile: ProfileData = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.full_name || session.user.email || 'Usuário',
                    role: 'MEMBER',
                    image_url: session.user.user_metadata?.avatar_url || '/default-avatar.svg',
                    has_completed_onboarding: false
                };
                setUserProfile(fallbackProfile);
                console.log('✅ AuthContext: Fallback profile created:', fallbackProfile.name);
            } else {
                setUserProfile(null);
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
        } catch (error) {
            console.error('❌ AuthContext: Error during logout:', error);
        }
    };

    // Initialize auth state and listen for changes
    useEffect(() => {
        console.log('🔌 AuthContext: Initializing...');
        let mounted = true;

        // Safety timeout to prevent infinite loading (10 seconds)
        const safetyTimeout = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('⚠️ AuthContext: Loading timeout - forcing isLoading to false');
                setIsLoading(false);
            }
        }, 10000);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;

            console.log('📡 AuthContext: Initial session check:', session ? 'Found' : 'None');
            setSession(session);

            if (session?.user?.id) {
                fetchProfile(session.user.id)
                    .catch((error) => {
                        console.error('❌ AuthContext: Error in fetchProfile:', error);
                    })
                    .finally(() => {
                        if (mounted) {
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
            if (mounted) {
                setIsLoading(false);
                clearTimeout(safetyTimeout);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('🔔 AuthContext: Auth state changed:', event);
            setSession(session);

            try {
                if (session?.user?.id) {
                    // User logged in or session refreshed
                    await fetchProfile(session.user.id);
                } else {
                    // User logged out
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('❌ AuthContext: Error in onAuthStateChange fetchProfile:', error);
            } finally {
                // Always set loading to false, regardless of success or failure
                setIsLoading(false);
            }
        });

        return () => {
            console.log('🧹 AuthContext: Cleaning up subscription');
            mounted = false;
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
