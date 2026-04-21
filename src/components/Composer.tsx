import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Send, Paperclip, Loader2, X } from 'lucide-react'
import clsx from 'clsx'

const MAX_WORDS = 100

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

interface ComposerProps {
  onSend: (content: string) => void
  isSending: boolean
  disabled?: boolean
  placeholder?: string
}

export default function Composer({
  onSend,
  isSending,
  disabled = false,
  placeholder = 'Message…',
}: ComposerProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wordCount = countWords(content)
  const isOverLimit = wordCount > MAX_WORDS
  const canSend = content.trim().length > 0 && !isOverLimit && !isSending && !disabled

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    resize()
  }

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(content)
    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }, [canSend, content, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const wordCountColor =
    wordCount === 0
      ? 'text-surface-300/30'
      : isOverLimit
        ? 'text-red-400 font-medium'
        : wordCount > 80
          ? 'text-amber-400'
          : 'text-surface-300/40'

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className={clsx(
          'flex items-end gap-2 bg-surface-800/60 border rounded-2xl px-3 py-2 transition-all duration-150',
          disabled
            ? 'border-surface-200/6 opacity-50'
            : 'border-surface-200/10 focus-within:border-brand-500/40 focus-within:bg-surface-800/80',
        )}
      >
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-surface-300/40 hover:text-surface-300/80 hover:bg-surface-700/50 transition-all duration-150 mb-0.5 disabled:pointer-events-none"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/mp4,video/webm,text/plain,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              // TODO: wire to uploadApi + attach to message
              console.log('File selected:', file.name)
            }
            e.target.value = ''
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={clsx(
            'flex-1 bg-transparent resize-none text-sm text-white placeholder:text-surface-300/30',
            'focus:outline-none leading-relaxed py-1.5 min-h-[36px] max-h-36',
            'disabled:cursor-not-allowed',
          )}
          style={{ overflowY: 'auto' }}
        />

        {/* Word counter + send */}
        <div className="flex items-center gap-2 flex-shrink-0 mb-0.5">
          {content.length > 0 && (
            <>
              {/* Clear button */}
              <button
                type="button"
                onClick={() => {
                  setContent('')
                  if (textareaRef.current) textareaRef.current.style.height = 'auto'
                  textareaRef.current?.focus()
                }}
                className="w-5 h-5 flex items-center justify-center text-surface-300/30 hover:text-surface-300/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Word count */}
              <span className={clsx('text-[11px] tabular-nums w-12 text-right', wordCountColor)}>
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
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
              canSend
                ? 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95 shadow-sm'
                : 'bg-surface-700/50 text-surface-300/20 cursor-not-allowed',
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Over-limit warning */}
      {isOverLimit && (
        <p className="text-xs text-red-400/80 mt-1.5 px-1 animate-fade-in">
          Message is {wordCount - MAX_WORDS} word{wordCount - MAX_WORDS !== 1 ? 's' : ''} over the
          100-word limit
        </p>
      )}

      {/* Hint */}
      {!disabled && content.length === 0 && (
        <p className="text-[10px] text-surface-300/20 text-center mt-1.5 hidden sm:block">
          Enter to send · Shift+Enter for new line
        </p>
      )}
    </div>
  )
}