// AuthContext.tsx
// Centralized authentication and user profile management
// Single source of truth for user data from Supabase profiles table

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ProfileData, profileService } from '../services/profileService';
import { logger } from '../utils/logger';

interface AuthContextType {
    session: Session | null;
    userProfile: ProfileData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isPasswordRecovery: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const mountedRef = useRef(true);
    const profileCacheRef = useRef<ProfileData | null>(null);
    const sessionUserIdRef = useRef<string | null>(null);

    // Fetch user profile from profiles table
    const fetchProfile = async (userId: string, isInitialLoad = false) => {
        try {
            logger.debug('🔄 AuthContext: Fetching profile for user:', userId);
            const profile = await profileService.getProfile(userId);

            if (!mountedRef.current) return;

            if (profile) {
                logger.debug('✅ AuthContext: Profile loaded:', profile.name);
                setUserProfile(profile);
                profileCacheRef.current = profile;
            } else {
                logger.warn('⚠️ AuthContext: No profile found for user:', userId);
                // Don't clear profile if we already have one cached (prevents flash)
                if (!profileCacheRef.current) {
                    setUserProfile(null);
                }
            }
        } catch (error: any) {
            if (!mountedRef.current) return;

            // AbortError happens during Supabase token refresh — silently use cache
            const isAbortError = error?.message?.includes('AbortError') ||
                error?.message?.includes('signal is aborted') ||
                error?.name === 'AbortError';
            if (isAbortError) {
                logger.debug('🔄 AuthContext: Request aborted (token refresh) — using cached profile');
                if (profileCacheRef.current) {
                    setUserProfile(profileCacheRef.current);
                }
                return;
            }

            logger.error('❌ AuthContext: Error fetching profile:', {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                userId
            });

            // If we already have a cached profile, keep using it
            if (profileCacheRef.current) {
                logger.debug('♻️ AuthContext: Using cached profile after fetch error');
                setUserProfile(profileCacheRef.current);
                return;
            }

            // Only create fallback on initial load when we have no profile at all
            if (isInitialLoad) {
                const currentSession = session;
                if (currentSession?.user) {
                    logger.warn('⚠️ AuthContext: Creating fallback profile from session data');
                    const fallbackProfile: ProfileData = {
                        id: currentSession.user.id,
                        email: currentSession.user.email || '',
                        name: currentSession.user.user_metadata?.full_name || currentSession.user.email || 'Usuário',
                        role: 'MEMBER',
                        image_url: currentSession.user.user_metadata?.avatar_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
                        has_completed_onboarding: false
                    };
                    setUserProfile(fallbackProfile);
                    profileCacheRef.current = fallbackProfile;
                    logger.debug('✅ AuthContext: Fallback profile created:', fallbackProfile.name);
                } else {
                    setUserProfile(null);
                }
            }
        }
    };

    // Public method to refresh profile (called after profile updates)
    const refreshProfile = async () => {
        if (session?.user?.id) {
            logger.debug('🔄 AuthContext: Refreshing profile...');
            await fetchProfile(session.user.id);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            logger.debug('👋 AuthContext: Logging out...');
            await supabase.auth.signOut();
            setSession(null);
            setUserProfile(null);
            profileCacheRef.current = null;
            setIsPasswordRecovery(false);
        } catch (error) {
            logger.error('❌ AuthContext: Error during logout:', error);
        }
    };

    // Password reset: send recovery email
    const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
        try {
            logger.debug('🔑 AuthContext: Sending password reset email to:', email);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
            });

            if (error) {
                logger.error('❌ AuthContext: Reset password error:', error);
                if (error.message?.includes('rate limit')) {
                    return { success: false, error: 'Muitas tentativas. Aguarde alguns minutos.' };
                }
                return { success: false, error: 'Erro ao enviar email de recuperação. Tente novamente.' };
            }

            logger.debug('✅ AuthContext: Password reset email sent');
            return { success: true };
        } catch (err) {
            logger.error('❌ AuthContext: Unexpected reset error:', err);
            return { success: false, error: 'Erro inesperado. Tente novamente.' };
        }
    };

    // Update password (called after clicking email link)
    const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        try {
            logger.debug('🔑 AuthContext: Updating user password...');
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) {
                logger.error('❌ AuthContext: Update password error:', error);
                if (error.message?.includes('same password')) {
                    return { success: false, error: 'A nova senha não pode ser igual à anterior.' };
                }
                return { success: false, error: 'Erro ao atualizar senha. Tente novamente.' };
            }

            logger.debug('✅ AuthContext: Password updated successfully');
            setIsPasswordRecovery(false);
            return { success: true };
        } catch (err) {
            logger.error('❌ AuthContext: Unexpected update error:', err);
            return { success: false, error: 'Erro inesperado. Tente novamente.' };
        }
    };

    // Initialize auth state and listen for changes
    useEffect(() => {
        logger.debug('🔌 AuthContext: Initializing...');
        mountedRef.current = true;

        // Safety timeout to prevent infinite loading (20 seconds)
        const safetyTimeout = setTimeout(() => {
            if (mountedRef.current && isLoading) {
                logger.warn('⚠️ AuthContext: Loading timeout - forcing isLoading to false');
                setIsLoading(false);
            }
        }, 20000);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mountedRef.current) return;

            logger.debug('📡 AuthContext: Initial session check:', session ? 'Found' : 'None');
            setSession(session);
            sessionUserIdRef.current = session?.user?.id || null;

            if (session?.user?.id) {
                fetchProfile(session.user.id, true)
                    .catch((error) => {
                        logger.error('❌ AuthContext: Error in fetchProfile:', error);
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
            logger.error('❌ AuthContext: Error getting session:', error);
            if (mountedRef.current) {
                setIsLoading(false);
                clearTimeout(safetyTimeout);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mountedRef.current) return;

            logger.debug('🔔 AuthContext: Auth state changed:', event);

            // TOKEN_REFRESHED: only update session silently, don't trigger re-renders
            // if the user hasn't changed. This prevents unmounting modals (e.g., ImageUpload)
            // when the app regains focus from native file picker on mobile.
            if (event === 'TOKEN_REFRESHED') {
                const currentUserId = sessionUserIdRef.current;
                const newUserId = newSession?.user?.id || null;
                if (currentUserId === newUserId) {
                    logger.debug('🔄 AuthContext: TOKEN_REFRESHED - skipping state update (same user)');
                    return;
                }
            }

            setSession(newSession);
            sessionUserIdRef.current = newSession?.user?.id || null;

            // Only re-fetch profile on actual sign-in events, not token refreshes
            if (event === 'SIGNED_IN' && newSession?.user?.id) {
                try {
                    await fetchProfile(newSession.user.id);
                } catch (error) {
                    logger.error('❌ AuthContext: Error in onAuthStateChange fetchProfile:', error);
                }
            } else if (event === 'PASSWORD_RECOVERY') {
                logger.debug('🔑 AuthContext: PASSWORD_RECOVERY event detected');
                setIsPasswordRecovery(true);
            } else if (event === 'SIGNED_OUT') {
                setUserProfile(null);
                profileCacheRef.current = null;
                setIsPasswordRecovery(false);
            }
        });

        return () => {
            logger.debug('🧹 AuthContext: Cleaning up subscription');
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
        isPasswordRecovery,
        refreshProfile,
        logout,
        resetPassword,
        updateUserPassword,
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
