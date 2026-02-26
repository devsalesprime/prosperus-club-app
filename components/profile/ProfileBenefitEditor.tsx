// components/profile/ProfileBenefitEditor.tsx
// Extracted from ProfileEdit.tsx L805-989 — Exclusive Benefit toggle + form + stats

import React from 'react';
import {
    Gift,
    Link2,
    Sparkles,
    Ticket,
    X,
} from 'lucide-react';
import { ExclusiveBenefit } from '../../services/profileService';
import { BenefitStatsCard } from '../BenefitStatsCard';

interface ProfileBenefitEditorProps {
    benefit: ExclusiveBenefit;
    ownerId: string;
    onBenefitChange: (benefit: ExclusiveBenefit) => void;
}

export const ProfileBenefitEditor: React.FC<ProfileBenefitEditorProps> = ({
    benefit,
    ownerId,
    onBenefitChange,
}) => {
    const updateField = (field: keyof ExclusiveBenefit, value: string | boolean) => {
        onBenefitChange({
            ...benefit,
            [field]: value,
        });
    };

    return (
        <>
            <div className="border border-yellow-600/30 rounded-xl p-6 bg-gradient-to-br from-yellow-900/10 to-transparent">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-yellow-600/20 rounded-lg shrink-0">
                            <Gift className="text-yellow-500" size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white">Oferta para o Clube</h3>
                            <p className="text-xs text-slate-400 truncate">Ofereça algo exclusivo para os membros</p>
                        </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                        type="button"
                        onClick={() => updateField('active', !benefit?.active)}
                        className={`relative shrink-0 w-14 h-8 !min-h-0 !min-w-0 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${benefit?.active
                            ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                            : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                        aria-label={benefit?.active ? 'Desativar oferta' : 'Ativar oferta'}
                        role="switch"
                        aria-checked={benefit?.active}
                    >
                        {/* Slider Knob */}
                        <span
                            className={`absolute top-[4px] left-[4px] w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${benefit?.active
                                ? 'translate-x-6 shadow-lg'
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
                <div className={`space-y-4 transition-opacity duration-200 ${benefit?.active ? 'opacity-100' : 'opacity-50 pointer-events-none'
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
                                value={benefit?.title || ''}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Ex: 15% de desconto em Consultoria"
                                maxLength={100}
                                disabled={!benefit?.active}
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
                                value={benefit?.description || ''}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="Descreva as condições e como o membro pode aproveitar..."
                                maxLength={200}
                                rows={3}
                                disabled={!benefit?.active}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition resize-none disabled:bg-slate-900 disabled:cursor-not-allowed"
                            />
                            <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                                {benefit?.description?.length || 0}/200
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
                                    value={benefit?.ctaUrl || ''}
                                    onChange={(e) => updateField('ctaUrl', e.target.value)}
                                    placeholder="https://seusite.com/oferta"
                                    disabled={!benefit?.active}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition disabled:bg-slate-900 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Texto do Botão</label>
                            <input
                                type="text"
                                value={benefit?.ctaLabel || ''}
                                onChange={(e) => updateField('ctaLabel', e.target.value)}
                                placeholder="Ex: Acessar Site, Chamar no Zap"
                                maxLength={30}
                                disabled={!benefit?.active}
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
                                value={benefit?.code || ''}
                                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                                placeholder="PROSPERUS15"
                                maxLength={20}
                                disabled={!benefit?.active}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm uppercase tracking-wider focus:outline-none focus:border-yellow-600 transition disabled:bg-slate-900 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* BENEFIT ANALYTICS - Performance Stats */}
            {benefit?.active && (
                <div className="mt-6">
                    <BenefitStatsCard ownerId={ownerId} />
                </div>
            )}
        </>
    );
};
