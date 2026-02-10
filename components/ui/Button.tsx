// Button.tsx
// Design System Button Component
// Centralized button with variants, sizes, and states

import React from 'react';
import { Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    children?: React.ReactNode;
}

// ============================================
// STYLE MAPS
// ============================================

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white',
    outline: 'border border-slate-700 text-slate-300 hover:border-yellow-600 hover:text-yellow-500 bg-transparent',
    ghost: 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 bg-transparent',
    danger: 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    icon: 'h-10 w-10 p-0 justify-center',
};

// ============================================
// COMPONENT
// ============================================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;

        // Base styles
        const baseStyles = `
            inline-flex items-center justify-center
            font-bold rounded-lg
            transition-all duration-200
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-yellow-500
            focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
            disabled:opacity-50 disabled:cursor-not-allowed
        `;

        // Combine all styles
        const combinedStyles = `
            ${baseStyles}
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${className}
        `.replace(/\s+/g, ' ').trim();

        return (
            <button
                ref={ref}
                className={combinedStyles}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                aria-busy={isLoading}
                {...props}
            >
                {isLoading && (
                    <Loader2
                        className="animate-spin"
                        size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
                    />
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
