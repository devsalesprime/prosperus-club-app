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
  async notifyColetaFaturamento() {
    try {
      // 1. Buscar todos os sócios (MEMBER) ativos
      const { data: members, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['MEMBER', 'ACCOUNT_MANAGER'])
      
      if (error) throw error
      if (!members || members.length === 0) return { count: 0 }

      let successCount = 0

      // 2. Loop para enviar notificação in-app para cada um
      for (const member of members) {
        try {
          await notificationService.createNotification(
            'Atualização de Faturamento',
            `Olá ${member.name.split(' ')[0]}, o trimestre virou! É hora de atualizar seu faturamento para recalcularmos seu ROI no clube.`,
            'INDIVIDUAL',
            '/',   // Action Link, vai pro dashboard
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
}

export const notificationTriggers = new NotificationTriggers()
