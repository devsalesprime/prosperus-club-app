// components/business/ReferralCard.tsx
// Card de indicação individual - Prosperus Club App v2.5

import React, { useState } from 'react';
import { Mail, Phone, FileText, ChevronDown, Loader2, MessageSquare, AlertTriangle } from 'lucide-react';
import { Referral, ReferralStatus } from '../../types';
import { businessService } from '../../services/businessService';

/** Formats a phone string: removes junk chars (commas, dots, spaces) and formats as (XX) XXXXX-XXXX */
const formatPhone = (raw: string): string => {
    // Strip everything that isn't a digit
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Fallback: just strip commas and extra spaces
    return raw.replace(/,/g, '').trim();
};

interface ReferralCardProps {
    referral: Referral;
    viewType: 'sent' | 'received';
    onStatusChange: () => void;
}

const statusConfig: Record<ReferralStatus, { label: string; color: string; bg: string }> = {
    NEW: { label: 'Novo', color: '#3b82f6', bg: '#dbeafe' },
    IN_PROGRESS: { label: 'Em Andamento', color: '#f59e0b', bg: '#fef3c7' },
    CONVERTED: { label: 'Convertido', color: '#10b981', bg: '#d1fae5' },
    LOST: { label: 'Perdido', color: '#ef4444', bg: '#fee2e2' },
    CONTESTED: { label: 'Contestado', color: '#f97316', bg: '#fff7ed' }
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const ReferralCard: React.FC<ReferralCardProps> = ({
    referral,
    viewType,
    onStatusChange
}) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showConvertInput, setShowConvertInput] = useState(false);
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [showContestInput, setShowContestInput] = useState(false);
    const [convertAmount, setConvertAmount] = useState('');
    const [feedback, setFeedback] = useState('');
    const [contestReason, setContestReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const partner = viewType === 'sent' ? referral.receiver : referral.referrer;
    const config = statusConfig[referral.status];
    const canChangeStatus = viewType === 'received' && referral.status !== 'CONVERTED' && referral.status !== 'CONTESTED';
    const canContest = viewType === 'received' && (referral.status === 'NEW' || referral.status === 'IN_PROGRESS');

    const formatAmount = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const cents = parseInt(numbers) || 0;
        return (cents / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const parseAmount = (): number => {
        return parseFloat(convertAmount.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handleStatusChange = async (newStatus: ReferralStatus) => {
        if (newStatus === 'CONVERTED') {
            setShowConvertInput(true);
            setShowStatusMenu(false);
            return;
        }

        if (newStatus === 'LOST') {
            setShowFeedbackInput(true);
            setShowStatusMenu(false);
            return;
        }

        setLoading(true);
        try {
            await businessService.updateReferralStatus(referral.id, newStatus);
            onStatusChange();
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setLoading(false);
            setShowStatusMenu(false);
        }
    };

    const handleConvert = async () => {
        const amount = parseAmount();
        if (amount <= 0) return;

        setLoading(true);
        try {
            await businessService.updateReferralStatus(referral.id, 'CONVERTED', {
                converted_amount: amount
            });
            onStatusChange();
            setShowConvertInput(false);
        } catch (error) {
            console.error('Error converting:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLost = async () => {
        if (!feedback.trim()) return;

        setLoading(true);
        try {
            await businessService.updateReferralStatus(referral.id, 'LOST', {
                feedback: feedback.trim()
            });
            onStatusChange();
            setShowFeedbackInput(false);
        } catch (error) {
            console.error('Error marking as lost:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContest = async () => {
        if (!contestReason.trim()) return;

        setLoading(true);
        try {
            await businessService.contestReferral(referral.id, contestReason.trim());
            onStatusChange();
            setShowContestInput(false);
        } catch (error) {
            console.error('Error contesting referral:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="referral-card">
            <div className="card-header">
                <div className="lead-info">
                    <h3 className="lead-name">{referral.lead_name}</h3>
                    <div className="partner-row">
                        <img
                            src={partner?.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`}
                            alt={partner?.name}
                            className="partner-avatar"
                        />
                        <span className="partner-name">
                            {viewType === 'sent' ? 'Para: ' : 'De: '}
                            {partner?.name}
                        </span>
                    </div>
                </div>

                <div className="status-section">
                    {canChangeStatus ? (
                        <div className="status-dropdown">
                            <button
                                className="status-badge clickable"
                                style={{ background: config.bg, color: config.color }}
                                onClick={() => setShowStatusMenu(!showStatusMenu)}
                            >
                                {config.label}
                                <ChevronDown size={14} />
                            </button>

                            {showStatusMenu && (
                                <div className="status-menu">
                                    {Object.entries(statusConfig)
                                        .filter(([key]) => key !== 'CONTESTED')
                                        .map(([key, val]) => (
                                            <button
                                                key={key}
                                                className="status-option"
                                                onClick={() => handleStatusChange(key as ReferralStatus)}
                                                disabled={loading}
                                            >
                                                <span className="dot" style={{ background: val.color }} />
                                                {val.label}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="status-badge"
                            style={{ background: config.bg, color: config.color }}
                        >
                            {config.label}
                        </div>
                    )}
                </div>
            </div>

            {/* Convert Input Modal */}
            {showConvertInput && (
                <div className="action-form">
                    <label>Valor do negócio fechado:</label>
                    <div className="currency-input">
                        <span>R$</span>
                        <input
                            type="text"
                            value={convertAmount}
                            onChange={e => setConvertAmount(formatAmount(e.target.value))}
                            placeholder="0,00"
                            autoFocus
                        />
                    </div>
                    <div className="form-actions">
                        <button onClick={() => setShowConvertInput(false)}>Cancelar</button>
                        <button
                            className="btn-confirm"
                            onClick={handleConvert}
                            disabled={loading || parseAmount() <= 0}
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar Conversão'}
                        </button>
                    </div>
                </div>
            )}

            {/* Feedback Input for Lost */}
            {showFeedbackInput && (
                <div className="action-form">
                    <label>Motivo da perda:</label>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Descreva o motivo pelo qual o lead não converteu..."
                        rows={3}
                        autoFocus
                    />
                    <div className="form-actions">
                        <button onClick={() => setShowFeedbackInput(false)}>Cancelar</button>
                        <button
                            className="btn-lost"
                            onClick={handleLost}
                            disabled={loading || !feedback.trim()}
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Marcar como Perdido'}
                        </button>
                    </div>
                </div>
            )}

            {/* Contest Input */}
            {showContestInput && (
                <div className="action-form">
                    <label>Motivo da contestação:</label>
                    <textarea
                        value={contestReason}
                        onChange={e => setContestReason(e.target.value)}
                        placeholder="Descreva por que está contestando esta indicação..."
                        rows={3}
                        autoFocus
                    />
                    <div className="form-actions">
                        <button onClick={() => setShowContestInput(false)}>Cancelar</button>
                        <button
                            className="btn-contest"
                            onClick={handleContest}
                            disabled={loading || !contestReason.trim()}
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar Contestação'}
                        </button>
                    </div>
                </div>
            )}

            {/* Contest Button */}
            {canContest && !showContestInput && (
                <button
                    className="contest-btn"
                    onClick={() => setShowContestInput(true)}
                >
                    <AlertTriangle size={14} />
                    Contestar Indicação
                </button>
            )}

            {/* Contact Info */}
            <div className="contact-info">
                {referral.lead_email && (
                    <a href={`mailto:${referral.lead_email}`} className="contact-item">
                        <Mail size={14} />
                        {referral.lead_email}
                    </a>
                )}
                {referral.lead_phone && (
                    <a href={`tel:${referral.lead_phone.replace(/\D/g, '')}`} className="contact-item">
                        <Phone size={14} />
                        {formatPhone(referral.lead_phone)}
                    </a>
                )}
            </div>

            {/* Converted Amount */}
            {referral.status === 'CONVERTED' && referral.converted_amount && (
                <div className="converted-amount">
                    💰 Valor convertido: {formatCurrency(referral.converted_amount)}
                </div>
            )}

            {/* Feedback for Lost (visible to referrer) */}
            {viewType === 'sent' && referral.status === 'LOST' && referral.feedback && (
                <div className="feedback-box">
                    <MessageSquare size={14} />
                    <div>
                        <strong>Feedback:</strong>
                        <p>{referral.feedback}</p>
                    </div>
                </div>
            )}

            {/* Contestation reason (visible to referrer) */}
            {viewType === 'sent' && referral.status === 'CONTESTED' && referral.feedback && (
                <div className="feedback-box contest">
                    <AlertTriangle size={14} />
                    <div>
                        <strong>Motivo da contestação:</strong>
                        <p>{referral.feedback}</p>
                    </div>
                </div>
            )}

            {/* Notes (expandable) */}
            {referral.notes && (
                <div className="notes-section">
                    <button
                        className="notes-toggle"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <FileText size={14} />
                        {expanded ? 'Ocultar notas' : 'Ver notas'}
                    </button>
                    {expanded && (
                        <p className="notes-content">{referral.notes}</p>
                    )}
                </div>
            )}

            <style>{`
                .referral-card {
                    background: #1e293b;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    margin-bottom: 12px;
                    border: 1px solid #334155;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .lead-name {
                    margin: 0 0 8px;
                    font-size: 18px;
                    color: #f1f5f9;
                }

                .partner-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .partner-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .partner-name {
                    font-size: 13px;
                    color: #94a3b8;
                }

                .status-dropdown {
                    position: relative;
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    border: none;
                }

                .status-badge.clickable {
                    cursor: pointer;
                }

                .status-menu {
                    position: absolute;
                    right: 0;
                    top: 100%;
                    margin-top: 4px;
                    background: #0f172a;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                    overflow: hidden;
                    z-index: 10;
                    min-width: 150px;
                    border: 1px solid #334155;
                }

                .status-option {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 12px 16px;
                    border: none;
                    background: transparent;
                    color: #f1f5f9;
                    text-align: left;
                    cursor: pointer;
                    font-size: 14px;
                }

                .status-option:hover {
                    background: #1e293b;
                }

                .status-option .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .action-form {
                    background: #0f172a;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border: 1px solid #334155;
                }

                .action-form label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    font-size: 14px;
                    color: #e2e8f0;
                }

                .currency-input {
                    display: flex;
                    align-items: center;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }

                .currency-input span {
                    padding: 12px;
                    background: #334155;
                    color: #94a3b8;
                    font-weight: 600;
                }

                .currency-input input {
                    flex: 1;
                    border: none;
                    padding: 12px;
                    font-size: 16px;
                    background: transparent;
                    color: #f1f5f9;
                }

                .action-form textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    font-size: 14px;
                    resize: none;
                    background: #1e293b;
                    color: #f1f5f9;
                }

                .form-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .form-actions button {
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                }

                .form-actions button:first-child {
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #94a3b8;
                }

                .btn-confirm {
                    background: #10b981;
                    border: none;
                    color: white;
                }

                .btn-lost {
                    background: #ef4444;
                    border: none;
                    color: white;
                }

                .btn-contest {
                    background: #f97316;
                    border: none;
                    color: white;
                }

                .contest-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px dashed #f97316;
                    background: rgba(249, 115, 22, 0.1);
                    color: #fb923c;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 12px;
                    justify-content: center;
                }

                .contest-btn:hover {
                    background: rgba(249, 115, 22, 0.2);
                }

                .feedback-box.contest {
                    background: rgba(249, 115, 22, 0.1);
                    color: #fb923c;
                }

                .contact-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #60a5fa;
                    font-size: 13px;
                    text-decoration: none;
                }

                .converted-amount {
                    background: rgba(16, 185, 129, 0.15);
                    color: #34d399;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 12px;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .feedback-box {
                    display: flex;
                    gap: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    color: #fca5a5;
                }

                .feedback-box strong {
                    display: block;
                    margin-bottom: 4px;
                }

                .feedback-box p {
                    margin: 0;
                    font-size: 14px;
                }

                .notes-section {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #334155;
                }

                .notes-toggle {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 13px;
                }

                .notes-content {
                    margin: 12px 0 0;
                    color: #94a3b8;
                    font-size: 14px;
                    line-height: 1.5;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ReferralCard;
