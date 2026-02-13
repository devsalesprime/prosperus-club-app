// ProfilePreview.tsx
// Component for previewing public profile

import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Building2,
    Linkedin,
    Instagram,
    Globe,
    MessageCircle,
    Mail,
    Eye,
    Gift,
    Ticket,
    Copy,
    Check,
    ExternalLink,
    Video,
    PlayCircle,
    UploadCloud,
    Loader2,
    Search,
    Users
} from 'lucide-react';
import { ProfileData } from '../services/profileService';
import { conversationService } from '../services/conversationService';
import { analyticsService } from '../services/analyticsService';
import { BenefitStatsCard } from './BenefitStatsCard';
import { ModalWrapper, ModalBody } from './ui/ModalWrapper';
import { ModalHeader } from './ModalHeader';
import { Avatar } from './ui/Avatar';

/**
 * Convert video URLs to embeddable format
 * Supports: YouTube, Vimeo, Google Drive, Loom
 */
const getVideoEmbedUrl = (url: string): { embedUrl: string | null; platform: string | null } => {
    if (!url) return { embedUrl: null, platform: null };

    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();

        // YouTube
        if (hostname.includes('youtube.com')) {
            const videoId = parsedUrl.searchParams.get('v');
            if (videoId) {
                return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'YouTube' };
            }
        }
        if (hostname.includes('youtu.be')) {
            const videoId = parsedUrl.pathname.slice(1);
            if (videoId) {
                return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'YouTube' };
            }
        }

        // Vimeo
        if (hostname.includes('vimeo.com')) {
            const videoId = parsedUrl.pathname.split('/').pop();
            if (videoId && /^\d+$/.test(videoId)) {
                return { embedUrl: `https://player.vimeo.com/video/${videoId}`, platform: 'Vimeo' };
            }
        }

        // Google Drive
        if (hostname.includes('drive.google.com')) {
            // Handle /file/d/FILE_ID/view format
            const match = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
            if (match && match[1]) {
                return { embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`, platform: 'Google Drive' };
            }
        }

        // Loom
        if (hostname.includes('loom.com')) {
            // Handle /share/VIDEO_ID format
            const match = parsedUrl.pathname.match(/\/share\/([^/?]+)/);
            if (match && match[1]) {
                return { embedUrl: `https://www.loom.com/embed/${match[1]}`, platform: 'Loom' };
            }
        }

        // Fallback - can't embed
        return { embedUrl: null, platform: null };
    } catch {
        return { embedUrl: null, platform: null };
    }
};

interface ProfilePreviewProps {
    profile: ProfileData;
    onClose: () => void;
    currentUserId?: string; // ID do usuário logado
    onStartChat?: (conversationId: string) => void; // Callback para navegar ao chat
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({ profile, onClose, currentUserId, onStartChat }) => {
    const isOwnProfile = currentUserId === profile.id;
    const [copied, setCopied] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    // ========================================
    // BENEFIT ANALYTICS TRACKING
    // ========================================

    // Track benefit view when modal opens (with 2s debounce)
    useEffect(() => {
        if (!profile.exclusive_benefit?.active || !currentUserId) return;

        // Debounce de 2 segundos para evitar views acidentais
        const timer = setTimeout(() => {
            analyticsService.trackBenefitView(profile.id, currentUserId);
        }, 2000);

        return () => clearTimeout(timer);
    }, [profile.id, profile.exclusive_benefit?.active, currentUserId]);

    // Handle benefit click tracking
    const handleBenefitClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Track click (fire-and-forget)
        if (currentUserId) {
            analyticsService.trackBenefitClick(profile.id, currentUserId);
        }

        // Link opens normally (não prevenir default)
    };

    // ========================================
    // OTHER HANDLERS
    // ========================================

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle starting a chat with this member
    const handleStartChat = async () => {
        if (!currentUserId || isOwnProfile || isStartingChat) return;

        setIsStartingChat(true);
        setChatError(null);

        try {
            // Get or create conversation between current user and profile owner
            const conversationId = await conversationService.getOrCreateConversation(
                currentUserId,
                profile.id
            );

            // Navigate to chat via callback
            if (onStartChat) {
                onStartChat(conversationId);
            }
            onClose();
        } catch (error) {
            console.error('Failed to start chat:', error);
            setChatError('Não foi possível iniciar a conversa. Tente novamente.');
        } finally {
            setIsStartingChat(false);
        }
    };

    // Check if benefit exists and is active
    const hasBenefit = profile.exclusive_benefit?.active &&
        profile.exclusive_benefit?.title &&
        profile.exclusive_benefit?.description;

    return (
        <ModalWrapper isOpen={true} onClose={onClose} maxWidth="2xl">
            {/* Header */}
            <ModalHeader
                title=""
                onClose={onClose}
            />

            <ModalBody noPadding>
                {/* Banner Hero */}
                <div className="relative h-32 w-full -mt-4 -mx-4 mb-0" style={{ width: 'calc(100% + 2rem)' }}>
                    <img
                        src={(profile as any).banner_url || `${import.meta.env.BASE_URL}fundo-prosperus-app.webp`}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
                </div>

                {/* Profile Content */}
                <div className="px-4 space-y-6 -mt-16 relative">
                    {/* ========================================= */}
                    {/* SECTION 1: HEADER - Foto, Nome, Cargo, Empresa, Redes */}
                    {/* ========================================= */}
                    <div className="text-center">
                        <Avatar
                            src={profile.image_url}
                            alt={profile.name}
                            size="2xl"
                            className="mx-auto mb-4 border-4 border-slate-900 shadow-lg shadow-yellow-900/20 ring-2 ring-yellow-600"
                        />
                        <h3 className="text-2xl font-bold text-white mb-1">{profile.name}</h3>

                        {profile.job_title && (
                            <div className="flex items-center justify-center gap-2 text-slate-300 mb-1">
                                <Briefcase size={16} />
                                <span>{profile.job_title}</span>
                            </div>
                        )}

                        {profile.company && (
                            <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                                <Building2 size={16} />
                                <span>{profile.company}</span>
                            </div>
                        )}

                        {/* Social Links - Inline in Header */}
                        {profile.socials && Object.values(profile.socials).some(v => v) && (
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                {profile.socials.linkedin && (
                                    <a
                                        href={profile.socials.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
                                    >
                                        <Linkedin size={16} />
                                        LinkedIn
                                    </a>
                                )}
                                {profile.socials.instagram && (
                                    <a
                                        href={profile.socials.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-pink-600 border border-slate-700 hover:border-pink-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
                                    >
                                        <Instagram size={16} />
                                        Instagram
                                    </a>
                                )}
                                {profile.socials.whatsapp && (
                                    <a
                                        href={`https://wa.me/${profile.socials.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-green-600 border border-slate-700 hover:border-green-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
                                    >
                                        <MessageCircle size={16} />
                                        WhatsApp
                                    </a>
                                )}
                                {profile.socials.website && (
                                    <a
                                        href={profile.socials.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-yellow-600 border border-slate-700 hover:border-yellow-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
                                    >
                                        <Globe size={16} />
                                        Website
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ========================================= */}
                    {/* SECTION 2: BIO */}
                    {/* ========================================= */}
                    {profile.bio && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Sobre</h4>
                            <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
                        </div>
                    )}

                    {/* ========================================= */}
                    {/* SECTION 3: TAGS/INTERESTS */}
                    {/* ========================================= */}
                    {profile.tags && profile.tags.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Interesses</h4>
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-yellow-600/20 border border-yellow-600/30 text-yellow-500 px-3 py-1 rounded-lg text-sm font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================= */}
                    {/* SECTION 3.5: STRATEGIC PROFILE (PRD v2.1) */}
                    {/* ========================================= */}
                    {(profile.what_i_sell || profile.what_i_need || (profile.partnership_interests && profile.partnership_interests.length > 0)) && (
                        <div className="space-y-4">
                            {profile.what_i_sell && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                        <Briefcase size={14} className="text-yellow-500" />
                                        O que ofereço
                                    </h4>
                                    <p className="text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm leading-relaxed">
                                        {profile.what_i_sell}
                                    </p>
                                </div>
                            )}
                            {profile.what_i_need && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                        <Search size={14} className="text-blue-400" />
                                        O que procuro
                                    </h4>
                                    <p className="text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm leading-relaxed">
                                        {profile.what_i_need}
                                    </p>
                                </div>
                            )}
                            {profile.partnership_interests && profile.partnership_interests.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                        <Users size={14} className="text-emerald-400" />
                                        Interesse em parcerias
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.partnership_interests.map((sector, index) => (
                                            <span
                                                key={index}
                                                className="inline-block bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 px-3 py-1 rounded-lg text-sm font-medium"
                                            >
                                                {sector}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================= */}
                    {/* VIDEO PITCH SECTION */}
                    {/* ========================================= */}
                    {profile.pitch_video_url ? (() => {
                        const { embedUrl, platform } = getVideoEmbedUrl(profile.pitch_video_url);
                        return (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <Video className="text-yellow-500" size={16} />
                                    Apresentação
                                    {platform && <span className="text-xs text-slate-500 font-normal">• {platform}</span>}
                                </h4>
                                {embedUrl ? (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg shadow-black/20 border border-slate-700">
                                        <iframe
                                            src={embedUrl}
                                            title={`Vídeo de apresentação de ${profile.name}`}
                                            className="absolute inset-0 w-full h-full"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                ) : (
                                    /* Fallback: Button to open video in new tab */
                                    <a
                                        href={profile.pitch_video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-600 text-white px-6 py-4 rounded-xl transition group"
                                    >
                                        <div className="p-3 rounded-full bg-yellow-600/20 group-hover:bg-yellow-600 transition">
                                            <PlayCircle className="text-yellow-500 group-hover:text-white" size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">Assistir Vídeo de Apresentação</p>
                                            <p className="text-xs text-slate-400">Abre em nova aba</p>
                                        </div>
                                        <ExternalLink size={16} className="text-slate-400" />
                                    </a>
                                )}
                            </div>
                        );
                    })() : isOwnProfile && (
                        /* Card de Instrução - apenas para o próprio usuário */
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <Video className="text-yellow-500" size={16} />
                                Vídeo de Apresentação
                            </h4>
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center bg-slate-900/50">
                                <div className="mb-4">
                                    <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                        <UploadCloud className="text-yellow-500" size={32} />
                                    </div>
                                    <h5 className="text-lg font-bold text-white mb-2">Destaque seu Perfil com um Vídeo</h5>
                                    <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                                        Grave um vídeo de até 3 minutos se apresentando. Suba no <strong className="text-slate-300">Google Drive</strong> (modo público) ou <strong className="text-slate-300">YouTube</strong> (não listado) e envie o link para nossa equipe de suporte.
                                    </p>
                                </div>
                                <a
                                    href="https://wa.me/5511999999999?text=Olá! Gostaria de enviar o link do meu vídeo de apresentação para o Prosperus Club."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-5 py-2.5 rounded-lg transition"
                                >
                                    <MessageCircle size={18} />
                                    Enviar Link para o Suporte
                                </a>
                            </div>
                        </div>
                    )}

                    {/* ========================================= */}
                    {/* EXCLUSIVE BENEFIT SECTION */}
                    {/* ========================================= */}
                    {hasBenefit && (
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <Gift className="text-yellow-500" size={16} />
                                Benefício Exclusivo para Sócios
                            </h4>
                            <div className="bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-600 rounded-xl p-5">
                                {/* Title */}
                                <h5 className="text-lg font-bold text-white mb-2">
                                    {profile.exclusive_benefit?.title}
                                </h5>

                                {/* Description */}
                                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                    {profile.exclusive_benefit?.description}
                                </p>

                                {/* Promo Code */}
                                {profile.exclusive_benefit?.code && (
                                    <div className="mb-4">
                                        <p className="text-xs text-slate-400 mb-2">Código Promocional:</p>
                                        <button
                                            onClick={() => copyToClipboard(profile.exclusive_benefit?.code || '')}
                                            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-mono font-bold px-4 py-2 rounded-lg transition group"
                                        >
                                            <Ticket size={16} className="text-yellow-500" />
                                            <span className="tracking-wider">{profile.exclusive_benefit?.code}</span>
                                            {copied ? (
                                                <Check size={16} className="text-green-500" />
                                            ) : (
                                                <Copy size={16} className="text-slate-400 group-hover:text-white" />
                                            )}
                                        </button>
                                        {copied && (
                                            <span className="ml-3 text-xs text-green-500">Copiado!</span>
                                        )}
                                    </div>
                                )}

                                {/* CTA Button */}
                                {profile.exclusive_benefit?.ctaUrl && (
                                    <a
                                        href={profile.exclusive_benefit.ctaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={handleBenefitClick}
                                        className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-5 py-2.5 rounded-lg transition"
                                    >
                                        {profile.exclusive_benefit?.ctaLabel || 'Resgatar Benefício'}
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================= */}
                    {/* BENEFIT STATS (OWNER ONLY) */}
                    {/* ========================================= */}
                    {hasBenefit && isOwnProfile && (
                        <div className="mb-6">
                            <BenefitStatsCard ownerId={profile.id} />
                        </div>
                    )}

                    {/* Contact Button */}
                    {!isOwnProfile && (
                        <div className="pt-6 border-t border-slate-800">
                            <button
                                onClick={handleStartChat}
                                disabled={isStartingChat || !currentUserId}
                                className={`w-full font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 ${isStartingChat
                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    }`}
                            >
                                {isStartingChat ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Iniciando conversa...
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle size={18} />
                                        Enviar Mensagem
                                    </>
                                )}
                            </button>
                            {chatError && (
                                <p className="text-red-400 text-xs text-center mt-2">{chatError}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 text-center">
                    <p className="text-xs text-slate-400">
                        Perfil público visível para outros membros
                    </p>
                </div>
            </ModalBody>
        </ModalWrapper>
    );
};
