// import { useEffect, useRef, useCallback } from 'react'
// import { BASE_WS_URL } from '@/lib/apiClient'
// import { useAuthStore } from '@/store/authStore'
// import { useChatStore } from '@/store/chatStore'
// import type { Message, WSEvent } from '@/types'

// const RECONNECT_DELAY_MS = 3_000
// const MAX_RECONNECT_ATTEMPTS = 8

// export function useWebSocket() {
//   const ws = useRef<WebSocket | null>(null)
//   const reconnectAttempts = useRef(0)
//   const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
//   const unmounted = useRef(false)

//   const { accessToken, isAuthenticated } = useAuthStore()
//   const {
//     appendMessage,
//     updateMessageStatus,
//     setUserOnline,
//     setWsConnected,
//     activeConversationId,
//   } = useChatStore()

//   const handleEvent = useCallback(
//     (event: WSEvent) => {
//       switch (event.type) {
//         case 'new_message': {
//           const msg = event.payload as Message
//           if (msg?.conversation_id) {
//             appendMessage(msg.conversation_id, msg)
//           }
//           break
//         }

//         case 'message_status': {
//           const { message_id, conversation_id, status } = event.payload as {
//             message_id: string
//             conversation_id: string
//             status: Message['status']
//           }
//           if (message_id && conversation_id) {
//             updateMessageStatus(conversation_id, message_id, status)
//           }
//           break
//         }

//         case 'user_online': {
//           const { user_id } = event.payload as { user_id: string }
//           if (user_id) setUserOnline(user_id, true)
//           break
//         }

//         case 'user_offline': {
//           const { user_id } = event.payload as { user_id: string }
//           if (user_id) setUserOnline(user_id, false)
//           break
//         }
//       }
//     },
//     [appendMessage, updateMessageStatus, setUserOnline, activeConversationId],
//   )

//   const connect = useCallback(() => {
//     if (!accessToken || !isAuthenticated || unmounted.current) return
//     if (ws.current?.readyState === WebSocket.OPEN) return

//     // const url = `${BASE_WS_URL}/api/v1/ws`
//     const url = `${BASE_WS_URL}/api/v1/ws?token=${encodeURIComponent(accessToken)}`
//     const socket = new WebSocket(url)
//     ws.current = socket

//     socket.onopen = () => {
//       reconnectAttempts.current = 0
//       setWsConnected(true)

//       // Send auth frame immediately after open
//       socket.send(JSON.stringify({ type: 'auth', token: accessToken }))
//     }

//     socket.onmessage = (e) => {
//       try {
//         const event: WSEvent = JSON.parse(e.data)
//         handleEvent(event)
//       } catch {
//         // malformed frame — ignore
//       }
//     }

//     socket.onclose = () => {
//       setWsConnected(false)
//       ws.current = null

//       if (unmounted.current) return
//       if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return

//       reconnectAttempts.current += 1
//       const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts.current, 30_000)
//       reconnectTimer.current = setTimeout(connect, delay)
//     }

//     socket.onerror = () => {
//       socket.close()
//     }
//   }, [accessToken, isAuthenticated, handleEvent, setWsConnected])

//   useEffect(() => {
//     unmounted.current = false

//     if (isAuthenticated && accessToken) {
//       connect()
//     }

//     // Listen for forced logout
//     const onLogout = () => {
//       unmounted.current = true
//       clearTimeout(reconnectTimer.current)
//       ws.current?.close()
//       ws.current = null
//       setWsConnected(false)
//     }
//     window.addEventListener('auth:logout', onLogout)

//     return () => {
//       unmounted.current = true
//       clearTimeout(reconnectTimer.current)
//       ws.current?.close()
//       ws.current = null
//       window.removeEventListener('auth:logout', onLogout)
//     }
//   }, [connect, isAuthenticated, accessToken, setWsConnected])

//   return { ws: ws.current }
// }


// ==========================

import { useEffect, useRef, useCallback } from 'react'
import { BASE_WS_URL } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import type { Message, WSEvent, TypingUser } from '@/types'

const RECONNECT_DELAY_MS = 3_000
const MAX_RECONNECT_ATTEMPTS = 8
// Auto-clear typing indicator if no stop event arrives within this window
const TYPING_TIMEOUT_MS = 4_000

// Singleton ref so the WS instance is accessible from the typing sender
export const wsRef = { current: null as WebSocket | null }

export function useWebSocket() {
  const reconnectAttempts = useRef(0)
  // const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const reconnectTimer =useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const unmounted = useRef(false)

  const { accessToken, isAuthenticated } = useAuthStore()
  const {
    appendMessage,
    updateMessageStatus,
    setUserOnline,
    setWsConnected,
    setTyping,
    clearTyping,
  } = useChatStore()

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
            message_id: string; conversation_id: string; status: Message['status']
          }
          if (message_id && conversation_id) updateMessageStatus(conversation_id, message_id, status)
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
          // Auto-expire if we never get typing_stop
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

    // Pass token as query param for the Go AuthenticateWS middleware
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
      } catch { /* ignore malformed frames */ }
    }

    socket.onclose = () => {
      setWsConnected(false)
      wsRef.current = null
      if (unmounted.current) return
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return
      reconnectAttempts.current += 1
      const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts.current, 30_000)
      reconnectTimer.current = setTimeout(connect, delay)
    }

    socket.onerror = () => socket.close()
  }, [accessToken, isAuthenticated, handleEvent, setWsConnected])

  useEffect(() => {
    unmounted.current = false
    if (isAuthenticated && accessToken) connect()

    const onLogout = () => {
      unmounted.current = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
      setWsConnected(false)
    }
    window.addEventListener('auth:logout', onLogout)

    return () => {
      unmounted.current = true
      clearTimeout(reconnectTimer.current)
      Object.values(typingTimers.current).forEach(clearTimeout)
      wsRef.current?.close()
      wsRef.current = null
      window.removeEventListener('auth:logout', onLogout)
    }
  }, [connect, isAuthenticated, accessToken, setWsConnected])
}

// Utility: send a typed WS frame if the socket is open
export function sendWSFrame(payload: object) {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify(payload))
  }
}

