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
            '/',   
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

  // --- Funções de Compatibilidade (Typescript Build Completo) ---
  
  async notifyNewVideo(...args: any[]) {}
  async notifyNewArticle(...args: any[]) {}
  async notifyNewSolution(...args: any[]) {}
  async notifyNewGallery(...args: any[]) {}
  async notifyNewEvent(...args: any[]) {}
  async notifyEventUpdated(...args: any[]) {}
  async notifyNewMessage(...args: any[]) {}

}

export const notificationTriggers = new NotificationTriggers()

// Exports soltos para retrocompatibilidade
export const notifyNewVideo = async (...args: any[]) => {}
export const notifyNewArticle = async (...args: any[]) => {}
export const notifyNewSolution = async (...args: any[]) => {}
export const notifyNewGallery = async (...args: any[]) => {}
export const notifyNewEvent = async (...args: any[]) => {}
export const notifyEventUpdated = async (...args: any[]) => {}
export const notifyNewMessage = async (...args: any[]) => {}
