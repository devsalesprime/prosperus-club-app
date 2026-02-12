

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  AGENDA = 'AGENDA',
  ACADEMY = 'ACADEMY',
  PROSPERUS_TOOLS = 'PROSPERUS_TOOLS', // Prosperus Tools Hub
  SOLUTIONS = 'SOLUTIONS', // Prosperus Tools: Soluções
  PROGRESS = 'PROGRESS', // Prosperus Tools: Meu Progresso
  MEMBERS = 'MEMBERS',
  GALLERY = 'GALLERY', // Substituído NEWS por GALLERY (PRD v2.0)
  NEWS = 'NEWS', // Blog/Artigos para sócios
  MESSAGES = 'MESSAGES', // Novo estado para Chat
  NOTIFICATIONS = 'NOTIFICATIONS', // Nova página dedicada de notificações
  PROFILE = 'PROFILE',
  // Business Core v2.5
  DEALS = 'DEALS', // Meus Negócios (ROI)
  REFERRALS = 'REFERRALS', // Indicações
  RANKINGS = 'RANKINGS', // Rankings de Performance
  FAVORITES = 'FAVORITES' // Meus Favoritos
}

export enum AdminViewState {
  DASHBOARD = 'DASHBOARD',
  EVENTS = 'EVENTS',
  VIDEOS = 'VIDEOS',
  TOOLS_SOLUTIONS = 'TOOLS_SOLUTIONS', // Prosperus Tools: Gerenciar Soluções
  TOOLS_PROGRESS = 'TOOLS_PROGRESS', // Prosperus Tools: Enviar Relatórios
  MEMBERS = 'MEMBERS',
  ARTICLES = 'ARTICLES',
  GALLERY = 'GALLERY', // Galeria de Fotos
  BANNERS = 'BANNERS', // Gerenciador de Banners
  CATEGORIES = 'CATEGORIES',
  ANALYTICS = 'ANALYTICS', // Novo
  NOTIFICATIONS = 'NOTIFICATIONS', // Novo
  MESSAGES = 'MESSAGES', // Novo (Moderação)
  ROI_AUDIT = 'ROI_AUDIT', // Business Core Admin
  SETTINGS = 'SETTINGS'
}

export interface Member {
  id: string;
  name: string;
  role: 'ADMIN' | 'TEAM' | 'MEMBER';
  company: string;
  jobTitle?: string; // HubSpot: jobtitle
  phone?: string; // HubSpot: phone or mobilephone
  image: string;
  description: string;
  socials: {
    linkedin?: string;
    instagram?: string;
    website?: string;
    whatsapp?: string;
  };
  tags: string[];
  isFeatured?: boolean;

  // PRD v2.0 - Gap 5: Benefício Exclusivo
  exclusiveBenefit?: {
    title: string;
    description: string; // máx 200 caracteres
    ctaUrl?: string;
    ctaLabel?: string;
  };
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  duration: string;
  progress: number; // 0-100
  videoUrl?: string; // Mock URL for iframe

  // PRD v2.0 - Gap 7: Navegação de Módulos
  seriesId?: string;
  seriesOrder?: number;

  // PRD v2.0 - Gap 6: Sistema de Comentários
  comments?: ClubComment[];
}

export interface VideoProgress {
  id: string;
  userId: string;
  videoId: string;
  progress: number; // 0-100
  lastWatchedAt: string;
}

export interface VideoSeries {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  videos: Video[];
}

export type EventCategory = 'PRESENTIAL' | 'ONLINE'; // RECORDED removed - legacy events may still exist in DB

export interface EventMaterial {
  title: string;
  url: string;
  type: 'PDF' | 'LINK' | 'DOC' | 'VIDEO';
}

export interface EventSession {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string start
  endDate?: string; // ISO string end
  type: 'MEMBER' | 'TEAM' | 'PRIVATE'; // Agenda Type
  category: EventCategory; // Visualization Category

  // Private Event Targeting (only when type === 'PRIVATE')
  targetMemberId?: string; // UUID of the specific member
  targetMemberName?: string; // Display name (denormalized for admin list)

  // Multi-date Sessions (optional)
  sessions?: EventSession[]; // For multi-day events with distinct schedules

  // Dynamic Fields
  location?: string; // For PRESENTIAL
  mapLink?: string; // For PRESENTIAL (Google Maps URL)
  link?: string; // For ONLINE or RECORDED
  meetingPassword?: string; // For ONLINE
  videoUrl?: string; // For RECORDED

  coverImage?: string;
  bannerUrl?: string; // New: Full banner image for details
  materials?: EventMaterial[]; // Customizable event materials

  // Calendar Helpers
  start?: Date;
  end?: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string; // URL amigável
  author: string;
  date: string;
  image: string;
  excerpt: string;
  content?: string; // HTML Completo
  categoryId?: string; // ID da Categoria
  categoryName?: string; // Nome legado ou denormalizado
  status: 'DRAFT' | 'PUBLISHED';
  views: number;
}

export interface SupportConfig {
  techPhone: string;
  financialPhone: string;
}

// --- NEW TYPES FOR MESSAGING & ANALYTICS ---

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // IDs dos membros
  lastMessage?: Message;
  unreadCount: number;
}

export interface AnalyticsEvent {
  eventName: string;
  metadata?: any;
  timestamp: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetUrl?: string;
  segment: 'ALL' | 'MEMBERS' | 'TEAM';
  status: 'SENT' | 'SCHEDULED' | 'FAILED';
  scheduledFor?: string;
  sentAt?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionUrl?: string;
}

// --- PRD v2.0 - NEW INTERFACES ---

// Gap 6: Sistema de Comentários da Academy
export interface ClubComment {
  id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  content: string; // máx 500 caracteres
  createdAt: string;
}

// Gap 2: Galeria de Fotos (DEPRECATED - Use GalleryAlbum)
export interface GalleryConfig {
  id: string;
  mainGalleryUrl: string;
  latestEventAlbumUrl: string;
  provider: 'GOOGLE_PHOTOS' | 'EXTERNAL' | 'CUSTOM';
  updatedAt: string;
}

// FASE 6 (ATUALIZADA): Multi-Álbum Gallery System
export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  coverImage?: string; // URL da imagem de destaque/banner
  createdAt: string;
}

// Gap 4: Banner da Tela Home
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  linkType?: 'INTERNAL' | 'EXTERNAL';
  startDate: string;
  endDate: string;
  isActive: boolean;
  placement: 'HOME' | 'ACADEMY';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// ========== BUSINESS CORE v2.5 ==========

export type DealStatus = 'PENDING' | 'CONFIRMED' | 'CONTESTED' | 'AUDITADO' | 'INVALIDADO';
export type ReferralStatus = 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST';

export interface Deal {
  id: string;
  seller_id: string;
  buyer_id: string;
  amount: number;
  description: string;
  status: DealStatus;
  deal_date: string;
  created_at: string;
  updated_at: string;
  // Admin audit fields
  audit_notes?: string;
  audited_at?: string;
  audited_by?: string;
  seller?: {
    id: string;
    name: string;
    image_url: string;
    email?: string;
    company?: string;
    job_title?: string;
  };
  buyer?: {
    id: string;
    name: string;
    image_url: string;
    email?: string;
    company?: string;
    job_title?: string;
  };
  auditor?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Referral {
  id: string;
  referrer_id: string;
  receiver_id: string;
  lead_name: string;
  lead_email?: string;
  lead_phone?: string;
  notes?: string;
  status: ReferralStatus;
  converted_amount?: number;
  feedback?: string; // Motivo da perda (required when LOST)
  created_at: string;
  updated_at: string;
  converted_at?: string;
  referrer?: {
    id: string;
    name: string;
    image_url: string;
  };
  receiver?: {
    id: string;
    name: string;
    image_url: string;
  };
}

export interface RankingEntry {
  rank?: number;
  user_id: string;
  name: string;
  image_url: string;
  total_amount?: number;
  total_sales?: number; // Alias for admin rankings
  deal_count?: number;
  deals_count?: number; // Alias for admin rankings
  avg_ticket?: number;
  referral_count?: number;
  converted_count?: number;
  total_converted_amount?: number;
}

export interface BusinessStats {
  totalSales: number;
  totalPurchases: number;
  pendingConfirmations: number;
  referralsSent: number;
  referralsReceived: number;
  conversions: number;
}
