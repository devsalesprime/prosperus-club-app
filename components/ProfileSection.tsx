/**
 * ProfileSection — Self-contained profile view extracted from App.tsx
 * Displays user profile card, social links, settings, and action buttons.
 */
import React from 'react';
import {
    X, Settings, Eye, LogOut,
    Linkedin, Instagram, Phone, Globe
} from 'lucide-react';
import { Member, ViewState } from '../types';
import { BenefitStatsCard } from './BenefitStatsCard';

interface ProfileSectionProps {
    currentUser: Member;
    setView: (view: ViewState) => void;
    setIsEditingProfile: (editing: boolean) => void;
    setShowPreviewProfile: (show: boolean) => void;
    onLogout: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
    currentUser,
    setView,
    setIsEditingProfile,
    setShowPreviewProfile,
    onLogout
}) => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in relative">
            {/* Close Button */}
            <button
                onClick={() => setView(ViewState.DASHBOARD)}
                className="absolute top-0 right-0 z-10 p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                title="Fechar"
            >
                <X size={24} />
            </button>

            {/* Profile Header Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-500 p-1">
                            <img
                                src={currentUser.image || '/default-avatar.svg'}
                                alt={currentUser.name}
                                className="w-full h-full rounded-full object-cover bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
                        <p className="text-yellow-500 font-medium">
                            {currentUser.jobTitle || currentUser.role}
                            {currentUser.company && <span className="text-slate-400"> @ {currentUser.company}</span>}
                        </p>
                        {currentUser.description && (
                            <p className="text-slate-400 text-sm mt-3 max-w-md">{currentUser.description}</p>
                        )}

                        {/* Tags */}
                        {currentUser.tags && currentUser.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                                {currentUser.tags.slice(0, 5).map((tag, index) => (
                                    <span
                                        key={index}
                                        className="bg-yellow-600/10 text-yellow-500 text-xs px-3 py-1 rounded-full border border-yellow-600/30"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {currentUser.tags.length > 5 && (
                                    <span className="text-slate-500 text-xs px-2 py-1">
                                        +{currentUser.tags.length - 5}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-800">
                    <button
                        onClick={() => setIsEditingProfile(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition shadow-lg shadow-yellow-900/20"
                    >
                        <Settings size={18} />
                        Editar Perfil
                    </button>
                    <button
                        onClick={() => setShowPreviewProfile(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition"
                    >
                        <Eye size={18} />
                        Ver como Público
                    </button>
                </div>
            </div>

            {/* Social Links */}
            {currentUser.socials && Object.values(currentUser.socials).some(v => v) && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Redes Sociais</h3>
                    <div className="flex flex-wrap gap-3">
                        {currentUser.socials.linkedin && (
                            <a href={currentUser.socials.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition border border-slate-700 hover:border-blue-600">
                                <Linkedin size={18} /> LinkedIn
                            </a>
                        )}
                        {currentUser.socials.instagram && (
                            <a href={currentUser.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition border border-slate-700 hover:border-pink-600">
                                <Instagram size={18} /> Instagram
                            </a>
                        )}
                        {currentUser.socials.whatsapp && (
                            <a href={`https://wa.me/${currentUser.socials.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-green-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition border border-slate-700 hover:border-green-600">
                                <Phone size={18} /> WhatsApp
                            </a>
                        )}
                        {currentUser.socials.website && (
                            <a href={currentUser.socials.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-yellow-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition border border-slate-700 hover:border-yellow-600">
                                <Globe size={18} /> Website
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Settings & Logout */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Configurações</h3>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition">
                    <span className="text-slate-300">Notificações</span>
                    <div className="w-10 h-6 bg-yellow-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </button>

                <div className="border-t border-slate-700 my-4"></div>

                {/* Benefit Analytics - Performance Stats */}
                <BenefitStatsCard ownerId={currentUser.id} />
                <div className="border-t border-slate-700 my-4"></div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 transition font-medium"
                >
                    <LogOut size={20} />
                    <span>Sair da Conta</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileSection;
