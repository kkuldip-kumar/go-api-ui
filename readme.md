# go-chat-frontend

React 19 + Vite chat frontend for the [go-chat](../go-chat) backend.

## Stack

| Concern | Library |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + DM Sans font |
| State management | Zustand 4 (auth + chat) |
| Server state | TanStack React Query 5 |
| HTTP | Axios with silent JWT refresh |
| Real-time | Native WebSocket with auto-reconnect |
| Icons | Lucide React |
| Date formatting | date-fns |

## Project structure

```
src/
├── api/index.ts          All API call functions (auth, messages, conversations…)
├── components/
│   ├── Avatar.tsx         Hash-based coloured initials avatar
│   ├── ChatWindow.tsx     Header + message list + composer
│   ├── Composer.tsx       Textarea, word counter (100-word limit), send button
│   ├── ConversationItem.tsx  Sidebar conversation row
│   ├── MessageBubble.tsx  Single message: text, attachments, status ticks
│   ├── MessageList.tsx    Infinite scroll with date dividers + auto-scroll
│   └── Sidebar.tsx        Conversation list + new-chat modal + profile menu
├── hooks/
│   ├── useAutoScroll.ts   Auto-scroll to bottom, preserve position on load-more
│   ├── useMessages.ts     React Query infinite pages + optimistic send
│   └── useWebSocket.ts    WS lifecycle, exponential reconnect, event dispatch
├── lib/apiClient.ts       Axios instance + 401 → refresh → retry interceptor
├── pages/
│   ├── AuthPage.tsx       Login / Register
│   └── ChatPage.tsx       Root chat layout, boots WebSocket
├── store/
│   ├── authStore.ts       Zustand persisted auth (user, tokens)
│   └── chatStore.ts       Zustand chat (conversations, messages, online map)
├── types/index.ts         All TypeScript types matching the Go API
└── main.tsx               React root + QueryClientProvider
```

## Getting started

### Prerequisites
- Node 20+
- Go backend running on `http://localhost:8080`

### Install and run

```bash
cd go-chat-frontend
npm install
npm run dev
# → http://localhost:3000
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8080` and `/ws` to `ws://localhost:8080`, so you don't need to configure CORS during development.

### Production build

```bash
npm run build
# dist/ is ready to serve from any static host (Nginx, Caddy, Vercel, etc.)
```

For production, set `VITE_API_URL` in `.env.local`:

```
VITE_API_URL=https://api.yourdomain.com
```

## Key behaviours

### Auto-scroll
`useAutoScroll` tracks whether the user is within 120 px of the bottom of the message list. If yes, every new incoming message (from WS or a sent message) smoothly scrolls to the bottom. If the user has scrolled up to read history, scroll position is preserved — loading older pages adds the height delta to `scrollTop` so the view doesn't jump.

### Optimistic sends
When you press Send, the message appears immediately in the chat with a `sending` clock icon and 70% opacity. The mutation fires to the REST API; on success the temporary record is replaced with the server's confirmed message (real ID, timestamp, status). On failure the optimistic message is removed and the error surfaces.

### WebSocket reconnect
The WS hook uses exponential backoff (3 s, 6 s, 9 s … up to 30 s) with a maximum of 8 attempts. A `live` / `offline` badge in the sidebar header shows the current state. After a reconnect the message list re-fetches automatically via React Query's `refetchOnWindowFocus`.

### Token refresh
The Axios interceptor catches 401 responses, queues all in-flight requests, silently POSTs to `/auth/refresh`, then replays the failed requests with the new token. If the refresh token is also expired the user is logged out and the `auth:logout` event is fired.

### 100-word limit
`Composer` counts words on every keystroke. The counter turns amber at 80 words and red above 100, and the Send button is disabled when over the limit. The backend independently rejects messages over 100 words with `400 MESSAGE_TOO_LONG`.