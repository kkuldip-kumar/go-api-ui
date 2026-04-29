import { useRef, useCallback, useEffect } from 'react'
import { sendWSFrame } from './useWebSocket'
import { useAuthStore } from '@/store/authStore'

const TYPING_THROTTLE_MS = 2_000

export function useTyping(conversationId: string | null) {
  const { user } = useAuthStore()
  const lastSentAt = useRef(0)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ✅ Ref to hold sendTypingStop — breaks the forward-reference circular dependency
  const sendTypingStopRef = useRef<() => void>(() => {})

  // Define sendTypingStop first so it can be synced into the ref
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

  // ✅ Sync ref inside effect — never during render
  useEffect(() => {
    sendTypingStopRef.current = sendTypingStop
  }, [sendTypingStop])

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

    // ✅ Call via ref — avoids accessing sendTypingStop before declaration
    clearTimeout(stopTimer.current)
    stopTimer.current = setTimeout(() => sendTypingStopRef.current(), 3_000)
  }, [conversationId, user])

  return { sendTypingStart, sendTypingStop }
}