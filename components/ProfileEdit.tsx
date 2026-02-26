// ProfileEdit.tsx — Orchestrator
// Decomposed from 1.078 lines → ~150 lines
// Sub-components in ./profile/, hook in ../hooks/useProfileForm.ts

import React, { useState } from 'react';
import {
    Save,
    AlertCircle,
    CheckCircle,
    Eye,
    History,
} from 'lucide-react';
import { profileService, ProfileData, ExclusiveBenefit } from '../services/profileService';
import { ImageUpload } from './ImageUpload';
import { ProfilePreview } from './ProfilePreview';
import { ModalWrapper, ModalBody } from './ui/ModalWrapper';
import { ModalHeader, ModalHeaderIconButton } from './ModalHeader';
import { ProfileHistory } from './ProfileHistory';
import { Button } from './ui/Button';
import { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

// Sub-components
import { ProfileAvatarSection } from './profile/ProfileAvatarSection';
import { ProfileBasicFields } from './profile/ProfileBasicFields';
import { ProfileSocialsEditor } from './profile/ProfileSocialsEditor';
import { ProfileTagsEditor } from './profile/ProfileTagsEditor';
import { ProfileStrategicFields } from './profile/ProfileStrategicFields';
import { ProfileBenefitEditor } from './profile/ProfileBenefitEditor';

// Hook
import { useProfileForm } from '../hooks/useProfileForm';

interface ProfileEditProps {
    currentUser: ProfileData;
    supabase: SupabaseClient;
    isMockMode?: boolean;
    onSave: (updatedProfile: ProfileData) => void;
    onCancel: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ currentUser, supabase, isMockMode = false, onSave, onCancel }) => {
    const { refreshProfile } = useAuth();

    const {
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
    } = useProfileForm({ currentUser, supabase, isMockMode, onSave });

    // Advanced features states
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    return (
        <ModalWrapper isOpen={true} onClose={onCancel} maxWidth="3xl">
            {/* Header */}
            <ModalHeader
                title="Editar Perfil"
                subtitle="Mantenha suas informações atualizadas no Member Book"
                onClose={onCancel}
                actions={
                    <>
                        <ModalHeaderIconButton
                            icon={Eye}
                            onClick={() => setShowPreview(true)}
                            title="Preview do Perfil"
                        />
                        <ModalHeaderIconButton
                            icon={History}
                            onClick={() => setShowHistory(true)}
                            title="Histórico de Alterações"
                        />
                    </>
                }
            />

            <ModalBody>
                {/* Completion Bar */}
                <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                            Completude do Perfil
                        </span>
                        <span className="text-sm font-bold text-yellow-500">
                            {completionPercentage}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-500"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-1 space-y-6">
                    {/* Profile Image */}
                    <ProfileAvatarSection
                        imageUrl={formData.image_url || ''}
                        onImageUrlChange={(url) => handleInputChange('image_url', url)}
                        onOpenUpload={() => setShowImageUpload(true)}
                    />

                    {/* Basic Fields: Name, Job, Company, Phone, Bio */}
                    <ProfileBasicFields
                        formData={formData}
                        onChange={handleInputChange}
                    />

                    {/* Social Media */}
                    <ProfileSocialsEditor
                        socials={formData.socials || {}}
                        onChange={handleSocialChange}
                    />

                    {/* Tags + Pitch Video */}
                    <ProfileTagsEditor
                        tags={formData.tags || []}
                        newTag={newTag}
                        pitchVideoUrl={formData.pitch_video_url || ''}
                        onSetNewTag={setNewTag}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                        onTagSelect={(tag) => {
                            setFormData(prev => ({
                                ...prev,
                                tags: [...(prev.tags || []), tag]
                            }));
                        }}
                        onPitchVideoChange={(url) => handleInputChange('pitch_video_url', url)}
                    />

                    {/* Strategic Profile: what_i_sell, what_i_need, Sectors */}
                    <ProfileStrategicFields
                        whatISell={formData.what_i_sell || ''}
                        whatINeed={formData.what_i_need || ''}
                        partnershipInterests={formData.partnership_interests || []}
                        onChange={handleInputChange}
                    />

                    {/* Exclusive Benefit */}
                    <ProfileBenefitEditor
                        benefit={formData.exclusive_benefit || {
                            title: '',
                            description: '',
                            ctaLabel: '',
                            ctaUrl: '',
                            code: '',
                            active: false,
                        }}
                        ownerId={currentUser.id}
                        onBenefitChange={(benefit) => handleInputChange('exclusive_benefit', benefit)}
                    />

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg flex items-start gap-3">
                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                            <p className="text-sm text-green-400">Perfil atualizado com sucesso!</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={onCancel}
                            disabled={saving}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={saving}
                            className="flex-1"
                        >
                            {saving ? 'Salvando...' : (<><Save size={20} /> Salvar Perfil</>)}
                        </Button>
                    </div>
                </form>
            </ModalBody>

            {/* Image Upload Modal */}
            {showImageUpload && (
                <ImageUpload
                    currentImageUrl={formData.image_url}
                    userId={currentUser.id}
                    supabase={supabase}
                    onImageUploaded={async (url) => {
                        logger.debug('📸 ProfileEdit: Image uploaded, URL:', url);
                        handleInputChange('image_url', url);
                        setShowImageUpload(false);

                        // Auto-save image_url directly to the database
                        try {
                            logger.debug('📸 ProfileEdit: Auto-saving image_url to database...');
                            await profileService.updateProfile(currentUser.id, { image_url: url } as any);
                            logger.debug('✅ ProfileEdit: image_url saved successfully');

                            // Refresh global profile context so the new photo shows everywhere
                            await refreshProfile();
                            setSuccess(true);
                            setTimeout(() => setSuccess(false), 3000);
                        } catch (err) {
                            console.error('❌ ProfileEdit: Error auto-saving image_url:', err);
                            setError('Foto enviada mas não foi possível salvar. Clique em "Salvar Perfil".');
                        }
                    }}
                    onCancel={() => setShowImageUpload(false)}
                />
            )}

            {/* Profile Preview Modal */}
            {showPreview && (
                <ProfilePreview
                    profile={{ ...currentUser, ...formData } as ProfileData}
                    onClose={() => setShowPreview(false)}
                />
            )}

            {/* Profile History Modal */}
            {showHistory && (
                <ProfileHistory
                    profileId={currentUser.id}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </ModalWrapper>
    );
};
