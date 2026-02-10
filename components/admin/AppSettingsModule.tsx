// ============================================
// APP SETTINGS MODULE - Admin Component
// ============================================
// Gerenciador de configurações do app (Suporte, Financeiro, Links)

import React, { useState, useEffect } from 'react';
import {
    Save,
    Phone,
    Mail,
    User,
    Link as LinkIcon,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Settings,
    Headphones,
    CreditCard,
    FileText
} from 'lucide-react';
import { settingsService, AppSettings, AppSettingsUpdate } from '../../services/settingsService';

// Form Input Component
const FormInput = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    icon,
    error
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    error?: string;
}) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <div className="relative">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg ${icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-600 transition`}
            />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// Section Header
const SectionHeader = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-slate-800 rounded-lg text-yellow-500">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    </div>
);

export const AppSettingsModule: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Form state
    const [formData, setFormData] = useState<AppSettingsUpdate>({
        support_email: '',
        support_phone: '',
        account_manager_name: '',
        account_manager_phone: '',
        account_manager_email: '',
        financial_email: '',
        financial_phone: '',
        terms_url: '',
        privacy_url: '',
        faq_url: ''
    });

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const data = await settingsService.getSettings();
                setSettings(data);
                setFormData({
                    support_email: data.support_email || '',
                    support_phone: data.support_phone || '',
                    account_manager_name: data.account_manager_name || '',
                    account_manager_phone: data.account_manager_phone || '',
                    account_manager_email: data.account_manager_email || '',
                    financial_email: data.financial_email || '',
                    financial_phone: data.financial_phone || '',
                    terms_url: data.terms_url || '',
                    privacy_url: data.privacy_url || '',
                    faq_url: data.faq_url || ''
                });
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate emails
        const emailFields = ['support_email', 'account_manager_email', 'financial_email'];
        emailFields.forEach(field => {
            const value = (formData as any)[field];
            if (value && !settingsService.validateEmail(value)) {
                newErrors[field] = 'Email inválido';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Save settings
    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const result = await settingsService.updateSettings(formData);

            if (result.success) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // Update form field
    const updateField = (field: keyof AppSettingsUpdate, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field changes
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="text-yellow-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings size={24} className="text-yellow-500" />
                        Configurações do App
                    </h2>
                    <p className="text-sm text-slate-400">Gerencie informações de contato e links importantes</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition shadow-lg ${saveStatus === 'success'
                            ? 'bg-green-600 text-white'
                            : saveStatus === 'error'
                                ? 'bg-red-600 text-white'
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                >
                    {isSaving ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : saveStatus === 'success' ? (
                        <CheckCircle size={18} />
                    ) : saveStatus === 'error' ? (
                        <AlertTriangle size={18} />
                    ) : (
                        <Save size={18} />
                    )}
                    {isSaving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : saveStatus === 'error' ? 'Erro' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Suporte Técnico */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <SectionHeader
                        icon={<Headphones size={20} />}
                        title="Suporte Técnico"
                        description="Informações de contato para suporte ao usuário"
                    />
                    <div className="space-y-4">
                        <FormInput
                            label="Email de Suporte"
                            value={formData.support_email || ''}
                            onChange={(v) => updateField('support_email', v)}
                            type="email"
                            placeholder="suporte@exemplo.com"
                            icon={<Mail size={16} />}
                            error={errors.support_email}
                        />
                        <FormInput
                            label="Telefone de Suporte"
                            value={formData.support_phone || ''}
                            onChange={(v) => updateField('support_phone', v)}
                            placeholder="+55 11 99999-9999"
                            icon={<Phone size={16} />}
                        />
                    </div>
                </div>

                {/* Gerente de Conta */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <SectionHeader
                        icon={<User size={20} />}
                        title="Gerente de Conta"
                        description="Contato do gerente de relacionamento"
                    />
                    <div className="space-y-4">
                        <FormInput
                            label="Nome do Gerente"
                            value={formData.account_manager_name || ''}
                            onChange={(v) => updateField('account_manager_name', v)}
                            placeholder="Nome completo"
                            icon={<User size={16} />}
                        />
                        <FormInput
                            label="Email do Gerente"
                            value={formData.account_manager_email || ''}
                            onChange={(v) => updateField('account_manager_email', v)}
                            type="email"
                            placeholder="gerente@exemplo.com"
                            icon={<Mail size={16} />}
                            error={errors.account_manager_email}
                        />
                        <FormInput
                            label="Telefone do Gerente"
                            value={formData.account_manager_phone || ''}
                            onChange={(v) => updateField('account_manager_phone', v)}
                            placeholder="+55 11 99999-9999"
                            icon={<Phone size={16} />}
                        />
                    </div>
                </div>

                {/* Financeiro */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <SectionHeader
                        icon={<CreditCard size={20} />}
                        title="Financeiro"
                        description="Contato para assuntos financeiros"
                    />
                    <div className="space-y-4">
                        <FormInput
                            label="Email Financeiro"
                            value={formData.financial_email || ''}
                            onChange={(v) => updateField('financial_email', v)}
                            type="email"
                            placeholder="financeiro@exemplo.com"
                            icon={<Mail size={16} />}
                            error={errors.financial_email}
                        />
                        <FormInput
                            label="Telefone Financeiro"
                            value={formData.financial_phone || ''}
                            onChange={(v) => updateField('financial_phone', v)}
                            placeholder="+55 11 99999-9999"
                            icon={<Phone size={16} />}
                        />
                    </div>
                </div>

                {/* Links Importantes */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <SectionHeader
                        icon={<FileText size={20} />}
                        title="Links Importantes"
                        description="URLs de páginas legais e FAQ"
                    />
                    <div className="space-y-4">
                        <FormInput
                            label="Termos de Uso"
                            value={formData.terms_url || ''}
                            onChange={(v) => updateField('terms_url', v)}
                            placeholder="https://..."
                            icon={<LinkIcon size={16} />}
                        />
                        <FormInput
                            label="Política de Privacidade"
                            value={formData.privacy_url || ''}
                            onChange={(v) => updateField('privacy_url', v)}
                            placeholder="https://..."
                            icon={<LinkIcon size={16} />}
                        />
                        <FormInput
                            label="FAQ / Ajuda"
                            value={formData.faq_url || ''}
                            onChange={(v) => updateField('faq_url', v)}
                            placeholder="https://..."
                            icon={<LinkIcon size={16} />}
                        />
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            {settings?.updated_at && (
                <p className="text-xs text-slate-500 text-center">
                    Última atualização: {new Date(settings.updated_at).toLocaleString('pt-BR')}
                </p>
            )}
        </div>
    );
};

export default AppSettingsModule;
