import { useEffect, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageApi } from '@/api'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import type { Message } from '@/types'

const PER_PAGE = 30

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { setMessages,  replaceOptimistic, removeOptimistic, appendMessage } =
    useChatStore()

  // ── Infinite query: loads pages from the server ─────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!conversationId) throw new Error('no conversation')
      const res = await messageApi.list(conversationId, pageParam as number, PER_PAGE)
      return { messages: res.data.data ?? [], page: pageParam as number, meta: res.data.meta }
    },
    getNextPageParam: (last) => {
      if (!last.meta) return undefined
      const { page, per_page, total_count } = last.meta
      return page * per_page < total_count ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!conversationId,
    staleTime: 30_000,
  })

  // Flatten pages into store (newest messages come from server in desc order → reverse each page)
  useEffect(() => {
    if (!conversationId || !data) return
    const allPages = data.pages.flatMap((p) => [...p.messages].reverse())
    setMessages(conversationId, allPages)
  }, [data, conversationId, setMessages])

  // ── Send message mutation with optimistic update ─────────────────────────
  const sendMutation = useMutation({
    mutationFn: ({ convId, content, attachment_ids }: { convId: string; content: string, attachment_ids:string[] }) =>
      messageApi.send(convId, content, attachment_ids),

    onMutate: async ({ convId, content }) => {
      // Cancel any in-flight fetches for this conversation
      await queryClient.cancelQueries({ queryKey: ['messages', convId] })

      const tempId = `opt_${Date.now()}_${Math.random()}`
      const optimistic: Message = {
        id: tempId,
        conversation_id: convId,
        sender_id: user?.id ?? '',
        content,
        word_count: content.trim().split(/\s+/).filter(Boolean).length,
        status: 'sending',
        sent_at: new Date().toISOString(),
        _optimistic: true,
      }

      appendMessage(convId, optimistic)
      return { tempId, convId }
    },

    onSuccess: (res, _, ctx) => {
      if (!ctx) return
      const confirmed = res.data.data
      replaceOptimistic(ctx.convId, ctx.tempId, confirmed)

      // Invalidate so next fetch is fresh
      queryClient.invalidateQueries({ queryKey: ['messages', ctx.convId] })
    },

    onError: (_err, _, ctx) => {
      if (!ctx) return
      removeOptimistic(ctx.convId, ctx.tempId)
    },
  })

  const sendMessage = useCallback(
    (content: string, attachment_ids:string[]) => {
      if (!conversationId || !content.trim()) return
      sendMutation.mutate({ convId: conversationId, content: content.trim(), attachment_ids })
    },
    [conversationId, sendMutation],
  )

  return {
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    sendMessage,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
  }
}