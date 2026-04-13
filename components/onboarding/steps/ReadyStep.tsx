// ReadyStep — Step 6 (Operação Estilhaço)
import React from 'react';
import { Check } from 'lucide-react';

export interface ReadyStepProps {
    imageUrl: string;
    name: string;
    completion: number;
}

export const ReadyStep: React.FC<ReadyStepProps> = ({ imageUrl, name, completion }) => (
    <div className="text-center py-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-yellow-600 shadow-lg shadow-yellow-900/30">
            <img src={imageUrl || `${import.meta.env.BASE_URL}default-avatar.svg`} alt="Avatar" className="w-full h-full object-cover" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
            Tudo Pronto, {(name || '').split(' ')[0]}! 🎉
        </h2>
        <p className="text-slate-300 text-lg mb-6">
            Seu perfil está <strong className="text-yellow-500">{completion}% completo</strong>
        </p>

        <div className="max-w-xs mx-auto mb-8">
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 rounded-full"
                    style={{ width: `${completion}%` }}
                />
            </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 max-w-sm mx-auto text-left space-y-3">
            <p className="text-sm font-bold text-yellow-500 uppercase">O que você pode fazer agora:</p>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
                <Check size={16} className="text-green-500 shrink-0" />
                Explorar o Member's Book e conectar-se
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
                <Check size={16} className="text-green-500 shrink-0" />
                Acessar a Academy e assistir conteúdos
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
                <Check size={16} className="text-green-500 shrink-0" />
                Conferir eventos e agendar presença
            </div>
        </div>
    </div>
);
