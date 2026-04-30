import {
  useState, useRef, useCallback, useEffect,
  type KeyboardEvent, type ChangeEvent, type DragEvent,
} from 'react'
import {
  Send, Paperclip, Loader2, X, FileText,
  Video, AlertCircle, CheckCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useTyping } from '@/hooks/useTyping'
import type { UploadProgress } from '@/types'

const MAX_WORDS = 100
const MAX_FILES = 10

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

function FileThumbnail({
  upload,
  onRemove,
}: {
  upload: UploadProgress
  onRemove: () => void
}) {
  const { file, previewUrl, progress, status, error } = upload
  const isVideo = file.type.startsWith('video/')

  return (
    <div
      className={clsx(
        'relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden group',
        'border transition-colors',
        status === 'error'
          ? 'border-red-500/50 bg-red-500/8'
          : status === 'done'
            ? 'border-emerald-500/30 bg-surface-800'
            : 'border-surface-200/10 bg-surface-800',
      )}
    >
      {/* Preview / icon */}
      {previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          {isVideo ? (
            <Video className="w-5 h-5 text-surface-300/40" />
          ) : (
            <FileText className="w-5 h-5 text-surface-300/40" />
          )}
          <span className="text-[9px] text-surface-300/40 font-medium px-1 truncate w-full text-center">
            {file.name.split('.').pop()?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Staged — ready to upload on send */}
      {status === 'staged' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500/30" />
      )}

      {/* Uploading overlay with circular progress */}
      {status === 'uploading' && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
          <span className="text-[9px] text-white/70 font-mono">{progress}%</span>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
            <div
              className="h-full bg-brand-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-0.5 p-1">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-[8px] text-red-300 text-center leading-tight line-clamp-2">
            {error}
          </span>
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-colors z-10"
        aria-label="Remove file"
      >
        <X className="w-2.5 h-2.5 text-white" />
      </button>
    </div>
  )
}

function FileTray({
  uploads,
  onRemove,
}: {
  uploads: UploadProgress[]
  onRemove: (id: string) => void
}) {
  if (uploads.length === 0) return null

  const doneCount = uploads.filter((u) => u.status === 'done').length
  const errorCount = uploads.filter((u) => u.status === 'error').length
  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length
  const stagedCount = uploads.filter((u) => u.status === 'staged').length

  return (
    <div className="px-1 pt-2 pb-1">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {uploads.map((u) => (
          <FileThumbnail key={u.id} upload={u} onRemove={() => onRemove(u.id)} />
        ))}
        {uploads.length < MAX_FILES && (
          <div className="flex-shrink-0 w-16 h-16 rounded-xl border border-dashed border-surface-200/15 flex items-center justify-center text-surface-300/20">
            <Paperclip className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1.5 px-0.5">
        <span className="text-[10px] text-surface-300/40">
          {uploads.length} file{uploads.length !== 1 ? 's' : ''}
        </span>

        {/* Staged — waiting for send */}
        {stagedCount > 0 && uploadingCount === 0 && (
          <span className="text-[10px] text-brand-400/70">
            Will upload on send
          </span>
        )}

        {uploadingCount > 0 && (
          <span className="text-[10px] text-brand-400 flex items-center gap-1 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Uploading {uploadingCount}…
          </span>
        )}
        {errorCount > 0 && (
          <span className="text-[10px] text-red-400">{errorCount} failed</span>
        )}
        {doneCount === uploads.length && uploads.length > 0 && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" />
            Ready to send
          </span>
        )}
      </div>
    </div>
  )
}

interface ComposerProps {
  onSend: (content: string, attachmentIds?: string[]) => void
  isSending: boolean
  disabled?: boolean
  placeholder?: string
  conversationId: string | null
}

export default function Composer({
  onSend,
  isSending,
  disabled = false,
  placeholder = 'Message…',
  conversationId,
}: ComposerProps) {
  const [content, setContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  // Holds message content waiting for uploads to finish before sending
  const [pendingSendContent, setPendingSendContent] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    uploads,
    stageFile,    // ← stage only, no upload
    uploadAll,    // ← upload all staged on send
    removeUpload,
    clearAll,
    doneAttachments,
    isUploading,
    isStaged,
  } = useFileUpload()

  const { sendTypingStart, sendTypingStop } = useTyping(conversationId)

  const wordCount = countWords(content)
  const isOverLimit = wordCount > MAX_WORDS
  const hasFiles = uploads.length > 0
  const hasContent = content.trim().length > 0

  const canSend =
    (hasContent || hasFiles) &&
    !isOverLimit &&
    !isSending &&
    !disabled &&
    !isUploading  // blocked while uploading in progress

  // ── After uploadAll completes, send the message ─────────────────────────────
  useEffect(() => {
    if (pendingSendContent === null) return
    if (isUploading) return // still uploading — wait

    const attachmentIds = doneAttachments.map((a) => a.id)
    onSend(
      pendingSendContent,
      attachmentIds.length > 0 ? attachmentIds : undefined,
    )
    setPendingSendContent(null)
    setContent('')
    clearAll()
    sendTypingStop()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }, [pendingSendContent, isUploading, doneAttachments, onSend, clearAll, sendTypingStop])

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    resize()
    if (e.target.value.trim()) sendTypingStart()
    else sendTypingStop()
  }

  const handleSend = useCallback(async () => {
    if (!canSend) return
    const trimmed = content.trim()

    if (isStaged) {
      // Files are staged — trigger upload now, then send via useEffect above
      setPendingSendContent(trimmed)
      await uploadAll()
      return
    }

    // No staged files (files already uploaded or text-only) — send immediately
    const attachmentIds = doneAttachments.map((a) => a.id)
    onSend(trimmed, attachmentIds.length > 0 ? attachmentIds : undefined)
    setContent('')
    clearAll()
    sendTypingStop()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }, [canSend, content, isStaged, uploadAll, doneAttachments, onSend, clearAll, sendTypingStop])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !hasFiles) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Stage files on select — NO upload yet ──────────────────────────────────
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const remaining = MAX_FILES - uploads.length
      Array.from(files).slice(0, remaining).forEach((f) => stageFile(f))
    },
    [stageFile, uploads.length],
  )

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const activePlaceholder = hasFiles ? 'Add a caption… (optional)' : placeholder

  const wordCountColor =
    wordCount === 0
      ? 'text-surface-300/25'
      : isOverLimit
        ? 'text-red-400 font-medium'
        : wordCount > 80
          ? 'text-amber-400'
          : 'text-surface-300/40'

  return (
    <div
      className="px-4 pb-4 pt-1 flex-shrink-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="flex items-center justify-center h-14 rounded-2xl border-2 border-dashed border-brand-500/60 bg-brand-500/8 mb-2 animate-fade-in">
          <p className="text-sm text-brand-400 font-medium flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Drop files to attach
          </p>
        </div>
      )}

      <div
        className={clsx(
          'bg-surface-800/60 border rounded-2xl transition-all duration-150',
          disabled
            ? 'border-surface-200/6 opacity-50'
            : isDragging
              ? 'border-brand-500/50 bg-brand-500/5'
              : hasFiles
                ? 'border-brand-500/25 bg-surface-800/80'
                : 'border-surface-200/10 focus-within:border-brand-500/40 focus-within:bg-surface-800/80',
        )}
      >
        <div className="px-3">
          <FileTray uploads={uploads} onRemove={removeUpload} />
        </div>

        {hasFiles && <div className="mx-3 h-px bg-surface-200/8" />}

        <div className="flex items-end gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploads.length >= MAX_FILES}
            className={clsx(
              'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl',
              'transition-all duration-150 mb-0.5',
              'disabled:pointer-events-none disabled:opacity-30',
              hasFiles
                ? 'text-brand-400 hover:text-brand-300 hover:bg-brand-500/10'
                : 'text-surface-300/40 hover:text-surface-300/80 hover:bg-surface-700/50',
            )}
            aria-label={`Attach file (${uploads.length}/${MAX_FILES})`}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,text/plain,application/pdf"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={sendTypingStop}
            placeholder={activePlaceholder}
            disabled={disabled}
            rows={1}
            className={clsx(
              'flex-1 bg-transparent resize-none text-sm text-white',
              'placeholder:text-surface-300/30 focus:outline-none leading-relaxed',
              'py-1.5 min-h-[36px] max-h-[120px] disabled:cursor-not-allowed',
            )}
            style={{ overflowY: 'auto' }}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
            {content.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setContent('')
                    if (textareaRef.current) textareaRef.current.style.height = 'auto'
                    textareaRef.current?.focus()
                    sendTypingStop()
                  }}
                  className="w-5 h-5 flex items-center justify-center text-surface-300/25 hover:text-surface-300/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className={clsx('text-[11px] tabular-nums w-[3.2rem] text-right', wordCountColor)}>
                  {wordCount}/{MAX_WORDS}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center',
                'transition-all duration-150',
                canSend
                  ? 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95 shadow-sm'
                  : 'bg-surface-700/50 text-surface-300/20 cursor-not-allowed',
              )}
              aria-label="Send"
            >
              {isSending || isUploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>

        {hasFiles && !isOverLimit && (
          <p className="text-[10px] text-surface-300/25 px-4 pb-2 -mt-1">
            {hasContent
              ? `Caption: "${content.length > 40 ? `${content.slice(0, 40)}…` : content}"`
              : 'Sending without caption — type above to add one'
            }
            {' · '}
            <span className="text-brand-400/60">
              {isStaged ? 'Files will upload when you hit send' : 'Enter to send'}
            </span>
          </p>
        )}
      </div>

      {isOverLimit && (
        <p className="text-xs text-red-400/80 mt-1.5 px-1 animate-fade-in">
          {wordCount - MAX_WORDS} word{wordCount - MAX_WORDS !== 1 ? 's' : ''} over the 100-word limit
        </p>
      )}

      {!disabled && !hasFiles && content.length === 0 && (
        <p className="text-[10px] text-surface-300/20 text-center mt-1.5 hidden sm:block">
          Enter to send · Shift+Enter for new line · Drop or click 📎 to attach files
        </p>
      )}
    </div>
  )
}