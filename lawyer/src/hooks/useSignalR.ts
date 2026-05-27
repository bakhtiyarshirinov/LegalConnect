import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '../store/authStore'

export function useSignalR(onMessage: (chatId: string, senderId: string, content: string, sentAt: string) => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/chat?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveMessage', (chatId: string, senderId: string, content: string, sentAt: string) => {
      onMessage(chatId, senderId, content, sentAt)
    })

    connection
      .start()
      .catch((err) => console.error('SignalR connection error:', err))

    connectionRef.current = connection

    return () => {
      connection.stop()
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const joinChat = useCallback(async (chatId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('JoinChat', chatId)
    }
  }, [])

  const leaveChat = useCallback(async (chatId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('LeaveChat', chatId)
    }
  }, [])

  return { joinChat, leaveChat }
}
