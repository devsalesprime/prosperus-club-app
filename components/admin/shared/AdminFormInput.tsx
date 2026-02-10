// ============================================
// ADMIN FORM INPUT - Shared Component
// ============================================
// Input unificado com forwardRef para react-hook-form
// Substitui as 2 implementações duplicadas (AdminApp + BannersModule)

import React from 'react';

interface AdminFormInputProps {
    label: string;
    value?: string;
    onChange?: (value: string) => void;
    type?: string;
    placeholder?: string;
    textarea?: boolean;
    error?: string;
    disabled?: boolean;
    min?: string | number;
    required?: boolean;
    rows?: number;
}

export const AdminFormInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, AdminFormInputProps>(
    ({ label, value, onChange, type = 'text', placeholder, textarea = false, error, disabled = false, min, required = false, rows = 4 }, ref) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {textarea ? (
                <textarea
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    className={`w-full bg-slate-950 border rounded-lg p-3 text-slate-200 outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-2 focus:ring-yellow-600/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            ) : (
                <input
                    ref={ref as React.Ref<HTMLInputElement>}
                    type={type}
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min}
                    className={`w-full bg-slate-950 border rounded-lg p-3 text-slate-200 outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-2 focus:ring-yellow-600/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            )}
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    )
);

AdminFormInput.displayName = 'AdminFormInput';
