import { FileText, Video, X, CheckCircle, AlertCircle, Play } from 'lucide-react'
import clsx from 'clsx'
import type { UploadProgress } from '@/types'

interface FileUploadPreviewProps {
  uploads: UploadProgress[]
  onRemove: (id: string) => void
}

// SVG circular progress — WhatsApp style
function CircularProgress({ progress, size = 44 }: { progress: number; size?: number }) {
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
    </svg>
  )
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('video/')) return <Video className="w-5 h-5 text-surface-300/70" />
  return <FileText className="w-5 h-5 text-surface-300/70" />
}

function UploadCard({ upload, onRemove }: { upload: UploadProgress; onRemove: () => void }) {
  const { file, previewUrl, progress, status, error } = upload
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  return (
    <div
      className={clsx(
        'relative flex-shrink-0 rounded-2xl overflow-hidden',
        isImage || isVideo ? 'w-[72px] h-[72px]' : 'w-[140px] h-[72px]',
        status === 'error'
          ? 'border border-red-500/40 bg-red-500/10'
          : 'border border-white/8 bg-surface-800',
      )}
    >
      {/* ── Thumbnail / preview ─────────────────────── */}
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : isVideo && previewUrl ? (
        <div className="relative w-full h-full">
          <video
            src={previewUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          {/* Video play badge */}
          {status === 'done' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        // PDF / generic file
        <div className="flex items-center gap-2.5 w-full h-full px-3">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-surface-700 flex items-center justify-center">
            <FileIcon mime={file.type} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/80 truncate leading-tight">{file.name}</p>
            <p className="text-[9px] text-surface-300/40 mt-0.5 uppercase">
              {file.name.split('.').pop()}
            </p>
          </div>
        </div>
      )}

      {/* ── Upload overlay ──────────────────────────── */}
      {status === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="relative flex items-center justify-center">
            <CircularProgress progress={progress} size={40} />
            {/* Cancel / stop icon in center */}
            <button
              onClick={onRemove}
              className="absolute inset-0 flex items-center justify-center"
              aria-label="Cancel upload"
            >
              <div className="w-3 h-3 rounded-sm border-2 border-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Done checkmark ──────────────────────────── */}
      {status === 'done' && (isImage || isVideo) && (
        <div className="absolute bottom-1 right-1">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* ── Error state ─────────────────────────────── */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 px-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          {error && (
            <span className="text-[8px] text-red-300 text-center leading-tight line-clamp-2">
              {error}
            </span>
          )}
        </div>
      )}

      {/* ── Remove button (idle / done states) ─────── */}
      {status !== 'uploading' && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-black/90 transition-colors group"
          aria-label="Remove"
        >
          <X className="w-2.5 h-2.5 text-white/70 group-hover:text-white transition-colors" />
        </button>
      )}
    </div>
  )
}

export default function FileUploadPreview({ uploads, onRemove }: FileUploadPreviewProps) {
  if (uploads.length === 0) return null

  return (
    <div className="px-3 pt-2 pb-1">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {uploads.map((u) => (
          <UploadCard key={u.id} upload={u} onRemove={() => onRemove(u.id)} />
        ))}
      </div>
    </div>
  )
}