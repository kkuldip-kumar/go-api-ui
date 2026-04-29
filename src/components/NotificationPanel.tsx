import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  Bell, BellOff, CheckCheck, MessageSquare,
  Paperclip, X, Loader2, Smartphone, ShieldAlert,
} from 'lucide-react'
import clsx from 'clsx'
import { notificationApi } from '@/api'
import { useChatStore } from '@/store/chatStore'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { Notification } from '@/types'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  if (type === 'file_shared') return <Paperclip className="w-3.5 h-3.5" />
  return <MessageSquare className="w-3.5 h-3.5" />
}

function PushPermissionBanner() {
  const { pushPermission, isSupported, requestPermission } = usePushNotifications()

  if (!isSupported || pushPermission === 'granted') return null

  return (
    <div className={clsx(
      'mx-3 mb-3 rounded-xl p-3 flex items-start gap-3 border',
      pushPermission === 'denied'
        ? 'bg-red-500/8 border-red-500/20'
        : 'bg-brand-500/8 border-brand-500/20',
    )}>
      <div className={clsx(
        'mt-0.5 flex-shrink-0',
        pushPermission === 'denied' ? 'text-red-400' : 'text-brand-400',
      )}>
        {pushPermission === 'denied'
          ? <ShieldAlert className="w-4 h-4" />
          : <Smartphone className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        {pushPermission === 'denied' ? (
          <>
            <p className="text-xs font-medium text-red-300">Notifications blocked</p>
            <p className="text-[11px] text-surface-300/50 mt-0.5 leading-relaxed">
              Enable notifications in your browser settings to receive alerts for new messages.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-white">Enable push notifications</p>
            <p className="text-[11px] text-surface-300/50 mt-0.5 leading-relaxed">
              Get notified when you receive new messages, even when the tab is in the background.
            </p>
            <button
              onClick={requestPermission}
              className="mt-2 text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Allow notifications →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function NotificationPanel({ open, onClose, anchorRef }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { setUnreadCount } = useChatStore()
  const qc = useQueryClient()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  const { data: _data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list(1, 30)
      return res.data.data
    },
    enabled: open,
    refetchInterval: open ? 15_000 : false,
    onSuccess: (d) => setUnreadCount(d.unread_count ?? 0),
  } as any)

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setUnreadCount(0)
    },
  })

//   const notifications: Notification[] = data?.notifications ?? []
//   const unreadCount: number = data?.unread_count ?? 0
  const notifications: Notification[] =  []
  const unreadCount: number =  0

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={clsx(
        'absolute right-0 top-full mt-2 w-80 z-50',
        'bg-surface-900 border border-surface-200/10 rounded-2xl shadow-modal',
        'flex flex-col max-h-[480px] overflow-hidden',
        'animate-pop-in',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium bg-brand-500 text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-[11px] text-brand-400 hover:text-brand-300 px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors flex items-center gap-1"
            >
              {markAllMutation.isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <CheckCheck className="w-3 h-3" />
              }
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-surface-300/40 hover:text-surface-300/80 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Push permission banner */}
      <div className="flex-shrink-0 pt-3">
        <PushPermissionBanner />
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center">
              <BellOff className="w-5 h-5 text-surface-300/30" />
            </div>
            <p className="text-sm text-surface-300/40">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-200/5">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.status === 'unread') markReadMutation.mutate(n.id)
                  if (n.payload?.conversation_id) {
                    window.dispatchEvent(new CustomEvent('notification:click', {
                      detail: { conversationId: n.payload.conversation_id },
                    }))
                    onClose()
                  }
                }}
                className={clsx(
                  'w-full flex items-start gap-3 px-4 py-3 text-left',
                  'hover:bg-surface-800/60 transition-colors',
                  n.status === 'unread' && 'bg-brand-500/5',
                )}
              >
                {/* Icon */}
                <div className={clsx(
                  'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5',
                  n.status === 'unread'
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'bg-surface-800 text-surface-300/40',
                )}>
                  <NotifIcon type={n.type} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx(
                      'text-xs font-medium leading-snug truncate',
                      n.status === 'unread' ? 'text-white' : 'text-surface-300/70',
                    )}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-surface-300/30 flex-shrink-0 tabular-nums">
                      {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: false })
                        .replace(' minutes', 'm').replace(' minute', 'm')
                        .replace(' hours', 'h').replace(' hour', 'h')
                        .replace(' seconds', 's').replace(' second', 's')
                        .replace(' days', 'd').replace(' day', 'd')}
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-300/50 mt-0.5 leading-relaxed line-clamp-2">
                    {n.body}
                  </p>
                </div>

                {/* Unread dot */}
                {n.status === 'unread' && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}