// ============================================
// CONTENT TAB — Analytics Dashboard
// ============================================
// Section clicks, Top videos/articles/events, file downloads, top downloaders

import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Video, FileText, Activity, Users, Download,
    BarChart3, Image, Wrench,
} from 'lucide-react';
import {
    analyticsService,
    TopContent,
    EventBreakdown,
} from '../../../services/analyticsService';
import { getFileDownloadStats, FileDownloadStat, getTopFileDownloaders, TopDownloader } from '../../../services/filesService';
import { supabase } from '../../../lib/supabase';
import { AdminEmptyState } from '../shared';
import {
    AnalyticsTabProps,
    PIE_COLORS,
    periodToDays,
    periodLabel,
} from './analyticsUtils';

interface SectionClickStats {
    kpis: { gallery_views: number; solution_clicks: number; report_views: number; file_downloads: number };
    top_galleries: { name: string; count: number }[];
    top_solutions: { name: string; count: number }[];
    top_reports: { name: string; count: number }[];
}

export const ContentTab: React.FC<AnalyticsTabProps> = ({ period }) => {
    const [topVideos, setTopVideos] = useState<TopContent[]>([]);
    const [topArticles, setTopArticles] = useState<TopContent[]>([]);
    const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
    const [fileStats, setFileStats] = useState<FileDownloadStat[]>([]);
    const [topDownloaders, setTopDownloaders] = useState<TopDownloader[]>([]);
    const [sectionStats, setSectionStats] = useState<SectionClickStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const days = periodToDays(period);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const [videosData, articlesData, breakdownData] = await Promise.all([
                    analyticsService.getTopVideos(5, days),
                    analyticsService.getTopArticles(5, days),
                    analyticsService.getEventBreakdown(days),
                ]);
                if (cancelled) return;
                setTopVideos(videosData);
                setTopArticles(articlesData);
                setEventBreakdown(breakdownData);

                // Non-blocking secondary fetches
                getFileDownloadStats(period).then(d => { if (!cancelled) setFileStats(d); }).catch(console.error);
                getTopFileDownloaders(period).then(d => { if (!cancelled) setTopDownloaders(d); }).catch(console.error);
                Promise.resolve(supabase.rpc('get_section_click_stats', { p_days: days }))
                    .then(({ data }) => { if (data && !cancelled) setSectionStats(data as SectionClickStats); })
                    .catch(console.error);
            } catch (error) {
                console.error('Error loading content data:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [period, days]);

    if (isLoading && topVideos.length === 0) {
        return <div className="text-center text-slate-500 py-12">Carregando conteúdo...</div>;
    }

    return (
        <>
            {/* Section Click KPIs */}
            {sectionStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Galeria', value: sectionStats.kpis.gallery_views, icon: <Image size={20} className="text-pink-400" />, bg: 'bg-pink-500/10' },
                        { label: 'Soluções', value: sectionStats.kpis.solution_clicks, icon: <Wrench size={20} className="text-purple-400" />, bg: 'bg-purple-500/10' },
                        { label: 'Relatórios', value: sectionStats.kpis.report_views, icon: <BarChart3 size={20} className="text-amber-400" />, bg: 'bg-amber-500/10' },
                        { label: 'Arquivos', value: sectionStats.kpis.file_downloads, icon: <Download size={20} className="text-teal-400" />, bg: 'bg-teal-500/10' },
                    ].map(item => (
                        <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded-lg ${item.bg}`}>{item.icon}</div>
                                <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{item.value.toLocaleString('pt-BR')}</p>
                            <p className="text-[10px] text-slate-500 mt-1">cliques · {periodLabel(period)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Content + Event Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Videos */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Video size={20} className="text-purple-500" />
                        <h3 className="font-bold text-white">Top Vídeos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {topVideos.length > 0 ? (
                        <div className="space-y-3">
                            {topVideos.map((video, index) => (
                                <div key={video.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">#{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{video.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                        {video.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState icon={<Video size={36} />} message="Nenhum vídeo assistido" />
                    )}
                </div>

                {/* Top Articles */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Top Artigos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {topArticles.length > 0 ? (
                        <div className="space-y-3">
                            {topArticles.map((article, index) => (
                                <div key={article.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">#{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{article.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                                        {article.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState icon={<FileText size={36} />} message="Nenhum artigo lido" />
                    )}
                </div>

                {/* Event Breakdown - Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={20} className="text-emerald-500" />
                        <h3 className="font-bold text-white">Tipos de Evento</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {eventBreakdown.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={eventBreakdown.slice(0, 5)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {eventBreakdown.slice(0, 5).map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 space-y-1">
                                {eventBreakdown.slice(0, 5).map((event, index) => (
                                    <div key={event.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                            <span className="text-slate-400">{event.name.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-white font-bold">{event.value.toLocaleString('pt-BR')}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState icon={<Activity size={36} />} message="Nenhum evento registrado" />
                    )}
                </div>
            </div>

            {/* FILE DOWNLOADS SECTION */}
            {fileStats.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Download size={20} className="text-teal-500" />
                        <h3 className="font-bold text-white">Downloads de Arquivos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {fileStats.filter(s => s.total_downloads > 0).slice(0, 10).map((stat, index) => (
                            <div key={stat.file_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-xs font-bold text-slate-500 w-5 text-right">#{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{stat.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {stat.file_type.toUpperCase()} · {stat.unique_downloaders} sócio{Number(stat.unique_downloaders) !== 1 ? 's' : ''} único{Number(stat.unique_downloaders) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-teal-400">{stat.total_downloads}</span>
                                    <p className="text-[10px] text-slate-500">downloads</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {fileStats.filter(s => s.total_downloads > 0).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">Nenhum download no período.</p>
                    )}
                </div>
            )}

            {/* TOP DOWNLOADERS SECTION */}
            {topDownloaders.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-yellow-500" />
                        <h3 className="font-bold text-white">Sócios Mais Engajados (Downloads)</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {topDownloaders.slice(0, 10).map((user, index) => (
                            <div key={user.user_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className={`text-xs font-bold w-5 text-right ${
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-slate-300' :
                                    index === 2 ? 'text-amber-600' :
                                    'text-slate-500'
                                }`}>
                                    #{index + 1}
                                </span>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 shrink-0">
                                    {user.user_image ? (
                                        <img src={user.user_image} alt={user.user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                            {user.user_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate font-medium">{user.user_name}</p>
                                    {user.user_company && (
                                        <p className="text-xs text-slate-500 truncate">{user.user_company}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-yellow-400">{user.total_downloads}</span>
                                    <p className="text-[10px] text-slate-500">
                                        {user.unique_files} arquivo{Number(user.unique_files) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOP ITEMS BY SECTION */}
            {sectionStats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                        { title: 'Top Galerias', items: sectionStats.top_galleries, icon: <Image size={20} className="text-pink-400" />, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                        { title: 'Top Soluções', items: sectionStats.top_solutions, icon: <Wrench size={20} className="text-purple-400" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { title: 'Top Relatórios', items: sectionStats.top_reports, icon: <BarChart3 size={20} className="text-amber-400" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map(section => (
                        <div key={section.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                {section.icon}
                                <h3 className="font-bold text-white">{section.title}</h3>
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                                    {periodLabel(period)}
                                </span>
                            </div>
                            {section.items.length > 0 ? (
                                <div className="space-y-3">
                                    {section.items.map((item, index) => (
                                        <div key={item.name} className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-500 w-5">#{index + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{item.name}</p>
                                            </div>
                                            <span className={`text-xs font-bold ${section.color} ${section.bg} px-2 py-1 rounded`}>
                                                {item.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <AdminEmptyState icon={section.icon} message="Nenhum clique registrado" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};
