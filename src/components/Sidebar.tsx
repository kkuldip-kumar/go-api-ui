import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, X, Loader2, MessageSquare,
  Bell, Settings, LogOut, Wifi, WifiOff
} from 'lucide-react'
import clsx from 'clsx'
import { conversationApi, authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import ConversationItem from './ConversationItem'
import {Avatar} from './Avatar'

export default function Sidebar() {
  // const { user, logout, refreshToken } = useAuthStore()
  // const {
  //   conversations,
  //   setConversations,
  //   upsertConversation,
  //   activeConversationId,
  //   setActiveConversation,
  //   onlineUsers,
  //   unreadCount,
  //   wsConnected,
  // } = useChatStore()
  const conversations = useChatStore(s => s.conversations)
const setConversations = useChatStore(s => s.setConversations)
const upsertConversation = useChatStore(s => s.upsertConversation)
const activeConversationId = useChatStore(s => s.activeConversationId)
const setActiveConversation = useChatStore(s => s.setActiveConversation)
const onlineUsers = useChatStore(s => s.onlineUsers)
const unreadCount = useChatStore(s => s.unreadCount)
const wsConnected = useChatStore(s => s.wsConnected)

// Same for authStore
const user = useAuthStore(s => s.user)
const logout = useAuthStore(s => s.logout)
const refreshToken = useAuthStore(s => s.refreshToken)

  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // ── Load conversations ─────────────────────────────────────────────────
  // const { isLoading } = useQuery({
  //   queryKey: ['conversations'],
  //   queryFn: async () => {
  //     const res = await conversationApi.list()
  //     return res.data.data ?? []
  //   },
  //   onSuccess: (data) => setConversations(data),
  //   refetchInterval: 30_000,
  // } as any)
const { isLoading, data: conversationsData } = useQuery({
  queryKey: ['conversations'],
  queryFn: async () => {
    const res = await conversationApi.list()
    return res.data.data ?? []
  },
  refetchInterval: 30_000,
})

// Sync to store separately — breaks the loop
useEffect(() => {
  if (conversationsData) {
    setConversations(conversationsData)
  }
}, [conversationsData]) // ← only runs when data actually changes

  // ── Search users ───────────────────────────────────────────────────────
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['user-search', userSearchQuery],
    queryFn: async () => {
      if (userSearchQuery.length < 2) return []
      const res = await authApi.searchUsers(userSearchQuery)
      return res.data.data ?? []
    },
    enabled: userSearchQuery.length >= 2,
    staleTime: 10_000,
  })

  // ── Create conversation ────────────────────────────────────────────────
  const createConvMutation = useMutation({
    mutationFn: (participantId: string) => conversationApi.create(participantId),
    onSuccess: (res) => {
      const conv = res.data.data
      upsertConversation(conv)
      setActiveConversation(conv.id)
      setShowNewChat(false)
      setUserSearchQuery('')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // ── Logout ─────────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ''),
    onSettled: () => logout(),
  })

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter conversations by search
  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations

  return (
    <aside className="w-72 flex-shrink-0 bg-surface-900 border-r border-surface-200/8 flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-surface-200/8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            <span className="text-sm font-semibold text-white tracking-tight">GoChat</span>
            {/* WS status */}
            <span className={clsx(
              'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full',
              wsConnected
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-surface-700 text-surface-300/40',
            )}>
              {wsConnected
                ? <Wifi className="w-2.5 h-2.5" />
                : <WifiOff className="w-2.5 h-2.5" />
              }
              {wsConnected ? 'live' : 'offline'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Notifications badge */}
            <button className="btn-ghost relative p-2 rounded-xl">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* New chat */}
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-ghost p-2 rounded-xl text-brand-400 hover:text-brand-300"
              aria-label="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-300/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-surface-800/60 border border-surface-200/8 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-surface-300/30 focus:outline-none focus:border-brand-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300/40 hover:text-surface-300/80"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Conversation list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-sm text-surface-300/40">
              {searchQuery ? 'No conversations match' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Start a new conversation
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const peerId = conv.participants.find((id) => id !== user?.id)
            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                currentUserId={user?.id ?? ''}
                isOnline={peerId ? !!onlineUsers[peerId] : false}
                onClick={() => setActiveConversation(conv.id)}
              />
            )
          })
        )}
      </div>

      {/* ── User profile footer ──────────────────────────────────────── */}
      <div className="border-t border-surface-200/8 px-3 py-3 relative" ref={profileMenuRef}>
        <button
          onClick={() => setShowProfileMenu((v) => !v)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-800/60 transition-colors"
        >
          <Avatar name={user?.username ?? 'Me'} size="sm" online={true} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-white truncate">{user?.username}</p>
            <p className="text-[10px] text-surface-300/40 truncate">{user?.email}</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-surface-300/30" />
        </button>

        {/* Profile menu */}
        {showProfileMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-surface-800 border border-surface-200/10 rounded-xl shadow-modal overflow-hidden animate-pop-in">
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              {logoutMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogOut className="w-4 h-4" />
              }
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* ── New Chat Modal ───────────────────────────────────────────── */}
      {showNewChat && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewChat(false)
          }}
        >
          <div className="bg-surface-900 border border-surface-200/10 rounded-2xl shadow-modal w-full max-w-sm animate-pop-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/8">
              <h2 className="text-sm font-semibold text-white">New conversation</h2>
              <button
                onClick={() => setShowNewChat(false)}
                className="text-surface-300/40 hover:text-surface-300/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {/* User search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-300/30" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by username…"
                  autoFocus
                  className="w-full bg-surface-800 border border-surface-200/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-surface-300/30 focus:outline-none focus:border-brand-500/40 transition-colors"
                />
              </div>

              {/* Results */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {isSearching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                  </div>
                )}

                {!isSearching && userSearchQuery.length >= 2 && (!searchResults || searchResults.length === 0) && (
                  <p className="text-center text-xs text-surface-300/40 py-4">
                    No users found
                  </p>
                )}

                {!isSearching && userSearchQuery.length < 2 && (
                  <p className="text-center text-xs text-surface-300/30 py-4">
                    Type at least 2 characters to search
                  </p>
                )}

                {searchResults?.map((u: any) => (
                  u.id !== user?.id && (
                    <button
                      key={u.id}
                      onClick={() => createConvMutation.mutate(u.id)}
                      disabled={createConvMutation.isPending}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-800/60 transition-colors text-left"
                    >
                      <Avatar name={u.username} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.username}</p>
                        <p className="text-xs text-surface-300/40 truncate">{u.email}</p>
                      </div>
                      {createConvMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-surface-300/30" />
                      )}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}