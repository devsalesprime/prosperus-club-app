// ============================================
// UserActivityDetail.tsx — Admin Component
// ============================================
// Deep-dive view of a single user's activity data
// Triggered from the Members table or Analytics dashboard
// Uses RPCs: get_user_activity_summary, get_user_activity_timeline, get_user_recent_events

import React, { useState, useEffect } from 'react';
import {
    X, Activity, Clock, Video, MessageCircle, FileText,
    LogIn, Eye, Search, Bell, AlertTriangle, BarChart3,
    Wrench, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivitySummary {
    event_type: string;
    event_count: number;
    last_at: string;
}

interface TimelineDay {
    date: string;
    label: string;
    count: number;
}

interface RecentEvent {
    event_id: string;
    event_type: string;
    metadata: Record<string, any> | null;
    created_at: string;
}

interface Props {
    userId: string;
    userName: string;
    userImage: string | null;
    onClose: () => void;
}

// ─── Event Icons & Labels ────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    PAGE_VIEW:          { icon: <Eye size={14} />,            label: 'Navegação',           color: 'text-blue-400' },
    VIDEO_START:        { icon: <Video size={14} />,          label: 'Vídeo Iniciado',      color: 'text-purple-400' },
    VIDEO_COMPLETE:     { icon: <Video size={14} />,          label: 'Vídeo Concluído',     color: 'text-emerald-400' },
    VIDEO_PROGRESS:     { icon: <Video size={14} />,          label: 'Progresso Vídeo',     color: 'text-purple-300' },
    ARTICLE_READ:       { icon: <FileText size={14} />,       label: 'Artigo Lido',         color: 'text-orange-400' },
    MESSAGE_SENT:       { icon: <MessageCircle size={14} />,  label: 'Mensagem Enviada',    color: 'text-cyan-400' },
    APP_OPEN:           { icon: <LogIn size={14} />,          label: 'Acesso ao App',       color: 'text-green-400' },
    LOGIN:              { icon: <LogIn size={14} />,          label: 'Login',               color: 'text-green-400' },
    LOGOUT:             { icon: <LogIn size={14} />,          label: 'Logout',              color: 'text-slate-400' },
    NOTIFICATION_CLICK: { icon: <Bell size={14} />,           label: 'Notificação',         color: 'text-yellow-400' },
    SEARCH:             { icon: <Search size={14} />,         label: 'Busca',               color: 'text-indigo-400' },
    TOOL_VIEW:          { icon: <Wrench size={14} />,         label: 'Ferramenta',          color: 'text-pink-400' },
    FILE_DOWNLOAD:      { icon: <Download size={14} />,       label: 'Download',            color: 'text-teal-400' },
    REPORT_VIEW:        { icon: <BarChart3 size={14} />,      label: 'Relatório',           color: 'text-amber-400' },
    EVENT_RSVP:         { icon: <Activity size={14} />,       label: 'RSVP Evento',         color: 'text-violet-400' },
    ERROR:              { icon: <AlertTriangle size={14} />,  label: 'Erro',                color: 'text-red-400' },
};

function getEventConfig(type: string) {
    return EVENT_CONFIG[type] || { icon: <Activity size={14} />, label: type, color: 'text-slate-400' };
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'ontem';
    return `${days}d atrás`;
}

function formatEventDetail(event: RecentEvent): string {
    const m = event.metadata;
    if (!m) return '';
    switch (event.event_type) {
        case 'PAGE_VIEW': return m.page_name || '';
        case 'VIDEO_START': return m.video_title || '';
        case 'VIDEO_COMPLETE': return m.video_title || '';
        case 'ARTICLE_READ': return m.article_title || '';
        case 'TOOL_VIEW': return m.tool_name || '';
        case 'SEARCH': return `"${m.query || ''}"`;
        case 'FILE_DOWNLOAD': return m.file_name || '';
        case 'REPORT_VIEW': return m.report_name || '';
        default: return '';
    }
}

// ─── Chart Colors ────────────────────────────────────────────────────────────
const CHART_COLORS = {
    primary: '#eab308',
    grid: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const UserActivityDetail: React.FC<Props> = ({ userId, userName, userImage, onClose }) => {
    const [summary, setSummary] = useState<ActivitySummary[]>([]);
    const [timeline, setTimeline] = useState<TimelineDay[]>([]);
    const [events, setEvents] = useState<RecentEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId, period]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');

            const [summaryRes, timelineRes, eventsRes] = await Promise.all([
                supabase.rpc('get_user_activity_summary', { p_user_id: userId, p_days: period }),
                supabase.rpc('get_user_activity_timeline', { p_user_id: userId, p_days: period }),
                supabase.rpc('get_user_recent_events', { p_user_id: userId, p_limit: 100 }),
            ]);

            setSummary((summaryRes.data || []).map((r: any) => ({
                event_type: r.event_type,
                event_count: Number(r.event_count),
                last_at: r.last_at,
            })));

            setTimeline((timelineRes.data || []).map((r: any) => {
                const d = new Date(r.activity_date);
                return {
                    date: r.activity_date,
                    label: `${d.getDate()}/${d.getMonth() + 1}`,
                    count: Number(r.event_count),
                };
            }));

            setEvents((eventsRes.data || []).map((r: any) => ({
                event_id: r.event_id,
                event_type: r.event_type,
                metadata: r.metadata,
                created_at: r.created_at,
            })));
        } catch (err) {
            console.error('Error loading user activity:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalEvents = summary.reduce((s, i) => s + i.event_count, 0);
    const visibleEvents = showAll ? events : events.slice(0, 20);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl my-8 mx-4 shadow-2xl">
                {/* ─── Header ──────────────────────────────── */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        {userImage ? (
                            <img src={userImage} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <Activity size={20} className="text-slate-500" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-white">{userName}</h2>
                            <p className="text-sm text-slate-400">Atividade detalhada</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            {[7, 30, 90].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setPeriod(d)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                                        period === d ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* ─── KPI Row ──────────────────────────── */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-white">{totalEvents.toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-slate-400">Total Eventos</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-white">{summary.length}</p>
                                <p className="text-xs text-slate-400">Tipos de Evento</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-white">
                                    {timeline.filter(d => d.count > 0).length}
                                </p>
                                <p className="text-xs text-slate-400">Dias Ativos</p>
                            </div>
                        </div>

                        {/* ─── Activity Timeline Chart ────────── */}
                        {timeline.length > 0 && (
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-yellow-500" />
                                    Atividade por Dia
                                </h3>
                                <ResponsiveContainer width="100%" height={160}>
                                    <AreaChart data={timeline}>
                                        <defs>
                                            <linearGradient id="userActivityGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                                        <XAxis dataKey="label" stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} />
                                        <YAxis stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                        <Area type="monotone" dataKey="count" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#userActivityGrad)" strokeWidth={2} name="Eventos" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* ─── Event Type Breakdown ───────────── */}
                        {summary.length > 0 && (
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Activity size={16} className="text-yellow-500" />
                                    Distribuição por Tipo
                                </h3>
                                <div className="space-y-2">
                                    {summary.map(item => {
                                        const cfg = getEventConfig(item.event_type);
                                        const pct = totalEvents > 0 ? Math.round((item.event_count / totalEvents) * 100) : 0;
                                        return (
                                            <div key={item.event_type} className="flex items-center gap-3">
                                                <div className={`flex items-center gap-2 w-36 ${cfg.color}`}>
                                                    {cfg.icon}
                                                    <span className="text-xs font-medium truncate">{cfg.label}</span>
                                                </div>
                                                <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-600/60 rounded-full transition-all"
                                                        style={{ width: `${Math.max(pct, 2)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-300 w-12 text-right">
                                                    {item.event_count}
                                                </span>
                                                <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── Recent Events Feed ─────────────── */}
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Clock size={16} className="text-yellow-500" />
                                Eventos Recentes
                            </h3>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {visibleEvents.map(event => {
                                    const cfg = getEventConfig(event.event_type);
                                    const detail = formatEventDetail(event);
                                    return (
                                        <div key={event.event_id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition">
                                            <div className={cfg.color}>{cfg.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-medium text-slate-200">
                                                    {cfg.label}
                                                </span>
                                                {detail && (
                                                    <span className="text-xs text-slate-500 ml-2 truncate">
                                                        — {detail}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-500 shrink-0">
                                                {formatRelativeTime(event.created_at)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {events.length > 20 && (
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="flex items-center gap-1 w-full justify-center mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 hover:text-white transition"
                                >
                                    {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    {showAll ? 'Mostrar menos' : `Ver todos (${events.length})`}
                                </button>
                            )}

                            {events.length === 0 && (
                                <p className="text-xs text-slate-500 text-center py-4">
                                    Nenhum evento registrado para este usuário.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserActivityDetail;
