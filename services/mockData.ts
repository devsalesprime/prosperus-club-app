
import { Member, Video, ClubEvent, Article, Category, SupportConfig, Conversation, Message, PushNotification, UserNotification, Banner, ClubComment, GalleryConfig } from '../types';

// --- INITIAL DATA ---

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'admin-1',
    name: 'Admin Prosperus',
    role: 'ADMIN',
    company: 'Prosperus Club',
    image: 'https://picsum.photos/200/200?random=100',
    description: 'Administrador do sistema com acesso total ao backoffice.',
    tags: ['Administração', 'Gestão'],
    socials: { linkedin: '#' },
    isFeatured: false
  },
  {
    id: 'team-1',
    name: 'Equipe Prosperus',
    role: 'TEAM',
    company: 'Prosperus Club',
    image: 'https://picsum.photos/200/200?random=101',
    description: 'Sócio da equipe com acesso administrativo e de sócio.',
    tags: ['Equipe', 'Suporte'],
    socials: { linkedin: '#' },
    isFeatured: false
  },
  {
    id: '1',
    name: 'Carlos Mendes',
    role: 'MEMBER',
    company: 'TechSolutions',
    image: 'https://picsum.photos/200/200?random=1',
    description: 'Especialista em transformação digital e arquitetura de software.',
    tags: ['Tecnologia', 'Inovação'],
    socials: { linkedin: '#', whatsapp: '#' },
    isFeatured: true,
    exclusiveBenefit: {
      title: 'Auditoria de Escala Gratuita',
      description: 'Como sócio, você tem direito a uma sessão de 45 minutos para auditar seus processos de escala.',
      ctaUrl: 'https://calendly.com/prosperus/auditoria',
      ctaLabel: 'Agendar Agora'
    }
  },
  {
    id: '2',
    name: 'Amanda Torres',
    role: 'MEMBER',
    company: 'VendaMais',
    image: 'https://picsum.photos/200/200?random=2',
    description: 'Focada em expansão de mercado e estruturação de times comerciais.',
    tags: ['Vendas', 'Consultoria'],
    socials: { linkedin: '#', instagram: '#' }
  },
  {
    id: '3',
    name: 'Ricardo Silva',
    role: 'MEMBER',
    company: 'GreenEnergy',
    image: 'https://picsum.photos/200/200?random=3',
    description: 'Empreendedor no setor de energias renováveis.',
    tags: ['Sustentabilidade', 'Energia'],
    socials: { website: '#' }
  }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Tendências', slug: 'tendencias' },
  { id: '2', name: 'Negócios', slug: 'negocios' },
  { id: '3', name: 'Inovação', slug: 'inovacao' },
  { id: '4', name: 'Liderança', slug: 'lideranca' }
];

const INITIAL_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Masterclass: Liderança Exponencial',
    description: 'Aprenda os pilares da liderança na era digital com grandes nomes do mercado.',
    thumbnail: 'https://picsum.photos/400/225?random=10',
    category: 'Liderança',
    duration: '45 min',
    progress: 75,
    videoUrl: 'https://player.curseduca.com/embed/670b3aa9-3393-47d1-8da8-9d2511e82c4f/?api_key=514f682c8d9b37c075733fe2d123b15ad2ea4b2d'
  },
  {
    id: '2',
    title: 'Estratégias de Networking',
    description: 'Como construir uma rede de contatos sólida e valiosa dentro do clube.',
    thumbnail: 'https://picsum.photos/400/225?random=11',
    category: 'Networking',
    duration: '20 min',
    progress: 10,
    videoUrl: 'https://player.curseduca.com/embed/670b3aa9-3393-47d1-8da8-9d2511e82c4f/?api_key=514f682c8d9b37c075733fe2d123b15ad2ea4b2d'
  }
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const INITIAL_EVENTS: ClubEvent[] = [
  {
    id: '1',
    title: 'Café com Negócios',
    date: today.toISOString(),
    endDate: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    type: 'MEMBER',
    category: 'PRESENTIAL',
    location: 'Sede Prosperus - Sala Vip',
    mapLink: 'https://maps.google.com/?q=Sede+Prosperus',
    description: 'Encontro mensal para networking e troca de experiências.',
    bannerUrl: 'https://picsum.photos/800/400?random=88'
  },
  {
    id: '2',
    title: 'Treinamento de Vendas: Fechamento',
    date: tomorrow.toISOString(),
    endDate: new Date(tomorrow.getTime() + 1.5 * 60 * 60 * 1000).toISOString(),
    type: 'TEAM',
    category: 'ONLINE',
    link: 'https://zoom.us/j/123456789',
    meetingPassword: 'vendas-win',
    description: 'Capacitação técnica para a equipe comercial focada em técnicas de fechamento.'
  },
  {
    id: '3',
    title: 'Masterclass: Futuro do Varejo',
    date: nextWeek.toISOString(),
    endDate: new Date(nextWeek.getTime() + 1 * 60 * 60 * 1000).toISOString(),
    type: 'MEMBER',
    category: 'RECORDED',
    videoUrl: 'https://player.curseduca.com/embed/sample',
    description: 'Aula gravada liberada para todos os membros sobre tendências de varejo.'
  }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'O Futuro do Trabalho Híbrido',
    slug: 'o-futuro-do-trabalho-hibrido',
    author: 'Redação Prosperus',
    date: '12 Out, 2023',
    image: 'https://picsum.photos/400/200?random=20',
    excerpt: 'Como as empresas estão se adaptando à nova realidade pós-pandemia.',
    content: `
      <h2>A Nova Realidade Corporativa</h2>
      <p>O trabalho híbrido deixou de ser uma tendência para se tornar uma realidade consolidada. Grandes corporações ao redor do mundo estão reavaliando seus espaços físicos e políticas de RH.</p>
      <p>Estudos mostram que <strong>70% dos colaboradores</strong> preferem um modelo flexível.</p>
      <h3>Desafios e Oportunidades</h3>
      <p>Entre os principais desafios estão a manutenção da cultura organizacional e a garantia de equidade entre quem está presencial e remoto.</p>
    `,
    categoryName: 'Tendências',
    categoryId: '1',
    status: 'PUBLISHED',
    views: 1240
  },
  {
    id: '2',
    title: '5 Dicas para um Pitch Perfeito',
    slug: '5-dicas-para-um-pitch-perfeito',
    author: 'Carlos Mendes',
    date: '08 Out, 2023',
    image: 'https://picsum.photos/400/200?random=21',
    excerpt: 'Técnicas essenciais para vender sua ideia em poucos minutos.',
    content: `
      <p>Um bom pitch pode mudar a trajetória da sua startup. Aqui estão 5 dicas fundamentais:</p>
      <ol>
        <li>Conheça seu público alvo.</li>
        <li>Tenha um storytelling claro.</li>
        <li>Apresente o problema antes da solução.</li>
        <li>Mostre números reais.</li>
        <li>Tenha um Call to Action (CTA) claro.</li>
      </ol>
    `,
    categoryName: 'Negócios',
    categoryId: '2',
    status: 'PUBLISHED',
    views: 856
  }
];

const INITIAL_SUPPORT: SupportConfig = {
  techPhone: '5511999999999',
  financialPhone: '5511888888888'
};

// Initial Chat Data (Mock)
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participants: ['1', '2'], // Carlos (Me) and Amanda
    unreadCount: 1,
    lastMessage: {
      id: 'm1',
      conversationId: 'c1',
      senderId: '2',
      content: 'Olá Carlos, podemos marcar aquela reunião?',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: false
    }
  },
  {
    id: 'c2',
    participants: ['1', 'admin'], // Carlos (Me) and Admin
    unreadCount: 0,
    lastMessage: {
      id: 'm2',
      conversationId: 'c2',
      senderId: '1',
      content: 'Obrigado pelo suporte!',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: true
    }
  }
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'm0', conversationId: 'c1', senderId: '1', content: 'Oi Amanda, tudo bem?', timestamp: new Date(Date.now() - 7200000).toISOString(), read: true },
  { id: 'm1', conversationId: 'c1', senderId: '2', content: 'Olá Carlos, podemos marcar aquela reunião?', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 'm2', conversationId: 'c2', senderId: 'admin', content: 'Olá Carlos, seu acesso foi liberado.', timestamp: new Date(Date.now() - 90000000).toISOString(), read: true },
  { id: 'm3', conversationId: 'c2', senderId: '1', content: 'Obrigado pelo suporte!', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true }
];

const INITIAL_NOTIFICATIONS: PushNotification[] = [
  { id: 'n1', title: 'Bem-vindo ao Prosperus Club!', message: 'Explore as novidades do nosso app.', targetUrl: '/', segment: 'ALL', status: 'SENT', sentAt: new Date(Date.now() - 172800000).toISOString() }
];

const INITIAL_USER_NOTIFICATIONS: UserNotification[] = [
  { id: 'u1', userId: '1', title: 'Novo Evento: Café com Negócios', message: 'Um novo evento presencial foi adicionado à agenda.', date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), read: false, actionUrl: 'AGENDA' },
  { id: 'u2', userId: '1', title: 'Vídeo Recomendado', message: 'Assista à nova Masterclass de Liderança.', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true, actionUrl: 'ACADEMY' },
  { id: 'u3', userId: '1', title: 'Bem-vindo ao Clube', message: 'Complete seu perfil para aumentar sua visibilidade.', date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), read: true, actionUrl: 'PROFILE' }
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: 'Convenção Anual 2026',
    subtitle: 'Garanta sua vaga no maior evento do ano em São Paulo.',
    imageUrl: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop',
    linkUrl: 'AGENDA',
    linkType: 'INTERNAL',
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    isActive: true,
    placement: 'HOME',
    priority: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'b2',
    title: 'Nova Masterclass: Growth Hacking',
    subtitle: 'Aprenda as estratégias que as startups usam para escalar rápido.',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop',
    linkUrl: 'ACADEMY',
    linkType: 'INTERNAL',
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    isActive: true,
    placement: 'HOME',
    priority: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_GALLERY_CONFIG: GalleryConfig = {
  id: 'gallery-1',
  mainGalleryUrl: import.meta.env.VITE_GALLERY_URL || 'https://photos.app.goo.gl/example',
  latestEventAlbumUrl: '',
  provider: 'GOOGLE_PHOTOS',
  updatedAt: new Date().toISOString()
};

// Data Service Class (Singleton Pattern)
class DataService {
  private members: Member[] = [];
  private videos: Video[] = [];
  private events: ClubEvent[] = [];
  private articles: Article[] = [];
  private categories: Category[] = [];
  private support: SupportConfig = INITIAL_SUPPORT;
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private notifications: PushNotification[] = [];
  private userNotifications: UserNotification[] = [];
  private banners: Banner[] = [];
  private galleryConfig: GalleryConfig = INITIAL_GALLERY_CONFIG;
  private listeners: Function[] = [];

  constructor() {
    this.members = this.load('members', INITIAL_MEMBERS);
    this.videos = this.load('videos', INITIAL_VIDEOS);
    this.events = this.load('events', INITIAL_EVENTS);
    this.articles = this.load('articles', INITIAL_ARTICLES);
    this.categories = this.load('categories', INITIAL_CATEGORIES);
    this.support = this.load('support', INITIAL_SUPPORT);
    this.conversations = this.load('conversations', INITIAL_CONVERSATIONS);
    this.messages = this.load('messages', INITIAL_MESSAGES);
    this.notifications = this.load('notifications', INITIAL_NOTIFICATIONS);
    this.userNotifications = this.load('userNotifications', INITIAL_USER_NOTIFICATIONS);
    this.banners = this.load('banners', INITIAL_BANNERS);
    this.galleryConfig = this.load('galleryConfig', INITIAL_GALLERY_CONFIG);
  }

  // LocalStorage Helper
  private load<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(`prosperus_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.error('Error loading data', e);
      return fallback;
    }
  }

  private save(key: string, data: any) {
    try {
      localStorage.setItem(`prosperus_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving data', e);
    }
  }

  subscribe(listener: Function) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- ANALYTICS ---
  trackEvent(eventName: string, metadata?: any) {
    console.log(`[ANALYTICS] ${eventName}`, metadata);
    // In production, save to DB. Here we just log.
  }

  getAnalyticsSummary() {
    // Generate dynamic mock data based on existing content
    const totalViews = this.articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const totalVideoProgress = this.videos.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    const avgCompletion = this.videos.length ? Math.round(totalVideoProgress / this.videos.length) : 0;

    return {
      totalMembers: this.members.length,
      activeUsersLast7Days: Math.floor(this.members.length * 0.8), // Mock
      totalArticleViews: totalViews,
      avgVideoCompletion: avgCompletion,
      videoViewsByCategory: [
        { name: 'Liderança', value: 450 },
        { name: 'Networking', value: 320 },
        { name: 'Vendas', value: 210 }
      ],
      articleViewsByCategory: this.categories.map(c => ({
        name: c.name,
        value: this.articles.filter(a => a.categoryId === c.id).reduce((acc, a) => acc + (a.views || 0), 0)
      }))
    };
  }

  // --- NOTIFICATIONS (ADMIN PUSH) ---
  async requestPushPermission() {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Mock: Add a "Welcome" notification to the user list if granted
      const alreadyHasWelcome = this.userNotifications.some(n => n.id === 'welcome-push');
      if (!alreadyHasWelcome) {
        this.userNotifications.unshift({
          id: 'welcome-push',
          userId: '1',
          title: 'Notificações Ativadas!',
          message: 'Agora você receberá alertas importantes diretamente no seu dispositivo.',
          date: new Date().toISOString(),
          read: false
        });
        this.save('userNotifications', this.userNotifications);
        this.notify();
      }
      return true;
    }
    return false;
  }

  getNotifications() { return this.notifications; }

  sendPushNotification(notification: Omit<PushNotification, 'id' | 'status' | 'sentAt'>) {
    const newNotification: PushNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      status: notification.scheduledFor ? 'SCHEDULED' : 'SENT',
      sentAt: notification.scheduledFor ? undefined : new Date().toISOString()
    };
    this.notifications.unshift(newNotification); // Add to top
    this.save('notifications', this.notifications);
    this.notify();

    // Mock sending process: Create UserNotification for logged user
    if (newNotification.status === 'SENT') {
      console.log(`[PUSH SERVER] Sending to ${newNotification.segment}: ${newNotification.title}`);
      this.userNotifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        userId: '1', // Mock sending to current user
        title: newNotification.title,
        message: newNotification.message,
        date: new Date().toISOString(),
        read: false,
        actionUrl: newNotification.targetUrl || undefined
      });
      this.save('userNotifications', this.userNotifications);
      this.notify();
    }
  }

  // --- USER NOTIFICATIONS (APP) ---
  getUserNotifications(userId: string) {
    return this.userNotifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  markNotificationAsRead(id: string) {
    this.userNotifications = this.userNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.save('userNotifications', this.userNotifications);
    this.notify();
  }

  markAllNotificationsAsRead(userId: string) {
    this.userNotifications = this.userNotifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    this.save('userNotifications', this.userNotifications);
    this.notify();
  }

  // --- MEMBERS ---
  getMembers() { return this.members; }
  updateMember(updated: Member) {
    this.members = this.members.map(m => m.id === updated.id ? { ...m, ...updated } : m);
    this.save('members', this.members);
    this.notify();
  }
  deleteMember(id: string) {
    this.members = this.members.filter(m => m.id !== id);
    this.save('members', this.members);
    this.notify();
  }

  // --- VIDEOS ---
  getVideos() { return this.videos; }
  addVideo(video: Omit<Video, 'id'>) {
    const newVideo = { ...video, id: Math.random().toString(36).substr(2, 9) };
    this.videos.push(newVideo);
    this.save('videos', this.videos);
    this.notify();
  }
  updateVideo(updated: Video) {
    this.videos = this.videos.map(v => v.id === updated.id ? { ...v, ...updated } : v);
    this.save('videos', this.videos);
    this.notify();
  }
  deleteVideo(id: string) {
    this.videos = this.videos.filter(v => v.id !== id);
    this.save('videos', this.videos);
    this.notify();
  }

  addComment(videoId: string, comment: Omit<ClubComment, 'id' | 'createdAt'>) {
    const video = this.videos.find(v => v.id === videoId);
    if (video) {
      const newComment: ClubComment = {
        ...comment,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      video.comments = [...(video.comments || []), newComment];
      this.save('videos', this.videos);
      this.notify();
    }
  }

  // --- BANNERS ---
  getBanners() { return this.banners; }
  addBanner(banner: Omit<Banner, 'id'>) {
    const newBanner = { ...banner, id: Math.random().toString(36).substr(2, 9) };
    this.banners.push(newBanner);
    this.save('banners', this.banners);
    this.notify();
  }
  updateBanner(updated: Banner) {
    this.banners = this.banners.map(b => b.id === updated.id ? updated : b);
    this.save('banners', this.banners);
    this.notify();
  }
  deleteBanner(id: string) {
    this.banners = this.banners.filter(b => b.id !== id);
    this.save('banners', this.banners);
    this.notify();
  }
  updateVideoProgress(id: string, progress: number) {
    this.videos = this.videos.map(v => v.id === id ? { ...v, progress: Math.min(100, progress) } : v);
    this.save('videos', this.videos);
    this.notify();
    if (progress === 100) this.trackEvent('video_complete', { videoId: id });
    else if (progress > 0) this.trackEvent('video_progress', { videoId: id, progress });
  }

  // --- EVENTS ---
  getClubEvents() { return this.events; }
  addClubEvent(event: Omit<ClubEvent, 'id'>) {
    const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
    this.events.push(newEvent);
    this.save('events', this.events);
    this.notify();
  }
  updateClubEvent(updated: ClubEvent) {
    this.events = this.events.map(e => e.id === updated.id ? { ...e, ...updated } : e);
    this.save('events', this.events);
    this.notify();
  }
  deleteClubEvent(id: string) {
    this.events = this.events.filter(e => e.id !== id);
    this.save('events', this.events);
    this.notify();
  }

  // --- CATEGORIES ---
  getCategories() { return this.categories; }
  addCategory(category: Omit<Category, 'id'>) {
    const newCat = { ...category, id: Math.random().toString(36).substr(2, 9) };
    this.categories.push(newCat);
    this.save('categories', this.categories);
    this.notify();
  }
  updateCategory(updated: Category) {
    this.categories = this.categories.map(c => c.id === updated.id ? updated : c);
    this.save('categories', this.categories);
    this.notify();
  }
  deleteCategory(id: string) {
    this.categories = this.categories.filter(c => c.id !== id);
    this.save('categories', this.categories);
    this.notify();
  }

  // --- ARTICLES ---
  getArticles() { return this.articles; }

  getArticleBySlug(slug: string) {
    return this.articles.find(a => a.slug === slug);
  }

  getAdjacentArticles(currentId: string) {
    const currentIndex = this.articles.findIndex(a => a.id === currentId);
    if (currentIndex === -1) return { prev: null, next: null };

    const prev = currentIndex > 0 ? this.articles[currentIndex - 1] : null;
    const next = currentIndex < this.articles.length - 1 ? this.articles[currentIndex + 1] : null;

    return { prev, next };
  }

  incrementArticleView(id: string) {
    const article = this.articles.find(a => a.id === id);
    if (article) {
      article.views = (article.views || 0) + 1;
      this.save('articles', this.articles);
      this.trackEvent('article_view', { articleId: id, title: article.title });
    }
  }

  addArticle(article: Omit<Article, 'id'>) {
    const newArticle = {
      ...article,
      id: Math.random().toString(36).substr(2, 9),
      views: 0
    };
    this.articles.push(newArticle);
    this.save('articles', this.articles);
    this.notify();
  }
  updateArticle(updated: Article) {
    this.articles = this.articles.map(a => a.id === updated.id ? { ...a, ...updated } : a);
    this.save('articles', this.articles);
    this.notify();
  }
  deleteArticle(id: string) {
    this.articles = this.articles.filter(a => a.id !== id);
    this.save('articles', this.articles);
    this.notify();
  }

  // --- MESSAGING ---
  getConversations(userId: string) {
    return this.conversations.filter(c => c.participants.includes(userId))
      .map(c => c);
  }

  getAllConversations() {
    // Admin function: returns ALL conversations
    return this.conversations;
  }

  getMessages(conversationId: string) {
    return this.messages.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  sendMessage(conversationId: string, senderId: string, content: string) {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      conversationId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.messages.push(newMessage);
    this.save('messages', this.messages);

    // Update conversation last message
    this.conversations = this.conversations.map(c => {
      if (c.id === conversationId) {
        return { ...c, lastMessage: newMessage, unreadCount: 0 }; // Reset unread for sender, Logic needed for receiver
      }
      return c;
    });
    this.save('conversations', this.conversations);

    this.notify();
    this.trackEvent('message_sent', { conversationId });
  }

  // --- SUPPORT ---
  getSupportConfig() { return this.support; }
  updateSupportConfig(config: SupportConfig) {
    this.support = config;
    this.save('support', this.support);
    this.notify();
  }

  // --- GALLERY ---
  getGalleryConfig() { return this.galleryConfig; }
  updateGalleryConfig(config: GalleryConfig) {
    this.galleryConfig = config;
    this.save('galleryConfig', this.galleryConfig);
    this.notify();
  }
}

export const dataService = new DataService();
