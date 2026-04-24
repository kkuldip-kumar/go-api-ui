import { useCallback, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { notificationApi } from '@/api'
import type { PushPermission } from '@/types'

// Detect if the browser supports the Notification API
const isSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator

export function usePushNotifications() {
  const { pushPermission, setPushPermission, activeConversationId } = useChatStore()

  // Sync Notification.permission into the store on mount
  useEffect(() => {
    if (!isSupported) {
      setPushPermission('unsupported')
      return
    }
    setPushPermission(Notification.permission as PushPermission)
  }, [setPushPermission])

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<PushPermission> => {
    if (!isSupported) return 'unsupported'
    try {
      const result = await Notification.requestPermission()
      setPushPermission(result as PushPermission)

      // If granted, register a placeholder token with the backend.
      // In a real app you'd use the Web Push API (VAPID) here.
      if (result === 'granted') {
        try {
          const pseudoToken = `web_${navigator.userAgent.slice(0, 20)}_${Date.now()}`
          await notificationApi.registerDeviceToken(pseudoToken, 'web')
        } catch { /* non-fatal */ }
      }

      return result as PushPermission
    } catch {
      return 'denied'
    }
  }, [setPushPermission])

  // Show a browser notification for a new message
  // Only fires when the tab is in the background
  const showMessageNotification = useCallback(
    (title: string, body: string, conversationId?: string) => {
      if (!isSupported || Notification.permission !== 'granted') return
      // Don't notify for the currently active conversation if the tab is visible
      if (document.visibilityState === 'visible' && conversationId === activeConversationId) return

      const n = new Notification(title, {
        body,
        icon: '/favicon.svg',
        tag: conversationId ?? 'go-chat', // collapse multiple from same conv
        // renotify: true,
      })

      n.onclick = () => {
        window.focus()
        n.close()
        // Navigate to conversation if needed
        if (conversationId) {
          window.dispatchEvent(new CustomEvent('notification:click', { detail: { conversationId } }))
        }
      }
    },
    [activeConversationId],
  )

  return {
    pushPermission,
    isSupported,
    requestPermission,
    showMessageNotification,
  }
}