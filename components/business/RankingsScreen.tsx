// components/business/RankingsScreen.tsx
// Tela de Rankings de Performance - Prosperus Club App v2.5

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Users, TrendingUp, Loader2, Medal } from 'lucide-react';
import { RankingEntry } from '../../types';
import { businessService } from '../../services/businessService';
import { supabase } from '../../lib/supabase';
import { ProfilePreview } from '../ProfilePreview';
import { profileService, ProfileData } from '../../services/profileService';

type TabType = 'sellers' | 'referrers';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getMedalColor = (position: number) => {
    switch (position) {
        case 1: return '#FFD700'; // Gold
        case 2: return '#C0C0C0'; // Silver
        case 3: return '#CD7F32'; // Bronze
        default: return '#999';
    }
};

export const RankingsScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('sellers');
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState<string | null>(null); // userId being loaded

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getUser();
    }, []);

    const loadRankings = async () => {
        setLoading(true);
        try {
            console.log('[Rankings] Fetching rankings for tab:', activeTab);
            const data = activeTab === 'sellers'
                ? await businessService.getTopSellers()
                : await businessService.getTopReferrers();
            console.log('[Rankings] Received data:', data);
            console.log('[Rankings] Data length:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('[Rankings] First entry:', JSON.stringify(data[0], null, 2));
            }
            setRankings(data);
        } catch (error) {
            console.error('[Rankings] Error loading rankings:', error);
            setRankings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRankings();
    }, [activeTab]);

    const userPosition = rankings.findIndex(r => r.user_id === currentUserId) + 1;
    const userEntry = rankings.find(r => r.user_id === currentUserId);

    const handleProfileClick = async (userId: string) => {
        if (profileLoading) return; // prevent double-clicks
        setProfileLoading(userId);
        try {
            const profile = await profileService.getProfile(userId);
            if (profile) {
                setSelectedProfile(profile);
            }
        } catch (error) {
            console.error('[Rankings] Error loading profile:', error);
        } finally {
            setProfileLoading(null);
        }
    };

    return (
        <div className="rankings-screen">
            <div className="screen-header">
                <Trophy className="header-icon" size={28} />
                <h1>Rankings</h1>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'sellers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sellers')}
                >
                    <TrendingUp size={18} />
                    Top Geradores
                </button>
                <button
                    className={`tab ${activeTab === 'referrers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referrers')}
                >
                    <Users size={18} />
                    Top Indicadores
                </button>
            </div>

            {/* User Position Card */}
            {userEntry && userPosition > 3 && (
                <div className="user-position-card">
                    <span className="position-badge">#{userPosition}</span>
                    <img
                        src={userEntry.image_url || '/default-avatar.svg'}
                        alt="Você"
                        className="user-avatar"
                    />
                    <div className="user-info">
                        <span className="user-name">Você</span>
                        <span className="user-stats">
                            {activeTab === 'sellers'
                                ? <TrendingUp size={18} className="trend-icon" />
                                : `${userEntry.referral_count || 0} indicações`
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Podium for Top 3 */}
            {!loading && rankings.length >= 3 && (
                <div className="podium">
                    {[1, 0, 2].map((index) => {
                        const entry = rankings[index];
                        if (!entry) return null;
                        const position = index + 1;
                        const isCurrentUser = entry.user_id === currentUserId;

                        return (
                            <div
                                key={entry.user_id}
                                className={`podium-item position-${position} ${isCurrentUser ? 'current-user' : ''}`}
                                onClick={() => handleProfileClick(entry.user_id)}
                                style={{ cursor: 'pointer' }}
                            >
                                {profileLoading === entry.user_id && (
                                    <div className="profile-loading-overlay">
                                        <Loader2 className="animate-spin" size={20} />
                                    </div>
                                )}
                                <div className="medal-container">
                                    <Medal size={position === 1 ? 32 : 24} style={{ color: getMedalColor(position) }} />
                                    <span className="position">{position}º</span>
                                </div>
                                <img
                                    src={entry.image_url || '/default-avatar.svg'}
                                    alt={entry.name}
                                    className="podium-avatar"
                                />
                                <span className="podium-name">{entry.name}</span>
                                <span className="podium-value">
                                    {activeTab === 'sellers'
                                        ? <TrendingUp size={20} className="trend-icon" />
                                        : `${entry.referral_count} indicações`
                                    }
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Full Rankings List */}
            <div className="rankings-list">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" size={32} />
                        <span>Carregando ranking...</span>
                    </div>
                ) : rankings.length === 0 ? (
                    <div className="empty-state">
                        <Award size={48} />
                        <h3>Nenhum dado ainda</h3>
                        <p>
                            {activeTab === 'sellers'
                                ? 'Registre negócios para aparecer no ranking!'
                                : 'Envie indicações para aparecer no ranking!'
                            }
                        </p>
                    </div>
                ) : (
                    (rankings.length < 3 ? rankings : rankings.slice(3)).map((entry, index) => {
                        const position = rankings.length < 3 ? index + 1 : index + 4;
                        const isCurrentUser = entry.user_id === currentUserId;

                        return (
                            <div
                                key={entry.user_id}
                                className={`ranking-item ${isCurrentUser ? 'current-user' : ''}`}
                                onClick={() => handleProfileClick(entry.user_id)}
                                style={{ cursor: 'pointer' }}
                            >
                                {profileLoading === entry.user_id && (
                                    <Loader2 className="animate-spin" size={16} style={{ color: '#FFDA71' }} />
                                )}
                                <span className="position-number">{position}</span>
                                <img
                                    src={entry.image_url || '/default-avatar.svg'}
                                    alt={entry.name}
                                    className="item-avatar"
                                />
                                <div className="item-info">
                                    <span className="item-name">
                                        {entry.name}
                                        {isCurrentUser && <span className="you-badge">Você</span>}
                                    </span>
                                    {activeTab === 'sellers' && (
                                        <span className="item-deals">{entry.deal_count} negócios</span>
                                    )}
                                    {activeTab === 'referrers' && entry.converted_count !== undefined && (
                                        <span className="item-deals">{entry.converted_count} convertidas</span>
                                    )}
                                </div>
                                <span className="item-value">
                                    {activeTab === 'sellers'
                                        ? <TrendingUp size={18} className="trend-icon" />
                                        : entry.referral_count
                                    }
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                .rankings-screen {
                    padding: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .screen-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .header-icon {
                    color: #FFDA71;
                }

                .screen-header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #f1f5f9;
                }

                .tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    background: #1e293b;
                    padding: 4px;
                    border-radius: 10px;
                }

                .tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    font-weight: 600;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab.active {
                    background: #334155;
                    color: #f1f5f9;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .user-position-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: linear-gradient(135deg, #031A2B 0%, #0A2E47 100%);
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    color: white;
                }

                .position-badge {
                    background: #FFDA71;
                    color: #031A2B;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 14px;
                }

                .user-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #FFDA71;
                }

                .user-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 600;
                }

                .user-stats {
                    font-size: 14px;
                    opacity: 0.8;
                }

                .podium {
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding: 20px 0;
                }

                .podium-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 16px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .podium-item:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(255, 218, 113, 0.2);
                }

                .podium-item.position-1:hover {
                    transform: scale(1.15);
                }

                .profile-loading-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 5;
                    border-radius: 12px;
                    color: #FFDA71;
                }

                .podium-item.current-user {
                    box-shadow: 0 4px 20px rgba(255, 218, 113, 0.3);
                    border: 2px solid #FFDA71;
                }

                .podium-item.position-1 {
                    order: 2;
                    transform: scale(1.1);
                    z-index: 2;
                }

                .podium-item.position-2 {
                    order: 1;
                }

                .podium-item.position-3 {
                    order: 3;
                }

                .medal-container {
                    position: relative;
                    margin-bottom: 8px;
                }

                .medal-container .position {
                    position: absolute;
                    bottom: -4px;
                    right: -8px;
                    background: #334155;
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 10px;
                }

                .podium-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    object-fit: cover;
                    margin-bottom: 8px;
                }

                .position-1 .podium-avatar {
                    width: 80px;
                    height: 80px;
                }

                .podium-name {
                    font-weight: 600;
                    color: #f1f5f9;
                    font-size: 14px;
                    text-align: center;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .podium-value {
                    color: #10b981;
                    font-weight: 700;
                    font-size: 13px;
                    margin-top: 4px;
                }

                .trend-icon {
                    color: #10b981;
                }

                .rankings-list {
                    min-height: 200px;
                }

                .ranking-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #f1f5f9 !important;
                    padding: 12px 16px;
                    border-radius: 10px;
                    margin-bottom: 8px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: background 0.2s, border-color 0.2s;
                }

                .ranking-item:hover {
                    background: #273548;
                    border-color: rgba(255, 218, 113, 0.3);
                }

                .ranking-item.current-user {
                    background: rgba(255, 218, 113, 0.08);
                    border: 1px solid rgba(255, 218, 113, 0.4);
                }

                .position-number {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #334155;
                    border-radius: 50%;
                    font-weight: 700;
                    font-size: 13px;
                    color: #94a3b8;
                }

                .item-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .item-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .item-name {
                    font-weight: 600;
                    color: #f1f5f9;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .you-badge {
                    background: #FFDA71;
                    color: #031A2B;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 700;
                }

                .item-deals {
                    font-size: 12px;
                    color: #94a3b8;
                }

                .item-value {
                    font-weight: 700;
                    color: #10b981;
                    font-size: 14px;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: #94a3b8;
                    gap: 12px;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 60px 20px;
                    color: #64748b;
                }

                .empty-state h3 {
                    color: #e2e8f0;
                    margin: 16px 0 8px;
                }

                .empty-state p {
                    margin: 0;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>

            {/* Profile Preview Modal */}
            {selectedProfile && (
                <ProfilePreview
                    profile={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                    currentUserId={currentUserId}
                />
            )}
        </div>
    );
};

export default RankingsScreen;
