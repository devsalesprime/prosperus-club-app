// components/business/TopRankingPreview.tsx
// Top 3 Ranking Preview - Prosperus Club App v2.8

import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, ArrowRight, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { businessService, RankingEntry } from '../../services/businessService';
import { Avatar } from '../ui/Avatar';

interface TopRankingPreviewProps {
    onViewFullRankings: () => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getMedalColor = (position: number): string => {
    switch (position) {
        case 1: return 'border-yellow-400'; // Gold
        case 2: return 'border-slate-300'; // Silver
        case 3: return 'border-amber-700'; // Bronze
        default: return 'border-slate-600';
    }
};

const getMedalEmoji = (position: number): string => {
    switch (position) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏅';
    }
};

export const TopRankingPreview: React.FC<TopRankingPreviewProps> = ({ onViewFullRankings }) => {
    const [topSellers, setTopSellers] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(true); // Accordion state - default open for consistency with ROI widget

    useEffect(() => {
        const loadTopSellers = async () => {
            try {
                const data = await businessService.getTopSellers();
                setTopSellers(data.slice(0, 3)); // Top 3 only
            } catch (error) {
                console.error('Failed to load top sellers:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTopSellers();
    }, []);

    // Loading State
    if (loading) {
        return (
            <div className="top-ranking-preview">
                <div className="ranking-header">
                    <Trophy className="trophy-icon" size={20} />
                    <h3>Top Sócios (Vendas)</h3>
                </div>
                <div className="loading-state">
                    <Loader2 className="animate-spin" size={32} />
                    <p>Carregando ranking...</p>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // Empty State
    if (topSellers.length === 0) {
        return (
            <div className="top-ranking-preview">
                <div className="ranking-header">
                    <Trophy className="trophy-icon" size={20} />
                    <h3>Top Sócios (Vendas)</h3>
                </div>
                <div className="empty-state">
                    <Trophy size={48} className="empty-icon" />
                    <h4>O Ranking começou!</h4>
                    <p>Seja o primeiro a registrar um negócio.</p>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // Podium Layout
    return (
        <div className="top-ranking-preview">
            {/* Clickable Header */}
            <div
                className="ranking-header"
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                aria-expanded={isOpen}
                aria-label="Toggle ranking details"
                style={{
                    marginBottom: isOpen ? '20px' : '0'
                }}
            >
                <Trophy className="trophy-icon" size={20} />
                <h3>Top Sócios (Vendas)</h3>
                {isOpen ? (
                    <ChevronUp className="chevron-icon" size={20} />
                ) : (
                    <ChevronDown className="chevron-icon" size={20} />
                )}
            </div>

            {/* Collapsible Content */}
            <div
                className="ranking-content"
                style={{
                    maxHeight: isOpen ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                }}
            >

                <div className="podium-container">
                    {topSellers.map((seller, index) => {
                        const position = index + 1;
                        const medalColor = getMedalColor(position);
                        const medalEmoji = getMedalEmoji(position);

                        return (
                            <div key={seller.user_id} className={`podium-card position-${position}`}>
                                <div className="medal-badge">{medalEmoji}</div>
                                <div className={`avatar-wrapper ${medalColor}`}>
                                    <Avatar
                                        src={seller.image_url}
                                        alt={seller.name}
                                        size="xl"
                                    />
                                </div>
                                <div className="seller-info">
                                    <p className="seller-name">{seller.name}</p>
                                    <p className="seller-amount">
                                        <TrendingUp size={20} className="trend-icon" />
                                    </p>
                                    <p className="seller-deals">
                                        {seller.deal_count || 0} negócio{seller.deal_count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button className="view-full-btn" onClick={onViewFullRankings}>
                    Ver Ranking Completo
                    <ArrowRight size={16} />
                </button>
            </div>

            <style>{styles}</style>
        </div>
    );
};

const styles = `
            .top-ranking-preview {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 20px;
            color: white;
    }

            .ranking-header {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
    }

    .ranking-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: #FFDA71;
        margin: 0;
        flex-grow: 1;
    }

    .chevron-icon {
        color: #FFDA71;
        transition: transform 0.2s ease;
    }

            .trophy-icon {
                color: #FFDA71;
    }

            /* Loading State */
            .loading-state {
                display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            gap: 12px;
            color: #94a3b8;
    }

            /* Empty State */
            .empty-state {
                display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
    }

            .empty-icon {
                color: #475569;
            margin-bottom: 16px;
    }

            .empty-state h4 {
                font - size: 18px;
            font-weight: 600;
            color: #e2e8f0;
            margin: 0 0 8px 0;
    }

            .empty-state p {
                font - size: 14px;
            color: #94a3b8;
            margin: 0;
    }

            /* Podium Container */
            .podium-container {
                display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 20px;
    }

            @media (max-width: 640px) {
        .podium - container {
                grid - template - columns: 1fr;
        }
    }

            /* Podium Card */
            .podium-card {
                background: rgba(255, 255, 255, 0.05);
            border: 2px solid transparent;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
    }

            .podium-card:hover {
                transform: translateY(-4px);
    }

            /* Position-specific styling */
            .podium-card.position-1 {
                background: linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%);
            border-color: rgba(250, 204, 21, 0.3);
    }

            .podium-card.position-1:hover {
                box - shadow: 0 8px 24px rgba(250, 204, 21, 0.2);
    }

            .podium-card.position-2 {
                background: linear-gradient(135deg, rgba(226, 232, 240, 0.1) 0%, rgba(203, 213, 225, 0.05) 100%);
            border-color: rgba(226, 232, 240, 0.3);
    }

            .podium-card.position-2:hover {
                box - shadow: 0 8px 24px rgba(226, 232, 240, 0.2);
    }

            .podium-card.position-3 {
                background: linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%);
            border-color: rgba(217, 119, 6, 0.3);
    }

            .podium-card.position-3:hover {
                box - shadow: 0 8px 24px rgba(217, 119, 6, 0.2);
    }

            /* Medal Badge */
            .medal-badge {
                position: absolute;
            top: -12px;
            right: 12px;
            font-size: 24px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

            /* Avatar Wrapper */
            .avatar-wrapper {
                width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
    }

            .avatar-wrapper.border-yellow-400 {
                border - color: #facc15;
            box-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
    }

            .avatar-wrapper.border-slate-300 {
                border - color: #cbd5e1;
            box-shadow: 0 0 20px rgba(203, 213, 225, 0.3);
    }

            .avatar-wrapper.border-amber-700 {
                border - color: #b45309;
            box-shadow: 0 0 20px rgba(180, 83, 9, 0.3);
    }

            /* Seller Info */
            .seller-info {
                width: 100%;
    }

            .seller-name {
                font - size: 14px;
            font-weight: 600;
            color: #f1f5f9;
            margin: 0 0 6px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
    }

            .seller-amount {
                font - size: 16px;
            font-weight: 700;
            color: #FFDA71;
            margin: 0 0 4px 0;
    }

            .seller-deals {
                font - size: 12px;
            color: #94a3b8;
            margin: 0;
    }

    .trend-icon {
        color: #10b981;
    }

            /* View Full Button */
            .view-full-btn {
                width: 100%;
            background: transparent;
            border: 1px solid #475569;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
    }

            .view-full-btn:hover {
                background: rgba(255, 218, 113, 0.1);
            border-color: #FFDA71;
            color: #FFDA71;
    }
            `;

export default TopRankingPreview;
