// components/profile/ProfileSocialsEditor.tsx
// Extracted from ProfileEdit.tsx L436-496 — LinkedIn, Instagram, WhatsApp, Website

import React from 'react';
import {
    Linkedin,
    Instagram,
    Globe,
    MessageCircle,
} from 'lucide-react';

interface ProfileSocialsEditorProps {
    socials: {
        linkedin?: string;
        instagram?: string;
        whatsapp?: string;
        website?: string;
    };
    onChange: (platform: string, value: string) => void;
}

export const ProfileSocialsEditor: React.FC<ProfileSocialsEditorProps> = ({
    socials,
    onChange,
}) => {
    return (
        <div>
            <h3 className="text-sm font-bold text-white mb-3">Redes Sociais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-2">LinkedIn</label>
                    <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="url"
                            value={socials?.linkedin}
                            onChange={(e) => onChange('linkedin', e.target.value)}
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
                            value={socials?.instagram}
                            onChange={(e) => onChange('instagram', e.target.value)}
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
                            value={socials?.whatsapp}
                            onChange={(e) => onChange('whatsapp', e.target.value)}
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
                            value={socials?.website}
                            onChange={(e) => onChange('website', e.target.value)}
                            placeholder="https://seusite.com"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
