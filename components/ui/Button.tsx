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

// Brand-aligned (gradient gold = CTA primário, conforme brand guide pág. 18).
// Variant `danger` mantém vermelho — convenção UX universal para destrutivo.
const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-br from-prosperus-ouro-vivo to-prosperus-ouro-nobre text-prosperus-bg-primary shadow-lg shadow-prosperus-ouro-nobre/20 hover:opacity-90',
    secondary: 'bg-prosperus-bg-box hover:bg-prosperus-azul-lideranca text-prosperus-text',
    outline: 'border border-prosperus-stroke text-prosperus-text-off hover:border-prosperus-ouro-vivo hover:text-prosperus-ouro-vivo bg-transparent',
    ghost: 'hover:bg-prosperus-bg-box text-prosperus-text-off hover:text-prosperus-text bg-transparent',
    danger: 'bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-prosperus-text',
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

        // Base styles — usa font-sans (Manrope) explicitamente em botões
        const baseStyles = `
            font-sans inline-flex items-center justify-center
            font-bold rounded-lg
            transition-all duration-200
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-prosperus-ouro-vivo
            focus-visible:ring-offset-2 focus-visible:ring-offset-prosperus-bg-primary
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
                type="button"
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
