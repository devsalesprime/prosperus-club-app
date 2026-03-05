// DocViewer.tsx — Bottom sheet viewer for legal docs and FAQ
// Renders parsed markdown sections. FAQ uses accordion, legal docs use flowing text.
// Floats over current content — no route change needed.

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useDocViewer, type DocType } from '../../hooks/useDocViewer';
import { parseMarkdownSections, filterSections, type DocSection } from '../../utils/docParser';

// Vite ?raw imports — loads the .md files as strings at build time
import faqRaw from '../../docs/FAQ_USABILIDADE.md?raw';
import privacyRaw from '../../docs/POLITICA_PRIVACIDADE.md?raw';
import termsRaw from '../../docs/TERMOS_DE_USO.md?raw';

const DOC_META: Record<DocType, { title: string; emoji: string; raw: string }> = {
    faq: { title: 'Central de Ajuda', emoji: '💬', raw: faqRaw },
    privacy: { title: 'Política de Privacidade', emoji: '🔒', raw: privacyRaw },
    terms: { title: 'Termos de Uso', emoji: '📋', raw: termsRaw },
};

export const DocViewer: React.FC = () => {
    const { activeDoc, closeDoc } = useDocViewer();
    const [sections, setSections] = useState<DocSection[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openSection, setOpenSection] = useState<string | null>(null);

    useEffect(() => {
        if (!activeDoc) return;
        setSections(parseMarkdownSections(DOC_META[activeDoc].raw));
        setSearchQuery('');
        setOpenSection(null);
    }, [activeDoc]);

    if (!activeDoc) return null;

    const meta = DOC_META[activeDoc];
    const isFaq = activeDoc === 'faq';
    const filtered = filterSections(sections, searchQuery);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={closeDoc}
            />

            {/* Bottom Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-[80] bg-[#0A0A0F] border-t border-slate-800 rounded-t-3xl flex flex-col h-[92dvh] animate-in slide-in-from-bottom-4 duration-300">
                {/* Handle */}
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.emoji}</span>
                        <h2 className="text-base font-semibold text-white">{meta.title}</h2>
                    </div>
                    <button
                        onClick={closeDoc}
                        className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search (FAQ only) */}
                {isFaq && (
                    <div className="px-5 pt-3 pb-2 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2.5 border border-slate-800">
                            <Search size={15} className="text-slate-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="Buscar dúvida..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm text-white placeholder:text-slate-600 outline-none flex-1"
                            />
                        </div>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                    {filtered.map((section, i) =>
                        isFaq ? (
                            <FaqAccordion
                                key={i}
                                section={section}
                                isOpen={openSection === section.title}
                                onToggle={() =>
                                    setOpenSection(openSection === section.title ? null : section.title)
                                }
                            />
                        ) : (
                            <LegalSection key={i} section={section} />
                        )
                    )}

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-600 text-sm">
                                Nenhum resultado para "{searchQuery}"
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <p className="text-xs text-slate-700 text-center pt-6 pb-4">
                        Última atualização: março de 2026
                    </p>
                </div>
            </div>
        </>
    );
};

// ── FAQ Accordion Item ────────────────────────────────────
const FaqAccordion: React.FC<{
    section: DocSection;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ section, isOpen, onToggle }) => (
    <button
        onClick={onToggle}
        className={`w-full text-left rounded-2xl border transition-all mb-1 ${isOpen
                ? 'bg-slate-900 border-yellow-600/20'
                : 'bg-slate-900/50 border-slate-800/50 hover:border-slate-700'
            }`}
    >
        <div className="flex items-start gap-3 p-4">
            <span className="text-yellow-500 font-bold text-sm mt-0.5 shrink-0">
                {isOpen ? '−' : '+'}
            </span>
            <div className="flex-1">
                <p className={`text-sm font-medium leading-snug ${isOpen ? 'text-white' : 'text-slate-300'}`}>
                    {section.title}
                </p>
                {isOpen && (
                    <p className="text-sm text-slate-400 mt-3 leading-relaxed whitespace-pre-line">
                        {section.content}
                    </p>
                )}
            </div>
        </div>
    </button>
);

// ── Legal Document Section (flowing text) ─────────────────
const LegalSection: React.FC<{ section: DocSection }> = ({ section }) => (
    <div className="mb-6">
        <h3 className="text-sm font-semibold text-yellow-500 mb-2">
            {section.title}
        </h3>
        <div className="text-sm text-slate-400 leading-relaxed space-y-2 whitespace-pre-line">
            {section.content}
        </div>
    </div>
);
