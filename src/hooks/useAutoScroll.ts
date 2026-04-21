import { useEffect, useRef, useCallback } from 'react'

interface UseAutoScrollOptions {
  messages: unknown[]           // dependency array to trigger scroll
  threshold?: number            // px from bottom to consider "at bottom"
}

export function useAutoScroll({ messages, threshold = 120 }: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const prevScrollHeight = useRef(0)

  // Scroll to bottom imperatively
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  // Track whether the user is near the bottom
  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distanceFromBottom <= threshold
  }, [threshold])

  // When messages change: scroll to bottom only if already near bottom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const scrollHeightBefore = prevScrollHeight.current
    const scrollHeightAfter = el.scrollHeight

    if (isAtBottomRef.current) {
      // Auto-scroll for new incoming messages
      requestAnimationFrame(() => scrollToBottom('smooth'))
    } else if (scrollHeightAfter > scrollHeightBefore) {
      // Prepended older messages → maintain scroll position
      const added = scrollHeightAfter - scrollHeightBefore
      el.scrollTop += added
    }

    prevScrollHeight.current = scrollHeightAfter
  }, [messages, scrollToBottom])

  // Instant scroll on first load (no animation)
  const scrollToBottomInstant = useCallback(() => {
    scrollToBottom('instant')
    isAtBottomRef.current = true
  }, [scrollToBottom])

  return {
    containerRef,
    onScroll,
    scrollToBottom,
    scrollToBottomInstant,
    isAtBottomRef,
  }
}