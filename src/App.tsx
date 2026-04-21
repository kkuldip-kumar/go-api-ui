import { useAuthStore } from '@/store/authStore'
import AuthPage from '@/pages/AuthPage'
import ChatPage from '@/pages/ChatPage'

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <ChatPage /> : <AuthPage />
}