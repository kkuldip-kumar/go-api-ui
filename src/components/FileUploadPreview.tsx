import { Image, FileText, Video, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { UploadProgress } from '@/types'

interface FileUploadPreviewProps {
  uploads: UploadProgress[]
  onRemove: (id: string) => void
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <Image className="w-4 h-4" />
  if (mime.startsWith('video/')) return <Video className="w-4 h-4" />
  return <FileText className="w-4 h-4" />
}

function UploadCard({ upload, onRemove }: { upload: UploadProgress; onRemove: () => void }) {
  const { file, previewUrl, progress, status, error } = upload

  return (
    <div className={clsx(
      'relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border',
      status === 'error'
        ? 'border-red-500/40 bg-red-500/10'
        : status === 'done'
          ? 'border-emerald-500/30 bg-surface-800'
          : 'border-surface-200/10 bg-surface-800',
    )}>
      {/* Image preview */}
      {previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-1">
          <FileIcon mime={file.type} />
          <span className="text-[9px] text-surface-300/50 truncate w-full text-center px-1">
            {file.name.split('.').pop()?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Dark overlay for non-image or uploading */}
      {(status === 'uploading' || status === 'done' || status === 'error') && (
        <div className={clsx(
          'absolute inset-0 flex items-center justify-center',
          status === 'uploading' ? 'bg-black/50' : 'bg-black/30',
        )}>
          {status === 'uploading' && (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span className="text-[9px] text-white/80">{progress}%</span>
            </div>
          )}
          {status === 'done' && (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-0.5 px-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-[8px] text-red-300 text-center leading-tight line-clamp-2">
                {error}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {status === 'uploading' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full bg-brand-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
        aria-label="Remove"
      >
        <X className="w-2.5 h-2.5 text-white" />
      </button>
    </div>
  )
}

export default function FileUploadPreview({ uploads, onRemove }: FileUploadPreviewProps) {
  if (uploads.length === 0) return null

  return (
    <div className="px-4 pt-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {uploads.map((u) => (
          <UploadCard key={u.id} upload={u} onRemove={() => onRemove(u.id)} />
        ))}
      </div>
    </div>
  )
}