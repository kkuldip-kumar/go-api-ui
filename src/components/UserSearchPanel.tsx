import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, Loader2, Plus } from 'lucide-react'
import clsx from 'clsx'
import { authApi, conversationApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { Avatar } from './Avatar'
import type { User } from '@/types'

interface UserSearchPanelProps {
  open: boolean
  onClose: () => void
}

export default function UserSearchPanel({ open, onClose }: UserSearchPanelProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { user: me } = useAuthStore()
  const { upsertConversation, setActiveConversation } = useChatStore()
  const qc = useQueryClient()

  // ✅ Reset query using a derived default — when panel closes, reset state
  // so next open starts fresh. No setState inside effect body.
  const prevOpenRef = useRef(open)
  useEffect(() => {
    // Only act on open → true transition
    if (!prevOpenRef.current && open) {
      setQuery('')
    }
    prevOpenRef.current = open
  }, [open])

  // ✅ Focus input separately — no setState here, only DOM side-effect
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [open])

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  const { data: results, isFetching } = useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      if (query.length < 2) return []
      const res = await authApi.searchUsers(query)
      return (res.data.data ?? []) as User[]
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  })

  const createConvMutation = useMutation({
    mutationFn: (participantId: string) => conversationApi.create(participantId),
    onSuccess: (res) => {
      const conv = res.data.data
      upsertConversation(conv)
      setActiveConversation(conv.id)
      qc.invalidateQueries({ queryKey: ['conversations'] })
      onClose()
    },
  })

  const users = results?.filter((u: User) => u.id !== me?.id) ?? []

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-80 bg-surface-900 border-l border-surface-200/10 z-50 flex flex-col shadow-modal animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-200/8">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">Find people</h2>
            <p className="text-[11px] text-surface-300/40 mt-0.5">
              Start a new conversation
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-surface-300/40 hover:text-surface-300/80 hover:bg-surface-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-surface-200/8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-300/30" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username…"
              className="w-full bg-surface-800 border border-surface-200/10 rounded-xl pl-8 pr-9 py-2.5 text-sm text-white placeholder:text-surface-300/30 focus:outline-none focus:border-brand-500/40 transition-colors"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400 animate-spin" />
            )}
            {query && !isFetching && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300/30 hover:text-surface-300/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-surface-800/60 border border-surface-200/8 flex items-center justify-center">
                <Search className="w-6 h-6 text-surface-300/20" />
              </div>
              <p className="text-sm text-surface-300/40">
                Type at least 2 characters to search
              </p>
            </div>
          ) : isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
              <p className="text-sm text-surface-300/40">No users found for "{query}"</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {users.map((u: User) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-800/60 transition-colors group"
                >
                  <Avatar name={u.username} size="md" online={u.is_online} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.username}</p>
                    <p className="text-[11px] text-surface-300/40 truncate">{u.email}</p>
                  </div>

                  <button
                    onClick={() => createConvMutation.mutate(u.id)}
                    disabled={createConvMutation.isPending}
                    className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                      'transition-all duration-150',
                      'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 hover:text-brand-300',
                      'opacity-0 group-hover:opacity-100',
                    )}
                    aria-label={`Message ${u.username}`}
                  >
                    {createConvMutation.isPending && createConvMutation.variables === u.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Plus className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}