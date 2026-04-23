// services/notificationTriggers.ts
// Responsável por disparar alertas e push notifications manuais ou programadas

import { supabase } from '../lib/supabase'
import { notificationService } from './notificationService'

class NotificationTriggers {
  /**
   * Dispara um push notification para todos os sócios ativos que precisam
   * atualizar o faturamento trimestral. Em produção, isso rodaria via CRON
   * Edge Function, mas o Admin pode disparar manualmente.
   */
    async notifyColetaFaturamento(targetSocioId?: string) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['MEMBER', 'ACCOUNT_MANAGER']);
        
      if (targetSocioId && targetSocioId !== 'all') {
          query = query.eq('id', targetSocioId);
      }
      
      const { data: members, error } = await query;
      
      if (error) throw error
      if (!members || members.length === 0) return { count: 0 }

      let successCount = 0
      for (const member of members) {
        try {
          await notificationService.createNotification(
            'Atualização de Faturamento',
            `Olá ${member.name.split(' ')[0]}, o trimestre virou! É hora de atualizar seu faturamento para recalcularmos seu Múltiplo de Crescimento no clube.`,
            'INDIVIDUAL',
            '/app/roi-crescimento',   
            member.id
          )
          successCount++
        } catch (err) {
          console.error(`Erro ao notificar membro ${member.id}:`, err)
        }
      }
      return { count: successCount }
    } catch (error) {
      console.error('Falha geral no disparo de coleta de faturamento:', error)
      throw error
    }
  }

  async notifyNewArticle(articleTitle: string) {
    try {
      const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
      if (error) throw error;
      if (!members) return { count: 0 };
      for (const member of members) {
        await notificationService.createNotification(
          '📰 Novo Artigo na Prosperus', 
          `Acabamos de publicar: ${articleTitle}. Leia agora na aba News!`, 
          'INDIVIDUAL', '/app/noticias', member.id
        ).catch(console.error);
      }
      return { count: members.length };
    } catch (e) {
      console.error(e);
      return { count: 0 };
    }
  }

  async notifyNewSolution(providerName: string) {
    try {
      const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
      if (error) throw error;
      if (!members) return { count: 0 };
      for (const member of members) {
        await notificationService.createNotification(
          '💼 Nova Parceria Estratégica', 
          `Um novo parceiro entrou no clube: ${providerName}. Acesse a aba de Soluções para resgatar seus benefícios!`, 
          'INDIVIDUAL', '/app/tools/solucoes', member.id
        ).catch(console.error);
      }
      return { count: members.length };
    } catch (e) {
      console.error(e);
      return { count: 0 };
    }
  }

  async notifyEventUpdated(eventName: string) {
    try {
      const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
      if (error) throw error;
      if (!members) return { count: 0 };
      for (const member of members) {
        await notificationService.createNotification(
          '📅 Atualização de Evento', 
          `O evento "${eventName}" sofreu alterações. Verifique sua agenda para mais detalhes.`, 
          'INDIVIDUAL', '/app/agenda', member.id
        ).catch(console.error);
      }
      return { count: members.length };
    } catch (e) {
      console.error(e);
      return { count: 0 };
    }
  }

  async notifyNewVideo(title: string, url?: string) {}
  async notifyNewGallery(title: string, albumId?: string) {}
  async notifyNewEvent(id: string, title: string, date: string, authorId?: string) {}
  async notifyNewMessage(conversationId: string, senderId: string, receiverId: string, content: string) {}

}

export const notificationTriggers = new NotificationTriggers()

// Exports soltos para retrocompatibilidade
export const notifyNewVideo = async (title: string, url?: string) => notificationTriggers.notifyNewVideo(title, url);
export const notifyNewArticle = async (id: string, title: string, authorId?: string) => notificationTriggers.notifyNewArticle(title);
export const notifyNewSolution = async (id: string, title: string, type?: string) => notificationTriggers.notifyNewSolution(title);
export const notifyNewGallery = async (title: string, albumId?: string) => notificationTriggers.notifyNewGallery(title, albumId);
export const notifyNewEvent = async (id: string, title: string, date: string, authorId?: string) => notificationTriggers.notifyNewEvent(id, title, date, authorId);
export const notifyEventUpdated = async (payload: { eventTitle: string; [key: string]: unknown }) => notificationTriggers.notifyEventUpdated(payload.eventTitle);
export const notifyNewMessage = async (conversationId: string, senderId: string, receiverId: string, content: string) => notificationTriggers.notifyNewMessage(conversationId, senderId, receiverId, content);
