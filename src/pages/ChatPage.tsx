import { useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import Sidebar from '@/components/Sidebar'
import ChatWindow from '@/components/ChatWindow'

export default function ChatPage() {
  // Boot the WebSocket connection for the entire session
  useWebSocket()

  // Handle forced-logout event fired by the Axios interceptor
  useEffect(() => {
    const handler = () => {
      // authStore.logout() is called inside the interceptor.
      // The <App /> render will see isAuthenticated = false and
      // switch to AuthPage automatically.
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Sidebar: conversation list */}
      <Sidebar />

      {/* Main area: message thread + composer */}
      <ChatWindow />
    </div>
  )
}