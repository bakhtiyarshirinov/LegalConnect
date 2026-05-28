import { useEffect, useRef, useCallback } from 'react'
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'
import { useAuthStore } from '../store/authStore'
import type { MessageDto } from '../api/chats'

interface UseSignalROptions {
  chatId: string | null
  onReceiveMessage?: (msg: MessageDto) => void
  onMessagesRead?: (data: { chatId: string; readBy: string }) => void
}

export function useSignalR({ chatId, onReceiveMessage, onMessagesRead }: UseSignalROptions) {
  const token = useAuthStore((s) => s.token)
  const connectionRef = useRef<HubConnection | null>(null)
  const connectedRef = useRef(false)

  const onReceiveRef = useRef(onReceiveMessage)
  const onReadRef = useRef(onMessagesRead)
  const chatIdRef = useRef(chatId)

  // Update refs in render so async callbacks always see latest values
  onReceiveRef.current = onReceiveMessage
  onReadRef.current = onMessagesRead
  chatIdRef.current = chatId

  // Build connection ONCE per token — not per chatId
  useEffect(() => {
    if (!token || connectedRef.current) return

    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5218/hubs/chat', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    connection.serverTimeoutInMilliseconds = 60000
    connection.keepAliveIntervalInMilliseconds = 15000

    connection.on('ReceiveMessage', (msg: MessageDto) => {
      onReceiveRef.current?.(msg)
    })
    connection.on('MessagesRead', (data: { chatId: string; readBy: string }) => {
      onReadRef.current?.(data)
    })

    // Re-join current chat after auto-reconnect
    connection.onreconnected(async () => {
      if (chatIdRef.current) {
        await connection.invoke('JoinChat', chatIdRef.current).catch(console.error)
      }
    })

    // Guard synchronously so StrictMode double-invoke doesn't build two connections
    connectedRef.current = true

    connection
      .start()
      .then(async () => {
        connectionRef.current = connection
        // Join whichever chat was selected before connection finished
        if (chatIdRef.current) {
          await connection.invoke('JoinChat', chatIdRef.current).catch(console.error)
        }
      })
      .catch((err) => {
        connectedRef.current = false
        console.error(err)
      })

    return () => {
      connectedRef.current = false
      connectionRef.current = null
      connection.stop().catch(() => {})
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Join/leave chat group when chatId changes
  useEffect(() => {
    if (!chatId) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const tryJoin = () => {
      if (cancelled) return
      const conn = connectionRef.current
      if (conn?.state === 'Connected') {
        conn.invoke('JoinChat', chatId).catch(console.error)
      } else {
        timeoutId = setTimeout(tryJoin, 500)
      }
    }

    tryJoin()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      const conn = connectionRef.current
      if (conn?.state === 'Connected') {
        conn.invoke('LeaveChat', chatId).catch(() => {})
      }
    }
  }, [chatId])

  const sendMessage = useCallback(async (cid: string, content: string) => {
    const conn = connectionRef.current
    if (conn && conn.state === 'Connected') {
      await conn.invoke('SendMessage', cid, content)
    } else {
      throw new Error('SignalR not connected')
    }
  }, [])

  const markAsRead = useCallback(async (cid: string) => {
    const conn = connectionRef.current
    if (conn && conn.state === 'Connected') {
      await conn.invoke('MarkAsRead', cid)
    }
  }, [])

  return { sendMessage, markAsRead }
}
