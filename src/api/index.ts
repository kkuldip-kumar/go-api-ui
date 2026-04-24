import { apiClient } from '@/lib/apiClient'
import type {
  ApiResponse,
  AuthResponse,
  Conversation,
  LoginPayload,
  Message,
  Notification,
  RegisterPayload,
  User,
} from '@/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', payload),

  logout: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout', {
      refresh_token: refreshToken,
    }),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/api/v1/users/me'),

  searchUsers: (q: string) =>
    apiClient.get<ApiResponse<User[]>>(`/api/v1/users/search?q=${encodeURIComponent(q)}`),
}

// ─── Conversations ───────────────────────────────────────────────────────────

export const conversationApi = {
  list: () =>
    apiClient.get<ApiResponse<Conversation[]>>('/api/v1/conversations'),

  create: (participantId: string) =>
    apiClient.post<ApiResponse<Conversation>>('/api/v1/conversations', {
      participant_id: participantId,
    }),
}

// ─── Messages ────────────────────────────────────────────────────────────────

export const messageApi = {
  list: (conversationId: string, page = 1, perPage = 30) =>
    apiClient.get<ApiResponse<Message[]>>(
      `/api/v1/messages/conversation/${conversationId}?page=${page}&per_page=${perPage}`,
    ),

  send: (conversationId: string, content: string, attachment_ids: string[]) =>
    apiClient.post<ApiResponse<Message>>('/api/v1/messages/send', {
      conversation_id: conversationId,
      attachment_ids,
      content,
    }),
}

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationApi = {
  list: (page = 1, perPage = 20) =>
    apiClient.get<ApiResponse<{ notifications: Notification[]; unread_count: number }>>(
      `/api/v1/notifications?page=${page}&per_page=${perPage}`,
    ),

  markRead: (id: string) =>
    apiClient.patch<ApiResponse<{ message: string }>>(`/api/v1/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<ApiResponse<{ message: string }>>('/api/v1/notifications/read-all'),

  registerDeviceToken: (token: string, platform: 'android' | 'ios' | 'web') =>
    apiClient.post<ApiResponse<{ message: string }>>('/api/v1/notifications/device-token', {
      token,
      platform,
    }),
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/api/v1/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (attachmentId: string) =>
    apiClient.delete(`/api/v1/upload/${attachmentId}`),
}