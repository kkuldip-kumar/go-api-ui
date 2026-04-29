import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ─── Request interceptor: attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 → refresh → retry ─────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(err: unknown, token: string | null) {
  // ✅ Explicit check instead of token! assertion (line 26)
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token ?? '')))
  failedQueue = []
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as RetryableConfig | undefined

    if (err.response?.status !== 401 || original?._retry) {
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        // ✅ Guard instead of original! assertion (line 44) and headers! (line 46)
        if (original?.headers) {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        }
        return Promise.reject(new Error('Missing request config'))
      })
    }

    if (!original) return Promise.reject(err)

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('no refresh token')

      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      })

      const newToken: string = data.data.access_token
      const newRefresh: string = data.data.refresh_token

      localStorage.setItem('access_token', newToken)
      localStorage.setItem('refresh_token', newRefresh)

      processQueue(null, newToken)

      // ✅ Guard instead of original! (line 70) and headers! (line 72)
      if (original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`
      }
      return apiClient(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

export const BASE_WS_URL = BASE_URL.replace(/^http/, 'ws')