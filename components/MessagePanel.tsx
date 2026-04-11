"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MessageSquare, User, Send,
  Clock, Eye, EyeOff, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

interface Message {
  _id: Id<"notifications">
  _creationTime: number
  senderName: string
  senderEmail: string
  message: string
  isRead: boolean
}

interface MessagePanelProps {
  userRole: 'doctor' | 'secretary'
  isOpen: boolean
  onClose: () => void
}

export default function MessagePanel({ userRole, isOpen, onClose }: MessagePanelProps) {
  // Always call hooks in the same order regardless of userRole
  const doctorMessages = useQuery(api.doctorSecretaryMessages.getDoctorMessages)
  const secretaryMessages = useQuery(api.doctorSecretaryMessages.getSecretaryMessages)
  const doctorUnreadCount = useQuery(api.doctorSecretaryMessages.getDoctorUnreadMessageCount)
  const secretaryUnreadCount = useQuery(api.doctorSecretaryMessages.getSecretaryUnreadMessageCount)
  const allSecretaries = useQuery(api.doctorSecretaryMessages.getAllSecretaries)
  const allDoctors = useQuery(api.doctorSecretaryMessages.getAllDoctors)

  const messages = userRole === 'doctor' ? doctorMessages : secretaryMessages
  const unreadCount = userRole === 'doctor' ? doctorUnreadCount : secretaryUnreadCount
  const recipients = userRole === 'doctor' ? allSecretaries : allDoctors

  const markAsRead = useMutation(api.doctorSecretaryMessages.markMessageAsRead)
  const doctorSendMutation = useMutation(api.doctorSecretaryMessages.doctorSendToSecretary)
  const secretarySendMutation = useMutation(api.doctorSecretaryMessages.secretarySendToDoctor)

  const [expandedId, setExpandedId] = useState<Id<"notifications"> | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('')

  const handleMarkAsRead = async (msgId: Id<"notifications">) => {
    try {
      await markAsRead({ messageId: msgId })
    } catch  {
      toast.error("Failed to mark as read")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('الرجاء كتابة رسالة')
      return
    }

    if (!selectedRecipientId) {
      toast.error('الرجاء اختيار مستقبل الرسالة')
      return
    }

    setIsSending(true)
    try {
      if (userRole === 'doctor') {
        await doctorSendMutation({
          toSecretaryUserId: selectedRecipientId as Id<"patients">,
          message: newMessage,
        })
      } else {
        await secretarySendMutation({
          toDoctorUserId: selectedRecipientId as Id<"patients">,
          message: newMessage,
        })
      }
      setNewMessage('')
      toast.success('تم إرسال الرسالة!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل إرسال الرسالة')
    } finally {
      setIsSending(false)
    }
  }

  const panelTitle = userRole === 'doctor'
    ? 'رسائل من السكرتيرات'
    : 'رسائل من الأطباء'

  const emptyMessage = userRole === 'doctor'
    ? 'لا توجد رسائل من السكرتيرات'
    : 'لا توجد رسائل من الأطباء'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="bg-card rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-border flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-linear-to-r from-violet-600 to-purple-600 text-white p-6 border-b border-purple-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{panelTitle}</h2>
                <p className="text-sm text-purple-200">
                  {unreadCount ? `${unreadCount} رسائل جديدة` : "لا توجد رسائل جديدة"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {messages && messages.length > 0 ? (
              messages.map((msg: Message) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    msg.isRead
                      ? 'bg-muted/50 border-border'
                      : 'bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800'
                  }`}
                  onClick={() =>
                    setExpandedId(expandedId === msg._id ? null : msg._id)
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {msg.senderName}
                        </span>
                        {!msg.isRead && (
                          <span className="w-2 h-2 bg-violet-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {msg.senderEmail}
                      </p>
                      <p className="text-sm text-foreground/80 line-clamp-2">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg._creationTime).toLocaleDateString("ar-SA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!msg.isRead) {
                          handleMarkAsRead(msg._id)
                        }
                      }}
                    >
                      {msg.isRead ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-violet-600" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded View */}
                  <AnimatePresence>
                    {expandedId === msg._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/50"
                      >
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{emptyMessage}</h3>
                <p className="text-sm text-muted-foreground">
                  الرسائل الجديدة ستظهر هنا
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-muted/50 border-t border-border p-4 space-y-3">
            {/* Select Recipient */}
            {recipients && recipients.length > 0 && (
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                disabled={isSending}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-600/30 disabled:opacity-50 text-sm"
              >
                <option value="">
                  {userRole === 'doctor' ? 'اختر سكرتيرة...' : 'اختر دكتور...'}
                </option>
                {recipients.map((recipient) => (
                  <option key={recipient._id} value={recipient._id}>
                    {recipient.name} ({recipient.email})
                  </option>
                ))}
              </select>
            )}

            {/* Send Message Area */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={userRole === 'doctor' ? 'اكتب رسالة للسكرتاري...' : 'اكتب رسالة للدكتور...'}
                  disabled={isSending}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-600/30 disabled:opacity-50 text-sm"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim() || !selectedRecipientId}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2.5 flex items-center gap-2 transition-all"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? 'جاري...' : 'إرسال'}
              </Button>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                className="rounded-full"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}