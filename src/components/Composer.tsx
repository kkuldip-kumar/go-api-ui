// import {
//   useState, useRef, useCallback,
//   type KeyboardEvent, type ChangeEvent, type DragEvent,
// } from 'react'
// import { Send, Paperclip, Loader2, X } from 'lucide-react'
// import clsx from 'clsx'
// import FileUploadPreview from './FileUploadPreview'
// import { useFileUpload } from '@/hooks/useFileUpload'
// import { useTyping } from '@/hooks/useTyping'

// const MAX_WORDS = 100

// function countWords(s: string): number {
//   return s.trim().split(/\s+/).filter(Boolean).length
// }

// interface ComposerProps {
//   onSend: (content: string, attachmentIds?: string[]) => void
//   isSending: boolean
//   disabled?: boolean
//   placeholder?: string
//   conversationId: string | null
// }

// export default function Composer({
//   onSend,
//   isSending,
//   disabled = false,
//   placeholder = 'Message…',
//   conversationId,
// }: ComposerProps) {
//   const [content, setContent] = useState('')
//   const [isDragging, setIsDragging] = useState(false)
//   const textareaRef = useRef<HTMLTextAreaElement>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const { uploads, addFile, removeUpload, clearAll, doneAttachments, isUploading } =
//     useFileUpload()
//   const { sendTypingStart, sendTypingStop } = useTyping(conversationId)

//   const wordCount = countWords(content)
//   const isOverLimit = wordCount > MAX_WORDS
//   const canSend =
//     (content.trim().length > 0 || doneAttachments.length > 0) &&
//     !isOverLimit && !isSending && !disabled && !isUploading

//   const resize = useCallback(() => {
//     const el = textareaRef.current
//     if (!el) return
//     el.style.height = 'auto'
//     el.style.height = `${Math.min(el.scrollHeight, 144)}px`
//   }, [])

//   const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
//     setContent(e.target.value)
//     resize()
//     if (e.target.value.trim()) sendTypingStart()
//     else sendTypingStop()
//   }

//   const handleSend = useCallback(() => {
//     if (!canSend) return
//     const attachmentIds = doneAttachments.map((a) => a.id)
//     onSend(content.trim(), attachmentIds.length > 0 ? attachmentIds : undefined)
//     setContent('')
//     clearAll()
//     sendTypingStop()
//     if (textareaRef.current) {
//       textareaRef.current.style.height = 'auto'
//       textareaRef.current.focus()
//     }
//   }, [canSend, content, doneAttachments, onSend, clearAll, sendTypingStop])

//   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       handleSend()
//     }
//   }

//   const handleFiles = useCallback(
//     (files: FileList | null) => {
//       if (!files) return
//       Array.from(files).forEach((f) => addFile(f))
//     },
//     [addFile],
//   )

//   // Drag-and-drop
//   const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
//   const onDragLeave = () => setIsDragging(false)
//   const onDrop = (e: DragEvent) => {
//     e.preventDefault()
//     setIsDragging(false)
//     handleFiles(e.dataTransfer.files)
//   }

//   const wordCountColor =
//     wordCount === 0
//       ? 'text-surface-300/30'
//       : isOverLimit
//         ? 'text-red-400 font-medium'
//         : wordCount > 80
//           ? 'text-amber-400'
//           : 'text-surface-300/40'

//   return (
//     <div
//       className="px-4 pb-4 pt-2"
//       onDragOver={onDragOver}
//       onDragLeave={onDragLeave}
//       onDrop={onDrop}
//     >
//       {/* File previews */}
//       <FileUploadPreview uploads={uploads} onRemove={removeUpload} />

//       {/* Drag overlay */}
//       {isDragging && (
//         <div className="flex items-center justify-center h-16 rounded-2xl border-2 border-dashed border-brand-500/50 bg-brand-500/5 mb-2 animate-fade-in">
//           <p className="text-sm text-brand-400 font-medium">Drop files to attach</p>
//         </div>
//       )}

//       {/* Composer bar */}
//       <div
//         className={clsx(
//           'flex items-end gap-2 bg-surface-800/60 border rounded-2xl px-3 py-2 transition-all duration-150',
//           disabled
//             ? 'border-surface-200/6 opacity-50'
//             : isDragging
//               ? 'border-brand-500/50 bg-brand-500/5'
//               : 'border-surface-200/10 focus-within:border-brand-500/40 focus-within:bg-surface-800/80',
//         )}
//       >
//         {/* Attach button */}
//         <button
//           type="button"
//           onClick={() => fileInputRef.current?.click()}
//           disabled={disabled}
//           className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-surface-300/40 hover:text-surface-300/80 hover:bg-surface-700/50 transition-all duration-150 mb-0.5 disabled:pointer-events-none"
//           aria-label="Attach file"
//         >
//           <Paperclip className={clsx('w-4 h-4', uploads.length > 0 && 'text-brand-400')} />
//         </button>

//         <input
//           ref={fileInputRef}
//           type="file"
//           multiple
//           className="hidden"
//           accept="image/*,video/mp4,video/webm,text/plain,application/pdf"
//           onChange={(e) => handleFiles(e.target.files)}
//         />

//         {/* Textarea */}
//         <textarea
//           ref={textareaRef}
//           value={content}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           onBlur={sendTypingStop}
//           placeholder={placeholder}
//           disabled={disabled}
//           rows={1}
//           className={clsx(
//             'flex-1 bg-transparent resize-none text-sm text-white placeholder:text-surface-300/30',
//             'focus:outline-none leading-relaxed py-1.5 min-h-[36px] max-h-36',
//             'disabled:cursor-not-allowed',
//           )}
//           style={{ overflowY: 'auto' }}
//         />

//         {/* Controls */}
//         <div className="flex items-center gap-2 flex-shrink-0 mb-0.5">
//           {content.length > 0 && (
//             <>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setContent('')
//                   if (textareaRef.current) textareaRef.current.style.height = 'auto'
//                   textareaRef.current?.focus()
//                   sendTypingStop()
//                 }}
//                 className="w-5 h-5 flex items-center justify-center text-surface-300/30 hover:text-surface-300/70 transition-colors"
//               >
//                 <X className="w-3.5 h-3.5" />
//               </button>
//               <span className={clsx('text-[11px] tabular-nums w-12 text-right', wordCountColor)}>
//                 {wordCount}/{MAX_WORDS}
//               </span>
//             </>
//           )}

//           <button
//             type="button"
//             onClick={handleSend}
//             disabled={!canSend}
//             className={clsx(
//               'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
//               canSend
//                 ? 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95 shadow-sm'
//                 : 'bg-surface-700/50 text-surface-300/20 cursor-not-allowed',
//             )}
//             aria-label="Send message"
//           >
//             {isSending || isUploading
//               ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
//               : <Send className="w-3.5 h-3.5" />
//             }
//           </button>
//         </div>
//       </div>

//       {/* Over-limit warning */}
//       {isOverLimit && (
//         <p className="text-xs text-red-400/80 mt-1.5 px-1 animate-fade-in">
//           Message is {wordCount - MAX_WORDS} word{wordCount - MAX_WORDS !== 1 ? 's' : ''} over the 100-word limit
//         </p>
//       )}

//       {/* Upload status summary */}
//       {isUploading && (
//         <p className="text-[11px] text-brand-400/70 mt-1.5 px-1 flex items-center gap-1 animate-fade-in">
//           <Loader2 className="w-3 h-3 animate-spin" />
//           Uploading files…
//         </p>
//       )}

//       {!disabled && content.length === 0 && uploads.length === 0 && (
//         <p className="text-[10px] text-surface-300/20 text-center mt-1.5 hidden sm:block">
//           Enter to send · Shift+Enter for new line · Drop files to attach
//         </p>
//       )}
//     </div>
//   )
// }

import {
  useState, useRef, useCallback, useEffect,
  type KeyboardEvent, type ChangeEvent, type DragEvent,
} from 'react'
import {
  Send, Paperclip, Loader2, X, Image, FileText,
  Video, AlertCircle, CheckCircle, ChevronRight,
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

// ─── Single file thumbnail in the tray ───────────────────────────────────────

function FileThumbnail({
  upload,
  onRemove,
}: {
  upload: UploadProgress
  onRemove: () => void
}) {
  const { file, previewUrl, progress, status, error } = upload
  const isImage = file.type.startsWith('image/')
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
        <img
          src={previewUrl}
          alt={file.name}
          className="w-full h-full object-cover"
        />
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

      {/* State overlay */}
      {status === 'uploading' && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
          <span className="text-[9px] text-white/70 font-mono">{progress}%</span>
          {/* Progress bar */}
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

      {/* Remove button — always visible */}
      <button
        onClick={onRemove}
        className={clsx(
          'absolute top-0.5 right-0.5 w-4 h-4 rounded-full',
          'bg-black/70 hover:bg-black/90',
          'flex items-center justify-center transition-colors',
          'z-10',
        )}
        aria-label="Remove file"
      >
        <X className="w-2.5 h-2.5 text-white" />
      </button>
    </div>
  )
}

// ─── File tray shown above the input bar ─────────────────────────────────────

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

  return (
    <div className="px-1 pt-2 pb-1">
      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {uploads.map((u) => (
          <FileThumbnail key={u.id} upload={u} onRemove={() => onRemove(u.id)} />
        ))}
        {/* "Add more" slot if under limit */}
        {uploads.length < MAX_FILES && (
          <div className="flex-shrink-0 w-16 h-16 rounded-xl border border-dashed border-surface-200/15 flex items-center justify-center text-surface-300/20">
            <Paperclip className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-2 mt-1.5 px-0.5">
        <span className="text-[10px] text-surface-300/40">
          {uploads.length} file{uploads.length !== 1 ? 's' : ''}
        </span>
        {uploadingCount > 0 && (
          <span className="text-[10px] text-brand-400 flex items-center gap-1 animate-pulse-soft">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Uploading {uploadingCount}…
          </span>
        )}
        {errorCount > 0 && (
          <span className="text-[10px] text-red-400">
            {errorCount} failed
          </span>
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

// ─── Main Composer ────────────────────────────────────────────────────────────

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploads, addFile, removeUpload, clearAll, doneAttachments, isUploading } =
    useFileUpload()
  const { sendTypingStart, sendTypingStop } = useTyping(conversationId)

  const wordCount = countWords(content)
  const isOverLimit = wordCount > MAX_WORDS
  const hasFiles = uploads.length > 0
  const hasReadyFiles = doneAttachments.length > 0
  const hasContent = content.trim().length > 0

  // Can send if: (has text OR has ready files) AND not over limit AND not currently uploading/sending
  const canSend =
    (hasContent || hasReadyFiles) &&
    !isOverLimit &&
    !isSending &&
    !disabled &&
    !isUploading

  // Auto-resize textarea
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

  const handleSend = useCallback(() => {
    // if (!canSend) return
    const attachmentIds = doneAttachments.map((a) => a.id)
    console.log("sdfsd", attachmentIds)
    onSend(content.trim(), attachmentIds.length > 0 ? attachmentIds : undefined)
    setContent('')
    clearAll()
    sendTypingStop()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }, [canSend, content, doneAttachments, onSend, clearAll, sendTypingStop])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !hasFiles) {
      // When files are attached, Enter adds a newline (caption editing mode)
      e.preventDefault()
      handleSend()
    }
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const remaining = MAX_FILES - uploads.length
      Array.from(files).slice(0, remaining).forEach((f) => addFile(f))
    },
    [addFile, uploads.length],
  )

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e: DragEvent) => {
    // Only clear if leaving the composer entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // Placeholder changes contextually
  const activePlaceholder = hasFiles
    ? 'Add a caption… (optional)'
    : placeholder

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
      {/* ── Drag-over overlay ──────────────────────────────────────── */}
      {isDragging && (
        <div className="flex items-center justify-center h-14 rounded-2xl border-2 border-dashed border-brand-500/60 bg-brand-500/8 mb-2 animate-fade-in">
          <p className="text-sm text-brand-400 font-medium flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Drop files to attach
          </p>
        </div>
      )}

      {/* ── Main composer card ─────────────────────────────────────── */}
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
        {/* File tray — shown when files are attached */}
        <div className="px-3">
          <FileTray uploads={uploads} onRemove={removeUpload} />
        </div>

        {/* Separator when tray is visible */}
        {hasFiles && (
          <div className="mx-3 h-px bg-surface-200/8" />
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* Attach button */}
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

          {/* Textarea */}
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

          {/* Right controls */}
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

            {/* Send button */}
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

        {/* Caption hint when files are attached */}
        {hasFiles && !isOverLimit && (
          <p className="text-[10px] text-surface-300/25 px-4 pb-2 -mt-1">
            {hasContent
              ? `Caption: "${content.length > 40 ? content.slice(0, 40) + '…' : content}"`
              : 'Sending without caption — type above to add one'
            }
            {' · '}
            <span className="text-brand-400/60">Enter to send</span>
          </p>
        )}
      </div>

      {/* Over-limit warning */}
      {isOverLimit && (
        <p className="text-xs text-red-400/80 mt-1.5 px-1 animate-fade-in">
          {wordCount - MAX_WORDS} word{wordCount - MAX_WORDS !== 1 ? 's' : ''} over the 100-word limit
        </p>
      )}

      {/* Generic hint */}
      {!disabled && !hasFiles && content.length === 0 && (
        <p className="text-[10px] text-surface-300/20 text-center mt-1.5 hidden sm:block">
          Enter to send · Shift+Enter for new line · Drop or click 📎 to attach files
        </p>
      )}
    </div>
  )
}