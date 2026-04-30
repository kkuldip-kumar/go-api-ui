import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { UploadProgress, Attachment } from '@/types'

const ALLOWED_MIME: Record<string, number> = {
  'image/jpeg': 10,
  'image/png': 10,
  'image/gif': 10,
  'image/webp': 10,
  'video/mp4': 200,
  'video/webm': 200,
  'video/quicktime': 200,
  'text/plain': 5,
  'application/pdf': 20,
}

export function validateFile(file: File): string | null {
  const maxMB = ALLOWED_MIME[file.type]
  if (maxMB === undefined) return `File type "${file.type}" is not allowed`
  if (file.size > maxMB * 1024 * 1024) return `File exceeds ${maxMB} MB limit`
  return null
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const updateUpload = useCallback((id: string, patch: Partial<UploadProgress>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  // ── Stage only (no upload) — call this on file select ──────────────────────
  const stageFile = useCallback((file: File): string => {
    const error = validateFile(file)
    const id = `upload_${Date.now()}_${Math.random()}`
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const previewUrl = (isImage || isVideo) ? URL.createObjectURL(file) : null

    const entry: UploadProgress = {
      id,
      file,
      previewUrl,
      progress: 0,
      status: error ? 'error' : 'staged', // ← new status: waiting for send
      error: error ?? undefined,
    }
    setUploads((prev) => [...prev, entry])
    return id
  }, [])

  // ── Upload a single already-staged entry ───────────────────────────────────
  const uploadOne = useCallback(
    async (id: string, file: File): Promise<Attachment | null> => {
      updateUpload(id, { status: 'uploading', progress: 0 })

      try {
        const form = new FormData()
        form.append('file', file)

        const res = await apiClient.post<{ success: boolean; data: Attachment }>(
          '/api/v1/upload',
          form,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (evt) => {
              const progress = evt.total
                ? Math.round((evt.loaded / evt.total) * 100)
                : 0
              updateUpload(id, { progress })
            },
          },
        )

        const attachment = res.data.data
        updateUpload(id, { status: 'done', progress: 100, attachment })
        return attachment
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? 'Upload failed'
        updateUpload(id, { status: 'error', error: msg })
        return null
      }
    },
    [updateUpload],
  )

  // ── Upload all staged files — call this on send click ──────────────────────
  // Returns array of successful Attachments (errors are skipped)
  const uploadAll = useCallback(async (): Promise<Attachment[]> => {
    const staged = uploads.filter((u) => u.status === 'staged')
    if (staged.length === 0) return []

    const results = await Promise.all(
      staged.map((u) => uploadOne(u.id, u.file))
    )

    return results.filter((a): a is Attachment => a !== null)
  }, [uploads, uploadOne])

  // ── Legacy addFile — stages + immediately uploads (kept for compatibility) ──
  const addFile = useCallback(
    async (file: File): Promise<Attachment | null> => {
      const error = validateFile(file)
      const id = `upload_${Date.now()}_${Math.random()}`
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const previewUrl = (isImage || isVideo) ? URL.createObjectURL(file) : null

      const entry: UploadProgress = {
        id,
        file,
        previewUrl,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error ?? undefined,
      }
      setUploads((prev) => [...prev, entry])
      if (error) return null

      return uploadOne(id, file)
    },
    [uploadOne],
  )

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((u) => u.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    setUploads((prev) => {
      prev.forEach((u) => { if (u.previewUrl) URL.revokeObjectURL(u.previewUrl) })
      return []
    })
  }, [])

  const doneAttachments = uploads
    .filter((u) => u.status === 'done' && u.attachment)
    .map((u) => u.attachment!)

  const isUploading = uploads.some((u) => u.status === 'uploading')
  const isStaged = uploads.some((u) => u.status === 'staged')
  const hasErrors = uploads.some((u) => u.status === 'error')

  return {
    uploads,
    // New API
    stageFile,   // call on file select — shows preview, no network
    uploadAll,   // call on send — uploads all staged files, returns attachments
    // Legacy (still works)
    addFile,
    // Common
    removeUpload,
    clearAll,
    doneAttachments,
    isUploading,
    isStaged,    // true when files are waiting to be uploaded
    hasErrors,
  }
}