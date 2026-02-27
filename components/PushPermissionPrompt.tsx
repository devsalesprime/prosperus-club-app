import React from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface PushPermissionPromptProps {
    userId: string;
    onDismiss: () => void;
}

/**
 * Bottom sheet elegante para solicitar permissão de push notifications.
 * Exibir APÓS o onboarding, quando o sócio já está engajado.
 * Respeita quando não suportado, já concedido ou negado.
 */
export function PushPermissionPrompt({ userId, onDismiss }: PushPermissionPromptProps) {
    const { isSupported, permissionState, isLoading, requestPermission } =
        usePushNotifications(userId);

    // Não mostrar se: não suportado, já concedido, ou negado
    if (!isSupported || permissionState === 'granted' || permissionState === 'denied') {
        return null;
    }

    return (
        <div
            className="fixed bottom-20 left-4 right-4 z-50 animate-in"
            style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 41, 59, 0.97))',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(20px)',
                animation: 'slideUp 0.4s ease-out'
            }}
        >
            {/* Fechar */}
            <button
                onClick={onDismiss}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    padding: '4px'
                }}
            >
                <X size={16} />
            </button>

            {/* Ícone + Texto */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(234, 179, 8, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Bell size={22} style={{ color: '#eab308' }} />
                </div>
                <div>
                    <p style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#f1f5f9',
                        marginBottom: '4px'
                    }}>
                        Ativar notificações
                    </p>
                    <p style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        lineHeight: '1.5'
                    }}>
                        Receba mensagens e avisos de novos eventos
                        diretamente na tela do seu celular.
                    </p>
                </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={onDismiss}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '14px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        color: '#94a3b8',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    Agora não
                </button>
                <button
                    onClick={async () => {
                        const ok = await requestPermission();
                        if (ok) onDismiss();
                    }}
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '14px',
                        background: isLoading ? '#92400e' : '#ca8a04',
                        border: 'none',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: isLoading ? 'wait' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        transition: 'all 0.2s'
                    }}
                >
                    {isLoading ? 'Aguarde...' : '🔔 Ativar'}
                </button>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
