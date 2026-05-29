import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '../store/authStore'

export interface IncomingMessage {
  id: string
  senderId: string
  senderFullName: string
  content: string
  isRead: boolean
  sentAt: string
}

export function useSignalR(onMessage: (msg: IncomingMessage) => void) {
  const token = useAuthStore((s) => s.token)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage // always current, no stale closure

  // Build connection once per token
  useEffect(() => {
    if (!token) return
    let active = true

    const conn = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5218/hubs/chat', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.serverTimeoutInMilliseconds = 60000
    conn.keepAliveIntervalInMilliseconds = 15000

    // Backend sends SendAsync("ReceiveMessage", messageDto) — one object argument
    conn.on('ReceiveMessage', (msg: IncomingMessage) => {
      onMessageRef.current(msg)
    })

    conn
      .start()
      .then(() => {
        if (!active) return
        connectionRef.current = conn
      })
      .catch((err) => {
        if (active) console.error('[SignalR] connection failed:', err)
      })

    return () => {
      active = false
      connectionRef.current = null
      conn.stop().catch(() => {})
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Join a chat room (retries until connection is ready)
  const joinChat = useCallback((chatId: string) => {
    let cancelled = false
    let retryId: ReturnType<typeof setTimeout>

    const tryJoin = () => {
      if (cancelled) return
      const conn = connectionRef.current
      if (conn?.state === 'Connected') {
        conn.invoke('JoinChat', chatId).catch(console.error)
      } else {
        retryId = setTimeout(tryJoin, 300)
      }
    }

    tryJoin()
    return () => {
      cancelled = true
      clearTimeout(retryId)
    }
  }, [])

  const leaveChat = useCallback((chatId: string) => {
    connectionRef.current?.invoke('LeaveChat', chatId).catch(() => {})
  }, [])

  // Send via SignalR — throws if not connected so caller can fallback to REST
  const sendMessage = useCallback(async (chatId: string, content: string) => {
    const conn = connectionRef.current
    if (!conn || conn.state !== 'Connected') throw new Error('Not connected')
    await conn.invoke('SendMessage', chatId, content)
  }, [])

  return { joinChat, leaveChat, sendMessage }
}
