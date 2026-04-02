// ProfileHistory.tsx
// Component for viewing profile change history

import React, { useState, useEffect } from 'react';
import { History, Clock, User, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { ModalWrapper, ModalBody } from './ui/ModalWrapper';
import { ModalHeader } from './ModalHeader';

interface ProfileChange {
    id: string;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    change_type: string;
    created_at: string;
    requires_approval: boolean;
    approved_at: string | null;
    approved_by: string | null;
    rejection_reason: string | null;
}

interface ProfileHistoryProps {
    profileId: string;
    onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
    name: 'Nome',
    bio: 'Sobre',
    company: 'Empresa',
    job_title: 'Cargo',
    image_url: 'Foto de Perfil',
    tags: 'Tags',
    socials: 'Redes Sociais',
    phone: 'Telefone'
};

export const ProfileHistory: React.FC<ProfileHistoryProps> = ({ profileId, onClose }) => {
    const [changes, setChanges] = useState<ProfileChange[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [profileId]);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('profile_history')
                .select('*')
                .eq('profile_id', profileId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setChanges(data || []);
        } catch (error) {
            console.error('Error fetching profile history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value: string | null, fieldName: string): string => {
        if (!value) return '(vazio)';

        // Handle special fields
        if (fieldName === 'image_url') {
            return value.length > 50 ? value.substring(0, 50) + '...' : value;
        }

        if (fieldName === 'tags' || fieldName === 'socials') {
            try {
                const parsed = JSON.parse(value);
                return JSON.stringify(parsed, null, 2);
            } catch {
                return value;
            }
        }

        return value;
    };

    const getChangeIcon = (change: ProfileChange) => {
        if (change.rejection_reason) {
            return <X className="text-red-500" size={16} />;
        }
        if (change.approved_at) {
            return <Check className="text-green-500" size={16} />;
        }
        if (change.requires_approval) {
            return <AlertCircle className="text-yellow-500" size={16} />;
        }
        return <Check className="text-slate-500" size={16} />;
    };

    const getChangeStatus = (change: ProfileChange): string => {
        if (change.rejection_reason) return 'Rejeitado';
        if (change.approved_at) return 'Aprovado';
        if (change.requires_approval) return 'Aguardando Aprovação';
        return 'Aplicado';
    };

    return (
        <ModalWrapper isOpen={true} onClose={onClose} maxWidth="3xl">
            <ModalHeader
                title="Histórico de Alterações"
                onClose={onClose}
            />

            <ModalBody>
                {/* Content */}
                <div>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-yellow-600 border-t-transparent"></div>
                            <p className="text-slate-400 mt-4">Carregando histórico...</p>
                        </div>
                    ) : changes.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400">Nenhuma alteração registrada</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {changes.map((change) => (
                                <div
                                    key={change.id}
                                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {getChangeIcon(change)}
                                            <div>
                                                <h4 className="text-sm font-bold text-white">
                                                    {FIELD_LABELS[change.field_name] || change.field_name}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                    <Clock size={12} />
                                                    {format(new Date(change.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${change.rejection_reason
                                            ? 'bg-red-900/20 text-red-400 border border-red-600/30'
                                            : change.approved_at
                                                ? 'bg-green-900/20 text-green-400 border border-green-600/30'
                                                : change.requires_approval
                                                    ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-600/30'
                                                    : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {getChangeStatus(change)}
                                        </span>
                                    </div>

                                    {/* Changes */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Anterior</p>
                                            <div className="bg-slate-900 rounded p-2 text-sm text-slate-300 break-words">
                                                {formatValue(change.old_value, change.field_name)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Novo</p>
                                            <div className="bg-slate-900 rounded p-2 text-sm text-green-400 break-words">
                                                {formatValue(change.new_value, change.field_name)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Reason */}
                                    {change.rejection_reason && (
                                        <div className="mt-3 p-2 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-400">
                                            <strong>Motivo da Rejeição:</strong> {change.rejection_reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                    <p className="text-xs text-slate-400 text-center">
                        Mostrando até 50 alterações mais recentes
                    </p>
                </div>
            </ModalBody>
        </ModalWrapper>
    );
};
