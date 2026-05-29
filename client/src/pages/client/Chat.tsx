import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Send, MessageSquare, Paperclip, FileText, Download } from 'lucide-react'
import { chatsApi, type MessageDto } from '../../api/chats'
import { filesApi } from '../../api/files'
import { useAuthStore } from '../../store/authStore'
import { useSignalR } from '../../hooks/useSignalR'
import { Skeleton } from '../../components/ui/Skeleton'

const BACKEND = 'http://localhost:5218'
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

function isImage(url: string) {
  const ext = url.split('.').pop()?.toLowerCase()
  return ext ? IMAGE_EXTS.has('.' + ext) : false
}

function fileName(url: string) {
  return url.split('/').pop() ?? url
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const pageVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function FileMessage({ url, isOwn }: { url: string; isOwn: boolean }) {
  const fullUrl = url.startsWith('http') ? url : `${BACKEND}${url}`
  if (isImage(url)) {
    return (
      <a href={fullUrl} target="_blank" rel="noreferrer">
        <img
          src={fullUrl}
          alt="attachment"
          style={{
            maxWidth: 220, maxHeight: 200, borderRadius: 8,
            display: 'block', objectFit: 'cover', cursor: 'pointer',
          }}
        />
      </a>
    )
  }
  return (
    <a
      href={fullUrl}
      download
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        color: isOwn ? '#FFFFFF' : '#0A0A0A', textDecoration: 'none',
      }}
    >
      <FileText size={18} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>
        {fileName(url)}
      </span>
      <Download size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
    </a>
  )
}

export default function Chat() {
  const user = useAuthStore((s) => s.user)!
  const userId = user.userId
  const qc = useQueryClient()
  const location = useLocation()
  const initialChatId = (location.state as { chatId?: string } | null)?.chatId ?? null

  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Chats list ──────────────────────────────────────────────────────────────
  const { data: chats = [], isLoading: loadingChats } = useQuery({
    queryKey: ['chats', userId],
    queryFn: () => chatsApi.getAll(userId),
    enabled: !!userId,
    refetchOnMount: 'always',
  })

  // ── Load messages on chat switch ────────────────────────────────────────────
  useEffect(() => {
    if (!activeChatId) { setMessages([]); return }
    let cancelled = false
    setMessages([])
    setLoadingMessages(true)
    chatsApi.getMessages(activeChatId)
      .then((data) => { if (!cancelled) setMessages(data) })
      .catch(() => { if (!cancelled) toast.error('Failed to load messages') })
      .finally(() => { if (!cancelled) setLoadingMessages(false) })
    return () => { cancelled = true }
  }, [activeChatId])

  // ── SignalR ─────────────────────────────────────────────────────────────────
  const handleMessage = useCallback((msg: MessageDto) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
    qc.invalidateQueries({ queryKey: ['chats', userId] })
  }, [qc, userId])

  const { sendMessage } = useSignalR({ chatId: activeChatId, onMessage: handleMessage })

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send text ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || !activeChatId || sending) return
    setInput('')
    setSending(true)
    try {
      await sendMessage(activeChatId, text, 'Text')
      qc.invalidateQueries({ queryKey: ['chats', userId] })
    } catch {
      try {
        const msg = await chatsApi.sendMessage(activeChatId, userId, text)
        setMessages((prev) => [...prev, msg])
        qc.invalidateQueries({ queryKey: ['chats', userId] })
      } catch (err: unknown) {
        toast.error((err as Error)?.message ?? 'Failed to send')
        setInput(text)
      }
    } finally {
      setSending(false)
    }
  }

  // ── Upload file ─────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeChatId) return
    e.target.value = ''

    setUploading(true)
    try {
      const { url, mimeType } = await filesApi.upload(file)
      const msgType = mimeType.startsWith('image/') ? 'Image' : 'File'
      try {
        await sendMessage(activeChatId, url, msgType)
        qc.invalidateQueries({ queryKey: ['chats', userId] })
      } catch {
        const msg = await chatsApi.sendMessage(activeChatId, userId, url)
        setMessages((prev) => [...prev, { ...msg, type: msgType }])
        qc.invalidateQueries({ queryKey: ['chats', userId] })
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const activeChat = chats.find((c) => c.id === activeChatId)
  const canSend = input.trim().length > 0 && !sending

  return (
    <motion.div
      initial="hidden" animate="visible" variants={pageVariant}
      style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#F5F5F5' }}
    >
      {/* Chats sidebar */}
      <div style={{
        width: 280, borderRight: '1px solid #E8E8E8', background: '#FFFFFF',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #E8E8E8' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A' }}>Messages</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loadingChats ? (
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={64} borderRadius={10} />)}
            </div>
          ) : chats.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#A3A3A3' }}>
              <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>No chats yet</p>
            </div>
          ) : chats.map((chat) => {
            const isActive = chat.id === activeChatId
            const name = (user.role === 'Client' ? chat.lawyerFullName : chat.clientFullName) ?? ''
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: isActive ? '#F5F5F5' : 'transparent',
                  border: isActive ? '1px solid #E8E8E8' : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                  transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#F5F5F5' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, background: '#0A0A0A', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {name[0] ?? '?'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </div>
                    {chat.lastMessageAt && (
                      <div style={{ fontSize: 11, color: '#A3A3A3', marginTop: 2 }}>
                        {formatTime(chat.lastMessageAt)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeChatId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#A3A3A3' }}>
            <MessageSquare size={48} style={{ opacity: 0.3 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#6B6B6B' }}>Select a chat</h3>
            <p style={{ fontSize: 14 }}>Choose a conversation from the sidebar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #E8E8E8',
              background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, background: '#0A0A0A', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {(user.role === 'Client' ? activeChat?.lawyerFullName : activeChat?.clientFullName)?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>
                  {user.role === 'Client' ? activeChat?.lawyerFullName : activeChat?.clientFullName}
                </div>
                <div style={{ fontSize: 12, color: '#6B6B6B' }}>
                  {user.role === 'Client' ? 'Lawyer' : 'Client'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={40} borderRadius={12}
                      width={i % 2 === 0 ? '60%' : '40%'}
                      style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end' }}
                    />
                  ))}
                </div>
              ) : messages.map((msg) => {
                const isOwn = msg.senderId === userId
                const isFile = msg.type === 'File' || msg.type === 'Image'
                return (
                  <div key={msg.id} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: isFile && isImage(msg.content) ? 240 : '65%',
                      padding: isFile && isImage(msg.content) ? 4 : '10px 14px',
                      background: isOwn ? '#0A0A0A' : '#FFFFFF',
                      color: isOwn ? '#FFFFFF' : '#0A0A0A',
                      border: isOwn ? '1px solid #0A0A0A' : '1px solid #E8E8E8',
                      borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 14, lineHeight: 1.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      {isFile
                        ? <FileMessage url={msg.content} isOwn={isOwn} />
                        : msg.content
                      }
                    </div>
                    <span style={{ fontSize: 11, color: '#A3A3A3', marginTop: 4 }}>
                      {formatTime(msg.sentAt)}
                    </span>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '14px 20px', borderTop: '1px solid #E8E8E8',
              background: '#FFFFFF', display: 'flex', gap: 8, alignItems: 'center',
            }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Paperclip button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Attach file"
                style={{
                  width: 38, height: 38, borderRadius: 10, border: '1px solid #E8E8E8',
                  background: '#F5F5F5', cursor: uploading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, opacity: uploading ? 0.5 : 1, transition: 'all 0.15s',
                }}
              >
                <Paperclip size={16} color="#6B6B6B" />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={uploading ? 'Uploading file…' : 'Type a message…'}
                disabled={uploading}
                style={{
                  flex: 1, border: '1px solid #E8E8E8', borderRadius: 12,
                  padding: '11px 16px', fontSize: 14, outline: 'none',
                  fontFamily: 'Inter, sans-serif', background: '#F5F5F5', color: '#0A0A0A',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E8E8' }}
              />

              <button
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: 'none',
                  background: canSend ? '#0A0A0A' : '#E8E8E8',
                  color: canSend ? '#FFFFFF' : '#A3A3A3',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
