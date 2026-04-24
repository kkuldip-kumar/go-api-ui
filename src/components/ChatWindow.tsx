import { useEffect } from 'react'
import { Phone, Video, MoreVertical, MessageSquareDot } from 'lucide-react'
import clsx from 'clsx'
import {Avatar} from './Avatar'
import MessageList from './MessageList'
import Composer from './Composer'
import { useMessages } from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, useActiveConversation, useConversationMessages, useTypingUsers } from '@/store/chatStore'
import TypingIndicator from './TypingIndicator'

export default function ChatWindow() {
  // const { user } = useAuthStore()
  const user = useAuthStore(s => s.user)
  // const { activeConversationId, onlineUsers, wsConnected } = useChatStore()
  const activeConversationId = useChatStore(s => s.activeConversationId)
const onlineUsers = useChatStore(s => s.onlineUsers)
const wsConnected = useChatStore(s => s.wsConnected)
  const activeConv = useActiveConversation()
  const messages = useConversationMessages(activeConversationId)
const typingUsers = useTypingUsers(activeConversationId)
  const {
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    isSending,
  } = useMessages(activeConversationId)

  // Determine peer info from conversation
  const peerId = activeConv?.participants.find((id) => id !== user?.id)
  const isOnline = peerId ? !!onlineUsers[peerId] : false

  const peerLabel = activeConv?.name
    ?? (peerId ? `User ${peerId.slice(-6)}` : 'Unknown')

  // Empty state — no conversation selected
  if (!activeConversationId || !activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-950 gap-4 text-center px-8">
        <div className="w-20 h-20 rounded-3xl bg-surface-800/60 border border-surface-200/8 flex items-center justify-center mb-2">
          <MessageSquareDot className="w-9 h-9 text-brand-500/50" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white/80">Select a conversation</h2>
          <p className="text-sm text-surface-300/40 mt-1">
            Choose a conversation from the sidebar or start a new one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-950 min-w-0">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200/8 bg-surface-900/60 backdrop-blur-sm flex-shrink-0">
        <Avatar name={peerLabel} size="md" online={isOnline} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{peerLabel}</p>
          <p className={clsx(
            'text-[11px] transition-colors',
            isOnline ? 'text-emerald-400' : 'text-surface-300/40',
          )}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button className="btn-ghost p-2 rounded-xl" aria-label="Voice call">
            <Phone className="w-4 h-4" />
          </button>
          <button className="btn-ghost p-2 rounded-xl" aria-label="Video call">
            <Video className="w-4 h-4" />
          </button>
          <button className="btn-ghost p-2 rounded-xl" aria-label="More options">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      {isError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-400">Failed to load messages</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-brand-400 mt-2 hover:text-brand-300 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-xs text-surface-300/40">Loading messages…</p>
          </div>
        </div>
      ) : (
  <>
          <MessageList
            messages={messages}
            myUserId={user?.id ?? ''}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
          {/* Typing indicator sits between message list and composer */}
          <TypingIndicator users={typingUsers} />
        </>

      )}

      {/* ── Composer ─────────────────────────────────────────────────── */}
      <Composer
        onSend={sendMessage}
        conversationId={activeConversationId}
        isSending={isSending}
        disabled={!wsConnected && messages.length === 0}
        placeholder={wsConnected ? 'Message…' : 'Connecting…'}
      />
    </div>
  )
}