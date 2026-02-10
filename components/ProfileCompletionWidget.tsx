// ProfileCompletionWidget.tsx
// Smart profile completion alert that only shows when profile is actually incomplete
// Uses centralized profile data from AuthContext

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { calculateProfileCompletion, getMissingFieldsText } from '../utils/profileUtils';

interface ProfileCompletionWidgetProps {
    onEditProfile: () => void;
}

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({ onEditProfile }) => {
    const { userProfile } = useAuth();
    const { percentage, missingFields } = calculateProfileCompletion(userProfile);

    // Don't render if profile is complete
    if (percentage === 100) {
        return null;
    }

    // Don't render if no profile data
    if (!userProfile) {
        return null;
    }

    const missingFieldsText = getMissingFieldsText(missingFields);

    return (
        <div className="bg-prosperus-navy-light border border-prosperus-gold-dark/30 rounded-xl p-4 md:p-6 mb-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-prosperus-gold" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-prosperus-white mb-2">
                        Seu perfil está {percentage}% completo
                    </h3>

                    {/* Progress Bar */}
                    <div className="w-full bg-prosperus-navy h-3 rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full bg-gradient-to-r from-prosperus-gold to-prosperus-gold-light transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Missing Fields */}
                    {missingFields.length > 0 && (
                        <p className="text-sm text-prosperus-grey mb-4">
                            Falta preencher: <span className="text-prosperus-white font-medium">{missingFieldsText}</span>
                        </p>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={onEditProfile}
                        className="px-4 py-2 bg-prosperus-gold hover:bg-prosperus-gold-light text-prosperus-navy font-semibold rounded-lg transition-colors"
                    >
                        Completar Agora
                    </button>
                </div>
            </div>
        </div>
    );
};

// Success state widget (optional - shows when profile is complete)
export const ProfileCompleteWidget: React.FC = () => {
    const { userProfile } = useAuth();
    const { percentage } = calculateProfileCompletion(userProfile);

    // Only show if profile is 100% complete
    if (percentage !== 100) {
        return null;
    }

    return (
        <div className="bg-prosperus-navy-light border border-prosperus-gold/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-prosperus-gold" />
                <p className="text-sm text-prosperus-white">
                    <span className="font-semibold">Perfil completo!</span> Você está aproveitando ao máximo o clube.
                </p>
            </div>
        </div>
    );
};
