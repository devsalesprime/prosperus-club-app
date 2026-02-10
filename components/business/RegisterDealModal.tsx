// components/business/RegisterDealModal.tsx
// Modal para registrar novo negócio - Prosperus Club App v2.5

import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Calendar, FileText, User, Loader2, Trash2 } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { supabase } from '../../lib/supabase';

interface RegisterDealModalProps {
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

export const RegisterDealModal: React.FC<RegisterDealModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [members, setMembers] = useState<MemberOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [selectedBuyer, setSelectedBuyer] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [dealDate, setDealDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState<string>('');

    // Load members when modal opens
    useEffect(() => {
        if (isOpen) {
            loadMembers();
        }
    }, [isOpen]);

    // CRITICAL: Cleanup state when modal closes (fixes lag/persistence bug)
    useEffect(() => {
        if (!isOpen) {
            setSelectedBuyer('');
            setSearchTerm('');
            setAmount('');
            setDescription('');
            setDealDate(new Date().toISOString().split('T')[0]);
            setError('');
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

    const formatCurrencyInput = (value: string) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');
        // Converte para centavos
        const cents = parseInt(numbers) || 0;
        // Formata como moeda
        return (cents / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrencyInput(e.target.value);
        setAmount(formatted);
    };

    const parseAmount = (): number => {
        // Converte "1.234,56" para 1234.56
        return parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedBuyer) {
            setError('Selecione o comprador');
            return;
        }

        const numericAmount = parseAmount();
        if (numericAmount <= 0) {
            setError('Informe um valor válido');
            return;
        }

        if (!description.trim()) {
            setError('Descreva o negócio realizado');
            return;
        }

        setSubmitting(true);
        try {
            await businessService.registerDeal({
                buyer_id: selectedBuyer,
                amount: numericAmount,
                description: description.trim(),
                deal_date: dealDate
            });

            // Reset form
            setSelectedBuyer('');
            setAmount('');
            setDescription('');
            setDealDate(new Date().toISOString().split('T')[0]);

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar negócio';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Optimized filtering with useMemo (prevents re-computation on every render)
    const filteredMembers = useMemo(() => {
        return members.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.company?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm]);

    // Get selected member data for display
    const selectedMember = useMemo(() => {
        return members.find(m => m.id === selectedBuyer);
    }, [members, selectedBuyer]);

    // Clear selection handler
    const handleClearSelection = () => {
        setSelectedBuyer('');
        setSearchTerm('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Registrar Negócio</h2>
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
                            Comprador
                        </label>

                        {/* Show selected member card OR search input */}
                        {selectedMember ? (
                            <div className="selected-member-card">
                                <img
                                    src={selectedMember.image_url || '/default-avatar.svg'}
                                    alt={selectedMember.name}
                                    className="selected-avatar"
                                />
                                <div className="selected-info">
                                    <span className="selected-name">{selectedMember.name}</span>
                                    <span className="selected-company">{selectedMember.company}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearSelection}
                                    className="remove-selection-btn"
                                    title="Remover seleção"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
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
                                                className="member-option"
                                                onClick={() => {
                                                    setSelectedBuyer(member.id);
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
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label>
                            <DollarSign size={16} />
                            Valor do Negócio
                        </label>
                        <div className="currency-input">
                            <span className="currency-prefix">R$</span>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <FileText size={16} />
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descreva o produto/serviço vendido..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Calendar size={16} />
                            Data do Negócio
                        </label>
                        <input
                            type="date"
                            value={dealDate}
                            onChange={e => setDealDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
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
                                    Registrando...
                                </>
                            ) : (
                                'Registrar Negócio'
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
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 12px;
                        width: 100%;
                        max-width: 480px;
                        max-height: 90vh;
                        overflow-y: auto;
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px;
                        border-bottom: 1px solid #1e293b;
                    }

                    .modal-header h2 {
                        margin: 0;
                        font-size: 18px;
                        color: #fff;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #94a3b8;
                        padding: 4px;
                    }

                    .close-btn:hover {
                        color: #fff;
                    }

                    form {
                        padding: 20px;
                    }

                    .error-message {
                        background: rgba(220, 38, 38, 0.15);
                        color: #f87171;
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 16px;
                        font-size: 14px;
                        border: 1px solid rgba(220, 38, 38, 0.3);
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }

                    .form-group label {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-weight: 600;
                        color: #e2e8f0;
                        margin-bottom: 8px;
                        font-size: 14px;
                    }

                    .search-input,
                    .form-group input,
                    .form-group textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        font-size: 14px;
                        transition: border-color 0.2s;
                        background: #1e293b;
                        color: #f1f5f9;
                    }

                    .search-input::placeholder,
                    .form-group input::placeholder,
                    .form-group textarea::placeholder {
                        color: #64748b;
                    }

                    .form-group input:focus,
                    .form-group textarea:focus,
                    .search-input:focus {
                        outline: none;
                        border-color: #FFDA71;
                    }

                    .member-list {
                        max-height: 200px;
                        overflow-y: auto;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        margin-top: 8px;
                        background: #1e293b;
                    }

                    .loading-state {
                        display: flex;
                        justify-content: center;
                        padding: 20px;
                        color: #94a3b8;
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
                        background: #334155;
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
                        color: #f1f5f9;
                    }

                    .member-company {
                        font-size: 12px;
                        color: #94a3b8;
                    }

                    /* Selected Member Card Styles */
                    .selected-member-card {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: rgba(255, 218, 113, 0.08);
                        border: 2px solid rgba(255, 218, 113, 0.4);
                        border-radius: 8px;
                        position: relative;
                    }

                    .selected-avatar {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        object-fit: cover;
                    }

                    .selected-info {
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                    }

                    .selected-name {
                        font-weight: 600;
                        color: #f1f5f9;
                        font-size: 15px;
                    }

                    .selected-company {
                        font-size: 13px;
                        color: #94a3b8;
                    }

                    .remove-selection-btn {
                        background: rgba(220, 38, 38, 0.15);
                        border: none;
                        border-radius: 6px;
                        padding: 8px;
                        cursor: pointer;
                        color: #f87171;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .remove-selection-btn:hover {
                        background: rgba(220, 38, 38, 0.25);
                        transform: scale(1.05);
                    }

                    .remove-selection-btn:active {
                        transform: scale(0.95);
                    }

                    .currency-input {
                        display: flex;
                        align-items: center;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        overflow: hidden;
                        background: #1e293b;
                    }

                    .currency-prefix {
                        background: #334155;
                        padding: 12px;
                        color: #94a3b8;
                        font-weight: 600;
                    }

                    .currency-input input {
                        border: none;
                        border-radius: 0;
                        flex: 1;
                        background: transparent;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        margin-top: 24px;
                    }

                    .btn-secondary {
                        padding: 12px 20px;
                        border: 1px solid #334155;
                        background: #1e293b;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        color: #94a3b8;
                    }

                    .btn-secondary:hover {
                        background: #334155;
                        color: #f1f5f9;
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
                `}</style>
            </div>
        </div>
    );
};

export default RegisterDealModal;
