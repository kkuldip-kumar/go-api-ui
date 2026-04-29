import { useEffect, useRef, useCallback, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Loader2, ArrowDown } from 'lucide-react'
import clsx from 'clsx'
import MessageBubble from './MessageBubble'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import type { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  myUserId: string
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

function DateDivider({ date }: { date: Date }) {
  let label: string
  if (isToday(date)) label = 'Today'
  else if (isYesterday(date)) label = 'Yesterday'
  else label = format(date, 'EEEE, MMMM d')

  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-surface-700/50" />
      <span className="text-[11px] font-medium text-surface-300/40 tracking-wide uppercase px-1">
        {label}
      </span>
      <div className="flex-1 h-px bg-surface-700/50" />
    </div>
  )
}

// function TypingIndicator() {
//   return (
//     <div className="flex items-end gap-2 px-4 pb-2">
//       <div className="w-7 flex-shrink-0" />
//       <div className="bg-surface-800 border border-surface-200/8 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-bubble">
//         <span className="w-1.5 h-1.5 rounded-full bg-surface-300/50 animate-typing-1" />
//         <span className="w-1.5 h-1.5 rounded-full bg-surface-300/50 animate-typing-2" />
//         <span className="w-1.5 h-1.5 rounded-full bg-surface-300/50 animate-typing-3" />
//       </div>
//     </div>
//   )
// }

export default function MessageList({
  messages,
  myUserId,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: MessageListProps) {
  const { containerRef, onScroll, scrollToBottomInstant } = useAutoScroll({
    messages,
  })

  const topSentinelRef = useRef<HTMLDivElement>(null)
  // const showScrollBtn =
  //   containerRef.current
  //     ? containerRef.current.scrollHeight -
  //         containerRef.current.scrollTop -
  //         containerRef.current.clientHeight >
  //       200
  //     : false

  // Intersection observer: trigger load-more when user scrolls to top
  // useEffect(() => {
  //   const sentinel = topSentinelRef.current
  //   if (!sentinel) return

  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
  //         onLoadMore()
  //       }
  //     },
  //     { root: containerRef.current, threshold: 0 },
  //   )

  //   observer.observe(sentinel)
  //   return () => observer.disconnect()
  // }, [hasNextPage, isFetchingNextPage, onLoadMore, containerRef])
  const [showScrollBtn, setShowScrollBtn] = useState(false)

useEffect(() => {
  const container = containerRef.current
  if (!container) return

  const handleScroll = () => {
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollBtn(distanceFromBottom > 200)
  }

  container.addEventListener('scroll', handleScroll, { passive: true })
  return () => container.removeEventListener('scroll', handleScroll)
}, [containerRef])

  // Scroll to bottom on first render
  useEffect(() => {
    scrollToBottomInstant()
  }, []) // eslint-disable-line

  // Group messages: detect consecutive messages from same sender
  const shouldShowAvatar = useCallback(
    (index: number) => {
      if (index === messages.length - 1) return true
      const next = messages[index + 1]
      return next.sender_id !== messages[index].sender_id
    },
    [messages],
  )

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-surface-800/60 border border-surface-200/8 flex items-center justify-center">
          <span className="text-2xl">💬</span>
        </div>
        <div>
          <p className="text-sm font-medium text-surface-300/80">No messages yet</p>
          <p className="text-xs text-surface-300/40 mt-1">
            Say hello to start the conversation
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 min-h-0">
      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-0.5"
      >
        {/* Top sentinel for intersection observer */}
        <div ref={topSentinelRef} className="h-1" />

        {/* Loading older messages spinner */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
          </div>
        )}

        {/* Load more button (fallback for accessibility) */}
        {hasNextPage && !isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors px-4 py-1.5 rounded-full bg-brand-500/10 hover:bg-brand-500/20"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Message rows with date dividers */}
        {messages.map((msg, i) => {
          const showDivider =
            i === 0 ||
            !isSameDay(new Date(messages[i - 1].sent_at), new Date(msg.sent_at))

          return (
            <div key={msg.id}>
              {showDivider && <DateDivider date={new Date(msg.sent_at)} />}
              <div className="py-0.5">
                <MessageBubble
                  message={msg}
                  isMine={msg.sender_id === myUserId}
                  showAvatar={shouldShowAvatar(i)}
                />
              </div>
            </div>
          )
        })}

        {/* Bottom anchor */}
        <div className="h-2" />
      </div>

      {/* Scroll-to-bottom FAB */}
      <button
        onClick={() => {
          containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth',
          })
        }}
        className={clsx(
          'absolute bottom-4 right-4 w-9 h-9 rounded-full bg-surface-800 border border-surface-200/15',
          'flex items-center justify-center shadow-panel',
          'hover:bg-surface-700 transition-all duration-200',
          'text-surface-300 hover:text-white',
          showScrollBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        )}
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
  )
}