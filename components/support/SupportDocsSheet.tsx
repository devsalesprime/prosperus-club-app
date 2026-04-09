// SupportDocsSheet.tsx — Root component + Context + Provider
// Manages which doc is open and renders the bottom sheet overlay.
// Usage: wrap app with <SupportDocsProvider>, call useSupportDocs().openDoc('faq')

import React, { useState, createContext, useContext } from 'react'
import { X, HelpCircle, Shield, FileText } from 'lucide-react'
import { FAQContent } from './FAQContent'
import { PrivacyContent } from './PrivacyContent'
import { TermsContent } from './TermsContent'

export type DocType = 'faq' | 'privacy' | 'terms' | null

interface Props {
    open: DocType
    onClose: () => void
}

const DOC_META = {
    faq: { title: 'Central de ajuda', icon: <HelpCircle size={18} /> },
    privacy: { title: 'Política de privacidade', icon: <Shield size={18} /> },
    terms: { title: 'Termos de uso', icon: <FileText size={18} /> },
}

export function SupportDocsSheet({ open, onClose }: Props) {
    if (!open) return null
    const meta = DOC_META[open]

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className="fixed inset-x-0 bottom-0 z-[80] flex flex-col rounded-t-3xl"
                style={{
                    background: '#031A2B',
                    borderTop: '1px solid #052B48',
                    height: '92dvh',
                    animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
                }}
            >
                <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>

                {/* Handle */}
                <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-0 shrink-0"
                    style={{ background: '#052B48' }} />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: '1px solid #052B48' }}>
                    <div className="flex items-center gap-2" style={{ color: '#FFDA71' }}>
                        {meta.icon}
                        <h2 className="text-base font-semibold text-white">
                            {meta.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-white"
                        style={{ background: '#052B48', color: '#8BA3B5' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content with scroll */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {open === 'faq' && <FAQContent />}
                    {open === 'privacy' && <PrivacyContent />}
                    {open === 'terms' && <TermsContent />}
                </div>
            </div>
        </>
    )
}

// ── Context + Hook ──────────────────────────────────────
interface SupportDocsCtx {
    openDoc: (type: DocType) => void
}
const SupportDocsContext = createContext<SupportDocsCtx>({ openDoc: () => { } })
export const useSupportDocs = () => useContext(SupportDocsContext)

// ── Provider — mount in App.tsx ─────────────────────────
export function SupportDocsProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState<DocType>(null)
    return (
        <SupportDocsContext.Provider value={{ openDoc: setOpen }}>
            {children}
            <SupportDocsSheet open={open} onClose={() => setOpen(null)} />
        </SupportDocsContext.Provider>
    )
}
