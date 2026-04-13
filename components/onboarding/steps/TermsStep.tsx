// TermsStep — Step 5 (Operação Estilhaço)
import React from 'react';

export interface TermsStepProps {
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    onAcceptTermsChange: (checked: boolean) => void;
    onAcceptPrivacyChange: (checked: boolean) => void;
    onOpenDoc: (docType: string) => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({
    acceptedTerms, acceptedPrivacy, onAcceptTermsChange, onAcceptPrivacyChange, onOpenDoc,
}) => (
    <div className="flex flex-col h-full justify-between py-4">
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Quase lá!</h2>
                <p className="text-slate-400 text-sm">Confirme que você leu e concorda com as regras.</p>
            </div>

            <label className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 cursor-pointer mb-3">
                <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => onAcceptTermsChange(e.target.checked)}
                    className="mt-0.5 accent-yellow-500 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-slate-300 leading-relaxed">
                    Li e aceito os{' '}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onOpenDoc('terms'); }}
                        className="text-yellow-500 underline underline-offset-2 hover:text-yellow-400"
                    >
                        Termos de Uso
                    </button>
                </span>
            </label>

            <label className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 cursor-pointer">
                <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={e => onAcceptPrivacyChange(e.target.checked)}
                    className="mt-0.5 accent-yellow-500 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-slate-300 leading-relaxed">
                    Li e aceito a{' '}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onOpenDoc('privacy'); }}
                        className="text-yellow-500 underline underline-offset-2 hover:text-yellow-400"
                    >
                        Política de Privacidade
                    </button>
                </span>
            </label>
        </div>
    </div>
);
