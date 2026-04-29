import { useEffect, useRef, useCallback } from 'react'
import { BASE_WS_URL } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useShallow } from 'zustand/react/shallow'
import type { Message, WSEvent, TypingUser } from '@/types'

const RECONNECT_DELAY_MS = 3_000
const MAX_RECONNECT_ATTEMPTS = 8
const TYPING_TIMEOUT_MS = 4_000

export const wsRef = { current: null as WebSocket | null }

export function useWebSocket() {
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const unmounted = useRef(false)
  const connectRef = useRef<() => void>(() => {})

  const { accessToken, isAuthenticated } = useAuthStore()

const {
  appendMessage,
  updateMessageStatus,
  setUserOnline,
  setWsConnected,
  setTyping,
  clearTyping,
} = useChatStore(
  useShallow((s) => ({
    appendMessage: s.appendMessage,
    updateMessageStatus: s.updateMessageStatus,
    setUserOnline: s.setUserOnline,
    setWsConnected: s.setWsConnected,
    setTyping: s.setTyping,
    clearTyping: s.clearTyping,
  }))
)

  const handleEvent = useCallback(
    (event: WSEvent) => {
      switch (event.type) {
        case 'new_message': {
          const msg = event.payload as Message
          if (msg?.conversation_id) appendMessage(msg.conversation_id, msg)
          break
        }
        case 'message_status': {
          const { message_id, conversation_id, status } = event.payload as {
            message_id: string
            conversation_id: string
            status: Message['status']
          }
          if (message_id && conversation_id)
            {updateMessageStatus(conversation_id, message_id, status)}
          break
        }
        case 'user_online': {
          const { user_id } = event.payload as { user_id: string }
          if (user_id) setUserOnline(user_id, true)
          break
        }
        case 'user_offline': {
          const { user_id } = event.payload as { user_id: string }
          if (user_id) setUserOnline(user_id, false)
          break
        }
        case 'typing_start': {
          const p = event.payload as TypingUser
          if (!p?.userId || !p?.conversationId) break
          setTyping(p.conversationId, p)
          const key = `${p.conversationId}:${p.userId}`
          clearTimeout(typingTimers.current[key])
          typingTimers.current[key] = setTimeout(() => {
            clearTyping(p.conversationId, p.userId)
          }, TYPING_TIMEOUT_MS)
          break
        }
        case 'typing_stop': {
          const p = event.payload as TypingUser
          if (!p?.userId || !p?.conversationId) break
          const key = `${p.conversationId}:${p.userId}`
          clearTimeout(typingTimers.current[key])
          clearTyping(p.conversationId, p.userId)
          break
        }
      }
    },
    [appendMessage, updateMessageStatus, setUserOnline, setTyping, clearTyping],
  )

  const connect = useCallback(() => {
    if (!accessToken || !isAuthenticated || unmounted.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${BASE_WS_URL}/api/v1/ws?token=${encodeURIComponent(accessToken)}`
    const socket = new WebSocket(url)
    wsRef.current = socket

    socket.onopen = () => {
      reconnectAttempts.current = 0
      setWsConnected(true)
    }

    socket.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data)
        handleEvent(event)
      } catch {
        /* ignore malformed frames */
      }
    }

    socket.onclose = () => {
      setWsConnected(false)
      wsRef.current = null
      if (unmounted.current) return
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return
      reconnectAttempts.current += 1
      const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts.current, 30_000)
      // ✅ Call via ref — never references connect directly (avoids forward-ref error)
      reconnectTimer.current = setTimeout(() => connectRef.current(), delay)
    }

    socket.onerror = () => socket.close()
  }, [accessToken, isAuthenticated, handleEvent, setWsConnected])

  // ✅ Sync connectRef inside an effect, never during render
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    unmounted.current = false
    if (isAuthenticated && accessToken) connect()

    const onLogout = () => {
      unmounted.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
      setWsConnected(false)
    }
    window.addEventListener('auth:logout', onLogout)

    return () => {
      unmounted.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      // ✅ Snapshot ref at cleanup time — avoids stale ref warning
      const timers = typingTimers.current
      Object.values(timers).forEach(clearTimeout)
      wsRef.current?.close()
      wsRef.current = null
      window.removeEventListener('auth:logout', onLogout)
    }
  }, [connect, isAuthenticated, accessToken, setWsConnected])
}

export function sendWSFrame(payload: object) {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify(payload))
  }
}