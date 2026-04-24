import { useRef, useCallback } from 'react'
import { sendWSFrame } from './useWebSocket'
import { useAuthStore } from '@/store/authStore'

const TYPING_THROTTLE_MS = 2_000 // min interval between typing_start frames

export function useTyping(conversationId: string | null) {
  const { user } = useAuthStore()
  const lastSentAt = useRef(0)
//   const stopTimer = useRef<ReturnType<typeof setTimeout>>()
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sendTypingStart = useCallback(() => {
    if (!conversationId || !user) return
    const now = Date.now()
    if (now - lastSentAt.current < TYPING_THROTTLE_MS) return
    lastSentAt.current = now

    sendWSFrame({
      type: 'typing_start',
      payload: {
        conversationId,
        userId: user.id,
        username: user.username,
      },
    })

    // Auto-send stop after 3s if user stops typing without explicitly clearing
    clearTimeout(stopTimer.current)
    stopTimer.current = setTimeout(() => sendTypingStop(), 3_000)
  }, [conversationId, user])

  const sendTypingStop = useCallback(() => {
    if (!conversationId || !user) return
    clearTimeout(stopTimer.current)
    lastSentAt.current = 0
    sendWSFrame({
      type: 'typing_stop',
      payload: {
        conversationId,
        userId: user.id,
        username: user.username,
      },
    })
  }, [conversationId, user])

  return { sendTypingStart, sendTypingStop }
}