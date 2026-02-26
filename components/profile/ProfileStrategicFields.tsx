// components/profile/ProfileStrategicFields.tsx
// Extracted from ProfileEdit.tsx L597-803 — what_i_sell, what_i_need, SectorSelector

import React from 'react';
import {
    Briefcase,
    Search,
    Users,
    X,
} from 'lucide-react';
import { ProfileUpdateData } from '../../services/profileService';

const SECTOR_OPTIONS = [
    'Tecnologia & Inovação', 'Saúde & Bem-estar',
    'Finanças & Investimentos', 'Consultoria & Gestão',
    'Jurídico & Compliance', 'Agronegócio',
    'Logística & Supply Chain', 'E-commerce & Digital',
    'Energia & Sustentabilidade', 'Food & Beverage',
    'Educação', 'Imóveis & Construção',
    'Marketing & Publicidade', 'Indústria & Manufatura',
    'Comércio & Varejo',
    'Outros'
];

interface ProfileStrategicFieldsProps {
    whatISell: string;
    whatINeed: string;
    partnershipInterests: string[];
    onChange: (field: keyof ProfileUpdateData, value: any) => void;
}

export const ProfileStrategicFields: React.FC<ProfileStrategicFieldsProps> = ({
    whatISell,
    whatINeed,
    partnershipInterests,
    onChange,
}) => {
    const interests = partnershipInterests || [];
    const hasOthers = interests.includes('Outros');
    const customTags = interests.filter((s: string) => !SECTOR_OPTIONS.includes(s));

    const toggleSector = (sector: string) => {
        if (interests.includes(sector)) {
            // Deselecting "Outros" also removes all custom tags
            if (sector === 'Outros') {
                onChange('partnership_interests',
                    interests.filter((s: string) => s !== 'Outros' && SECTOR_OPTIONS.includes(s)) as any
                );
            } else {
                onChange('partnership_interests',
                    interests.filter((s: string) => s !== sector) as any
                );
            }
        } else {
            onChange('partnership_interests',
                [...interests, sector] as any
            );
        }
    };

    const addCustomTag = (value: string) => {
        const val = value.trim();
        if (!val || interests.includes(val)) return;
        onChange('partnership_interests', [...interests, val] as any);
    };

    const removeCustomTag = (tag: string) => {
        const updated = interests.filter((s: string) => s !== tag);
        // If no custom tags remain, also deselect "Outros"
        const remainingCustom = updated.filter((s: string) => !SECTOR_OPTIONS.includes(s));
        if (remainingCustom.length === 0) {
            onChange('partnership_interests',
                updated.filter((s: string) => s !== 'Outros') as any
            );
        } else {
            onChange('partnership_interests', updated as any);
        }
    };

    return (
        <div className="border border-emerald-600/30 rounded-xl p-6 bg-gradient-to-br from-emerald-900/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                    <Users className="text-emerald-400" size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Perfil Estratégico</h3>
                    <p className="text-xs text-slate-400">Dados para conexões inteligentes entre sócios</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* What I Sell */}
                <div>
                    <label className="block text-xs text-slate-400 mb-2">
                        <Briefcase size={12} className="inline mr-1 text-yellow-500" />
                        O que você vende/faz?
                    </label>
                    <textarea
                        value={whatISell || ''}
                        onChange={(e) => onChange('what_i_sell', e.target.value)}
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-600 transition resize-none"
                        placeholder="Ex: Consultoria em gestão, software de CRM, serviços jurídicos..."
                    />
                </div>

                {/* What I Need */}
                <div>
                    <label className="block text-xs text-slate-400 mb-2">
                        <Search size={12} className="inline mr-1 text-blue-400" />
                        O que você precisa/compraria agora?
                    </label>
                    <textarea
                        value={whatINeed || ''}
                        onChange={(e) => onChange('what_i_need', e.target.value)}
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                        placeholder="Ex: Automação de marketing, parceiro logístico, assessoria contábil..."
                    />
                </div>

                {/* Partnership Interests — SectorSelector */}
                <div className="space-y-3">
                    {/* Label */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <Users size={12} className="inline mr-1.5 text-yellow-500" />
                            Setor de Interesse
                        </label>
                        <p className="text-xs text-slate-600 mt-0.5">
                            Selecione os setores para parcerias
                        </p>
                    </div>

                    {/* Tag grid — flex-wrap with stretch override */}
                    <div className="w-full">
                        <div className="flex flex-wrap gap-2 items-start content-start">
                            {SECTOR_OPTIONS.map(sector => {
                                const isSelected = interests.includes(sector);
                                return (
                                    <button
                                        key={sector}
                                        type="button"
                                        onClick={() => toggleSector(sector)}
                                        className={`whitespace-nowrap flex-shrink-0 self-start w-auto px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 ${isSelected
                                            ? 'bg-yellow-600 border-yellow-500 text-white shadow-sm shadow-yellow-900/30'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                                            }`}
                                    >
                                        {isSelected && sector !== 'Outros' && (
                                            <span className="mr-1 text-yellow-200">✓</span>
                                        )}
                                        {sector}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom input — only when "Outros" selected */}
                    {hasOthers && (
                        <div style={{ animation: 'sectorFadeIn 250ms ease-out' }} className="space-y-2">
                            <div className="flex gap-2 w-full">
                                <input
                                    type="text"
                                    id="sector-custom-input"
                                    placeholder="Digite o setor personalizado..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomTag(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                    className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-yellow-600/60 focus:ring-1 focus:ring-yellow-600/20 outline-none transition-all"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('sector-custom-input') as HTMLInputElement;
                                        if (input) {
                                            addCustomTag(input.value);
                                            input.value = '';
                                            input.focus();
                                        }
                                    }}
                                    className="flex-shrink-0 flex-none px-4 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition-all active:scale-95 whitespace-nowrap"
                                >
                                    + Add
                                </button>
                            </div>

                            {/* Custom tag chips */}
                            {customTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {customTags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-600/15 border border-yellow-600/30 text-yellow-400"
                                            style={{ animation: 'sectorFadeIn 200ms ease-out' }}
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeCustomTag(tag)}
                                                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-yellow-600/30 transition-colors text-yellow-500"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <style>{`
                        @keyframes sectorFadeIn {
                            from { opacity: 0; transform: translateY(-4px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};
