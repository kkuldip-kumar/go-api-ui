import { format, isToday, isYesterday } from 'date-fns'
import { Check, CheckCheck, Clock, Image, FileText, Video, Download } from 'lucide-react'
import clsx from 'clsx'
import type { Message, Attachment } from '@/types'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showAvatar: boolean
  senderName?: string
}

function StatusTick({ status }: { status: Message['status'] }) {
  if (status === 'sending') return <Clock className="w-3 h-3 text-surface-300/40" />
  if (status === 'sent') return <Check className="w-3 h-3 text-surface-300/40" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-surface-300/40" />
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-brand-400" />
  return null
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.type === 'image') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg overflow-hidden mt-1.5 max-w-[240px] group relative"
      >
        <img
          src={attachment.url}
          alt={attachment.original_name}
          className="w-full h-auto max-h-48 object-cover transition-opacity group-hover:opacity-90"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
      </a>
    )
  }

  if (attachment.type === 'video') {
    return (
      <video
        src={attachment.url}
        controls
        className="rounded-lg mt-1.5 max-w-[240px] max-h-48 w-full"
        preload="metadata"
      />
    )
  }

  // Generic file
  const sizeKB = Math.round(attachment.size_bytes / 1024)
  const sizeMB = (attachment.size_bytes / (1024 * 1024)).toFixed(1)
  const displaySize = attachment.size_bytes > 1_048_576 ? `${sizeMB} MB` : `${sizeKB} KB`

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.original_name}
      className="flex items-center gap-3 mt-1.5 p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors max-w-[240px] group"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-700/50 flex items-center justify-center">
        {attachment.mime_type.startsWith('text/') ? (
          <FileText className="w-4 h-4 text-surface-300" />
        ) : (
          <FileText className="w-4 h-4 text-surface-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attachment.original_name}</p>
        <p className="text-xs text-surface-300/50 mt-0.5">{displaySize}</p>
      </div>
      <Download className="w-3.5 h-3.5 text-surface-300/40 group-hover:text-surface-300/80 flex-shrink-0 transition-colors" />
    </a>
  )
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`
  return format(date, 'dd MMM, HH:mm')
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  senderName,
}: MessageBubbleProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasContent = message.content.trim().length > 0
  const isOptimistic = message._optimistic

  return (
    <div
      className={clsx(
        'flex items-end gap-2 group',
        isMine ? 'flex-row-reverse' : 'flex-row',
        'animate-slide-up',
      )}
    >
      {/* Avatar placeholder (keeps alignment) */}
      <div className="w-7 flex-shrink-0" />

      <div
        className={clsx(
          'flex flex-col max-w-[72%] sm:max-w-[60%]',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        {/* Sender name for group chats */}
        {!isMine && showAvatar && senderName && (
          <span className="text-xs font-medium text-brand-400/80 mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'relative px-3.5 py-2.5 rounded-2xl shadow-bubble transition-opacity',
            isMine
              ? 'bg-brand-500 text-white rounded-br-sm'
              : 'bg-surface-800 text-white rounded-bl-sm border border-surface-200/8',
            isOptimistic && 'opacity-70',
          )}
        >
          {/* Attachments */}
          {hasAttachments &&
            message.attachments!.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}

          {/* Text content */}
          {hasContent && (
            <p
              className={clsx(
                'text-sm leading-relaxed break-words whitespace-pre-wrap',
                hasAttachments && 'mt-1.5',
              )}
            >
              {message.content}
            </p>
          )}

          {/* Time + status */}
          <div
            className={clsx(
              'flex items-center gap-1 mt-1',
              isMine ? 'justify-end' : 'justify-start',
            )}
          >
            <span
              className={clsx(
                'text-[10px] leading-none',
                isMine ? 'text-white/50' : 'text-surface-300/40',
              )}
            >
              {formatMessageTime(message.sent_at)}
            </span>
            {isMine && <StatusTick status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  )
}