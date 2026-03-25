
import React, { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Calendar,
  PlaySquare,
  Users,
  Newspaper,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  Menu,
  MapPin,
  Video as VideoIcon,
  Link as LinkIcon,
  ArrowRight,
  FileText,
  Tags,
  BarChart,
  Bell,
  MessageSquare,
  Send,
  Upload,
  Download,
  Eye,
  Clock,
  Zap,
  TrendingUp,
  Wrench,
  FolderOpen,
  ChevronDown,
  PenTool,
  Cog,
  Search
} from 'lucide-react';
import { AdminViewState, Member, ClubEvent, Video, Article, Category, SupportConfig, EventCategory, PushNotification, Conversation, Message, EventMaterial } from './types';
import { dataService } from './services/mockData';
import { eventService } from './services/eventService';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AdminGlobalSearch } from './components/admin/layout/AdminGlobalSearch';

// ─── Lazy Loaded Admin Modules (Code Splitting) ────────────────
const AdminNotifications = React.lazy(() => import('./components/notifications/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const ChatModerationList = React.lazy(() => import('./components/admin/ChatModerationList').then(m => ({ default: m.ChatModerationList })));
const ChatModerationDetail = React.lazy(() => import('./components/admin/ChatModerationDetail').then(m => ({ default: m.ChatModerationDetail })));
const AdminArticleList = React.lazy(() => import('./components/admin/AdminArticleList').then(m => ({ default: m.AdminArticleList })));
const AdminArticleEditor = React.lazy(() => import('./components/admin/AdminArticleEditor').then(m => ({ default: m.AdminArticleEditor })));
const AnalyticsDashboard = React.lazy(() => import('./components/admin/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const BannersModule = React.lazy(() => import('./components/admin/BannersModule').then(m => ({ default: m.BannersModule })));
const AppSettingsModule = React.lazy(() => import('./components/admin/AppSettingsModule').then(m => ({ default: m.AppSettingsModule })));
const AdminChatManager = React.lazy(() => import('./components/AdminChatManager').then(m => ({ default: m.AdminChatManager })));
const AdminRoiManager = React.lazy(() => import('./components/admin/AdminRoiManager').then(m => ({ default: m.AdminRoiManager })));
const AdminSolutions = React.lazy(() => import('./components/admin/AdminSolutions').then(m => ({ default: m.AdminSolutions })));
const AdminMemberProgress = React.lazy(() => import('./components/admin/AdminMemberProgress').then(m => ({ default: m.AdminMemberProgress })));
const EventsModule = React.lazy(() => import('./components/admin/events').then(m => ({ default: m.EventsModule })));
const MembersModule = React.lazy(() => import('./components/admin/MembersModule').then(m => ({ default: m.MembersModule })));
const AcademyModule = React.lazy(() => import('./components/admin/AcademyModule').then(m => ({ default: m.AcademyModule })));
const GalleryModule = React.lazy(() => import('./components/admin/GalleryModule').then(m => ({ default: m.GalleryModule })));
const AdminFilesModule = React.lazy(() => import('./components/admin/AdminFilesModule').then(m => ({ default: m.AdminFilesModule })));

import { Article as ServiceArticle } from './services/articleService';

// Admin loading fallback
const AdminLazyFallback = () => (
    <div className="flex items-center justify-center p-12 min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-slate-400">Carregando módulo...</span>
        </div>
    </div>
);

// --- SHARED ADMIN COMPONENTS ---

interface AdminSidebarProps {
  currentView: AdminViewState;
  setView: (view: AdminViewState) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// Sidebar menu groups
interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: { id: AdminViewState; label: string; icon: React.ReactNode }[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: 'data',
    label: 'Dados & Analytics',
    icon: <BarChart size={18} />,
    items: [
      { id: AdminViewState.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: AdminViewState.ANALYTICS, label: 'Analytics', icon: <BarChart size={18} /> },
    ],
  },
  {
    id: 'content',
    label: 'Conteúdo',
    icon: <PenTool size={18} />,
    items: [
      { id: AdminViewState.VIDEOS, label: 'Academy', icon: <PlaySquare size={18} /> },
      { id: AdminViewState.ARTICLES, label: 'Notícias', icon: <Newspaper size={18} /> },
      { id: AdminViewState.BANNERS, label: 'Banners', icon: <ImageIcon size={18} /> },
      { id: AdminViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={18} /> },
      { id: AdminViewState.MEMBER_FILES, label: 'Arquivos', icon: <FolderOpen size={18} /> },
    ],
  },
  {
    id: 'operations',
    label: 'Operações',
    icon: <Cog size={18} />,
    items: [
      { id: AdminViewState.EVENTS, label: 'Eventos', icon: <Calendar size={18} /> },
      { id: AdminViewState.MEMBERS, label: 'Sócios', icon: <Users size={18} /> },
      { id: AdminViewState.TOOLS_PROGRESS, label: 'Relatórios', icon: <Upload size={18} /> },
      { id: AdminViewState.TOOLS_SOLUTIONS, label: 'Soluções', icon: <Wrench size={18} /> },
      { id: AdminViewState.ROI_AUDIT, label: 'ROI & Auditoria', icon: <TrendingUp size={18} /> },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: <Settings size={18} />,
    items: [
      { id: AdminViewState.NOTIFICATIONS, label: 'Notificações', icon: <Bell size={18} /> },
      { id: AdminViewState.MESSAGES, label: 'Mensagens', icon: <MessageSquare size={18} /> },
      { id: AdminViewState.CATEGORIES, label: 'Tags / Categorias', icon: <Tags size={18} /> },
      { id: AdminViewState.SETTINGS, label: 'Suporte', icon: <Settings size={18} /> },
    ],
  },
];

const AdminSidebar = ({ currentView, setView, onLogout, isOpen, onClose }: AdminSidebarProps) => {
  // Find which group contains the current view to auto-expand it
  const getActiveGroupId = (view: AdminViewState): string => {
    for (const group of SIDEBAR_GROUPS) {
      if (group.items.some(item => item.id === view)) return group.id;
    }
    return 'data';
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SIDEBAR_GROUPS.forEach(g => { initial[g.id] = g.id === getActiveGroupId(currentView); });
    return initial;
  });

  // Auto-expand group when navigating
  useEffect(() => {
    const activeGroup = getActiveGroupId(currentView);
    setExpandedGroups(prev => ({ ...prev, [activeGroup]: true }));
  }, [currentView]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavigation = (id: AdminViewState) => {
    setView(id);
    onClose();
  };

  return (
    <>
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus Admin" className="h-10 w-auto" />
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="px-4 py-3 bg-red-900/20 border-b border-red-900/30">
          <p className="text-xs text-red-400 font-bold uppercase tracking-wider text-center">Modo Administrativo</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_GROUPS.map(group => {
            const isExpanded = expandedGroups[group.id];
            const hasActiveItem = group.items.some(item => item.id === currentView);
            return (
              <div key={group.id}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-semibold tracking-wide ${
                    hasActiveItem
                      ? 'text-yellow-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {group.icon}
                    {group.label}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>
                {/* Group Items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pl-3 pr-1 pb-1 space-y-0.5">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                          currentView === item.id
                            ? 'bg-slate-800 text-yellow-500 font-medium'
                            : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut size={18} />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

interface DataTableProps<T extends { id: string }> {
  columns: string[];
  data: T[];
  onEdit: (row: T) => void;
  onDelete: (id: string) => void;
}

function DataTable<T extends { id: string }>({ columns, data, onEdit, onDelete }: DataTableProps<T>) {
  const keyMap: { [key: string]: string } = {
    'título': 'title',
    'categoria': 'categoryName',
    'slug': 'slug',
    'nome': 'name',
    'duração': 'duration',
    'autor': 'author',
    'data': 'date',
    'status': 'status',
    'empresa': 'company',
    'role': 'role',
    'local': 'location',
    'tipo': 'type',
    'mensagem': 'message',
    'alvo': 'segment',
    'agendado': 'scheduledFor',
    'enviado em': 'sentAt'
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
          <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
            <tr>
              {columns.map((col: string, idx: number) => (
                <th key={idx} className="px-6 py-4">{col}</th>
              ))}
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row) => {
              const r = row as Record<string, any>;
              return (
                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                  {columns.map((col: string, idx: number) => {
                    const headerLower = col.toLowerCase();
                    const key = keyMap[headerLower] || headerLower;
                    let val = r[key];

                    if (col === 'Data' && val) val = new Date(val).toLocaleDateString();
                    if (col === 'Título' || col === 'Nome') val = <span className="font-medium text-white">{val}</span>;
                    if (col === 'Categoria' && !val && r.category) val = r.category;

                    if (key === 'status' && r.segment) {
                      val = val === 'SENT' ? <span className="text-emerald-400 flex items-center gap-1"><Check size={12} /> Enviado</span> :
                        val === 'SCHEDULED' ? <span className="text-amber-400 flex items-center gap-1"><Clock size={12} /> Agendado</span> :
                          <span className="text-red-400">Falha</span>;
                    }

                    if (col === 'Categoria' && !r.segment) {
                      val = val === 'PRESENTIAL' ? <span className="text-purple-400 flex items-center gap-1"><MapPin size={12} /> Presencial</span> :
                        val === 'ONLINE' ? <span className="text-emerald-400 flex items-center gap-1"><VideoIcon size={12} /> Online</span> :
                          val === 'RECORDED' ? <span className="text-orange-400 flex items-center gap-1"><LinkIcon size={12} /> Gravada</span> :
                            <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full text-xs border border-slate-700">{val}</span>;
                    }

                    return <td key={idx} className="px-6 py-4">{val || '-'}</td>
                  })}
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => onEdit(row)} className="text-blue-400 hover:text-blue-300 p-1 inline-block"><Edit size={16} /></button>
                    <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-300 p-1 inline-block"><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-slate-600">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-slate-800">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
      </div>
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  error?: string;
  disabled?: boolean;
  min?: string | number;
}

const FormInput = React.forwardRef<HTMLElement, FormInputProps>(({ label, value, onChange, type = "text", placeholder, textarea = false, error, disabled = false, min }, ref) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
    {textarea ? (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className={`w-full bg-slate-950 border rounded-lg p-3 text-slate-200 outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-2 focus:ring-yellow-600/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    ) : (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        className={`w-full bg-slate-950 border rounded-lg p-3 text-slate-200 outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-2 focus:ring-yellow-600/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    )}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
));

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conteúdo (HTML)</label>
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      <div className="bg-slate-900 p-2 border-b border-slate-800 flex gap-2 flex-wrap">
        <span className="text-xs text-slate-500 px-2 py-1">Editor Simples (HTML)</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent p-4 text-slate-200 outline-none min-h-[200px] font-mono text-sm"
        placeholder="Use tags HTML como <p>, <strong>, <h3>..."
      />
    </div>
  </div>
);

// --- DASHBOARD HOME COMPONENT ---

interface DashboardKpi {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  navigateTo: AdminViewState;
}

const AdminDashboardHome = ({ setView }: { setView: (view: AdminViewState) => void }) => {
  const [kpis, setKpis] = useState<{ members: number | null; upcomingEvents: number | null; videos: number | null; articles: number | null; files: number | null }>({
    members: null, upcomingEvents: null, videos: null, articles: null, files: null,
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const { supabase } = await import('./lib/supabase');

        const [membersRes, eventsRes, videosRes, articlesRes, filesRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'MEMBER'),
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
    { label: 'Sócios Ativos', value: kpis.members, icon: <Users size={24} />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', navigateTo: AdminViewState.MEMBERS },
    { label: 'Eventos Próximos', value: kpis.upcomingEvents, icon: <Calendar size={24} />, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20', navigateTo: AdminViewState.EVENTS },
    { label: 'Vídeos Academy', value: kpis.videos, icon: <PlaySquare size={24} />, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', navigateTo: AdminViewState.VIDEOS },
    { label: 'Artigos Publicados', value: kpis.articles, icon: <Newspaper size={24} />, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20', navigateTo: AdminViewState.ARTICLES },
    { label: 'Arquivos do Clube', value: kpis.files, icon: <FolderOpen size={24} />, color: 'text-teal-400', bgColor: 'bg-teal-500/10 border-teal-500/20', navigateTo: AdminViewState.MEMBER_FILES },
  ];

  const quickActions = [
    { label: 'Criar Evento', icon: <Calendar size={18} />, view: AdminViewState.EVENTS, color: 'from-purple-600 to-purple-500' },
    { label: 'Enviar Notificação', icon: <Bell size={18} />, view: AdminViewState.NOTIFICATIONS, color: 'from-red-600 to-red-500' },
    { label: 'Novo Vídeo', icon: <PlaySquare size={18} />, view: AdminViewState.VIDEOS, color: 'from-amber-600 to-amber-500' },
    { label: 'Ver Analytics', icon: <BarChart size={18} />, view: AdminViewState.ANALYTICS, color: 'from-indigo-600 to-indigo-500' },
  ];

  const navGroups = [
    {
      title: 'Conteúdo',
      items: [
        { id: AdminViewState.VIDEOS, title: 'Academy', icon: <PlaySquare size={24} className="text-amber-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.ARTICLES, title: 'Notícias', icon: <Newspaper size={24} className="text-blue-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.BANNERS, title: 'Banners', icon: <ImageIcon size={24} className="text-pink-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.GALLERY, title: 'Galeria', icon: <ImageIcon size={24} className="text-cyan-400" />, cta: 'Ver' },
        { id: AdminViewState.MEMBER_FILES, title: 'Arquivos', icon: <FolderOpen size={24} className="text-teal-400" />, cta: 'Gerenciar' },
      ],
    },
    {
      title: 'Operações',
      items: [
        { id: AdminViewState.EVENTS, title: 'Eventos', icon: <Calendar size={24} className="text-purple-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.MEMBERS, title: 'Sócios', icon: <Users size={24} className="text-emerald-400" />, cta: 'Ver' },
        { id: AdminViewState.TOOLS_PROGRESS, title: 'Relatórios', icon: <Upload size={24} className="text-violet-400" />, cta: 'Enviar' },
        { id: AdminViewState.TOOLS_SOLUTIONS, title: 'Soluções', icon: <Wrench size={24} className="text-slate-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.ROI_AUDIT, title: 'ROI & Auditoria', icon: <TrendingUp size={24} className="text-green-400" />, cta: 'Ver' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { id: AdminViewState.NOTIFICATIONS, title: 'Notificações', icon: <Bell size={24} className="text-red-400" />, cta: 'Enviar' },
        { id: AdminViewState.MESSAGES, title: 'Mensagens', icon: <MessageSquare size={24} className="text-teal-400" />, cta: 'Moderar' },
        { id: AdminViewState.CATEGORIES, title: 'Tags', icon: <Tags size={24} className="text-orange-400" />, cta: 'Gerenciar' },
        { id: AdminViewState.SETTINGS, title: 'Suporte', icon: <Settings size={24} className="text-gray-400" />, cta: 'Configurar' },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">Painel de Controle</h2>
        <p className="text-slate-400">Visão geral do Prosperus Club</p>
      </div>

      {/* KPI Cards — horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
        {kpiCards.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setView(kpi.navigateTo)}
            className={`flex flex-col items-start p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg min-w-[140px] snap-start sm:min-w-0 ${kpi.bgColor}`}
          >
            <div className={`mb-3 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <span className="text-2xl font-bold text-white">
              {kpiLoading ? (
                <span className="inline-block w-8 h-6 bg-slate-700 rounded animate-pulse" />
              ) : (
                kpi.value ?? '—'
              )}
            </span>
            <span className="text-xs text-slate-400 mt-1 font-medium">{kpi.label}</span>
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

// --- MODULES ---

const AnalyticsModule = () => {
  return <AnalyticsDashboard />;
};

const NotificationsModule = () => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [segment, setSegment] = useState<'ALL' | 'MEMBERS' | 'TEAM'>('ALL');
  const [scheduledFor, setScheduledFor] = useState('');

  useEffect(() => {
    const updateData = () => {
      setNotifications(dataService.getNotifications());
      setVideos(dataService.getVideos());
      setArticles(dataService.getArticles());
    };
    updateData();
    const unsub = dataService.subscribe(updateData);

    // Fetch events from Supabase
    eventService.getAllEvents().then(setEvents);

    return unsub;
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.sendPushNotification({ title, message, targetUrl, segment, scheduledFor: scheduledFor || undefined });
    setIsModalOpen(false);
    setTitle(''); setMessage(''); setTargetUrl(''); setSegment('ALL'); setScheduledFor('');
    toast.success('Notificação enviada com sucesso!');
  };

  const handleSelectContent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    const [type, id] = value.split(':');
    if (type === 'EVENT') {
      const item = events.find(i => i.id === id);
      if (item) { setTitle(`📅 ${item.title}`); setMessage(`Não perca o evento "${item.title}" no dia ${new Date(item.date).toLocaleDateString()}. Confira na agenda!`); setTargetUrl('AGENDA'); }
    } else if (type === 'VIDEO') {
      const item = videos.find(i => i.id === id);
      if (item) { setTitle(`🎥 Nova Aula: ${item.title}`); setMessage(`Assista agora: "${item.title}". Disponível no Academy.`); setTargetUrl('ACADEMY'); }
    } else if (type === 'ARTICLE') {
      const item = articles.find(i => i.id === id);
      if (item) { setTitle(`📰 News: ${item.title}`); setMessage(`Leia o novo artigo: "${item.title}". Confira na seção de notícias.`); setTargetUrl('NEWS'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Notificações Push</h2>
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition">
          <Send size={18} /> Nova Notificação
        </button>
      </div>
      <DataTable columns={['Título', 'Mensagem', 'Alvo', 'Status', 'Enviado Em']} data={notifications} onEdit={() => { }} onDelete={() => { }} />
      {isModalOpen && (
        <Modal title="Nova Notificação Push" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
              <label className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <Zap size={14} /> Preenchimento Rápido (Opcional)
              </label>
              <select onChange={handleSelectContent} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none text-sm">
                <option value="">Selecione uma atividade para divulgar...</option>
                <optgroup label="Eventos Próximos">
                  {events.map(e => (<option key={e.id} value={`EVENT:${e.id}`}>{e.title} ({new Date(e.date).toLocaleDateString()})</option>))}
                </optgroup>
                <optgroup label="Vídeos / Academy">
                  {videos.map(v => (<option key={v.id} value={`VIDEO:${v.id}`}>{v.title}</option>))}
                </optgroup>
                <optgroup label="Artigos / News">
                  {articles.map(a => (<option key={a.id} value={`ARTICLE:${a.id}`}>{a.title}</option>))}
                </optgroup>
              </select>
            </div>
            <FormInput label="Título da Notificação" value={title} onChange={setTitle} placeholder="Ex: Novo evento disponível!" />
            <FormInput label="Mensagem" textarea value={message} onChange={setMessage} placeholder="Corpo da notificação..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Segmentação</label>
                <select value={segment} onChange={(e: any) => setSegment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none">
                  <option value="ALL">Todos os Usuários</option>
                  <option value="MEMBERS">Apenas Sócios</option>
                  <option value="TEAM">Apenas Time</option>
                </select>
              </div>
              <FormInput label="URL de Destino (Opcional)" value={targetUrl} onChange={setTargetUrl} placeholder="/events" />
            </div>
            <FormInput label="Agendar Para (Opcional)" type="datetime-local" value={scheduledFor} onChange={setScheduledFor} />
            <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
              <p className="text-xs text-yellow-500 flex gap-2">
                <Bell size={14} className="shrink-0 mt-0.5" />
                <span>Atenção: Ao clicar em enviar, a notificação será processada e enviada para todos os dispositivos registrados no segmento selecionado.</span>
              </p>
            </div>
            <div className="flex justify-end pt-4 gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition shadow-lg shadow-red-900/20">Enviar Push</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// --- CHAT MODERATION MODULE (SUPABASE) ---

interface ChatModerationModuleProps {
  currentUserId: string;
}

const ChatModerationModule: React.FC<ChatModerationModuleProps> = ({ currentUserId }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-140px)] flex bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className={`w-full md:w-1/3 border-r border-slate-800 ${selectedConversationId ? 'hidden md:block' : 'block'}`}>
        <ChatModerationList onSelectConversation={setSelectedConversationId} selectedConversationId={selectedConversationId} />
      </div>
      <div className={`flex-1 ${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-col bg-[#0f172a]`}>
        {selectedConversationId ? (
          <ChatModerationDetail conversationId={selectedConversationId} currentAdminId={currentUserId} onBack={() => setSelectedConversationId(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare size={48} className="mb-4 opacity-50" />
            <p>Selecione uma conversa para moderar</p>
            <p className="text-xs text-slate-600 mt-2">Use a lista à esquerda para navegar pelas conversas</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MessagesModerationModule = () => {
  const [adminId, setAdminId] = useState<string>('');

  useEffect(() => {
    const getAdminId = async () => {
      const { supabase } = await import('./lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminId(user.id);
    };
    getAdminId();
  }, []);

  if (!adminId) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400">Carregando módulo de moderação...</p>
        </div>
      </div>
    );
  }

  return <AdminChatManager currentAdminId={adminId} />;
};

// --- NEWS CATEGORIES MODULE ---

const CategoriesModule = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});

  useEffect(() => {
    setCategories(dataService.getCategories());
    return dataService.subscribe(() => setCategories(dataService.getCategories()));
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSave = () => {
    if (!editingCategory.name) return;
    const slug = editingCategory.slug || generateSlug(editingCategory.name);
    const categoryToSave = { ...editingCategory, slug };
    if (editingCategory.id) {
      dataService.updateCategory(categoryToSave as Category);
    } else {
      dataService.addCategory(categoryToSave as any);
    }
    setIsModalOpen(false);
    setEditingCategory({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Categorias de Notícias</h2>
        <button onClick={() => { setEditingCategory({}); setIsModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Nova Categoria
        </button>
      </div>
      <DataTable columns={['Nome', 'Slug']} data={categories} onEdit={(c: Category) => { setEditingCategory(c); setIsModalOpen(true); }} onDelete={(id: string) => dataService.deleteCategory(id)} />
      {isModalOpen && (
        <Modal title={editingCategory.id ? "Editar Categoria" : "Nova Categoria"} onClose={() => setIsModalOpen(false)}>
          <div className="space-y-4">
            <FormInput label="Nome da Categoria" value={editingCategory.name || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, name: v, slug: editingCategory.id ? editingCategory.slug : generateSlug(v) })} />
            <FormInput label="Slug (URL amigável)" value={editingCategory.slug || ''} onChange={(v: string) => setEditingCategory({ ...editingCategory, slug: v })} placeholder="gerado-automaticamente" />
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-500 transition shadow-lg shadow-pink-900/20">Salvar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- NEWS MODULE (UPDATED) ---
const NewsModule = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article>>({});

  useEffect(() => {
    setArticles(dataService.getArticles());
    setCategories(dataService.getCategories());
    return dataService.subscribe(() => {
      setArticles(dataService.getArticles());
      setCategories(dataService.getCategories());
    });
  }, []);

  const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSave = () => {
    const cat = categories.find(c => c.id === editingArticle.categoryId);
    const articleToSave = {
      ...editingArticle,
      slug: editingArticle.slug || generateSlug(editingArticle.title || ''),
      status: editingArticle.status || 'DRAFT',
      date: editingArticle.date || new Date().toLocaleDateString(),
      categoryName: cat ? cat.name : editingArticle.categoryName
    };
    if (editingArticle.id) {
      dataService.updateArticle(articleToSave as Article);
    } else {
      dataService.addArticle(articleToSave as Article);
    }
    setIsModalOpen(false);
    setEditingArticle({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Notícias & Artigos</h2>
        <button onClick={() => { setEditingArticle({}); setIsModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Novo Artigo
        </button>
      </div>
      <DataTable columns={['Título', 'Categoria', 'Slug', 'Status']} data={articles} onEdit={(a: Article) => { setEditingArticle(a); setIsModalOpen(true); }} onDelete={(id: string) => dataService.deleteArticle(id)} />
      {isModalOpen && (
        <Modal title={editingArticle.id ? "Editar Artigo" : "Novo Artigo"} onClose={() => setIsModalOpen(false)}>
          <div className="space-y-4">
            <FormInput label="Título" value={editingArticle.title || ''} onChange={(v: string) => setEditingArticle({ ...editingArticle, title: v, slug: editingArticle.id ? editingArticle.slug : generateSlug(v) })} />
            <FormInput label="Slug (URL)" value={editingArticle.slug || ''} onChange={(v: string) => setEditingArticle({ ...editingArticle, slug: v })} placeholder="gerado-automaticamente" />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</label>
              <select value={editingArticle.categoryId || ''} onChange={(e) => setEditingArticle({ ...editingArticle, categoryId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none">
                <option value="">Selecione...</option>
                {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Autor" value={editingArticle.author || ''} onChange={(v: string) => setEditingArticle({ ...editingArticle, author: v })} />
              <div className="flex flex-col justify-end pb-1">
                <label className="text-sm text-slate-400 mb-2">Status</label>
                <select value={editingArticle.status || 'DRAFT'} onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value as any })} className="bg-slate-950 border border-slate-800 rounded px-3 py-3 text-white w-full">
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                </select>
              </div>
            </div>
            <FormInput label="URL da Imagem Capa" value={editingArticle.image || ''} onChange={(v: string) => setEditingArticle({ ...editingArticle, image: v })} />
            <FormInput label="Resumo" textarea value={editingArticle.excerpt || ''} onChange={(v: string) => setEditingArticle({ ...editingArticle, excerpt: v })} />
            <RichTextEditor value={editingArticle.content || ''} onChange={(v: string) => setEditingArticle({ ...editingArticle, content: v })} />
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20">Salvar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- ACADEMY MODULE → Extracted to ./components/admin/AcademyModule.tsx ---
// --- GALLERY MODULE → Extracted to ./components/admin/GalleryModule.tsx ---

// --- ARTICLES MODULE (News & Blog) ---
const ArticlesModule = () => {
  const [editingArticle, setEditingArticle] = useState<ServiceArticle | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleEdit = (article: ServiceArticle) => { setEditingArticle(article); setShowEditor(true); };
  const handleNew = () => { setEditingArticle(null); setShowEditor(true); };
  const handleBack = () => { setShowEditor(false); setEditingArticle(null); };
  const handleSaved = () => { setShowEditor(false); setEditingArticle(null); };

  if (showEditor) {
    return <AdminArticleEditor article={editingArticle} onBack={handleBack} onSaved={handleSaved} />;
  }

  return <AdminArticleList onEdit={handleEdit} onNew={handleNew} />;
};

const SettingsModule = () => {
  return <AppSettingsModule />;
};

export const AdminApp = ({ currentUser, onLogout }: { currentUser: Member; onLogout: () => void }) => {
  const [view, setView] = useState<AdminViewState>(AdminViewState.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (currentUser.role === 'MEMBER') {
      alert('Acesso negado. Apenas administradores e equipe podem acessar esta área.');
      onLogout();
    }
  }, [currentUser, onLogout]);

  const renderContent = () => {
    switch (view) {
      case AdminViewState.DASHBOARD: return <AdminDashboardHome setView={setView} />;
      case AdminViewState.ANALYTICS: return <AnalyticsModule />;
      case AdminViewState.NOTIFICATIONS: return <AdminNotifications />;
      case AdminViewState.MESSAGES: return <MessagesModerationModule />;
      case AdminViewState.EVENTS: return <EventsModule />;
      case AdminViewState.VIDEOS: return <AcademyModule DataTable={DataTable} />;
      case AdminViewState.TOOLS_SOLUTIONS: return <AdminSolutions />;
      case AdminViewState.TOOLS_PROGRESS: return <AdminMemberProgress />;
      case AdminViewState.MEMBERS: return <MembersModule />;
      case AdminViewState.ARTICLES: return <ArticlesModule />;
      case AdminViewState.GALLERY: return <GalleryModule DataTable={DataTable} />;
      case AdminViewState.BANNERS: return <BannersModule />;
      case AdminViewState.CATEGORIES: return <CategoriesModule />;
      case AdminViewState.ROI_AUDIT: return <AdminRoiManager />;
      case AdminViewState.MEMBER_FILES: return <AdminFilesModule />;
      case AdminViewState.SETTINGS: return <SettingsModule />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex relative">
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="text-white"><Menu size={24} /></button><img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Admin" className="h-8 w-auto" /></div>
        <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 text-slate-400 hover:text-white transition p-2"><Search size={20} /></button>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="fixed md:static inset-y-0 left-0 z-50"><AdminSidebar currentView={view} setView={setView} onLogout={onLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} /></div>
      <style>{`
        .admin-main-mobile { padding-top: calc(5rem + env(safe-area-inset-top, 0px)); }
        @media (min-width: 768px) { .admin-main-mobile { padding-top: 2rem; } }
      `}</style>
      <main className="admin-main-mobile flex-1 min-h-screen bg-[#0f172a] w-full px-3 py-4 md:p-8 overflow-x-hidden">
        {/* Desktop Search Bar */}
        <div className="hidden md:flex max-w-7xl mx-auto mb-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 w-full max-w-sm bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-300 transition"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono text-slate-400">⌘K</kbd>
          </button>
        </div>
        <div className="max-w-7xl mx-auto">
          <ErrorBoundary moduleName="painel administrativo">
            <Suspense fallback={<AdminLazyFallback />}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <AdminGlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={setView} />
    </div>
  );
};
