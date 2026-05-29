import { useEffect, useRef, useCallback } from 'react'
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'
import { useAuthStore } from '../store/authStore'
import type { MessageDto } from '../api/chats'

interface UseSignalROptions {
  chatId: string | null
  onMessage: (msg: MessageDto) => void
}

export function useSignalR({ chatId, onMessage }: UseSignalROptions) {
  const token = useAuthStore((s) => s.token)
  const connectionRef = useRef<HubConnection | null>(null)

  // Refs updated in render body — always current inside async callbacks
  const onMessageRef = useRef(onMessage)
  const chatIdRef = useRef(chatId)
  onMessageRef.current = onMessage
  chatIdRef.current = chatId

  // ── Build connection ONCE per token ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return

    // `active` prevents a stale .then() from winning the ref race in
    // React StrictMode (effects run twice: mount → cleanup → mount).
    // Without it, conn A's .then() can set connectionRef AFTER cleanup clears
    // it and conn B has already set it correctly.
    let active = true

    const conn = new HubConnectionBuilder()
      .withUrl('http://localhost:5218/hubs/chat', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    conn.serverTimeoutInMilliseconds = 60000
    conn.keepAliveIntervalInMilliseconds = 15000

    conn.on('ReceiveMessage', (msg: MessageDto) => {
      onMessageRef.current(msg)
    })

    conn.onreconnected(async () => {
      if (chatIdRef.current) {
        await conn.invoke('JoinChat', chatIdRef.current).catch(console.error)
      }
    })

    conn.start()
      .then(async () => {
        if (!active) return // cleanup already ran — don't touch the ref
        connectionRef.current = conn
        if (chatIdRef.current) {
          await conn.invoke('JoinChat', chatIdRef.current).catch(console.error)
        }
      })
      .catch((err) => {
        if (active) console.error('[SignalR] connection failed', err)
      })

    return () => {
      active = false
      connectionRef.current = null
      conn.stop().catch(() => {})
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join / leave room when chatId changes ────────────────────────────────────
  useEffect(() => {
    if (!chatId) return

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
      connectionRef.current?.invoke('LeaveChat', chatId).catch(() => {})
    }
  }, [chatId])

  // ── Send ─────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (cid: string, content: string, messageType = 'Text') => {
    const conn = connectionRef.current
    if (!conn || conn.state !== 'Connected') throw new Error('Not connected')
    await conn.invoke('SendMessage', cid, content, messageType)
  }, [])

  return { sendMessage }
}
