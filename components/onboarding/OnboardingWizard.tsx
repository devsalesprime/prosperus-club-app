// OnboardingWizard.tsx
// Multi-step onboarding modal for first-time users
// 4 steps: Welcome → Profile Info → Social & Tags → Ready!

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ProfileData, ProfileUpdateData, profileService } from '../../services/profileService';
import { supabase } from '../../lib/supabase';
import { useSupportDocs } from '../support/SupportDocsSheet';

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
    'E-commerce & Digital', 'Energia & Sustentabilidade', 'Food & Beverage',
    'Outros'
];

const MAX_INTERESTS = 5;

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
    currentUser,
    onComplete,
    onProfileUpdate
}) => {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { openDoc } = useSupportDocs();
    const [triedNext, setTriedNext] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [customInterest, setCustomInterest] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Touch swipe state
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const touchEndX = useRef(0);
    const isSwiping = useRef(false);

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

    const totalSteps = 7;

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSocialChange = (field: string, value: string) => {
        // Strip @ if user types it
        const clean = value.replace(/^@/, '').trim();

        // Auto-build full URL from username
        let fullUrl = clean;
        if (clean && field === 'linkedin') {
            fullUrl = `https://linkedin.com/in/${clean}`;
        } else if (clean && field === 'instagram') {
            fullUrl = `https://instagram.com/${clean}`;
        }

        setFormData(prev => ({
            ...prev,
            socials: { ...prev.socials, [field]: field === 'website' ? value : fullUrl }
        }));
        if (triedNext) setErrors({});
    };

    // Extract username from stored URL for display
    const getUsernameFromUrl = (url: string, platform: string): string => {
        if (!url) return '';
        if (platform === 'linkedin') return url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');
        if (platform === 'instagram') return url.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '');
        return url;
    };

    // Per-step validation
    const validateStep = (s: number): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (s === 1) {
            // Photo step — optional (keeps default logo if not uploaded)
        } else if (s === 2) {
            // Profile info — only name and company are required
            if (!formData.name?.trim()) errs.name = 'Nome é obrigatório';
            if (!formData.company?.trim()) errs.company = 'Empresa é obrigatória';
        } else if (s === 3) {
            // Social & tags — all optional
        } else if (s === 4) {
            // Strategic profile
            if (!formData.what_i_sell?.trim()) errs.what_i_sell = 'Campo obrigatório';
            if (!(formData.partnership_interests && formData.partnership_interests.length >= 1)) errs.partnership_interests = 'Selecione pelo menos 1 setor';
            if (formData.partnership_interests && formData.partnership_interests.length > MAX_INTERESTS) errs.partnership_interests = `Máximo ${MAX_INTERESTS} setores`;
            if (formData.partnership_interests?.includes('Outros') && !customInterest.trim()) errs.custom_interest = 'Descreva qual área';
        }
        return errs;
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
                const next = interests.filter(s => s !== sector);
                // Clear custom interest if deselecting Outros
                if (sector === 'Outros') setCustomInterest('');
                return { ...prev, partnership_interests: next };
            } else {
                if (interests.length >= MAX_INTERESTS) return prev; // Block above max
                return { ...prev, partnership_interests: [...interests, sector] };
            }
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Import normalization utilities
        const { normalizeImage, validateImageFile } = await import('../../utils/imageUpload');

        // Validate before processing
        const validationError = validateImageFile(file);
        if (validationError) {
            setErrors(prev => ({ ...prev, photo: validationError }));
            e.target.value = ''; // Allow re-selection
            return;
        }

        setUploadingPhoto(true);
        setErrors(prev => { const n = { ...prev }; delete n.photo; return n; });

        try {
            // Normalize to JPEG via Canvas (resolves HEIC, Google Fotos, AVIF, WebP)
            const normalizedBlob = await normalizeImage(file);

            const fileName = `${currentUser.id}/avatar_${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, normalizedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true,
                    cacheControl: '3600',
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
            setFormData(prev => ({ ...prev, image_url: timestampedUrl }));

            // Persist immediately to DB so it's not lost if user closes the wizard
            await profileService.updateProfileImage(currentUser.id, timestampedUrl);
        } catch (error) {
            console.error('Error uploading photo:', error);
            setErrors(prev => ({ ...prev, photo: 'Não foi possível salvar a foto. Tente novamente.' }));
        } finally {
            setUploadingPhoto(false);
            e.target.value = ''; // Allow re-selection of same file
        }
    };

    const handleNext = useCallback(() => {
        // Validate current step before advancing
        const stepErrors = validateStep(step);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            setTriedNext(true);
            return;
        }
        setErrors({});
        setTriedNext(false);

        if (step < totalSteps - 1) {
            setSlideDirection('left');
            setTimeout(() => {
                setStep(s => s + 1);
                setSlideDirection(null);
            }, 150);
        }
    }, [step, formData, customInterest]);

    const handleBack = useCallback(() => {
        if (step > 0) {
            setSlideDirection('right');
            setTimeout(() => {
                setStep(s => s - 1);
                setSlideDirection(null);
            }, 150);
        }
    }, [step]);

    // --- Touch Swipe Handlers ---
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Don't capture swipe if user is interacting with input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            isSwiping.current = false;
            return;
        }
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchEndX.current = e.touches[0].clientX;
        isSwiping.current = true;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isSwiping.current) return;
        touchEndX.current = e.touches[0].clientX;
        // If vertical scroll is dominant, cancel swipe
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
        const deltaX = Math.abs(touchEndX.current - touchStartX.current);
        if (deltaY > deltaX) {
            isSwiping.current = false;
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!isSwiping.current) return;
        const SWIPE_THRESHOLD = 50;
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) {
                // Swipe left → next step
                handleNext();
            } else {
                // Swipe right → previous step
                handleBack();
            }
        }
        isSwiping.current = false;
    }, [handleNext, handleBack]);

    const handleComplete = async () => {
        setSaving(true);
        try {
            // Save profile updates
            const updated = await profileService.updateProfile(currentUser.id, formData);

            // Save terms acceptance timestamps and custom interest
            await profileService.acceptTerms(currentUser.id, customInterest.trim() || null);

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

    // handleSkip removed — all fields are now required

    // Step components
    const renderStep = () => {
        switch (step) {
            case 0: return renderWelcome();
            case 1: return renderPhotoStep();
            case 2: return renderProfileInfo();
            case 3: return renderSocialTags();
            case 4: return renderStrategicProfile();
            case 5: return renderTermsAcceptance();
            case 6: return renderReady();
            default: return null;
        }
    };

    // Step 0: Welcome
    const renderWelcome = () => (
        <div className="text-center py-6">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-900/30">
                <Sparkles className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
                Você chegou ao lugar certo.
            </h2>
            <p className="text-slate-300 text-lg mb-6 max-w-md mx-auto">
                Configure seu perfil em <strong className="text-yellow-500">menos de 3 minutos</strong> e comece a gerar negócios com os sócios do clube.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-8">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <Camera className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400">Sua Foto</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <User className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400">Seu Perfil</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <Rocket className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400">Explorar</p>
                </div>
            </div>
        </div>
    );

    // Step 1: Photo (dedicated)
    const renderPhotoStep = () => (
        <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-white mb-2">
                Sua foto é sua presença.
            </h2>
            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                Sócios com foto recebem <strong className="text-yellow-500">3× mais conexões</strong> estratégicas.
            </p>

            {/* Photo Upload */}
            <div className="flex justify-center mb-4">
                <div className="relative">
                    <div
                        className="w-32 h-32 rounded-full border-4 border-yellow-600/50 overflow-hidden bg-slate-800 cursor-pointer hover:border-yellow-500 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <img src={formData.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt="Avatar" className="w-full h-full object-cover" />
                        {uploadingPhoto && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-500 text-white p-2.5 rounded-full shadow-lg transition-colors"
                    >
                        <Camera size={16} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Status / Error */}
            {errors.photo && (
                <div className="flex items-center justify-center gap-1.5 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <p className="text-xs text-red-400">
                            📷 {errors.photo}
                        </p>
                    </div>
                </div>
            )}

            {/* Upload label */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ color: '#FFDA71' }}
            >
                {uploadingPhoto ? 'Processando...' : formData.image_url && !formData.image_url.includes('default-avatar') ? 'Trocar foto' : 'Adicionar foto'}
            </button>

            {/* Format hint */}
            {(!formData.image_url || formData.image_url.includes('default-avatar')) && (
                <p className="text-[10px] mt-3" style={{ color: '#95A4B4', opacity: 0.5 }}>
                    JPG, PNG, HEIC · máx. 15MB · Google Fotos ✓
                </p>
            )}
        </div>
    );

    // Step 2: Profile Info (data only — photo moved to step 1)
    const renderProfileInfo = () => (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Seus dados básicos</h2>
                <p className="text-slate-400 text-sm">Essas informações ajudam outros sócios a te encontrar</p>
            </div>

            {/* Form Fields */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    <User size={14} className="inline mr-1.5 -mt-0.5" />
                    Nome Completo <span className="text-yellow-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => { handleInputChange('name', e.target.value); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-yellow-600'}`}
                    placeholder="Seu nome completo"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        <Building2 size={14} className="inline mr-1.5 -mt-0.5" />
                        Empresa <span className="text-yellow-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.company || ''}
                        onChange={(e) => { handleInputChange('company', e.target.value); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.company; return n; }); }}
                        className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${errors.company ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-yellow-600'}`}
                        placeholder="Sua empresa"
                    />
                    {errors.company && <p className="text-xs text-red-400 mt-1">{errors.company}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        <Briefcase size={14} className="inline mr-1.5 -mt-0.5" />
                        Cargo
                    </label>
                    <input
                        type="text"
                        value={formData.job_title || ''}
                        onChange={(e) => { handleInputChange('job_title', e.target.value); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.job_title; return n; }); }}
                        className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${errors.job_title ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-yellow-600'}`}
                        placeholder="Seu cargo"
                    />
                    {errors.job_title && <p className="text-xs text-red-400 mt-1">{errors.job_title}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Sobre Você
                </label>
                <textarea
                    value={formData.bio || ''}
                    onChange={(e) => { handleInputChange('bio', e.target.value); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.bio; return n; }); }}
                    rows={3}
                    maxLength={300}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition resize-none ${errors.bio ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-yellow-600'}`}
                    placeholder="Conte com clareza o que você faz — isso gera matches melhores"
                />
                <div className="flex justify-between mt-1">
                    {errors.bio ? <p className="text-xs text-red-400">{errors.bio}</p> : <span />}
                    <p className="text-xs text-slate-500">{(formData.bio || '').length}/300</p>
                </div>
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

            {/* Social Links — username only */}
            <div className="space-y-3">
                <div>
                    <div className="relative">
                        <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                        <input
                            type="text"
                            value={getUsernameFromUrl(formData.socials?.linkedin || '', 'linkedin')}
                            onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                            className={`w-full bg-slate-800 border rounded-xl pl-16 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${errors.linkedin ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'}`}
                            placeholder="seuperfil"
                        />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 ml-1">linkedin.com/in/<span className="text-blue-400">{getUsernameFromUrl(formData.socials?.linkedin || '', 'linkedin') || '...'}</span></p>
                    {errors.linkedin && <p className="text-xs text-red-400 mt-0.5 ml-1">{errors.linkedin}</p>}
                </div>
                <div>
                    <div className="relative">
                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                        <input
                            type="text"
                            value={getUsernameFromUrl(formData.socials?.instagram || '', 'instagram')}
                            onChange={(e) => handleSocialChange('instagram', e.target.value)}
                            className={`w-full bg-slate-800 border rounded-xl pl-16 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${errors.instagram ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-pink-500'}`}
                            placeholder="seuperfil"
                        />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 ml-1">instagram.com/<span className="text-pink-400">{getUsernameFromUrl(formData.socials?.instagram || '', 'instagram') || '...'}</span></p>
                    {errors.instagram && <p className="text-xs text-red-400 mt-0.5 ml-1">{errors.instagram}</p>}
                </div>
                <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                    <input
                        type="url"
                        value={formData.socials?.website || ''}
                        onChange={(e) => handleSocialChange('website', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        placeholder="https://seusite.com.br (opcional)"
                    />
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    <Tag size={14} className="inline mr-1.5 -mt-0.5" />
                    Áreas de Interesse <span className="text-slate-500">(opcional)</span>
                </label>
                <div className={`flex flex-wrap gap-2 ${errors.tags ? 'ring-1 ring-red-500/50 rounded-xl p-2 -m-2' : ''}`}>
                    {AVAILABLE_TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => { handleTagToggle(tag); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.tags; return n; }); }}
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
                {errors.tags && <p className="text-xs text-red-400 mt-2">{errors.tags}</p>}
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
                    Tem algum serviço, recurso ou produto que você está buscando agora? <span className="text-yellow-500">*</span>
                </label>
                <textarea
                    value={formData.what_i_sell || ''}
                    onChange={(e) => { handleInputChange('what_i_sell', e.target.value); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.what_i_sell; return n; }); }}
                    rows={2}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition resize-none ${errors.what_i_sell ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-yellow-500'}`}
                    placeholder="Descreva com clareza — ‘Consultoria em gestão’ > ‘Negócios’"
                />
                {errors.what_i_sell && <p className="text-xs text-red-400 mt-1">{errors.what_i_sell}</p>}
            </div>

            {/* What I Need */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Search size={14} className="inline mr-1.5 -mt-0.5 text-blue-400" />
                    O que consome com frequência? <span className="text-slate-500">(opcional)</span>
                </label>
                <textarea
                    value={formData.what_i_need || ''}
                    onChange={(e) => { handleInputChange('what_i_need', e.target.value); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.what_i_need; return n; }); }}
                    rows={2}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition resize-none ${errors.what_i_need ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'}`}
                    placeholder="Quanto mais específico, mais certeiro o match"
                />
                {errors.what_i_need && <p className="text-xs text-red-400 mt-1">{errors.what_i_need}</p>}
            </div>

            {/* Partnership Interests */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-300">
                        <Users size={14} className="inline mr-1.5 -mt-0.5 text-emerald-400" />
                        Setores de interesse <span className="text-yellow-500">*</span>
                    </label>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                            background: (formData.partnership_interests?.length || 0) >= 1
                                ? 'rgba(255,218,113,0.15)' : 'rgba(239,68,68,0.15)',
                            color: (formData.partnership_interests?.length || 0) >= 1
                                ? '#FFDA71' : '#f87171',
                            border: `1px solid ${(formData.partnership_interests?.length || 0) >= 1 ? 'rgba(255,218,113,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                    >
                        {formData.partnership_interests?.length || 0}/{MAX_INTERESTS}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                    Escolha de 1 a {MAX_INTERESTS} áreas
                    {(formData.partnership_interests?.length || 0) >= MAX_INTERESTS && (
                        <span className="ml-1 text-yellow-600">· limite atingido</span>
                    )}
                </p>
                <div className={`flex flex-wrap gap-2 ${errors.partnership_interests ? 'ring-1 ring-red-500/50 rounded-xl p-2 -m-2' : ''}`}>
                    {PARTNERSHIP_SECTORS.map(sector => {
                        const isSelected = (formData.partnership_interests || []).includes(sector);
                        const atMax = (formData.partnership_interests?.length || 0) >= MAX_INTERESTS;
                        const isDisabled = !isSelected && atMax;
                        return (
                            <button
                                key={sector}
                                onClick={() => { handlePartnershipToggle(sector); if (triedNext) setErrors(prev => { const n = { ...prev }; delete n.partnership_interests; return n; }); }}
                                disabled={isDisabled}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isSelected
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 scale-105'
                                    : isDisabled
                                        ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                    }`}
                            >
                                {isSelected && <Check size={12} className="inline mr-1" />}
                                {sector === 'Outros' && isSelected ? '✦ Outros' : sector}
                            </button>
                        );
                    })}
                </div>
                {errors.partnership_interests && <p className="text-xs text-red-400 mt-2">{errors.partnership_interests}</p>}

                {/* Campo "Outros" — aparece ao selecionar */}
                {(formData.partnership_interests || []).includes('Outros') && (
                    <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid #FFDA71', background: '#031726' }}>
                        <div className="flex items-center px-4 py-1" style={{ borderBottom: '1px solid #052B48' }}>
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FFDA71', opacity: 0.7 }}>Qual área?</span>
                        </div>
                        <input
                            type="text"
                            value={customInterest}
                            onChange={e => { setCustomInterest(e.target.value); if (triedNext && errors.custom_interest) setErrors(prev => { const n = { ...prev }; delete n.custom_interest; return n; }); }}
                            placeholder="Ex: Construção civil, Moda, Saúde mental..."
                            maxLength={60}
                            className="w-full px-4 py-3 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                        />
                        {customInterest && (
                            <div className="px-4 pb-2 flex justify-end">
                                <span className="text-[10px] text-slate-600">{customInterest.length}/60</span>
                            </div>
                        )}
                        {errors.custom_interest && <p className="text-xs text-red-400 px-4 pb-2">{errors.custom_interest}</p>}
                    </div>
                )}
            </div>
        </div>
    );

    // Step 5: Terms Acceptance
    const renderTermsAcceptance = () => (
        <div className="flex flex-col h-full justify-between py-4">
            <div>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Quase lá!</h2>
                    <p className="text-slate-400 text-sm">Confirme que você leu e concorda com as regras.</p>
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 cursor-pointer mb-3">
                    <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 accent-yellow-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-slate-300 leading-relaxed">
                        Li e aceito os{' '}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); openDoc('terms'); }}
                            className="text-yellow-500 underline underline-offset-2 hover:text-yellow-400"
                        >
                            Termos de Uso
                        </button>
                    </span>
                </label>

                {/* Privacy checkbox */}
                <label className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={acceptedPrivacy}
                        onChange={e => setAcceptedPrivacy(e.target.checked)}
                        className="mt-0.5 accent-yellow-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-slate-300 leading-relaxed">
                        Li e aceito a{' '}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); openDoc('privacy'); }}
                            className="text-yellow-500 underline underline-offset-2 hover:text-yellow-400"
                        >
                            Política de Privacidade
                        </button>
                    </span>
                </label>
            </div>
        </div>
    );

    // Step 6: Ready!
    const renderReady = () => {
        const completion = profileService.getProfileCompletionPercentage({
            ...currentUser,
            ...formData,
            image_url: formData.image_url || currentUser.image_url
        } as ProfileData);

        return (
            <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-yellow-600 shadow-lg shadow-yellow-900/30">
                    <img src={formData.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt="Avatar" className="w-full h-full object-cover" />
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
                        Explorar o Member's Book e conectar-se
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
                {/* Skip button removed — all fields are required */}

                {/* Progress Bar */}
                <div className="h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                        style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Step Indicator + Counter */}
                <div className="flex items-center justify-center gap-2 pt-6 pb-1">
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
                <p className="text-center text-[10px] font-medium pb-2" style={{ color: '#CA9A43' }}>
                    {step + 1} de {totalSteps}
                </p>

                {/* Content — swipeable area */}
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto px-8 py-4 touch-pan-y"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        transition: slideDirection ? 'transform 0.15s ease-out, opacity 0.15s ease-out' : 'none',
                        transform: slideDirection === 'left' ? 'translateX(-30px)'
                            : slideDirection === 'right' ? 'translateX(30px)'
                                : 'translateX(0)',
                        opacity: slideDirection ? 0.3 : 1,
                    }}
                >
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
                            disabled={step === 5 && (!acceptedTerms || !acceptedPrivacy)}
                            className={`flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-yellow-900/20 transition${step === 5 && (!acceptedTerms || !acceptedPrivacy) ? ' opacity-30 cursor-not-allowed' : ''}`}
                        >
                            {step === 5 ? 'Entrar no clube' : 'Continuar'}
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={saving || uploadingPhoto}
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
