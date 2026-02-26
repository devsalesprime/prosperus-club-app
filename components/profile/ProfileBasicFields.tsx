// components/profile/ProfileBasicFields.tsx
// Extracted from ProfileEdit.tsx L347-434 — Name, Job Title, Company, Phone, Bio

import React from 'react';
import {
    User,
    Briefcase,
    Building2,
    Phone,
    FileText,
} from 'lucide-react';
import { ProfileUpdateData } from '../../services/profileService';

interface ProfileBasicFieldsProps {
    formData: ProfileUpdateData;
    onChange: (field: keyof ProfileUpdateData, value: string) => void;
}

export const ProfileBasicFields: React.FC<ProfileBasicFieldsProps> = ({
    formData,
    onChange,
}) => {
    return (
        <>
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
                            onChange={(e) => onChange('name', e.target.value)}
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
                            onChange={(e) => onChange('job_title', e.target.value)}
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
                            onChange={(e) => onChange('company', e.target.value)}
                            placeholder="Nome da empresa"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-white mb-2">
                        Telefone
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => onChange('phone', e.target.value)}
                            placeholder="+55 11 99999-9999"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition"
                        />
                    </div>
                </div>
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
                        onChange={(e) => onChange('bio', e.target.value)}
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
        </>
    );
};
