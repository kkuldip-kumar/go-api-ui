import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx — those are user/auth errors, not transient
      retry: (failureCount, error: any) => {
        const status = error?.response?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})

const root = document.getElementById('root')!
if (!root) throw new Error('Root element not found')
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
