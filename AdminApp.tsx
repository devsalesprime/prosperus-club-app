import React, { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  PlaySquare,
  Users,
  Newspaper,
  Settings,
  LogOut,
  X,
  Menu,
  BarChart3,
  Bell,
  BellRing,
  MessageSquare,
  Wrench,
  FolderOpen,
  ChevronDown,
  Search,
  Image as ImageIcon,
  Tags,
  ShieldCheck,
  GraduationCap,
  Cake,
  FileText,
  Target,
  LifeBuoy,
  TrendingUp
} from 'lucide-react';
import { AdminViewState, Member } from './types';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AdminGlobalSearch } from './components/admin/layout/AdminGlobalSearch';
import { DataTable } from './components/admin/shared/AdminSharedUI';

// ─── Lazy Loaded Admin Modules (Code Splitting) ────────────────
const AdminDashboardHome = React.lazy(() => import('./components/admin/AdminDashboardHome').then(m => ({ default: m.AdminDashboardHome })));
const AdminNotifications = React.lazy(() => import('./components/notifications/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const AdminChatManager = React.lazy(() => import('./components/AdminChatManager').then(m => ({ default: m.AdminChatManager })));
const AnalyticsDashboard = React.lazy(() => import('./components/admin/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const BannersModule = React.lazy(() => import('./components/admin/BannersModule').then(m => ({ default: m.BannersModule })));
const AppSettingsModule = React.lazy(() => import('./components/admin/AppSettingsModule').then(m => ({ default: m.AppSettingsModule })));
const AdminRoiManager = React.lazy(() => import('./components/admin/AdminRoiManager').then(m => ({ default: m.AdminRoiManager })));
const ROIAdminModule = React.lazy(() => import('./components/admin/ROIAdminModule').then(m => ({ default: m.ROIAdminModule })));
const AdminSolutions = React.lazy(() => import('./components/admin/AdminSolutions').then(m => ({ default: m.AdminSolutions })));
const AdminMemberProgress = React.lazy(() => import('./components/admin/AdminMemberProgress').then(m => ({ default: m.AdminMemberProgress })));
const EventsModule = React.lazy(() => import('./components/admin/events').then(m => ({ default: m.EventsModule })));
const MembersModule = React.lazy(() => import('./components/admin/MembersModule').then(m => ({ default: m.MembersModule })));
const AcademyModule = React.lazy(() => import('./components/admin/AcademyModule').then(m => ({ default: m.AcademyModule })));
const GalleryModule = React.lazy(() => import('./components/admin/GalleryModule').then(m => ({ default: m.GalleryModule })));
const AdminFilesModule = React.lazy(() => import('./components/admin/AdminFilesModule').then(m => ({ default: m.AdminFilesModule })));
const AdminBirthdaysModule = React.lazy(() => import('./components/admin/AdminBirthdaysModule').then(m => ({ default: m.AdminBirthdaysModule })));
const CategoriesModule = React.lazy(() => import('./components/admin/CategoriesModule').then(m => ({ default: m.CategoriesModule })));
const ArticlesModule = React.lazy(() => import('./components/admin/ArticlesModule').then(m => ({ default: m.ArticlesModule })));
const AdminBenefitsApproval = React.lazy(() => import('./components/admin/AdminBenefitsApproval').then(m => ({ default: m.AdminBenefitsApproval })));

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
    icon: <BarChart3 size={18} />,
    items: [
      { id: AdminViewState.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: AdminViewState.ANALYTICS, label: 'Analytics', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    id: 'content',
    label: 'Conteúdo',
    icon: <GraduationCap size={18} />,
    items: [
      { id: AdminViewState.VIDEOS, label: 'Academy', icon: <GraduationCap size={18} /> },
      { id: AdminViewState.ARTICLES, label: 'Notícias', icon: <Newspaper size={18} /> },
      { id: AdminViewState.BANNERS, label: 'Banners', icon: <ImageIcon size={18} /> },
      { id: AdminViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={18} /> },
      { id: AdminViewState.MEMBER_FILES, label: 'Arquivos', icon: <FolderOpen size={18} /> },
    ],
  },
  {
    id: 'operations',
    label: 'Operações',
    icon: <Users size={18} />,
    items: [
      { id: AdminViewState.MEMBERS, label: 'Sócios', icon: <Users size={18} /> },
      { id: AdminViewState.BIRTHDAYS, label: 'Aniversariantes', icon: <Cake size={18} /> },
      { id: AdminViewState.BENEFITS_APPROVAL, label: 'Benefícios', icon: <ShieldCheck size={18} /> },
      { id: AdminViewState.EVENTS, label: 'Eventos', icon: <CalendarDays size={18} /> },
      { id: AdminViewState.TOOLS_PROGRESS, label: 'Relatórios', icon: <FileText size={18} /> },
      { id: AdminViewState.TOOLS_SOLUTIONS, label: 'Soluções', icon: <Wrench size={18} /> },
      { id: AdminViewState.ROI_AUDIT, label: 'ROI & Auditoria', icon: <Target size={18} /> },
      { id: AdminViewState.ROI_GROWTH, label: 'Crescimento (ROI)', icon: <TrendingUp size={18} /> },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: <Settings size={18} />,
    items: [
      { id: AdminViewState.NOTIFICATIONS, label: 'Notificações', icon: <BellRing size={18} /> },
      { id: AdminViewState.MESSAGES, label: 'Mensagens', icon: <MessageSquare size={18} /> },
      { id: AdminViewState.CATEGORIES, label: 'Tags / Categorias', icon: <Tags size={18} /> },
      { id: AdminViewState.SETTINGS, label: 'Suporte', icon: <LifeBuoy size={18} /> },
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
      toast.error('Acesso negado. Apenas administradores e equipe podem acessar esta área.');
      onLogout();
    }
  }, [currentUser, onLogout]);

  const renderContent = () => {
    switch (view) {
      case AdminViewState.DASHBOARD: return <AdminDashboardHome setView={setView} />;
      case AdminViewState.ANALYTICS: return <AnalyticsDashboard />;
      case AdminViewState.NOTIFICATIONS: return <AdminNotifications />;
      case AdminViewState.MESSAGES: return <AdminChatManager currentAdminId={currentUser.id} />;
      case AdminViewState.EVENTS: return <EventsModule />;
      case AdminViewState.BIRTHDAYS: return <AdminBirthdaysModule />;
      case AdminViewState.VIDEOS: return <AcademyModule DataTable={DataTable} />;
      case AdminViewState.TOOLS_SOLUTIONS: return <AdminSolutions />;
      case AdminViewState.TOOLS_PROGRESS: return <AdminMemberProgress />;
      case AdminViewState.MEMBERS: return <MembersModule />;
      case AdminViewState.ARTICLES: return <ArticlesModule />;
      case AdminViewState.GALLERY: return <GalleryModule DataTable={DataTable} />;
      case AdminViewState.BANNERS: return <BannersModule />;
      case AdminViewState.CATEGORIES: return <CategoriesModule />;
      case AdminViewState.ROI_AUDIT: return <AdminRoiManager />;
      case AdminViewState.ROI_GROWTH: return <ROIAdminModule />;
      case AdminViewState.MEMBER_FILES: return <AdminFilesModule />;
      case AdminViewState.BENEFITS_APPROVAL: return <AdminBenefitsApproval />;
      case AdminViewState.SETTINGS: return <AppSettingsModule />;
      default: return null;
    }
  };

  return (
    <div className="admin-root-container min-h-screen bg-slate-950 text-slate-200 font-sans flex relative max-w-[100vw] overflow-x-hidden box-border">
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
      <main className="admin-main-mobile flex-1 min-w-0 max-w-full min-h-screen bg-slate-900 w-full px-3 py-4 md:p-8 overflow-x-hidden box-border">
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
