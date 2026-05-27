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

  useEffect(() => {
    if (!token) return

    const connection = new HubConnectionBuilder()
      .withUrl(`/hubs/chat?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Error)
      .build()

    if (onReceiveMessage) {
      connection.on('ReceiveMessage', onReceiveMessage)
    }
    if (onMessagesRead) {
      connection.on('MessagesRead', onMessagesRead)
    }

    connection
      .start()
      .then(async () => {
        connectionRef.current = connection
        if (chatId) {
          await connection.invoke('JoinChat', chatId)
        }
      })
      .catch(console.error)

    return () => {
      if (chatId && connection.state === 'Connected') {
        connection.invoke('LeaveChat', chatId).catch(() => {})
      }
      connection.stop()
    }
  }, [token, chatId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { sendMessage, markAsRead }
}
