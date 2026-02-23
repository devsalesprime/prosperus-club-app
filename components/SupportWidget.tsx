// ============================================
// SUPPORT WIDGET - Floating Help Button
// ============================================
// Botão flutuante de suporte com popover de contatos

import React, { useState, useEffect, useRef } from 'react';
import {
    Info,
    X,
    Mail,
    Phone,
    User,
    MessageCircle,
    HelpCircle,
    ExternalLink,
    Headphones,
    CreditCard,
    FileText,
    ChevronRight
} from 'lucide-react';
import { settingsService, AppSettings } from '../services/settingsService';

// Format phone for WhatsApp link (remove non-digits)
const formatWhatsAppLink = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
};

// Contact Item Component
const ContactItem = ({
    icon,
    label,
    value,
    href,
    isWhatsApp = false
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    href: string;
    isWhatsApp?: boolean;
}) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600 transition-all group"
    >
        <div className={`p-2 rounded-lg ${isWhatsApp ? 'bg-green-600/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-white truncate">{value}</p>
        </div>
        <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
    </a>
);

// Section Header
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
        <div className="text-yellow-500">{icon}</div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
    </div>
);

export const SupportWidget: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Auto-close popover when button becomes hidden
    useEffect(() => {
        if (!visible && isOpen) setIsOpen(false);
    }, [visible, isOpen]);

    // Load settings when opened
    useEffect(() => {
        if (isOpen && !settings) {
            setIsLoading(true);
            settingsService.getSettings()
                .then(data => setSettings(data))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, settings]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                panelRef.current &&
                buttonRef.current &&
                !panelRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    return (
        <>
            {/* Floating Button — animated visibility via opacity + scale */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 p-3.5 rounded-full shadow-xl transition-all duration-300 ${isOpen
                    ? 'bg-slate-700 text-white rotate-180'
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 hover:text-white border border-slate-600 hover:border-yellow-600/50 hover:shadow-yellow-600/20'
                    } bottom-24 right-4 md:bottom-6 md:right-6
                    ${visible
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-75 pointer-events-none'
                    }`}
                title="Central de Ajuda"
            >
                {isOpen ? <X size={22} /> : <Info size={22} />}
            </button>

            {/* Popover Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className={`fixed z-50 w-80 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300
                        bottom-40 right-4 md:bottom-20 md:right-6`}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-4 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HelpCircle size={20} className="text-yellow-500" />
                            <h3 className="font-bold text-white">Central de Ajuda</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-5">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : settings ? (
                            <>
                                {/* Suporte Técnico */}
                                <div>
                                    <SectionHeader icon={<Headphones size={16} />} title="Suporte Técnico" />
                                    <div className="space-y-2">
                                        {settings.support_email && (
                                            <ContactItem
                                                icon={<Mail size={16} />}
                                                label="Email"
                                                value={settings.support_email}
                                                href={`mailto:${settings.support_email}`}
                                            />
                                        )}
                                        {settings.support_phone && (
                                            <ContactItem
                                                icon={<MessageCircle size={16} />}
                                                label="WhatsApp"
                                                value={settings.support_phone}
                                                href={formatWhatsAppLink(settings.support_phone)}
                                                isWhatsApp
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Gerente de Conta */}
                                {settings.account_manager_name && (
                                    <div>
                                        <SectionHeader icon={<User size={16} />} title="Sua Gerente de Conta" />
                                        <div className="bg-gradient-to-br from-yellow-900/20 to-slate-800/50 border border-yellow-600/20 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center">
                                                    <User size={20} className="text-yellow-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{settings.account_manager_name}</p>
                                                    <p className="text-xs text-slate-400">Gerente de Conta</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {settings.account_manager_phone && (
                                                    <a
                                                        href={formatWhatsAppLink(settings.account_manager_phone)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        <MessageCircle size={16} />
                                                        WhatsApp
                                                    </a>
                                                )}
                                                {settings.account_manager_email && (
                                                    <a
                                                        href={`mailto:${settings.account_manager_email}`}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        <Mail size={16} />
                                                        Email
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Financeiro */}
                                {(settings.financial_email || settings.financial_phone) && (
                                    <div>
                                        <SectionHeader icon={<CreditCard size={16} />} title="Financeiro" />
                                        <div className="space-y-2">
                                            {settings.financial_email && (
                                                <ContactItem
                                                    icon={<Mail size={16} />}
                                                    label="Email"
                                                    value={settings.financial_email}
                                                    href={`mailto:${settings.financial_email}`}
                                                />
                                            )}
                                            {settings.financial_phone && (
                                                <ContactItem
                                                    icon={<Phone size={16} />}
                                                    label="Telefone"
                                                    value={settings.financial_phone}
                                                    href={`tel:${settings.financial_phone.replace(/\D/g, '')}`}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Links Úteis */}
                                {(settings.faq_url || settings.terms_url || settings.privacy_url) && (
                                    <div>
                                        <SectionHeader icon={<FileText size={16} />} title="Links Úteis" />
                                        <div className="flex flex-wrap gap-2">
                                            {settings.faq_url && (
                                                <a
                                                    href={settings.faq_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                                                >
                                                    <HelpCircle size={12} />
                                                    FAQ
                                                    <ExternalLink size={10} className="opacity-50" />
                                                </a>
                                            )}
                                            {settings.terms_url && (
                                                <a
                                                    href={settings.terms_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                                                >
                                                    <FileText size={12} />
                                                    Termos
                                                    <ExternalLink size={10} className="opacity-50" />
                                                </a>
                                            )}
                                            {settings.privacy_url && (
                                                <a
                                                    href={settings.privacy_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                                                >
                                                    <FileText size={12} />
                                                    Privacidade
                                                    <ExternalLink size={10} className="opacity-50" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-center text-slate-400 py-4">
                                Não foi possível carregar as informações.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default SupportWidget;
