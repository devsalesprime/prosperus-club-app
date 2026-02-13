
import React, { useState, useEffect } from 'react';
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
  Wrench
} from 'lucide-react';
import { AdminViewState, Member, ClubEvent, Video, Article, Category, SupportConfig, EventCategory, PushNotification, Conversation, Message, EventMaterial } from './types';
import { dataService } from './services/mockData';
import { AdminNotifications } from './components/AdminNotifications';
import { ChatModerationList } from './components/admin/ChatModerationList';
import { ChatModerationDetail } from './components/admin/ChatModerationDetail';
import { AdminArticleList } from './components/admin/AdminArticleList';
import { AdminArticleEditor } from './components/admin/AdminArticleEditor';
import { Article as ServiceArticle } from './services/articleService';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { BannersModule } from './components/admin/BannersModule';
import { AppSettingsModule } from './components/admin/AppSettingsModule';
import { AdminChatManager } from './components/AdminChatManager';
import { AdminRoiManager } from './components/admin/AdminRoiManager';
import { AdminSolutions } from './components/admin/AdminSolutions';
import { AdminMemberProgress } from './components/admin/AdminMemberProgress';
import { EventsModule } from './components/admin/EventsModule';
import { MembersModule } from './components/admin/MembersModule';
import { AcademyModule } from './components/admin/AcademyModule';
import { GalleryModule } from './components/admin/GalleryModule';

// --- SHARED ADMIN COMPONENTS ---

interface AdminSidebarProps {
  currentView: AdminViewState;
  setView: (view: AdminViewState) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ currentView, setView, onLogout, isOpen, onClose }: AdminSidebarProps) => {
  const menuItems = [
    { id: AdminViewState.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: AdminViewState.ANALYTICS, label: 'Analytics', icon: <BarChart size={20} /> },
    { id: AdminViewState.EVENTS, label: 'Eventos', icon: <Calendar size={20} /> },
    { id: AdminViewState.VIDEOS, label: 'Academy', icon: <PlaySquare size={20} /> },
    { id: AdminViewState.TOOLS_SOLUTIONS, label: 'Gerenciar Soluções', icon: <Wrench size={20} /> },
    { id: AdminViewState.TOOLS_PROGRESS, label: 'Enviar Relatórios', icon: <Upload size={20} /> },
    { id: AdminViewState.MEMBERS, label: 'Sócios', icon: <Users size={20} /> },
    { id: AdminViewState.ARTICLES, label: 'Notícias', icon: <Newspaper size={20} /> },
    { id: AdminViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={20} /> },
    { id: AdminViewState.BANNERS, label: 'Banners', icon: <ImageIcon size={20} /> },
    { id: AdminViewState.CATEGORIES, label: 'Tags / Categorias', icon: <Tags size={20} /> },
    { id: AdminViewState.MESSAGES, label: 'Mensagens', icon: <MessageSquare size={20} /> },
    { id: AdminViewState.ROI_AUDIT, label: 'ROI & Auditoria', icon: <TrendingUp size={20} /> },
    { id: AdminViewState.NOTIFICATIONS, label: 'Notificações', icon: <Bell size={20} /> },
    { id: AdminViewState.SETTINGS, label: 'Suporte', icon: <Settings size={20} /> },
  ];

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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === item.id
                ? 'bg-slate-800 text-yellow-500'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut size={20} />
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
            })}            {data.length === 0 && (
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

const AdminDashboardHome = ({ setView }: { setView: (view: AdminViewState) => void }) => {
  const cards = [
    { id: AdminViewState.ANALYTICS, title: 'Analytics & Métricas', description: 'Acompanhe o engajamento dos usuários, views de vídeos e leitura de artigos.', icon: <BarChart size={32} className="text-indigo-400" />, cta: 'Ver Dashboard', color: 'hover:border-indigo-500/50' },
    { id: AdminViewState.NOTIFICATIONS, title: 'Notificações Push', description: 'Envie alertas e comunicados para os dispositivos dos usuários.', icon: <Bell size={32} className="text-red-400" />, cta: 'Enviar Push', color: 'hover:border-red-500/50' },
    { id: AdminViewState.EVENTS, title: 'Agenda & Eventos', description: 'Gerencie eventos presenciais, online e aulas ao vivo.', icon: <Calendar size={32} className="text-purple-400" />, cta: 'Gerenciar Agenda', color: 'hover:border-purple-500/50' },
    { id: AdminViewState.ARTICLES, title: 'Notícias & Blog', description: 'Publique artigos, comunicados e novidades do clube.', icon: <Newspaper size={32} className="text-blue-400" />, cta: 'Gerenciar Notícias', color: 'hover:border-blue-500/50' },
    { id: AdminViewState.VIDEOS, title: 'Academy (Vídeos)', description: 'Organize a biblioteca de vídeos e masterclasses.', icon: <PlaySquare size={32} className="text-amber-400" />, cta: 'Gerenciar Academy', color: 'hover:border-amber-500/50' },
    { id: AdminViewState.MEMBERS, title: 'Sócios', description: 'Visualize e gerencie a base de sócios e permissões.', icon: <Users size={32} className="text-emerald-400" />, cta: 'Ver Sócios', color: 'hover:border-emerald-500/50' },
    { id: AdminViewState.MESSAGES, title: 'Moderação de Mensagens', description: 'Visualize conversas entre membros para fins de moderação.', icon: <MessageSquare size={32} className="text-teal-400" />, cta: 'Ver Conversas', color: 'hover:border-teal-500/50' },
    { id: AdminViewState.BANNERS, title: 'Banners', description: 'Gerencie os banners promocionais e datas de exibição.', icon: <ImageIcon size={32} className="text-pink-400" />, cta: 'Gerenciar Banners', color: 'hover:border-pink-500/50' },
    { id: AdminViewState.GALLERY, title: 'Galeria', description: 'Organize e gerencie as imagens da galeria do clube.', icon: <ImageIcon size={32} className="text-cyan-400" />, cta: 'Ver Galeria', color: 'hover:border-cyan-500/50' },
    { id: AdminViewState.CATEGORIES, title: 'Tags / Categorias', description: 'Gerencie as categorias e tags de organização de conteúdo.', icon: <Tags size={32} className="text-orange-400" />, cta: 'Gerenciar Categorias', color: 'hover:border-orange-500/50' },
    { id: AdminViewState.ROI_AUDIT, title: 'ROI & Auditoria', description: 'Acompanhe ROI, indicações e rankings do Business Core.', icon: <TrendingUp size={32} className="text-green-400" />, cta: 'Ver ROI', color: 'hover:border-green-500/50' },
    { id: AdminViewState.TOOLS_SOLUTIONS, title: 'Gerenciar Soluções', description: 'Configure as soluções disponíveis no Prosperus Tools.', icon: <Wrench size={32} className="text-slate-400" />, cta: 'Gerenciar Soluções', color: 'hover:border-slate-500/50' },
    { id: AdminViewState.TOOLS_PROGRESS, title: 'Enviar Relatórios', description: 'Envie relatórios de progresso para os membros.', icon: <Upload size={32} className="text-violet-400" />, cta: 'Enviar Relatórios', color: 'hover:border-violet-500/50' },
    { id: AdminViewState.SETTINGS, title: 'Suporte', description: 'Configure informações de suporte e contato.', icon: <Settings size={32} className="text-gray-400" />, cta: 'Configurar Suporte', color: 'hover:border-gray-500/50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Painel de Controle</h2>
        <p className="text-slate-400 max-w-2xl">Bem-vindo à central de gestão do Prosperus Club. Selecione um módulo abaixo para iniciar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setView(card.id)}
            className={`flex flex-col items-start text-left p-6 bg-slate-900 rounded-xl border border-slate-800 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${card.color}`}
          >
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 mb-4 group-hover:scale-110 transition-transform">
              {card.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
            <p className="text-sm text-slate-400 mb-6 flex-1 leading-relaxed">{card.description}</p>
            <span className="text-sm font-semibold text-white flex items-center gap-2 group-hover:text-yellow-500 transition-colors">
              {card.cta} <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
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
      setEvents(dataService.getClubEvents());
      setVideos(dataService.getVideos());
      setArticles(dataService.getArticles());
    };
    updateData();
    return dataService.subscribe(updateData);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.sendPushNotification({ title, message, targetUrl, segment, scheduledFor: scheduledFor || undefined });
    setIsModalOpen(false);
    setTitle(''); setMessage(''); setTargetUrl(''); setSegment('ALL'); setScheduledFor('');
    alert('Notificação enviada com sucesso!');
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
      case AdminViewState.SETTINGS: return <SettingsModule />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex relative">
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="text-white"><Menu size={24} /></button><img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Admin" className="h-8 w-auto" /></div>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="fixed md:static inset-y-0 left-0 z-50"><AdminSidebar currentView={view} setView={setView} onLogout={onLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} /></div>
      <main className="flex-1 min-h-screen bg-[#0f172a] w-full pt-20 md:pt-8 p-4 md:p-8 overflow-x-hidden md:ml-64"><div className="max-w-7xl mx-auto">{renderContent()}</div></main>
    </div>
  );
};
