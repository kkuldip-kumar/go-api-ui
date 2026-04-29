import { create } from 'zustand'
import type { Conversation, Message, TypingUser, User } from '@/types'

interface OnlineMap { [userId: string]: boolean }
// typingUsers[conversationId] = array of users currently typing
interface TypingMap { [conversationId: string]: TypingUser[] }
interface ChatState {
  // Conversations
  conversations: Conversation[]
  setConversations: (convs: Conversation[]) => void
  upsertConversation: (conv: Conversation) => void

  // Active conversation
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void

  // Messages keyed by conversation id
  messages: Record<string, Message[]>
  setMessages: (convId: string, msgs: Message[]) => void
  prependMessages: (convId: string, msgs: Message[]) => void   // older pages
  appendMessage: (convId: string, msg: Message) => void        // new message
  replaceOptimistic: (convId: string, tempId: string, msg: Message) => void
  removeOptimistic: (convId: string, tempId: string) => void
  updateMessageStatus: (convId: string, msgId: string, status: Message['status']) => void

  // Online presence
  onlineUsers: OnlineMap
  setUserOnline: (userId: string, online: boolean) => void
  // Typing indicators — per conversation
  typingUsers: TypingMap
  setTyping: (convId: string, user: TypingUser) => void
  clearTyping: (convId: string, userId: string) => void
  // User search results for new conversation
  searchResults: User[]
  setSearchResults: (users: User[]) => void

  // Unread notification count
  unreadCount: number
  setUnreadCount: (n: number) => void
  decrementUnread: () => void

  // WebSocket connection state
  wsConnected: boolean
  setWsConnected: (v: boolean) => void
}

export const useChatStore = create<ChatState>()((set,) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  upsertConversation: (conv) =>
    set((s) => {
      const exists = s.conversations.find((c) => c.id === conv.id)
      if (exists) {
        return {
          conversations: s.conversations.map((c) =>
            c.id === conv.id ? { ...c, ...conv } : c,
          ),
        }
      }
      return { conversations: [conv, ...s.conversations] }
    }),

  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),

  messages: {},
  setMessages: (convId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [convId]: msgs } })),

  prependMessages: (convId, msgs) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [convId]: [...msgs, ...(s.messages[convId] ?? [])],
      },
    })),

  appendMessage: (convId, msg) =>
    set((s) => {
      const existing = s.messages[convId] ?? []
      // Don't duplicate
      if (existing.some((m) => m.id === msg.id)) return s
      return { messages: { ...s.messages, [convId]: [...existing, msg] } }
    }),

  replaceOptimistic: (convId, tempId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [convId]: (s.messages[convId] ?? []).map((m) =>
          m.id === tempId ? msg : m,
        ),
      },
    })),

  removeOptimistic: (convId, tempId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [convId]: (s.messages[convId] ?? []).filter((m) => m.id !== tempId),
      },
    })),

  updateMessageStatus: (convId, msgId, status) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [convId]: (s.messages[convId] ?? []).map((m) =>
          m.id === msgId ? { ...m, status } : m,
        ),
      },
    })),

  onlineUsers: {},
  setUserOnline: (userId, online) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: online } })),

    typingUsers: {},
  setTyping: (convId, user) =>
    set((s) => {
      const existing = s.typingUsers[convId] ?? []
      const filtered = existing.filter((u) => u.userId !== user.userId)
      return { typingUsers: { ...s.typingUsers, [convId]: [...filtered, user] } }
    }),
  clearTyping: (convId, userId) =>
    set((s) => ({
      typingUsers: { ...s.typingUsers, [convId]: (s.typingUsers[convId] ?? []).filter((u) => u.userId !== userId) },
    })),

  searchResults: [],
  setSearchResults: (searchResults) => set({ searchResults }),

  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  decrementUnread: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),

  wsConnected: false,
  setWsConnected: (wsConnected) => set({ wsConnected }),
}))

// Selector helpers (avoid rerenders by selecting minimal slices)
export const useActiveConversation = () =>
  useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId) ?? null,
  )

const EMPTY_MESSAGES: Message[] = [] // ← stable reference outside

export const useConversationMessages = (convId: string | null) =>
  useChatStore((s) => (convId ? (s.messages[convId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES))

export const useTypingUsers = (convId: string | null) =>
  useChatStore((s) => (convId ? (s.typingUsers[convId] ?? []) : []))