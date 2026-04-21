// ─── API Envelope ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string; details?: Record<string, string> }
  meta?: { page: number; per_page: number; total_count: number }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  is_online: boolean
  last_seen_at: string
  created_at: string
  updated_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface AuthResponse {
  user: User
  tokens: TokenPair
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

// ─── Conversations ───────────────────────────────────────────────────────────

export type ConversationType = 'direct' | 'group'

export interface MessagePreview {
  content: string
  sender_id: string
  sent_at: string
}

export interface Conversation {
  id: string
  type: ConversationType
  participants: string[]
  name?: string
  last_message?: MessagePreview
  created_at: string
  updated_at: string
}

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export interface Attachment {
  id: string
  uploader_id: string
  message_id: string
  type: 'image' | 'video' | 'file'
  original_name: string
  url: string
  mime_type: string
  size_bytes: number
  uploaded_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  word_count: number
  status: MessageStatus
  attachments?: Attachment[]
  sent_at: string
  delivered_at?: string
  read_at?: string
  // optimistic flag — set locally before the server confirms
  _optimistic?: boolean
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType = 'new_message' | 'file_shared' | 'user_online'
export type NotificationStatus = 'unread' | 'read'

export interface Notification {
  id: string
  receiver_id: string
  sender_id: string
  type: NotificationType
  title: string
  body: string
  payload: Record<string, string>
  status: NotificationStatus
  created_at: string
  read_at?: string
}

// ─── WebSocket Events ────────────────────────────────────────────────────────

export type WSEventType =
  | 'new_message'
  | 'message_status'
  | 'file_shared'
  | 'user_online'
  | 'user_offline'

export interface WSEvent<T = unknown> {
  type: WSEventType
  payload: T
}