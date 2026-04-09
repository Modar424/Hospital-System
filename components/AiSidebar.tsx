"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useAction } from 'convex/react'
import { Bot, Loader2, Send, User, X } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
}

function AIChatSidebar() {
  const { t, lang } = useI18n()

  const SUGGESTIONS = [
    t('chat_suggestion_appointments'),
    t('chat_suggestion_doctor'),
    t('chat_suggestion_hours'),
    lang === 'ar' ? 'ما هي الأدوية المتوفرة الآن؟' : 'What medications are available?',
  ]

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t('chat_greeting'),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [width, setWidth] = useState(480)
  const [isResizing, setIsResizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sendMessage = useAction(api.actions.chat)

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('aiSidebarWidth')
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10))
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = window.innerWidth - e.clientX
      if (newWidth > 300 && newWidth < 900) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (containerRef.current) {
        localStorage.setItem('aiSidebarWidth', width.toString())
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, width])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (text?: string) => {
    const msg = text || input
    if (!msg.trim()) return

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const newMessages: Message[] = [...messages, { role: "user", content: msg, timestamp: now }]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const history = newMessages.map((m) => ({ role: m.role, content: m.content }))
      const response = await sendMessage({ message: msg, conversationHistory: history })

      if (response) {
        const respTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: respTime }])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t('chat_error_connection'), timestamp: now }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          className="chatbot-pulse fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <Bot className="w-7 h-7 text-white" />
        </Button>
      </>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="chatbot-pulse fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 z-40"
        size="icon"
      >
        <Bot className="w-7 h-7 text-white" />
      </Button>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end transition-all duration-300">
        <div
          ref={containerRef}
          style={{ width: `${width}px` }}
          className="h-full flex flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right-96 duration-300"
        >
          <div
            onMouseDown={() => setIsResizing(true)}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-primary/0 hover:bg-primary/50 cursor-col-resize transition-all duration-200",
              isResizing && "bg-primary"
            )}
            title="Drag to resize"
          />

          <div className="px-5 py-4 border-b border-border bg-linear-to-r from-primary/5 via-primary/2 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t('chat_title')}</div>
                <div className="text-xs text-primary font-normal">{t('chat_online')}</div>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background/50">
            <div className="px-4 py-4 space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2 text-sm animate-in fade-in", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role !== "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={cn("max-w-[75%] space-y-1", m.role === "user" && "items-end flex flex-col")}>
                    <div
                      className={cn(
                        "px-4 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-white rounded-2xl rounded-tr-none shadow-md"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none shadow-sm"
                      )}
                    >
                      {m.content}
                    </div>
                    {m.timestamp && (
                      <span className="text-[10px] text-muted-foreground px-1">{m.timestamp}</span>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
                    <span className="typing-dot w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="typing-dot w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="typing-dot w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          <div className="px-4 py-3 border-t border-border flex gap-2 flex-wrap bg-background/50">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-colors border border-primary/20 hover:border-primary"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-border flex gap-2 bg-background">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat_input_placeholder')}
              className="flex-1 border-border focus:border-primary rounded-full"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90 text-white shrink-0 rounded-full"
              size="icon"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIChatSidebar
