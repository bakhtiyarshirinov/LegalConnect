import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Send, MessageSquare, Search } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getChats, getMessages, sendMessage as sendMessageRest, type Chat, type Message } from '../api/chats'
import { useSignalR, type IncomingMessage } from '../hooks/useSignalR'
import { Skeleton } from '../components/ui/Skeleton'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatChatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  if (diff < 86400000) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Chat() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [chats, setChats] = useState<Chat[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const joinCleanupRef = useRef<(() => void) | null>(null)

  // Load chats list
  useEffect(() => {
    if (!user) return
    setChatsLoading(true)
    getChats(user.userId)
      .then(setChats)
      .catch(console.error)
      .finally(() => setChatsLoading(false))
  }, [user])

  // Load messages when chat changes
  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }
    let cancelled = false
    setMessages([])
    setLoadingMessages(true)
    getMessages(selectedChat.id)
      .then((data) => { if (!cancelled) setMessages(data) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingMessages(false) })
    return () => { cancelled = true }
  }, [selectedChat?.id])

  // SignalR: receive incoming messages
  const handleIncoming = useCallback((msg: IncomingMessage) => {
    // Server echoes sender's own message back — deduplicate by ID
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      const newMsg: Message = {
        id: msg.id,
        chatId: selectedChat?.id ?? '',
        senderId: msg.senderId,
        content: msg.content,
        sentAt: msg.sentAt,
      }
      return [...prev, newMsg]
    })
    // Refresh chat list to update lastMessageAt
    if (user) {
      getChats(user.userId).then(setChats).catch(() => {})
    }
  }, [selectedChat?.id, user])

  const { joinChat, leaveChat, sendMessage } = useSignalR(handleIncoming)

  // Join/leave room when selected chat changes
  useEffect(() => {
    if (joinCleanupRef.current) {
      joinCleanupRef.current()
      joinCleanupRef.current = null
    }
    if (!selectedChat) return

    const cleanup = joinChat(selectedChat.id)
    joinCleanupRef.current = cleanup ?? null

    return () => {
      leaveChat(selectedChat.id)
      if (joinCleanupRef.current) {
        joinCleanupRef.current()
        joinCleanupRef.current = null
      }
    }
  }, [selectedChat?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !selectedChat || !user) return
    const content = input.trim()
    setInput('')
    setSending(true)
    try {
      // Send via SignalR — server saves to DB and broadcasts to group including sender
      // handleIncoming will add the echo to state (with dedup)
      await sendMessage(selectedChat.id, content)
    } catch {
      // Fallback: REST API
      try {
        const msg = await sendMessageRest(selectedChat.id, user.userId, content)
        setMessages((prev) => [...prev, msg])
      } catch {
        setInput(content) // restore on failure
      }
    } finally {
      setSending(false)
    }
  }

  const filteredChats = chats.filter((c) =>
    (c.clientFullName?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()),
  )

  const canSend = input.trim().length > 0 && !sending

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Chat list sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: 280,
          borderRight: '1px solid #E8E8E8',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #F0F0F0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 12 }}>
            Messages
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#6B6B6B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
                border: '1px solid #E8E8E8', fontSize: 13, color: '#0A0A0A',
                outline: 'none', background: '#F5F5F5',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {chatsLoading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((k) => (
                <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Skeleton width={40} height={40} borderRadius="50%" />
                  <div style={{ flex: 1 }}>
                    <Skeleton height={14} style={{ marginBottom: 6 }} />
                    <Skeleton height={12} width="70%" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B6B6B', fontSize: 13 }}>
              No chats found
            </div>
          ) : filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              style={{
                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                background: selectedChat?.id === chat.id ? '#F5F5F5' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid #F5F5F5', transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (selectedChat?.id !== chat.id) e.currentTarget.style.background = '#FAFAFA'
              }}
              onMouseLeave={(e) => {
                if (selectedChat?.id !== chat.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#0A0A0A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
              }}>
                {chat.clientFullName?.[0] ?? '?'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
                    {chat.clientFullName}
                  </span>
                  <span style={{ fontSize: 11, color: '#6B6B6B' }}>
                    {formatChatTime(chat.lastMessageAt)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 24px', borderBottom: '1px solid #E8E8E8',
              background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: '#0A0A0A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#FFFFFF',
              }}>
                {selectedChat.clientFullName?.[0] ?? '?'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                  {selectedChat.clientFullName}
                </div>
                <div style={{ fontSize: 12, color: '#6B6B6B' }}>Client</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflow: 'auto', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map((k) => (
                    <Skeleton key={k} height={40} borderRadius={12}
                      width={k % 2 === 0 ? '55%' : '40%'}
                      style={{ alignSelf: k % 2 === 0 ? 'flex-start' : 'flex-end' }}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#6B6B6B', fontSize: 14, gap: 12,
                }}>
                  <MessageSquare size={32} color="#E8E8E8" />
                  <span>No messages yet. Start the conversation!</span>
                </div>
              ) : messages.map((msg) => {
                const isOwn = msg.senderId === user?.userId
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: '65%', padding: '10px 14px',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOwn ? '#0A0A0A' : '#F5F5F5',
                      color: isOwn ? '#FFFFFF' : '#0A0A0A',
                      fontSize: 14, lineHeight: 1.5,
                    }}>
                      <div>{msg.content}</div>
                      <div style={{
                        fontSize: 11, marginTop: 4, textAlign: 'right',
                        color: isOwn ? 'rgba(255,255,255,0.5)' : '#6B6B6B',
                      }}>
                        {formatTime(msg.sentAt)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #E8E8E8',
              background: '#FFFFFF', display: 'flex', gap: 12, alignItems: 'flex-end',
            }}>
              <input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 24,
                  border: '1px solid #E8E8E8', fontSize: 14, color: '#0A0A0A',
                  outline: 'none', background: '#F5F5F5',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: canSend ? '#0A0A0A' : '#E8E8E8',
                  border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                <Send size={16} color={canSend ? '#FFFFFF' : '#6B6B6B'} />
              </motion.button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16, color: '#6B6B6B',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#F5F5F5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={28} color="#C0C0C0" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>
                Select a conversation
              </p>
              <p style={{ fontSize: 13, color: '#6B6B6B' }}>
                Choose a chat from the list to start messaging
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
