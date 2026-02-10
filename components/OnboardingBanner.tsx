// OnboardingBanner.tsx
// Banner to encourage profile completion

import React from 'react';
import { AlertCircle, User, ArrowRight } from 'lucide-react';
import { ProfileData, profileService } from '../services/profileService';

interface OnboardingBannerProps {
    currentUser: ProfileData;
    onEditProfile: () => void;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({ currentUser, onEditProfile }) => {
    const isComplete = profileService.isProfileComplete(currentUser);
    const completionPercentage = profileService.getProfileCompletionPercentage(currentUser);

    // Don't show if profile is complete or onboarding was already completed
    if (isComplete || currentUser.has_completed_onboarding) {
        return null;
    }

    const getMissingFields = (): string[] => {
        const missing: string[] = [];

        if (!currentUser.bio) missing.push('Sobre Você');
        if (!currentUser.company) missing.push('Empresa');
        if (!currentUser.job_title) missing.push('Cargo');
        if (!currentUser.tags || currentUser.tags.length === 0) missing.push('Tags de Interesse');
        if (!currentUser.image_url) missing.push('Foto de Perfil');

        return missing;
    };

    const missingFields = getMissingFields();

    return (
        <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-600/10 border border-yellow-600/30 rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-600/20 rounded-lg shrink-0">
                    <User className="text-yellow-500" size={24} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                            Complete seu Perfil
                        </h3>
                        <span className="bg-yellow-600/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded-full">
                            {completionPercentage}%
                        </span>
                    </div>

                    <p className="text-sm text-slate-300 mb-3">
                        Seu perfil está incompleto. Complete as informações para aparecer no <strong>Member Book</strong> e se conectar com outros membros.
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Missing Fields */}
                    {missingFields.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                                Campos Pendentes:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {missingFields.map((field, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 bg-slate-800/50 text-slate-300 px-2 py-1 rounded text-xs"
                                    >
                                        <AlertCircle size={12} className="text-yellow-500" />
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={onEditProfile}
                        className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-2 rounded-lg transition shadow-lg shadow-yellow-900/20"
                    >
                        Completar Perfil
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
