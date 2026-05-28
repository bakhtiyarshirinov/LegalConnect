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

  // Keep refs up to date so handlers never go stale without rebuilding the connection
  const onReceiveRef = useRef(onReceiveMessage)
  const onReadRef = useRef(onMessagesRead)
  useEffect(() => { onReceiveRef.current = onReceiveMessage }, [onReceiveMessage])
  useEffect(() => { onReadRef.current = onMessagesRead }, [onMessagesRead])

  useEffect(() => {
    if (!token) return

    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5218/hubs/chat', {
        accessTokenFactory: () => token ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Error)
      .build()

    // Stable wrappers — always call the latest callback ref
    connection.on('ReceiveMessage', (msg: MessageDto) => {
      onReceiveRef.current?.(msg)
    })
    connection.on('MessagesRead', (data: { chatId: string; readBy: string }) => {
      onReadRef.current?.(data)
    })

    // Re-join the chat after an automatic reconnect
    connection.onreconnected(async () => {
      if (chatId) {
        await connection.invoke('JoinChat', chatId).catch(console.error)
      }
    })

    connection
      .start()
      .then(async () => {
        connectionRef.current = connection
        if (chatId) {
          await connection.invoke('JoinChat', chatId).catch(console.error)
        }
      })
      .catch(console.error)

    return () => {
      connectionRef.current = null
      if (connection.state === 'Connected' && chatId) {
        connection.invoke('LeaveChat', chatId).catch(() => {})
      }
      connection.stop().catch(() => {})
    }
  }, [token, chatId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (cid: string, content: string) => {
    const conn = connectionRef.current
    if (conn && conn.state === 'Connected') {
      await conn.invoke('SendMessage', cid, content)
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
