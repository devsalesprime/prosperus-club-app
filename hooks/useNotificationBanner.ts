// hooks/useNotificationBanner.ts
// Controla quando exibir o banner e navega para o deep link

import { useState, useEffect } from 'react'
import { notificationBannerService, NotificationBanner } from '../services/notificationBannerService'

export function useNotificationBanner(userId: string | null, userRole: string | null) {
  const [activeBanner, setActiveBanner] = useState<NotificationBanner | null>(null)
  const [ready, setReady]               = useState(false)

  useEffect(() => {
    if (!userId || !userRole) return

    // Delay de 2s para não competir com o carregamento inicial
    const timer = setTimeout(async () => {
      const banner = await notificationBannerService.getActiveBannerForUser(userId, userRole)
      setActiveBanner(banner)
      setReady(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [userId, userRole])

  const dismissBanner = (deepLink?: string) => {
    if (activeBanner) {
      notificationBannerService.markBannerAsSeen(activeBanner.id, userId!)
    }
    setActiveBanner(null)
    return deepLink
  }

  return { activeBanner, ready, dismissBanner }
}
