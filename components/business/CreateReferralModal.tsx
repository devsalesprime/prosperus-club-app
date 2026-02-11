// components/business/CreateReferralModal.tsx
// Modal para criar nova indicação - Prosperus Club App v2.5

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, User, Mail, Phone, FileText, Loader2, Send } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { supabase } from '../../lib/supabase';
import { useScrollLock } from '../../hooks/useScrollLock';

interface CreateReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface MemberOption {
    id: string;
    name: string;
    image_url: string;
    company: string;
}

export const CreateReferralModal: React.FC<CreateReferralModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // iOS-proof scroll lock
    useScrollLock({ enabled: isOpen, modalId: 'create-referral' });

    // iOS touchmove prevention
    const handleTouchMove = useCallback((e: TouchEvent) => {
        const target = e.target as HTMLElement;
        const content = contentRef.current;
        if (!content || !content.contains(target)) {
            e.preventDefault();
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const overlay = overlayRef.current;
        if (!overlay) return;
        overlay.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => overlay.removeEventListener('touchmove', handleTouchMove);
    }, [isOpen, handleTouchMove]);

    const [members, setMembers] = useState<MemberOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [selectedReceiver, setSelectedReceiver] = useState<string>('');
    const [leadName, setLeadName] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMembers();
        }
    }, [isOpen]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, image_url, company')
                .neq('id', user?.id)
                .order('name');

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error loading members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedReceiver) {
            setError('Selecione o membro que receberá a indicação');
            return;
        }

        if (!leadName.trim()) {
            setError('Informe o nome do lead');
            return;
        }

        setSubmitting(true);
        try {
            await businessService.createReferral({
                receiver_id: selectedReceiver,
                lead_name: leadName.trim(),
                lead_email: leadEmail.trim() || undefined,
                lead_phone: leadPhone.trim() || undefined,
                notes: notes.trim() || undefined
            });

            // Reset form
            setSelectedReceiver('');
            setLeadName('');
            setLeadEmail('');
            setLeadPhone('');
            setNotes('');
            setSearchTerm('');

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar indicação';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
            <div ref={contentRef} className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Nova Indicação</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            <User size={16} />
                            Indicar para
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar membro..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <div className="member-list">
                            {loading ? (
                                <div className="loading-state">
                                    <Loader2 className="animate-spin" size={20} />
                                </div>
                            ) : (
                                filteredMembers.slice(0, 5).map(member => (
                                    <div
                                        key={member.id}
                                        className={`member-option ${selectedReceiver === member.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedReceiver(member.id);
                                            setSearchTerm(member.name);
                                        }}
                                    >
                                        <img
                                            src={member.image_url || '/default-avatar.svg'}
                                            alt={member.name}
                                            className="member-avatar"
                                        />
                                        <div className="member-info">
                                            <span className="member-name">{member.name}</span>
                                            <span className="member-company">{member.company}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="section-title">Dados do Lead</div>

                    <div className="form-group">
                        <label>
                            <User size={16} />
                            Nome do Lead *
                        </label>
                        <input
                            type="text"
                            value={leadName}
                            onChange={e => setLeadName(e.target.value)}
                            placeholder="Nome completo do potencial cliente"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                <Mail size={16} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={leadEmail}
                                onChange={e => setLeadEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <Phone size={16} />
                                Telefone
                            </label>
                            <input
                                type="tel"
                                value={leadPhone}
                                onChange={e => setLeadPhone(e.target.value)}
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <FileText size={16} />
                            Contexto / Notas
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Informações relevantes sobre o lead e a oportunidade..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Enviar Indicação
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <style>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                    }

                    .modal-content {
                        background: white;
                        color: #1e293b !important;
                        border-radius: 12px;
                        width: 100%;
                        max-width: 520px;
                        max-height: 90vh;
                        overflow-y: auto;
                        overscroll-behavior: contain;
                        -webkit-overflow-scrolling: touch;
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px;
                        border-bottom: 1px solid #eee;
                        position: sticky;
                        top: 0;
                        background: white;
                        z-index: 10;
                    }

                    .modal-header h2 {
                        margin: 0;
                        font-size: 18px;
                        color: #031A2B;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #666;
                        padding: 4px;
                    }

                    form {
                        padding: 20px;
                    }

                    .error-message {
                        background: #fee2e2;
                        color: #dc2626;
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 16px;
                        font-size: 14px;
                    }

                    .section-title {
                        font-weight: 600;
                        color: #031A2B;
                        margin: 20px 0 12px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #eee;
                    }

                    .form-group {
                        margin-bottom: 16px;
                    }

                    .form-group label {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-weight: 600;
                        color: #031A2B !important;
                        margin-bottom: 8px;
                        font-size: 14px;
                    }

                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }

                    .search-input,
                    .form-group input,
                    .form-group textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        font-size: 14px;
                        color: #1e293b !important;
                        background: white !important;
                        transition: border-color 0.2s;
                    }

                    .form-group input:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #FFDA71;
                    }

                    .member-list {
                        max-height: 180px;
                        overflow-y: auto;
                        border: 1px solid #eee;
                        border-radius: 8px;
                        margin-top: 8px;
                    }

                    .loading-state {
                        display: flex;
                        justify-content: center;
                        padding: 20px;
                        color: #666;
                    }

                    .member-option {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }

                    .member-option:hover {
                        background: #f5f5f5;
                    }

                    .member-option.selected {
                        background: #FFF9E6;
                    }

                    .member-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        object-fit: cover;
                    }

                    .member-info {
                        display: flex;
                        flex-direction: column;
                    }

                    .member-name {
                        font-weight: 600;
                        color: #031A2B;
                    }

                    .member-company {
                        font-size: 12px;
                        color: #666 !important;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        margin-top: 24px;
                    }

                    .btn-secondary {
                        padding: 12px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        color: #666;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    }

                    .btn-primary {
                        padding: 12px 20px;
                        border: none;
                        background: #FFDA71;
                        color: #031A2B;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .btn-primary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default CreateReferralModal;
