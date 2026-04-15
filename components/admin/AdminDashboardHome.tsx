import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, PlaySquare, Newspaper, FolderOpen, BellRing, BarChart3, ArrowRight, Image as ImageIcon, Wrench, Target, MessageSquare, Tags, ShieldCheck, GraduationCap, Cake, FileText, LifeBuoy, TrendingUp } from 'lucide-react';
import { AdminViewState } from '../../types';

interface DashboardKpi {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  navigateTo: AdminViewState;
}

export const AdminDashboardHome = ({ setView }: { setView: (view: AdminViewState) => void }) => {
  const [kpis, setKpis] = useState<{ members: number | null; upcomingEvents: number | null; videos: number | null; articles: number | null; files: number | null }>({
    members: null, upcomingEvents: null, videos: null, articles: null, files: null,
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');

        const [membersRes, eventsRes, videosRes, articlesRes, filesRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('club_events').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString()),
          supabase.from('videos').select('*', { count: 'exact', head: true }),
          supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
          supabase.from('member_files').select('*', { count: 'exact', head: true }).eq('is_visible', true),
        ]);

        setKpis({
          members: membersRes.count ?? 0,
          upcomingEvents: eventsRes.count ?? 0,
          videos: videosRes.count ?? 0,
          articles: articlesRes.count ?? 0,
          files: filesRes.count ?? 0,
        });
      } catch (err) {
        console.error('Error loading KPIs:', err);
      } finally {
        setKpiLoading(false);
      }
    };
    loadKpis();
  }, []);

  const kpiCards: DashboardKpi[] = [
    { label: 'Total Cadastrados', value: kpis.members, icon: <Users size={24} />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', navigateTo: AdminViewState.MEMBERS },
    { label: 'Eventos Próximos', value: kpis.upcomingEvents, icon: <CalendarDays size={24} />, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20', navigateTo: AdminViewState.EVENTS },
    { label: 'Vídeos Academy', value: kpis.videos, icon: <PlaySquare size={24} />, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', navigateTo: AdminViewState.VIDEOS },
    { label: 'Artigos Publicados', value: kpis.articles, icon: <Newspaper size={24} />, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20', navigateTo: AdminViewState.ARTICLES },
    { label: 'Arquivos do Clube', value: kpis.files, icon: <FolderOpen size={24} />, color: 'text-teal-400', bgColor: 'bg-teal-500/10 border-teal-500/20', navigateTo: AdminViewState.MEMBER_FILES },
  ];

  const quickActions = [
    { label: 'Criar Evento', icon: <CalendarDays size={18} />, view: AdminViewState.EVENTS, color: 'from-purple-600 to-purple-500' },
    { label: 'Enviar Notificação', icon: <BellRing size={18} />, view: AdminViewState.NOTIFICATIONS, color: 'from-red-600 to-red-500' },
    { label: 'Novo Vídeo', icon: <PlaySquare size={18} />, view: AdminViewState.VIDEOS, color: 'from-amber-600 to-amber-500' },
    { label: 'Ver Analytics', icon: <BarChart3 size={18} />, view: AdminViewState.ANALYTICS, color: 'from-indigo-600 to-indigo-500' },
    { label: 'Benefícios', icon: <ShieldCheck size={18} />, view: AdminViewState.BENEFITS_APPROVAL, color: 'from-emerald-600 to-emerald-500' },
    { label: 'Aniversariantes', icon: <Cake size={18} />, view: AdminViewState.BIRTHDAYS, color: 'from-pink-600 to-pink-500' },
  ];

  const navGroups = [
    {
      title: 'Conteúdo',
      items: [
        { id: AdminViewState.VIDEOS, title: 'Academy', icon: <GraduationCap size={24} className="text-amber-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.ARTICLES, title: 'Notícias', icon: <Newspaper size={24} className="text-blue-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.BANNERS, title: 'Banners', icon: <ImageIcon size={24} className="text-pink-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.GALLERY, title: 'Galeria', icon: <ImageIcon size={24} className="text-cyan-400" />, cta: 'Ver' },
        { id: AdminViewState.MEMBER_FILES, title: 'Arquivos', icon: <FolderOpen size={24} className="text-teal-400" />, cta: 'Gerenciar' },
      ],
    },
    {
      title: 'Operações',
      items: [
        { id: AdminViewState.MEMBERS, title: 'Sócios', icon: <Users size={24} className="text-emerald-400" />, cta: 'Ver' },
        { id: AdminViewState.BIRTHDAYS, title: 'Aniversariantes', icon: <Cake size={24} className="text-pink-400" />, cta: 'Ver' },
        { id: AdminViewState.BENEFITS_APPROVAL, title: 'Benefícios', icon: <ShieldCheck size={24} className="text-emerald-400" />, cta: 'Moderar' },
        { id: AdminViewState.EVENTS, title: 'Eventos', icon: <CalendarDays size={24} className="text-purple-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.TOOLS_PROGRESS, title: 'Relatórios', icon: <FileText size={24} className="text-violet-400" />, cta: 'Enviar' },
        { id: AdminViewState.TOOLS_SOLUTIONS, title: 'Soluções', icon: <Wrench size={24} className="text-slate-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.ROI_AUDIT, title: 'Crescimento (ROI)', icon: <TrendingUp size={24} className="text-emerald-500" />, cta: 'Auditar' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { id: AdminViewState.NOTIFICATIONS, title: 'Notificações', icon: <BellRing size={24} className="text-red-400" />, cta: 'Enviar' },
        { id: AdminViewState.MESSAGES, title: 'Mensagens', icon: <MessageSquare size={24} className="text-teal-400" />, cta: 'Moderar' },
        { id: AdminViewState.CATEGORIES, title: 'Tags', icon: <Tags size={24} className="text-orange-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.SETTINGS, title: 'Suporte', icon: <LifeBuoy size={24} className="text-gray-400" />, cta: 'Configurar' },
      ],
    },
  ];

  return (
    <div className="dashboard-container space-y-8 animate-in fade-in duration-500 w-full min-w-0">
      <style>{`
          .dashboard-container * {
              max-width: 100% !important;
              box-sizing: border-box !important;
          }
      `}</style>
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">Painel de Controle</h2>
        <p className="text-slate-400">Visão geral do Prosperus Club</p>
      </div>

      {/* KPI Cards — responsividade mobile first (Table-to-Card concept) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-6">
        {kpiCards.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setView(kpi.navigateTo)}
            className={`w-full flex flex-col items-start p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${kpi.bgColor}`}
          >
            <div className="flex items-center gap-2.5 mb-1.5 w-full">
              <div className={`${kpi.color}`}>
                {kpi.icon}
              </div>
              <span className="text-2xl font-bold text-white leading-none tracking-tight">
                {kpiLoading ? (
                  <span className="inline-block w-8 h-6 bg-slate-700 rounded animate-pulse" />
                ) : (
                  kpi.value ?? '—'
                )}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium line-clamp-2 text-left leading-tight">{kpi.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setView(action.view)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r ${action.color} text-white text-sm font-semibold hover:opacity-90 transition shadow-lg hover:shadow-xl`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Cards — Grouped */}
      {navGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{group.title}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            {group.items.map((card) => (
              <button
                key={card.id}
                onClick={() => setView(card.id)}
                className="flex flex-col items-start p-4 bg-slate-900 rounded-xl border border-slate-800 transition-all group hover:border-yellow-500/30 hover:-translate-y-0.5"
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 mb-3 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{card.title}</h4>
                <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-yellow-500 transition-colors">
                  {card.cta} <ArrowRight size={12} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
