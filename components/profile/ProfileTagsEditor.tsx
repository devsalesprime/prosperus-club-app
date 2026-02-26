// components/profile/ProfileTagsEditor.tsx
// Extracted from ProfileEdit.tsx L498-595 — Tags + Pitch Video

import React from 'react';
import {
    Tag,
    X,
    Plus,
    Video,
    PlayCircle,
    Link2,
    Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TagSuggestions } from '../TagSuggestions';

interface ProfileTagsEditorProps {
    tags: string[];
    newTag: string;
    pitchVideoUrl: string;
    onSetNewTag: (val: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
    onTagSelect: (tag: string) => void;
    onPitchVideoChange: (url: string) => void;
}

export const ProfileTagsEditor: React.FC<ProfileTagsEditorProps> = ({
    tags,
    newTag,
    pitchVideoUrl,
    onSetNewTag,
    onAddTag,
    onRemoveTag,
    onTagSelect,
    onPitchVideoChange,
}) => {
    return (
        <>
            {/* Tags */}
            <div>
                <h3 className="text-sm font-bold text-white mb-3">Tags de Interesse</h3>
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => onSetNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                            placeholder="Ex: Vendas, Marketing, Tecnologia"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                        />
                    </div>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={onAddTag}
                    >
                        <Plus size={18} />
                        Adicionar
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags?.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => onRemoveTag(tag)}
                                className="hover:text-red-400 transition"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    {(!tags || tags.length === 0) && (
                        <p className="text-sm text-slate-500">Nenhuma tag adicionada</p>
                    )}
                </div>

                {/* Tag Suggestions */}
                <TagSuggestions
                    currentTags={tags || []}
                    onTagSelect={onTagSelect}
                />
            </div>

            {/* VIDEO DE APRESENTAÇÃO SECTION */}
            <div className="border border-purple-600/30 rounded-xl p-6 bg-gradient-to-br from-purple-900/10 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Video className="text-purple-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Vídeo de Apresentação</h3>
                        <p className="text-xs text-slate-400">Destaque seu perfil com um pitch em vídeo</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-2">
                            <Link2 size={12} className="inline mr-1 text-purple-400" />
                            Link do vídeo (YouTube, Vimeo, Google Drive ou Loom)
                        </label>
                        <div className="relative">
                            <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="url"
                                value={pitchVideoUrl || ''}
                                onChange={(e) => onPitchVideoChange(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=... ou https://drive.google.com/file/d/..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition"
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <Sparkles className="text-purple-400 shrink-0 mt-0.5" size={14} />
                        <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="text-purple-400 font-medium">Dica:</span> Grave um vídeo de até 3 minutos se apresentando.
                            Suba no <strong className="text-slate-300">YouTube</strong> (não listado) ou <strong className="text-slate-300">Google Drive</strong> (modo público) e cole o link acima.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
