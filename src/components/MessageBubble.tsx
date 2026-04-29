import { format, isToday, isYesterday } from 'date-fns'
import { Check, CheckCheck, Clock, FileText, Download } from 'lucide-react'
import clsx from 'clsx'
import type { Message, Attachment } from '@/types'

// ─── Status tick ─────────────────────────────────────────────────────────────

function StatusTick({ status }: { status: Message['status'] }) {
  if (status === 'sending')   return <Clock     className="w-3 h-3 text-white/40" />
  if (status === 'sent')      return <Check     className="w-3 h-3 text-white/40" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-white/40" />
  if (status === 'read')      return <CheckCheck className="w-3 h-3 text-blue-300" />
  return null
}

// ─── Individual attachment renderers ─────────────────────────────────────────

// function ImageAttachment({ att }: { att: Attachment }) {
//   return (
//     <a
//       href={att.url}
//       target="_blank"
//       rel="noopener noreferrer"
//       className="block relative overflow-hidden rounded-lg group"
//     >
//       <img
//         src={att.url}
//         alt={att.original_name}
//         className="w-full h-auto max-h-52 object-cover transition-opacity group-hover:opacity-90"
//         loading="lazy"
//       />
//       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
//       <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg p-1">
//         <Expand className="w-3 h-3 text-white" />
//       </div>
//     </a>
//   )
// }

function VideoAttachment({ att }: { att: Attachment }) {
  return (
    <video
      src={att.url}
      controls
      className="w-full rounded-lg max-h-52"
      preload="metadata"
    />
  )
}

function FileAttachment({ att }: { att: Attachment }) {
  const sizeStr =
    att.size_bytes > 1_048_576
      ? `${(att.size_bytes / 1_048_576).toFixed(1)} MB`
      : `${Math.round(att.size_bytes / 1024)} KB`

  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      download={att.original_name}
      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 transition-colors group"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-700/60 flex items-center justify-center">
        <FileText className="w-4 h-4 text-surface-300/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{att.original_name}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{sizeStr}</p>
      </div>
      <Download className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 flex-shrink-0 transition-colors" />
    </a>
  )
}

// ─── Multi-file grid layout ───────────────────────────────────────────────────
//
// 1 image   → full-width
// 2 images  → side-by-side halves
// 3 images  → one large top + two small bottom
// 4+ images → 2×2 grid (max 4 shown, "+N more" overlay on last)

function ImageGrid({
  images,
  extras,
}: {
  images: Attachment[]
  extras: number
}) {
  const shown = images.slice(0, 4)
  const gridClass =
    shown.length === 1
      ? 'grid-cols-1'
      : shown.length === 2
        ? 'grid-cols-2'
        : shown.length === 3
          ? 'grid-cols-2'
          : 'grid-cols-2'

  return (
    <div className={clsx('grid gap-0.5 overflow-hidden rounded-xl', gridClass)}>
      {shown.map((att, i) => {
        const isLarge = shown.length === 3 && i === 0
        const isLast = i === shown.length - 1 && extras > 0

        return (
          <div
            key={att.id}
            className={clsx(
              'relative overflow-hidden',
              isLarge && 'col-span-2 row-span-1',
            )}
            style={{ aspectRatio: isLarge ? '2/1' : '1/1' }}
          >
            <img
              src={att.url}
              alt={att.original_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {isLast && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">+{extras}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Attachment section ───────────────────────────────────────────────────────

function AttachmentSection({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter((a) => a.type === 'image')
  const videos = attachments.filter((a) => a.type === 'video')
  const files  = attachments.filter((a) => a.type === 'file')

  return (
    <div className="space-y-1.5">
      {/* Image grid */}
      {images.length > 0 && (
        <ImageGrid images={images} extras={Math.max(0, images.length - 4)} />
      )}

      {/* Videos (stacked) */}
      {videos.map((v) => (
        <VideoAttachment key={v.id} att={v} />
      ))}

      {/* File attachments */}
      {files.map((f) => (
        <FileAttachment key={f.id} att={f} />
      ))}
    </div>
  )
}

// ─── Main bubble ─────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'dd MMM HH:mm')
}

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showAvatar?: boolean
  senderName?: string
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  senderName,
}: MessageBubbleProps) {
  const hasText        = message.content.trim().length > 0
  const hasAttachments = (message.attachments?.length ?? 0) > 0
  const isOptimistic   = message._optimistic

  // Caption is the text content when attachments are also present
  const caption = hasAttachments && hasText ? message.content : null
  // Pure text (no attachments)
  const bodyText = !hasAttachments && hasText ? message.content : null

  return (
    <div
      className={clsx(
        'flex items-end gap-2 group animate-slide-up',
        isMine ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar spacer */}
      <div className="w-7 flex-shrink-0" />

      <div
        className={clsx(
          'flex flex-col max-w-[72%] sm:max-w-[62%]',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        {/* Sender label (group chats) */}
        {!isMine && showAvatar && senderName && (
          <span className="text-xs font-medium text-brand-400/80 mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'relative rounded-2xl shadow-bubble overflow-hidden transition-opacity',
            hasAttachments
              ? isMine
                ? 'bg-brand-600/40 border border-brand-500/20'
                : 'bg-surface-800 border border-surface-200/8'
              : isMine
                ? 'bg-brand-500 px-3.5 py-2.5'
                : 'bg-surface-800 border border-surface-200/8 px-3.5 py-2.5',
            isOptimistic && 'opacity-70',
          )}
        >
          {/* Attachments */}
          {hasAttachments && (
            <div className={clsx(hasAttachments && (caption || !hasText) && 'p-1.5')}>
              <AttachmentSection attachments={message.attachments!} />
            </div>
          )}

          {/* Caption (text sent alongside files) */}
          {caption && (
            <div className={clsx('px-3 pb-2 pt-1', !hasAttachments && 'pt-0')}>
              <p className={clsx(
                'text-sm leading-relaxed break-words whitespace-pre-wrap',
                isMine ? 'text-white' : 'text-white',
              )}>
                {caption}
              </p>
            </div>
          )}

          {/* Pure text body */}
          {bodyText && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-white">
              {bodyText}
            </p>
          )}

          {/* Time + status row */}
          <div
            className={clsx(
              'flex items-center gap-1 mt-1',
              hasAttachments ? 'px-3 pb-2' : '',
              isMine ? 'justify-end' : 'justify-start',
            )}
          >
            <span className="text-[10px] text-white/45 leading-none">
              {formatTime(message.sent_at)}
            </span>
            {isMine && <StatusTick status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  )
}