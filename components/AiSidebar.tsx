"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { useAction } from 'convex/react'
import { Bot, Loader2, Send, User, ChevronDown } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
}

const SUGGESTIONS = [
  'Book appointment',
  'My appointments',
  'Find doctor by specialty',
  'Hospital hours',
]

function AIChatSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your HealWell assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sendMessage = useAction(api.actions.chat)

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
        { role: "assistant", content: "I'm having trouble connecting. Please try again.", timestamp: now }
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

  return (
    <>
      {/* Floating chatbot button with pulse */}
      <Button
        onClick={() => setIsOpen(true)}
        className="chatbot-pulse fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <Bot className="w-7 h-7 text-white" />
      </Button>

      {/* Chat sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-100 sm:w-120 flex flex-col border-l border-border bg-background/95 backdrop-blur-lg p-0">
          <SheetHeader className="px-5 py-4 border-b border-border bg-linear-to-r from-primary/5 to-transparent">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">HealWell AI</div>
                <div className="text-xs text-primary font-normal">Online</div>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
                  <div className={cn("max-w-[78%] space-y-1", m.role === "user" && "items-end flex flex-col")}>
                    <div
                      className={cn(
                        "px-4 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-white rounded-2xl rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none"
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
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                    <span className="typing-dot w-2 h-2 bg-primary rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-primary rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-primary rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Suggestions */}
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-colors border border-primary/20"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 border-border focus:border-primary"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90 text-white shrink-0"
              size="icon"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default AIChatSidebar
