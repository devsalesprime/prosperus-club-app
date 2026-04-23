// services/notificationBannerService.ts

import { supabase } from '../lib/supabase'

export interface NotificationBanner {
  id:           string
  title:        string
  image_url:    string
  deep_link:    string
  link_label:   string | null
  is_active:    boolean
  starts_at:    string
  ends_at:      string | null
  skip_delay:   number
  target_roles: string[]
  created_at:   string
}

export interface BannerMetrics {
  totalViews: number;
  ctaClicks: number;
  skipClicks: number;
}

// ─── Buscar banner ativo não visto pelo usuário atual ────────────────────────
// Retorna apenas 1 — o mais recente não visto nesta sessão
async function getActiveBannerForUser(
  userId:   string,
  userRole: string
): Promise<NotificationBanner | null> {
  // 1. Buscar do banco banners em que foi feito o CTA (exclusão permanente)
  const { data: seenViews } = await supabase
    .from('notification_banner_views')
    .select('banner_id')
    .eq('user_id', userId);
    
  const dbSeenIds = (seenViews || []).map(r => r.banner_id);

  // 2. Buscar banners que foram apenas "Pulados" (cache 24h via localStorage)
  const skipKey = `banner-skips-${userId}`;
  const skipsConfig = JSON.parse(localStorage.getItem(skipKey) || '{}');
  const now = Date.now();
  const skippedIds: string[] = [];
  
  for (const bId in skipsConfig) {
      if (skipsConfig[bId] > now) {
          skippedIds.push(bId);
      } else {
          delete skipsConfig[bId]; // limpar expirados
      }
  }
  localStorage.setItem(skipKey, JSON.stringify(skipsConfig)); // atualiza e limpa lixo silenciomente

  const excludedIds = [...new Set([...dbSeenIds, ...skippedIds])];

  let query = supabase
    .from('notification_banners')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .contains('target_roles', [userRole]);

  if (excludedIds.length > 0) {
     query = query.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[BannerService] erro:', error)
    return null
  }

  return data
}

// ─── Marcar banner como visto (sessão + banco) ───────────────────────────────
async function markBannerAsSeen(
  bannerId: string,
  userId:   string
): Promise<void> {
  // O usuário clicou na CTA (action). Escreve permanentemente no Supabase!
  supabase
    .from('notification_banner_views')
    .upsert({ banner_id: bannerId, user_id: userId }, { onConflict: 'banner_id,user_id' })
    .then(({ error }) => {
        if (error) console.warn('[BannerService] view não registrada:', error);
    });
}

// ─── Pular banner (24h de cooldown) ──────────────────────────────────────────
async function markBannerAsSkipped(
  bannerId: string,
  userId: string
): Promise<void> {
  const skipKey = `banner-skips-${userId}`;
  const skips = JSON.parse(localStorage.getItem(skipKey) || '{}');
  // Adiciona a expiração de +24 horas (milissegundos)
  skips[bannerId] = Date.now() + (24 * 60 * 60 * 1000);
  localStorage.setItem(skipKey, JSON.stringify(skips));
}

// ─── CRUD admin ──────────────────────────────────────────────────────────────
async function createBanner(
  data: Omit<NotificationBanner, 'id' | 'created_at'>
): Promise<NotificationBanner> {
  const { data: created, error } = await supabase
    .from('notification_banners')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return created
}

async function updateBanner(
  id:   string,
  data: Partial<NotificationBanner>
): Promise<void> {
  const { error } = await supabase
    .from('notification_banners')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('notification_banners')
    .delete()
    .eq('id', id)
  if (error) throw error
}

async function getAllBanners(): Promise<NotificationBanner[]> {
  const { data, error } = await supabase
    .from('notification_banners')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

async function getBannerMetrics(bannerId: string): Promise<BannerMetrics> {
  // Views diretas da tabela isolada
  const { count: views } = await supabase
    .from('notification_banner_views')
    .select('*', { count: 'exact', head: true })
    .eq('banner_id', bannerId);

  // Cliques capturados via Data Lake (analytics_events)
  const { data: events } = await supabase
    .from('analytics_events')
    .select('metadata')
    .eq('event_type', 'BANNER_INTERACTION')
    .contains('metadata', { banner_id: bannerId });

  let ctaClicks = 0;
  let skipClicks = 0;

  events?.forEach((e: { metadata?: Record<string, unknown> }) => {
      if (e.metadata?.action === 'cta_clicked') ctaClicks++;
      if (e.metadata?.action === 'skip_clicked') skipClicks++;
  });

  return {
    totalViews: views || 0,
    ctaClicks,
    skipClicks
  };
}

export const notificationBannerService = {
  getActiveBannerForUser,
  markBannerAsSeen,
  markBannerAsSkipped,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllBanners,
  getBannerMetrics
};
