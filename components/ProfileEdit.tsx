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
    HelpCircle,
    Shield,
    FileText,
    MessageCircle,
    ExternalLink,
    ChevronRight,
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
import { useSupportDocs } from './support/SupportDocsSheet';

interface ProfileEditProps {
    currentUser: ProfileData;
    supabase: SupabaseClient;
    isMockMode?: boolean;
    onSave: (updatedProfile: ProfileData) => void;
    onCancel: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ currentUser, supabase, isMockMode = false, onSave, onCancel }) => {
    const { refreshProfile } = useAuth();
    const { openDoc } = useSupportDocs();

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
                subtitle="Mantenha suas informações atualizadas no Member's Book"
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
                    {(!formData.image_url || formData.image_url.includes('default-avatar')) && (
                        <p className="text-xs text-center -mt-3 mb-2" style={{ color: '#CA9A43' }}>
                            ⚠ Sem foto, você não aparece em destaque no Member's Book
                        </p>
                    )}

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

                    {/* ═══ Suporte e Legal ═══ */}
                    <section className="pt-4 border-t border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3 px-1">
                            Suporte e Legal
                        </p>
                        <div className="flex flex-col gap-1">
                            {[
                                { icon: HelpCircle, label: 'Central de ajuda', sub: 'Dúvidas de uso e funcionalidades', action: () => openDoc('faq') },
                                { icon: Shield, label: 'Política de privacidade', sub: 'Como usamos seus dados', action: () => openDoc('privacy') },
                                { icon: FileText, label: 'Termos de uso', sub: 'Regras da plataforma', action: () => openDoc('terms') },
                            ].map(item => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.action}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all text-left w-full"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                                        <item.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-600 shrink-0" />
                                </button>
                            ))}
                            <a
                                href="https://wa.me/5511918236211"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all text-left w-full"
                            >
                                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                                    <MessageCircle size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">Falar com suporte</p>
                                    <p className="text-xs text-slate-500 mt-0.5">WhatsApp da equipe Prosperus</p>
                                </div>
                                <ExternalLink size={14} className="text-slate-600 shrink-0" />
                            </a>
                        </div>
                    </section>


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
