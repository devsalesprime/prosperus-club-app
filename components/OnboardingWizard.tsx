// OnboardingWizard.tsx
// Multi-step onboarding modal for first-time users
// 4 steps: Welcome → Profile Info → Social & Tags → Ready!

import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    User,
    Building2,
    Briefcase,
    Camera,
    Check,
    Sparkles,
    Linkedin,
    Instagram,
    Globe,
    Tag,
    Rocket,
    Search,
    Users
} from 'lucide-react';
import { ProfileData, ProfileUpdateData, profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';

interface OnboardingWizardProps {
    currentUser: ProfileData;
    onComplete: () => void;
    onProfileUpdate: (updatedProfile: ProfileData) => void;
}

const AVAILABLE_TAGS = [
    'Tecnologia', 'Vendas', 'Marketing', 'Investimentos',
    'Consultoria', 'Saúde', 'Educação', 'Finanças',
    'Imobiliário', 'Jurídico', 'Indústria', 'Comércio',
    'Serviços', 'Agronegócio', 'Startups', 'E-commerce'
];

const PARTNERSHIP_SECTORS = [
    'Tecnologia & SaaS', 'Saúde & Bem-estar', 'Educação & Treinamento',
    'Finanças & Investimentos', 'Marketing & Publicidade', 'Imobiliário',
    'Indústria & Manufatura', 'Comércio & Varejo', 'Consultoria & Gestão',
    'Jurídico & Compliance', 'Agronegócio', 'Logística & Supply Chain',
    'E-commerce & Digital', 'Energia & Sustentabilidade', 'Food & Beverage'
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
    currentUser,
    onComplete,
    onProfileUpdate
}) => {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState<ProfileUpdateData>({
        name: currentUser.name || '',
        company: currentUser.company || '',
        job_title: currentUser.job_title || '',
        bio: currentUser.bio || '',
        image_url: currentUser.image_url || '',
        socials: {
            linkedin: currentUser.socials?.linkedin || '',
            instagram: currentUser.socials?.instagram || '',
            website: currentUser.socials?.website || '',
            whatsapp: currentUser.socials?.whatsapp || ''
        },
        tags: currentUser.tags || [],
        // Strategic Profile Fields (PRD v2.1)
        what_i_sell: currentUser.what_i_sell || '',
        what_i_need: currentUser.what_i_need || '',
        partnership_interests: currentUser.partnership_interests || []
    });

    const totalSteps = 5;

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSocialChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            socials: { ...prev.socials, [field]: value }
        }));
    };

    const handleTagToggle = (tag: string) => {
        setFormData(prev => {
            const tags = prev.tags || [];
            if (tags.includes(tag)) {
                return { ...prev, tags: tags.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...tags, tag] };
            }
        });
    };

    const handlePartnershipToggle = (sector: string) => {
        setFormData(prev => {
            const interests = prev.partnership_interests || [];
            if (interests.includes(sector)) {
                return { ...prev, partnership_interests: interests.filter(s => s !== sector) };
            } else {
                return { ...prev, partnership_interests: [...interests, sector] };
            }
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) return;
        if (file.size > 5 * 1024 * 1024) return; // 5MB max

        setUploadingPhoto(true);
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const filePath = `${currentUser.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
            setFormData(prev => ({ ...prev, image_url: timestampedUrl }));
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            // Save profile updates
            const updated = await profileService.updateProfile(currentUser.id, formData);

            // Mark onboarding as complete
            await profileService.completeOnboarding(currentUser.id);

            if (updated) {
                onProfileUpdate({ ...updated, has_completed_onboarding: true });
            }

            onComplete();
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        setSaving(true);
        try {
            await profileService.completeOnboarding(currentUser.id);
            onProfileUpdate({ ...currentUser, has_completed_onboarding: true });
            onComplete();
        } catch (error) {
            console.error('Error skipping onboarding:', error);
        } finally {
            setSaving(false);
        }
    };

    // Step components
    const renderStep = () => {
        switch (step) {
            case 0: return renderWelcome();
            case 1: return renderProfileInfo();
            case 2: return renderSocialTags();
            case 3: return renderStrategicProfile();
            case 4: return renderReady();
            default: return null;
        }
    };

    // Step 1: Welcome
    const renderWelcome = () => (
        <div className="text-center py-6">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-900/30">
                <Sparkles className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
                Bem-vindo ao Prosperus Club!
            </h2>
            <p className="text-slate-300 text-lg mb-6 max-w-md mx-auto">
                Vamos configurar seu perfil em <strong className="text-yellow-500">poucos passos</strong> para você aproveitar ao máximo a sua experiência.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-8">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <User className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400">Seu Perfil</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <Globe className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400">Conexões</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <Rocket className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400">Explorar</p>
                </div>
            </div>
        </div>
    );

    // Step 2: Profile Info
    const renderProfileInfo = () => (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Complete seu Perfil</h2>
                <p className="text-slate-400 text-sm">Essas informações ajudam outros sócios a te encontrar</p>
            </div>

            {/* Photo Upload */}
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div
                        className="w-28 h-28 rounded-full border-4 border-yellow-600/50 overflow-hidden bg-slate-800 cursor-pointer hover:border-yellow-500 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <img src={formData.image_url || '/default-avatar.png'} alt="Avatar" className="w-full h-full object-cover" />
                        {uploadingPhoto && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-full shadow-lg transition-colors"
                    >
                        <Camera size={14} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Form Fields */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    <User size={14} className="inline mr-1.5 -mt-0.5" />
                    Nome Completo
                </label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition"
                    placeholder="Seu nome completo"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        <Building2 size={14} className="inline mr-1.5 -mt-0.5" />
                        Empresa
                    </label>
                    <input
                        type="text"
                        value={formData.company || ''}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition"
                        placeholder="Sua empresa"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        <Briefcase size={14} className="inline mr-1.5 -mt-0.5" />
                        Cargo
                    </label>
                    <input
                        type="text"
                        value={formData.job_title || ''}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition"
                        placeholder="Seu cargo"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Sobre Você
                </label>
                <textarea
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    maxLength={300}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition resize-none"
                    placeholder="Conte um pouco sobre você e seu negócio..."
                />
                <p className="text-xs text-slate-500 mt-1 text-right">
                    {(formData.bio || '').length}/300
                </p>
            </div>
        </div>
    );

    // Step 3: Social & Tags
    const renderSocialTags = () => (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-1">Conecte-se</h2>
                <p className="text-slate-400 text-sm">Redes sociais e áreas de interesse</p>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
                <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                    <input
                        type="url"
                        value={formData.socials?.linkedin || ''}
                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                        placeholder="https://linkedin.com/in/seuperfil"
                    />
                </div>
                <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
                    <input
                        type="url"
                        value={formData.socials?.instagram || ''}
                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                        placeholder="https://instagram.com/seuperfil"
                    />
                </div>
                <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                    <input
                        type="url"
                        value={formData.socials?.website || ''}
                        onChange={(e) => handleSocialChange('website', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        placeholder="https://seusite.com.br"
                    />
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    <Tag size={14} className="inline mr-1.5 -mt-0.5" />
                    Áreas de Interesse <span className="text-slate-500">(selecione pelo menos 1)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${(formData.tags || []).includes(tag)
                                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/30 scale-105'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                }`}
                        >
                            {(formData.tags || []).includes(tag) && <Check size={12} className="inline mr-1" />}
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 4: Strategic Profile (PRD v2.1)
    const renderStrategicProfile = () => (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-1">Perfil Estratégico</h2>
                <p className="text-slate-400 text-sm">Seus dados de negócio para conexões inteligentes</p>
            </div>

            {/* What I Sell */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Briefcase size={14} className="inline mr-1.5 -mt-0.5 text-yellow-500" />
                    O que você vende/faz? <span className="text-yellow-500">*</span>
                </label>
                <textarea
                    value={formData.what_i_sell || ''}
                    onChange={(e) => handleInputChange('what_i_sell', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition resize-none"
                    placeholder="Ex: Consultoria em gestão empresarial, software de CRM, serviços jurídicos..."
                />
            </div>

            {/* What I Need */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Search size={14} className="inline mr-1.5 -mt-0.5 text-blue-400" />
                    O que você precisa/compraria agora? <span className="text-yellow-500">*</span>
                </label>
                <textarea
                    value={formData.what_i_need || ''}
                    onChange={(e) => handleInputChange('what_i_need', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                    placeholder="Ex: Sistema de automação de marketing, parceiro logístico, assessoria contábil..."
                />
            </div>

            {/* Partnership Interests */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    <Users size={14} className="inline mr-1.5 -mt-0.5 text-emerald-400" />
                    Setores de interesse para parcerias <span className="text-yellow-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {PARTNERSHIP_SECTORS.map(sector => (
                        <button
                            key={sector}
                            onClick={() => handlePartnershipToggle(sector)}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${(formData.partnership_interests || []).includes(sector)
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 scale-105'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                }`}
                        >
                            {(formData.partnership_interests || []).includes(sector) && <Check size={12} className="inline mr-1" />}
                            {sector}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 4: Ready!
    const renderReady = () => {
        const completion = profileService.getProfileCompletionPercentage({
            ...currentUser,
            ...formData,
            image_url: formData.image_url || currentUser.image_url
        } as ProfileData);

        return (
            <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-yellow-600 shadow-lg shadow-yellow-900/30">
                    <img src={formData.image_url || '/default-avatar.png'} alt="Avatar" className="w-full h-full object-cover" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">
                    Tudo Pronto, {(formData.name || currentUser.name || '').split(' ')[0]}! 🎉
                </h2>
                <p className="text-slate-300 text-lg mb-6">
                    Seu perfil está <strong className="text-yellow-500">{completion}% completo</strong>
                </p>

                {/* Completion Bar */}
                <div className="max-w-xs mx-auto mb-8">
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 rounded-full"
                            style={{ width: `${completion}%` }}
                        />
                    </div>
                </div>

                {/* What's next */}
                <div className="bg-slate-800/50 rounded-xl p-6 max-w-sm mx-auto text-left space-y-3">
                    <p className="text-sm font-bold text-yellow-500 uppercase">O que você pode fazer agora:</p>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check size={16} className="text-green-500 shrink-0" />
                        Explorar o Member Book e conectar-se
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check size={16} className="text-green-500 shrink-0" />
                        Assistir vídeos na Academy
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check size={16} className="text-green-500 shrink-0" />
                        Ver a agenda de eventos
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check size={16} className="text-green-500 shrink-0" />
                        Registrar negócios e indicações
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in p-4">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    disabled={saving}
                    className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white text-sm flex items-center gap-1 transition"
                >
                    Pular
                    <X size={16} />
                </button>

                {/* Progress Bar */}
                <div className="h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                        style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === step
                                ? 'bg-yellow-500 scale-125'
                                : i < step
                                    ? 'bg-yellow-600/50'
                                    : 'bg-slate-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    {renderStep()}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between p-6 border-t border-slate-800">
                    {step > 0 ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1 text-slate-400 hover:text-white transition px-4 py-2 rounded-lg hover:bg-slate-800"
                        >
                            <ChevronLeft size={18} />
                            Voltar
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < totalSteps - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-yellow-900/20 transition"
                        >
                            Continuar
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={saving}
                            className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-yellow-900/20 transition disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Rocket size={18} />
                                    Explorar Dashboard
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
