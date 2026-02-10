// ============================================
// SETTINGS SERVICE
// ============================================
// Gerencia configurações globais do app (Singleton pattern)

import { supabase } from '../lib/supabase';

// Tipos
export interface AppSettings {
    id: number;

    // Suporte Técnico
    support_email: string;
    support_phone: string;

    // Gerente de Conta
    account_manager_name: string;
    account_manager_phone: string;
    account_manager_email: string;

    // Financeiro
    financial_email: string;
    financial_phone: string;

    // Links
    terms_url: string;
    privacy_url: string;
    faq_url: string;

    // Metadata
    updated_at: string;
    updated_by: string | null;
}

export interface AppSettingsUpdate {
    support_email?: string;
    support_phone?: string;
    account_manager_name?: string;
    account_manager_phone?: string;
    account_manager_email?: string;
    financial_email?: string;
    financial_phone?: string;
    terms_url?: string;
    privacy_url?: string;
    faq_url?: string;
}

// Default settings (fallback)
const DEFAULT_SETTINGS: AppSettings = {
    id: 1,
    support_email: 'suporte@prosperusclub.com.br',
    support_phone: '+55 11 99999-9999',
    account_manager_name: 'Sua Gerente de Conta',
    account_manager_phone: '+55 11 99999-9999',
    account_manager_email: 'gerente@prosperusclub.com.br',
    financial_email: 'financeiro@prosperusclub.com.br',
    financial_phone: '+55 11 99999-9999',
    terms_url: 'https://prosperusclub.com.br/termos',
    privacy_url: 'https://prosperusclub.com.br/privacidade',
    faq_url: 'https://prosperusclub.com.br/faq',
    updated_at: new Date().toISOString(),
    updated_by: null
};

class SettingsService {
    private cache: AppSettings | null = null;
    private cacheTime: number = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    /**
     * Get app settings (with cache)
     */
    async getSettings(): Promise<AppSettings> {
        // Check cache
        if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
            return this.cache;
        }

        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('id, support_email, support_phone, account_manager_name, account_manager_phone, account_manager_email, financial_email, financial_phone, terms_url, privacy_url, faq_url, updated_at, updated_by')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                return DEFAULT_SETTINGS;
            }

            // Update cache
            this.cache = data;
            this.cacheTime = Date.now();

            return data;
        } catch (error) {
            console.error('Error in getSettings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * Update app settings (Admin only)
     */
    async updateSettings(updates: AppSettingsUpdate): Promise<{ success: boolean; data?: AppSettings; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1)
                .select()
                .single();

            if (error) {
                console.error('Error updating settings:', error);
                return { success: false, error: error.message };
            }

            // Invalidate cache
            this.cache = null;

            console.log('✅ Settings updated');
            return { success: true, data };
        } catch (error: any) {
            console.error('Error in updateSettings:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Clear cache (force refresh)
     */
    clearCache(): void {
        this.cache = null;
        this.cacheTime = 0;
    }

    /**
     * Validate email format
     */
    validateEmail(email: string): boolean {
        if (!email) return true; // Empty is valid (will use default)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Format phone number (BR)
     */
    formatPhone(phone: string): string {
        // Remove non-digits
        const digits = phone.replace(/\D/g, '');

        // Format: +55 11 99999-9999
        if (digits.length === 13 && digits.startsWith('55')) {
            return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
        }
        if (digits.length === 11) {
            return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
        if (digits.length === 10) {
            return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }

        return phone; // Return as-is if format not recognized
    }
}

export const settingsService = new SettingsService();
