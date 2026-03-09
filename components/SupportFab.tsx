import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Headphones, CreditCard } from 'lucide-react';
import { settingsService, AppSettings } from '../services/settingsService';

export const SupportFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  const handleSupportClick = (type: 'TECH' | 'FINANCIAL') => {
    if (!settings) return;

    // Strip non-digits for wa.me link
    const rawPhone = type === 'TECH' ? settings.support_phone : settings.financial_phone;
    const phone = rawPhone.replace(/\D/g, '');
    const message = type === 'TECH'
      ? 'Olá, preciso de ajuda técnica com o App Prosperus.'
      : 'Olá, gostaria de falar sobre assuntos financeiros do Prosperus Club.';

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end space-y-3">
      {isOpen && (
        <div className="flex flex-col space-y-2 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <button
            onClick={() => handleSupportClick('FINANCIAL')}
            className="flex items-center justify-end space-x-2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition"
          >
            <span className="text-sm font-medium">Financeiro</span>
            <div className="bg-emerald-500 p-1.5 rounded-full">
              <CreditCard size={16} className="text-white" />
            </div>
          </button>

          <button
            onClick={() => handleSupportClick('TECH')}
            className="flex items-center justify-end space-x-2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition"
          >
            <span className="text-sm font-medium">Suporte Técnico</span>
            <div className="bg-blue-500 p-1.5 rounded-full">
              <Headphones size={16} className="text-white" />
            </div>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:scale-110'
          }`}
      >
        {isOpen ? <X color="white" size={24} /> : <MessageCircle color="white" size={24} />}
      </button>
    </div>
  );
};
