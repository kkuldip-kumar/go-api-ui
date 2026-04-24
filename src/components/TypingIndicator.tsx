import clsx from 'clsx'
import type { TypingUser } from '@/types'

interface TypingIndicatorProps {
  users: TypingUser[]
  className?: string
}

export default function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const label =
    users.length === 1
      ? `${users[0].username} is typing`
      : users.length === 2
        ? `${users[0].username} and ${users[1].username} are typing`
        : `${users[0].username} and ${users.length - 1} others are typing`

  return (
    <div className={clsx('flex items-end gap-2 px-4 pb-2 animate-fade-in', className)}>
      {/* Avatar spacer to align with message bubbles */}
      <div className="w-7 flex-shrink-0" />

      <div className="flex items-center gap-2.5 bg-surface-800 border border-surface-200/8 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-bubble">
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-surface-300/50 animate-typing-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-surface-300/50 animate-typing-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-surface-300/50 animate-typing-3" />
        </div>
        <span className="text-[11px] text-surface-300/50 leading-none">{label}</span>
      </div>
    </div>
  )
}