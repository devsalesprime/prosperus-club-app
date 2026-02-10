// ProfileEdit.tsx
// Component for editing user profile

import React, { useState, useEffect } from 'react';
import {
    User,
    Briefcase,
    Building2,
    Phone,
    FileText,
    Linkedin,
    Instagram,
    Globe,
    MessageCircle,
    X,
    Plus,
    Save,
    AlertCircle,
    CheckCircle,
    Tag,
    Upload,
    Eye,
    History,
    Gift,
    Link2,
    ToggleLeft,
    ToggleRight,
    Sparkles,
    Ticket
} from 'lucide-react';
import { profileService, ProfileData, ProfileUpdateData, ExclusiveBenefit } from '../services/profileService';
import { ImageUpload } from './ImageUpload';
import { ProfilePreview } from './ProfilePreview';
import { TagSuggestions } from './TagSuggestions';
import { BenefitStatsCard } from './BenefitStatsCard';
import { ModalWrapper, ModalBody } from './ui/ModalWrapper';
import { ModalHeader, ModalHeaderIconButton } from './ModalHeader';
import { ProfileHistory } from './ProfileHistory';
import { Button } from './ui/Button';
import { AvatarEditable } from './ui/Avatar';
import { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

interface ProfileEditProps {
    currentUser: ProfileData;
    supabase: SupabaseClient; // Add supabase client
    isMockMode?: boolean; // Flag to indicate if we're in mock/demo mode
    onSave: (updatedProfile: ProfileData) => void;
    onCancel: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ currentUser, supabase, isMockMode = false, onSave, onCancel }) => {
    const { refreshProfile } = useAuth();
    const [formData, setFormData] = useState<ProfileUpdateData>({
        name: currentUser.name || '',
        company: currentUser.company || '',
        job_title: currentUser.job_title || '',
        image_url: currentUser.image_url || '',
        bio: currentUser.bio || '',
        // phone: currentUser.phone || '', // TODO: Uncomment after running migration 011
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
        }
    });

    const [newTag, setNewTag] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Advanced features states
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Sync formData when currentUser changes (e.g., after profile fetch)
    useEffect(() => {
        setFormData({
            name: currentUser.name || '',
            company: currentUser.company || '',
            job_title: currentUser.job_title || '',
            image_url: currentUser.image_url || '',
            bio: currentUser.bio || '',
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
            }
        });
    }, [currentUser.id, currentUser.image_url, currentUser.name, currentUser.bio]);

    const handleInputChange = (field: keyof ProfileUpdateData, value: string | { linkedin?: string; instagram?: string; whatsapp?: string; website?: string } | string[] | ExclusiveBenefit) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSocialChange = (platform: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [platform]: value
            }
        }));
    };

    const handleAddTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), trimmedTag]
            }));
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
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
                console.log('⚠️ MOCK MODE: Skipping Supabase save, updating locally only');
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
            const updatedProfile = await profileService.updateProfile(currentUser.id, formData);

            if (updatedProfile) {
                // Check if profile is now complete and mark onboarding as done
                if (profileService.isProfileComplete(updatedProfile) && !updatedProfile.has_completed_onboarding) {
                    await profileService.completeOnboarding(currentUser.id);
                    updatedProfile.has_completed_onboarding = true;
                    console.log('✅ Onboarding marked as complete');
                }

                // 🔄 CRITICAL: Refresh global profile context
                console.log('🔄 ProfileEdit: Refreshing global profile context...');
                await refreshProfile();

                // 🔄 Sync to HubSpot CRM (fire-and-forget, completely non-blocking)
                // This prevents CORS errors from blocking the UI update
                supabase.functions.invoke('sync-hubspot', {
                    body: { profile: updatedProfile }
                }).then(({ error: syncError }) => {
                    if (syncError) {
                        console.warn('⚠️ HubSpot sync failed (non-blocking):', syncError);
                    } else {
                        console.log('✅ Profile synced to HubSpot');
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
    };

    const completionPercentage = profileService.getProfileCompletionPercentage({
        ...currentUser,
        ...formData
    } as ProfileData);

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
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Foto de Perfil
                        </label>
                        {/* Layout responsivo: empilha no mobile, inline no desktop */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                            {/* Clickable avatar with camera overlay */}
                            <button
                                type="button"
                                onClick={() => setShowImageUpload(true)}
                                className="relative shrink-0 group"
                                title="Trocar foto de perfil"
                            >
                                <AvatarEditable
                                    src={formData.image_url}
                                    alt="Preview"
                                    size="xl"
                                />
                                {/* Camera overlay */}
                                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                                    <Upload size={24} className="text-white" />
                                </div>
                            </button>
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                                    placeholder="https://exemplo.com/foto.jpg"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => setShowImageUpload(true)}
                                    className="w-full sm:w-auto shrink-0"
                                >
                                    <Upload size={18} />
                                    Upload
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center sm:text-left">
                            Toque na foto ou clique em Upload para alterar
                        </p>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Nome Completo *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Seu nome"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Cargo
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.job_title}
                                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                                    placeholder="Ex: CEO, Diretor Comercial"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Empresa
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => handleInputChange('company', e.target.value)}
                                    placeholder="Nome da empresa"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>

                        {/* TODO: Uncomment after running migration 011_add_phone_to_profiles.sql
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Telefone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                        </div>
                        */}
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Sobre Você
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-slate-500" size={18} />
                            <textarea
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="Conte um pouco sobre você, sua experiência e interesses..."
                                rows={4}
                                maxLength={500}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition resize-none"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.bio?.length || 0}/500 caracteres
                        </p>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">Redes Sociais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">LinkedIn</label>
                                <div className="relative">
                                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="url"
                                        value={formData.socials?.linkedin}
                                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                                        placeholder="https://linkedin.com/in/..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Instagram</label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="url"
                                        value={formData.socials?.instagram}
                                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-2">WhatsApp</label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.socials?.whatsapp}
                                        onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                                        placeholder="5511999999999"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="url"
                                        value={formData.socials?.website}
                                        onChange={(e) => handleSocialChange('website', e.target.value)}
                                        placeholder="https://seusite.com"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">Tags de Interesse</h3>
                        <div className="flex gap-2 mb-3">
                            <div className="relative flex-1">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    placeholder="Ex: Vendas, Marketing, Tecnologia"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                                />
                            </div>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleAddTag}
                            >
                                <Plus size={18} />
                                Adicionar
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags?.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-red-400 transition"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {(!formData.tags || formData.tags.length === 0) && (
                                <p className="text-sm text-slate-500">Nenhuma tag adicionada</p>
                            )}
                        </div>

                        {/* Tag Suggestions */}
                        <TagSuggestions
                            currentTags={formData.tags || []}
                            onTagSelect={(tag) => {
                                setFormData(prev => ({
                                    ...prev,
                                    tags: [...(prev.tags || []), tag]
                                }));
                            }}
                        />
                    </div>

                    {/* ========================================= */}
                    {/* EXCLUSIVE BENEFIT SECTION (PREMIUM) */}
                    {/* ========================================= */}
                    <div className="border border-yellow-600/30 rounded-xl p-6 bg-gradient-to-br from-yellow-900/10 to-transparent">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-600/20 rounded-lg">
                                    <Gift className="text-yellow-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Oferta para o Clube</h3>
                                    <p className="text-xs text-slate-400">Ofereça algo exclusivo para os membros</p>
                                </div>
                            </div>
                            {/* Toggle Switch - Premium Range Slider Style */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        exclusive_benefit: {
                                            ...prev.exclusive_benefit!,
                                            active: !prev.exclusive_benefit?.active
                                        }
                                    }));
                                }}
                                className={`btn-sm relative w-[52px] h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${formData.exclusive_benefit?.active
                                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                                    : 'bg-slate-700 hover:bg-slate-600'
                                    }`}
                                aria-label={formData.exclusive_benefit?.active ? 'Desativar oferta' : 'Ativar oferta'}
                                role="switch"
                                aria-checked={formData.exclusive_benefit?.active}
                            >
                                {/* Slider Knob */}
                                <span
                                    className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${formData.exclusive_benefit?.active
                                        ? 'translate-x-[24px] shadow-lg'
                                        : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Gamification Tip */}
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <Sparkles className="text-yellow-500 shrink-0" size={16} />
                            <p className="text-xs text-slate-400">
                                <span className="text-yellow-500 font-medium">Dica:</span> Sócios com benefícios ativos ganham destaque no diretório!
                            </p>
                        </div>

                        {/* Benefit Form Fields */}
                        <div className={`space-y-4 transition-opacity duration-200 ${formData.exclusive_benefit?.active ? 'opacity-100' : 'opacity-50 pointer-events-none'
                            }`}>
                            {/* Title */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Título da Oferta <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={formData.exclusive_benefit?.title || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            exclusive_benefit: {
                                                ...prev.exclusive_benefit!,
                                                title: e.target.value
                                            }
                                        }))}
                                        placeholder="Ex: 15% de desconto em Consultoria"
                                        maxLength={100}
                                        disabled={!formData.exclusive_benefit?.active}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Como Funciona / Regras <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={formData.exclusive_benefit?.description || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            exclusive_benefit: {
                                                ...prev.exclusive_benefit!,
                                                description: e.target.value
                                            }
                                        }))}
                                        placeholder="Descreva as condições e como o membro pode aproveitar..."
                                        maxLength={200}
                                        rows={3}
                                        disabled={!formData.exclusive_benefit?.active}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition resize-none disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    />
                                    <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                                        {formData.exclusive_benefit?.description?.length || 0}/200
                                    </span>
                                </div>
                            </div>

                            {/* Two columns: CTA URL + CTA Label */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Link para Resgate</label>
                                    <div className="relative">
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="url"
                                            value={formData.exclusive_benefit?.ctaUrl || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                exclusive_benefit: {
                                                    ...prev.exclusive_benefit!,
                                                    ctaUrl: e.target.value
                                                }
                                            }))}
                                            placeholder="https://seusite.com/oferta"
                                            disabled={!formData.exclusive_benefit?.active}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition disabled:bg-slate-900 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Texto do Botão</label>
                                    <input
                                        type="text"
                                        value={formData.exclusive_benefit?.ctaLabel || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            exclusive_benefit: {
                                                ...prev.exclusive_benefit!,
                                                ctaLabel: e.target.value
                                            }
                                        }))}
                                        placeholder="Ex: Acessar Site, Chamar no Zap"
                                        maxLength={30}
                                        disabled={!formData.exclusive_benefit?.active}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Promo Code */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Código Promocional <span className="text-slate-500">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={formData.exclusive_benefit?.code || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            exclusive_benefit: {
                                                ...prev.exclusive_benefit!,
                                                code: e.target.value.toUpperCase()
                                            }
                                        }))}
                                        placeholder="PROSPERUS15"
                                        maxLength={20}
                                        disabled={!formData.exclusive_benefit?.active}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm uppercase tracking-wider focus:outline-none focus:border-yellow-600 transition disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* BENEFIT ANALYTICS - Performance Stats */}
                    {/* ========================================= */}
                    {formData.exclusive_benefit?.active && (
                        <div className="mt-6">
                            <BenefitStatsCard ownerId={currentUser.id} />
                        </div>
                    )}

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
                    onImageUploaded={(url) => {
                        handleInputChange('image_url', url);
                        setShowImageUpload(false);
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
