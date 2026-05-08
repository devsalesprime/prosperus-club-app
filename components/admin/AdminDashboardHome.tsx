import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, PlaySquare, Newspaper, FolderOpen, BellRing, BarChart3, ArrowRight, Image as ImageIcon, Wrench, Target, MessageSquare, Tags, ShieldCheck, GraduationCap, Cake, FileText, LifeBuoy, TrendingUp, Megaphone } from 'lucide-react';
import { AdminViewState } from '../../types';
import { dashboardService, AdminKpis } from '../../services/dashboardService';

interface DashboardKpi {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  navigateTo: AdminViewState;
}

export const AdminDashboardHome = ({ setView }: { setView: (view: AdminViewState) => void }) => {
  const [kpis, setKpis] = useState<{ [K in keyof AdminKpis]: number | null }>({
    members: null, upcomingEvents: null, videos: null, articles: null, files: null,
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    dashboardService.getAdminKpis()
      .then((data) => { if (!cancelled) setKpis(data); })
      .catch((err) => console.error('Error loading KPIs:', err))
      .finally(() => { if (!cancelled) setKpiLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Brand-aligned: monochrome admin surfaces (azul-lideranca + ouro)
  // conforme arquétipo Governante 60% / Sábio 40% da brand guide.
  const kpiCardClass =
    'bg-prosperus-azul-lideranca/20 border-prosperus-stroke hover:border-prosperus-ouro-vivo/40';

  const kpiCards: DashboardKpi[] = [
    { label: 'Total Cadastrados', value: kpis.members, icon: <Users size={24} />, color: 'text-prosperus-ouro-vivo', bgColor: kpiCardClass, navigateTo: AdminViewState.MEMBERS },
    { label: 'Eventos Próximos', value: kpis.upcomingEvents, icon: <CalendarDays size={24} />, color: 'text-prosperus-ouro-vivo', bgColor: kpiCardClass, navigateTo: AdminViewState.EVENTS },
    { label: 'Vídeos Academy', value: kpis.videos, icon: <PlaySquare size={24} />, color: 'text-prosperus-ouro-vivo', bgColor: kpiCardClass, navigateTo: AdminViewState.VIDEOS },
    { label: 'Artigos Publicados', value: kpis.articles, icon: <Newspaper size={24} />, color: 'text-prosperus-ouro-vivo', bgColor: kpiCardClass, navigateTo: AdminViewState.ARTICLES },
    { label: 'Arquivos do Clube', value: kpis.files, icon: <FolderOpen size={24} />, color: 'text-prosperus-ouro-vivo', bgColor: kpiCardClass, navigateTo: AdminViewState.MEMBER_FILES },
  ];

  const quickActions = [
    { label: 'Criar Evento', icon: <CalendarDays size={18} />, view: AdminViewState.EVENTS },
    { label: 'Enviar Notificação', icon: <BellRing size={18} />, view: AdminViewState.NOTIFICATIONS },
    { label: 'Novo Vídeo', icon: <PlaySquare size={18} />, view: AdminViewState.VIDEOS },
    { label: 'Ver Analytics', icon: <BarChart3 size={18} />, view: AdminViewState.ANALYTICS },
    { label: 'Benefícios', icon: <ShieldCheck size={18} />, view: AdminViewState.BENEFITS_APPROVAL },
    { label: 'Aniversariantes', icon: <Cake size={18} />, view: AdminViewState.BIRTHDAYS },
  ];

  // Ícones todos em ouro-vivo: monocromático, alinhado ao tom Sábio (exclusividade/prestígio)
  const navIconClass = 'text-prosperus-ouro-vivo';
  const navGroups = [
    {
      title: 'Conteúdo',
      items: [
        { id: AdminViewState.VIDEOS, title: 'Academy', icon: <GraduationCap size={24} className={navIconClass} />, cta: 'Gerenciar' },
        { id: AdminViewState.ARTICLES, title: 'Notícias', icon: <Newspaper size={24} className={navIconClass} />, cta: 'Gerenciar' },
        { id: AdminViewState.BANNERS, title: 'Banners', icon: <ImageIcon size={24} className={navIconClass} />, cta: 'Gerenciar' },
        { id: AdminViewState.GALLERY, title: 'Galeria', icon: <ImageIcon size={24} className={navIconClass} />, cta: 'Ver' },
        { id: AdminViewState.MEMBER_FILES, title: 'Arquivos', icon: <FolderOpen size={24} className={navIconClass} />, cta: 'Gerenciar' },
      ],
    },
    {
      title: 'Operações',
      items: [
        { id: AdminViewState.MEMBERS, title: 'Sócios', icon: <Users size={24} className={navIconClass} />, cta: 'Ver' },
        { id: AdminViewState.BIRTHDAYS, title: 'Aniversariantes', icon: <Cake size={24} className={navIconClass} />, cta: 'Ver' },
        { id: AdminViewState.BENEFITS_APPROVAL, title: 'Benefícios', icon: <ShieldCheck size={24} className={navIconClass} />, cta: 'Moderar' },
        { id: AdminViewState.EVENTS, title: 'Eventos', icon: <CalendarDays size={24} className={navIconClass} />, cta: 'Gerenciar' },
        { id: AdminViewState.TOOLS_PROGRESS, title: 'Relatórios', icon: <FileText size={24} className={navIconClass} />, cta: 'Enviar' },
        { id: AdminViewState.TOOLS_SOLUTIONS, title: 'Soluções', icon: <Wrench size={24} className={navIconClass} />, cta: 'Gerenciar' },
        { id: AdminViewState.ROI_AUDIT, title: 'ROI & Auditoria', icon: <Target size={24} className={navIconClass} />, cta: 'Ver' },
        { id: AdminViewState.ROI_GROWTH, title: 'Crescimento (ROI)', icon: <TrendingUp size={24} className={navIconClass} />, cta: 'Auditar' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { id: AdminViewState.NOTIFICATIONS, title: 'Notificações', icon: <BellRing size={24} className={navIconClass} />, cta: 'Enviar' },
        { id: AdminViewState.MESSAGES, title: 'Mensagens', icon: <MessageSquare size={24} className={navIconClass} />, cta: 'Moderar' },
        { id: AdminViewState.CATEGORIES, title: 'Tags', icon: <Tags size={24} className={navIconClass} />, cta: 'Gerenciar' },
        { id: AdminViewState.SETTINGS, title: 'Suporte', icon: <LifeBuoy size={24} className={navIconClass} />, cta: 'Configurar' },
        { id: AdminViewState.NOTIFICATION_BANNERS, title: 'Banners Fullscreen', icon: <Megaphone size={24} className={navIconClass} />, cta: 'Gerenciar' },
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
        <h2 className="text-3xl font-bold text-prosperus-text mb-1">Painel de Controle</h2>
        <p className="font-sans text-prosperus-text-off">Visão geral do Prosperus Club</p>
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
              <div className={kpi.color}>
                {kpi.icon}
              </div>
              <span className="font-display text-2xl font-bold text-prosperus-text leading-none tracking-tight">
                {kpiLoading ? (
                  <span className="inline-block w-8 h-6 bg-prosperus-stroke rounded animate-pulse" />
                ) : (
                  kpi.value ?? '—'
                )}
              </span>
            </div>
            <span className="font-sans text-[11px] sm:text-xs text-prosperus-text-off font-medium line-clamp-2 text-left leading-tight">{kpi.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-sans text-sm font-semibold text-prosperus-text-off uppercase tracking-wider mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setView(action.view)}
              className="font-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-prosperus-ouro-vivo to-prosperus-ouro-nobre text-prosperus-bg-primary text-sm font-semibold hover:opacity-90 transition shadow-lg hover:shadow-xl"
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
          <h3 className="font-sans text-sm font-semibold text-prosperus-text-off uppercase tracking-wider mb-3">{group.title}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            {group.items.map((card) => (
              <button
                key={card.id}
                onClick={() => setView(card.id)}
                className="flex flex-col items-start p-4 bg-prosperus-bg-box rounded-xl border border-prosperus-stroke transition-all group hover:border-prosperus-ouro-vivo/40 hover:-translate-y-0.5"
              >
                <div className="p-2 rounded-lg bg-prosperus-bg-primary border border-prosperus-stroke mb-3 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h4 className="text-sm font-bold text-prosperus-text mb-1">{card.title}</h4>
                <span className="font-sans text-xs text-prosperus-text-off flex items-center gap-1 group-hover:text-prosperus-ouro-vivo transition-colors">
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
