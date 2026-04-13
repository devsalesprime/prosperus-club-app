// WelcomeStep — Step 0 (Operação Estilhaço)
import React from 'react';
import { Camera, User, Rocket, Sparkles } from 'lucide-react';

export const WelcomeStep: React.FC = () => (
    <div className="text-center py-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-900/30">
            <Sparkles className="text-white" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
            Você chegou ao lugar certo.
        </h2>
        <p className="text-slate-300 text-lg mb-6 max-w-md mx-auto">
            Configure seu perfil em <strong className="text-yellow-500">menos de 3 minutos</strong> e comece a gerar negócios com os sócios do clube.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-8">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <Camera className="text-yellow-500 mx-auto mb-2" size={24} />
                <p className="text-xs text-slate-400">Sua Foto</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <User className="text-yellow-500 mx-auto mb-2" size={24} />
                <p className="text-xs text-slate-400">Seu Perfil</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <Rocket className="text-yellow-500 mx-auto mb-2" size={24} />
                <p className="text-xs text-slate-400">Explorar</p>
            </div>
        </div>
    </div>
);
