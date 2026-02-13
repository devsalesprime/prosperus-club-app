// ============================================
// CONTESTED REFERRALS TAB
// ============================================
// Priority queue for disputed referrals requiring admin resolution

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, User, Mail, Phone, Calendar, MessageSquare } from 'lucide-react';

interface ContestedReferral {
    id: string;
    referrer_id: string;
    referrer_name: string;
    referrer_email: string;
    referrer_image: string;
    receiver_id: string;
    receiver_name: string;
    receiver_email: string;
    receiver_image: string;
    lead_name: string;
    lead_email?: string;
    lead_phone?: string;
    notes?: string;
    feedback: string; // contestation reason
    created_at: string;
}

interface ContestedReferralsTabProps {
    referrals: ContestedReferral[];
    loading: boolean;
    onResolve: (referralId: string, decision: 'RESTORE' | 'DISMISS', notes: string) => Promise<void>;
}

export const ContestedReferralsTab: React.FC<ContestedReferralsTabProps> = ({ referrals, loading, onResolve }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [decision, setDecision] = useState<'RESTORE' | 'DISMISS' | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [resolving, setResolving] = useState(false);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const handleResolve = async (refDecision: 'RESTORE' | 'DISMISS') => {
        if (!selectedId || !adminNotes.trim()) return;

        setResolving(true);
        try {
            await onResolve(selectedId, refDecision, adminNotes.trim());
            setSelectedId(null);
            setDecision(null);
            setAdminNotes('');
        } catch (error) {
            console.error('Error resolving contested referral:', error);
        } finally {
            setResolving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                Carregando indicações contestadas...
            </div>
        );
    }

    if (referrals.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <CheckCircle size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <h3 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>Nenhuma contestação pendente</h3>
                <p style={{ margin: 0 }}>Todas as indicações contestadas foram resolvidas.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px', background: '#431407', borderRadius: 12,
                color: '#fb923c', fontSize: 14, fontWeight: 600
            }}>
                <AlertTriangle size={18} />
                {referrals.length} indicaç{referrals.length === 1 ? 'ão contestada' : 'ões contestadas'} pendente{referrals.length === 1 ? '' : 's'}
            </div>

            {referrals.map(ref => (
                <div key={ref.id} style={{
                    background: '#1e293b', borderRadius: 12, padding: 20,
                    border: selectedId === ref.id ? '1px solid #f97316' : '1px solid #334155'
                }}>
                    {/* Parties */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                                src={ref.referrer_image || '/default-avatar.svg'}
                                alt={ref.referrer_name}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                                <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{ref.referrer_name}</div>
                                <div style={{ color: '#94a3b8', fontSize: 12 }}>Indicador</div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div>
                                <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{ref.receiver_name}</div>
                                <div style={{ color: '#94a3b8', fontSize: 12 }}>Receptor (contestou)</div>
                            </div>
                            <img
                                src={ref.receiver_image || '/default-avatar.svg'}
                                alt={ref.receiver_name}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>

                    {/* Lead Info */}
                    <div style={{
                        background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12,
                        display: 'flex', flexDirection: 'column', gap: 6
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
                            <User size={14} />
                            <strong>Lead:</strong> {ref.lead_name}
                        </div>
                        {ref.lead_email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                                <Mail size={14} /> {ref.lead_email}
                            </div>
                        )}
                        {ref.lead_phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                                <Phone size={14} /> {ref.lead_phone}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12 }}>
                            <Calendar size={14} /> {formatDate(ref.created_at)}
                        </div>
                    </div>

                    {/* Contestation Reason */}
                    <div style={{
                        background: '#431407', borderRadius: 8, padding: 12, marginBottom: 16,
                        display: 'flex', gap: 10, color: '#fb923c', fontSize: 14
                    }}>
                        <MessageSquare size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <strong style={{ display: 'block', marginBottom: 4 }}>Motivo da contestação:</strong>
                            {ref.feedback}
                        </div>
                    </div>

                    {/* Actions */}
                    {selectedId === ref.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <textarea
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder="Notas da resolução (obrigatório)..."
                                rows={3}
                                style={{
                                    width: '100%', padding: 12, borderRadius: 8,
                                    border: '1px solid #334155', background: '#0f172a',
                                    color: '#f1f5f9', fontSize: 14, resize: 'none'
                                }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => handleResolve('RESTORE')}
                                    disabled={resolving || !adminNotes.trim()}
                                    style={{
                                        flex: 1, padding: '10px 16px', borderRadius: 8,
                                        border: 'none', background: '#10b981', color: 'white',
                                        fontWeight: 600, cursor: 'pointer', fontSize: 14,
                                        opacity: resolving || !adminNotes.trim() ? 0.5 : 1
                                    }}
                                >
                                    <CheckCircle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    Restaurar Indicação
                                </button>
                                <button
                                    onClick={() => handleResolve('DISMISS')}
                                    disabled={resolving || !adminNotes.trim()}
                                    style={{
                                        flex: 1, padding: '10px 16px', borderRadius: 8,
                                        border: 'none', background: '#ef4444', color: 'white',
                                        fontWeight: 600, cursor: 'pointer', fontSize: 14,
                                        opacity: resolving || !adminNotes.trim() ? 0.5 : 1
                                    }}
                                >
                                    <XCircle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    Descartar Indicação
                                </button>
                            </div>
                            <button
                                onClick={() => { setSelectedId(null); setAdminNotes(''); }}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: '1px solid #334155',
                                    background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setSelectedId(ref.id)}
                            style={{
                                width: '100%', padding: '10px 16px', borderRadius: 8,
                                border: '1px solid #f97316', background: 'transparent',
                                color: '#f97316', fontWeight: 600, cursor: 'pointer', fontSize: 14
                            }}
                        >
                            Analisar e Resolver
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ContestedReferralsTab;
