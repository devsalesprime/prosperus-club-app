// hooks/useProfileForm.ts
// Extracted from ProfileEdit.tsx — state, handlers, validation, submit logic

import { useState, useEffect, useCallback } from 'react';
import { profileService, ProfileData, ProfileUpdateData, ExclusiveBenefit } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { SupabaseClient } from '@supabase/supabase-js';

interface UseProfileFormParams {
    currentUser: ProfileData;
    supabase: SupabaseClient;
    isMockMode: boolean;
    onSave: (updatedProfile: ProfileData) => void;
}

export function useProfileForm({ currentUser, supabase, isMockMode, onSave }: UseProfileFormParams) {
    const { refreshProfile } = useAuth();

    const [formData, setFormData] = useState<ProfileUpdateData>({
        name: currentUser.name || '',
        company: currentUser.company || '',
        job_title: currentUser.job_title || '',
        image_url: currentUser.image_url || '',
        bio: currentUser.bio || '',
        pitch_video_url: currentUser.pitch_video_url || '',
        phone: currentUser.phone || '',
        socials: {
            linkedin: currentUser.socials?.linkedin || '',
            instagram: currentUser.socials?.instagram || '',
            whatsapp: currentUser.socials?.whatsapp || '',
            website: currentUser.socials?.website || ''
        },
        tags: currentUser.tags || [],
        exclusive_benefit: currentUser.exclusive_benefit || {
            title: '',
            description: '',
            ctaLabel: '',
            ctaUrl: '',
            code: '',
            active: false
        },
        what_i_sell: currentUser.what_i_sell || '',
        what_i_need: currentUser.what_i_need || '',
        partnership_interests: currentUser.partnership_interests || []
    });

    const [newTag, setNewTag] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Sync formData when currentUser changes (e.g., after profile fetch)
    useEffect(() => {
        setFormData({
            name: currentUser.name || '',
            company: currentUser.company || '',
            job_title: currentUser.job_title || '',
            image_url: currentUser.image_url || '',
            bio: currentUser.bio || '',
            pitch_video_url: currentUser.pitch_video_url || '',
            phone: currentUser.phone || '',
            socials: {
                linkedin: currentUser.socials?.linkedin || '',
                instagram: currentUser.socials?.instagram || '',
                whatsapp: currentUser.socials?.whatsapp || '',
                website: currentUser.socials?.website || ''
            },
            tags: currentUser.tags || [],
            exclusive_benefit: currentUser.exclusive_benefit || {
                title: '',
                description: '',
                ctaLabel: '',
                ctaUrl: '',
                code: '',
                active: false
            },
            what_i_sell: currentUser.what_i_sell || '',
            what_i_need: currentUser.what_i_need || '',
            partnership_interests: currentUser.partnership_interests || []
        });
    }, [currentUser.id, currentUser.image_url, currentUser.name, currentUser.bio]);

    const handleInputChange = useCallback((field: keyof ProfileUpdateData, value: string | { linkedin?: string; instagram?: string; whatsapp?: string; website?: string } | string[] | ExclusiveBenefit) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleSocialChange = useCallback((platform: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [platform]: value
            }
        }));
    }, []);

    const handleAddTag = useCallback(() => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), trimmedTag]
            }));
            setNewTag('');
        }
    }, [newTag, formData.tags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validation
        if (!formData.name?.trim()) {
            setError('Nome é obrigatório');
            return;
        }

        // Validate socials
        const socialsValidation = profileService.validateSocials(formData.socials);
        if (!socialsValidation.valid) {
            setError(socialsValidation.errors.join(', '));
            return;
        }

        try {
            setSaving(true);

            // If in mock mode, skip Supabase save and just update locally
            if (isMockMode) {
                logger.debug('⚠️ MOCK MODE: Skipping Supabase save, updating locally only');
                const mockUpdatedProfile: ProfileData = {
                    ...currentUser,
                    ...formData
                };

                setSuccess(true);
                setTimeout(() => {
                    onSave(mockUpdatedProfile);
                }, 1000);
                return;
            }

            // Normal flow: save to Supabase
            // Strip 'Outros' toggle marker before persisting — only real sector values go to DB
            const cleanedFormData = {
                ...formData,
                partnership_interests: (formData.partnership_interests || []).filter((s: string) => s !== 'Outros')
            };
            logger.debug('📸 ProfileEdit: Saving profile with image_url:', cleanedFormData.image_url);
            const updatedProfile = await profileService.updateProfile(currentUser.id, cleanedFormData);

            if (updatedProfile) {
                // Check if profile is now complete and mark onboarding as done
                if (profileService.isProfileComplete(updatedProfile) && !updatedProfile.has_completed_onboarding) {
                    await profileService.completeOnboarding(currentUser.id);
                    updatedProfile.has_completed_onboarding = true;
                    logger.debug('✅ Onboarding marked as complete');
                }

                // 🔄 CRITICAL: Refresh global profile context
                logger.debug('🔄 ProfileEdit: Refreshing global profile context...');
                await refreshProfile();

                // 🔄 Sync to HubSpot CRM (fire-and-forget, completely non-blocking)
                supabase.functions.invoke('sync-hubspot', {
                    body: { profile: updatedProfile }
                }).then(({ error: syncError }) => {
                    if (syncError) {
                        console.warn('⚠️ HubSpot sync failed (non-blocking):', syncError);
                    } else {
                        logger.debug('✅ Profile synced to HubSpot');
                    }
                }).catch(syncErr => {
                    console.warn('⚠️ HubSpot sync error (non-blocking):', syncErr);
                });

                setSuccess(true);
                setTimeout(() => {
                    onSave(updatedProfile);
                }, 1000);
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setSaving(false);
        }
    }, [formData, currentUser, isMockMode, onSave, supabase, refreshProfile]);

    const completionPercentage = profileService.getProfileCompletionPercentage({
        ...currentUser,
        ...formData
    } as ProfileData);

    return {
        formData,
        setFormData,
        newTag,
        setNewTag,
        saving,
        error,
        setError,
        success,
        setSuccess,
        handleInputChange,
        handleSocialChange,
        handleAddTag,
        handleRemoveTag,
        handleSubmit,
        completionPercentage,
        refreshProfile,
    };
}
