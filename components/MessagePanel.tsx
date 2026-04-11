"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MessageSquare, Send, Loader2, Trash2, RotateCcw, Inbox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  _id: Id<"notifications">
  _creationTime: number
  senderName: string
  senderEmail: string
  message: string
  isRead: boolean
  isDeleted?: boolean
}

interface MessagePanelProps {
  userRole: 'doctor' | 'secretary'
  isOpen: boolean
  onClose: () => void
}

export default function MessagePanel({ userRole, isOpen, onClose }: MessagePanelProps) {
  const doctorMessages = useQuery(api.doctorSecretaryMessages.getDoctorMessages)
  const secretaryMessages = useQuery(api.doctorSecretaryMessages.getSecretaryMessages)
  const doctorUnreadCount = useQuery(api.doctorSecretaryMessages.getDoctorUnreadMessageCount)
  const secretaryUnreadCount = useQuery(api.doctorSecretaryMessages.getSecretaryUnreadMessageCount)
  const allSecretaries = useQuery(api.doctorSecretaryMessages.getAllSecretaries)
  const allDoctors = useQuery(api.doctorSecretaryMessages.getAllDoctors)
  const myTrash = useQuery(api.trash.getMyTrash) as Message[] | undefined

  const allMessages = userRole === 'doctor' ? doctorMessages : secretaryMessages
  const unreadCount = userRole === 'doctor' ? doctorUnreadCount : secretaryUnreadCount
  const recipients = userRole === 'doctor' ? allSecretaries : allDoctors

  const markAsRead = useMutation(api.doctorSecretaryMessages.markMessageAsRead)
  const doctorSendMutation = useMutation(api.doctorSecretaryMessages.doctorSendToSecretary)
  const secretarySendMutation = useMutation(api.doctorSecretaryMessages.secretarySendToDoctor)
  const deleteNotif = useMutation(api.trash.deleteNotification)
  const restoreNotif = useMutation(api.trash.restoreNotification)
  const permanentDelete = useMutation(api.trash.permanentDeleteNotification)

  const [activeTab, setActiveTab] = useState<'inbox' | 'trash'>('inbox')
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('')

  const messages = (allMessages as Message[] | undefined)?.filter(m => !m.isDeleted)
  const trashMessages = myTrash?.filter(m => {
    const msgTypes = ['secretary_message_to_doctor', 'doctor_message_to_secretary',
      'doctor_to_secretary_message', 'secretary_to_doctor_message']
    return true // show all trash for this user
  })
  const trashCount = trashMessages?.length ?? 0

  const handleMarkAsRead = async (msgId: Id<"notifications">) => {
    try { await markAsRead({ messageId: msgId }) }
    catch { toast.error("Failed to mark as read") }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) { toast.error('الرجاء كتابة رسالة'); return }
    if (!selectedRecipientId) { toast.error('الرجاء اختيار مستقبل الرسالة'); return }
    setIsSending(true)
    try {
      if (userRole === 'doctor') {
        await doctorSendMutation({ toSecretaryUserId: selectedRecipientId as Id<"patients">, message: newMessage })
      } else {
        await secretarySendMutation({ toDoctorUserId: selectedRecipientId as Id<"patients">, message: newMessage })
      }
      setNewMessage('')
      toast.success('تم إرسال الرسالة!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل إرسال الرسالة')
    } finally { setIsSending(false) }
  }

  const handleDelete = async (id: Id<"notifications">) => {
    try { await deleteNotif({ notificationId: id }); toast.success("نُقل إلى سلة المحذوفات") }
    catch { toast.error("فشل في الحذف") }
  }

  const handleRestore = async (id: Id<"notifications">) => {
    try { await restoreNotif({ notificationId: id }); toast.success("تمت الاستعادة") }
    catch { toast.error("فشل في الاستعادة") }
  }

  const handlePermanentDelete = async (id: Id<"notifications">) => {
    try { await permanentDelete({ notificationId: id }); toast.success("تم الحذف نهائياً") }
    catch { toast.error("فشل في الحذف") }
  }

  const panelTitle = userRole === 'doctor' ? 'رسائل السكرتيرة' : 'رسائل الأطباء'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="bg-card rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl border border-border flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-violet-600 to-purple-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base">{panelTitle}</h2>
                <p className="text-xs text-purple-200">
                  {activeTab === 'inbox'
                    ? (unreadCount ? `${unreadCount} جديدة` : "لا توجد رسائل جديدة")
                    : `${trashCount} في السلة`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/20">
            <button
              onClick={() => setActiveTab('inbox')}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors",
                activeTab === 'inbox' ? "border-b-2 border-violet-600 text-violet-600" : "text-muted-foreground hover:text-foreground")}
            >
              <Inbox className="w-3.5 h-3.5" />
              الرسائل
              {(unreadCount ?? 0) > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-violet-600 text-white rounded-full">{unreadCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors",
                activeTab === 'trash' ? "border-b-2 border-red-500 text-red-500" : "text-muted-foreground hover:text-foreground")}
            >
              <Trash2 className="w-3.5 h-3.5" />
              المحذوفات
              {trashCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded-full">{trashCount}</span>
              )}
            </button>
          </div>

          {/* Messages Area */}
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 bg-gradient-to-b from-violet-50/30 to-transparent dark:from-violet-950/10">
            {activeTab === 'inbox' ? (
              messages && messages.length > 0 ? (
                messages.map((msg: Message, i: number) => (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group flex items-end gap-2"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0 text-xs font-bold text-violet-600">
                      {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Bubble */}
                    <div className="flex-1 max-w-[85%]">
                      <div className={cn(
                        "rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm",
                        msg.isRead
                          ? "bg-card border border-border"
                          : "bg-violet-600 text-white"
                      )}>
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.senderName}</p>
                        <p className={cn("text-sm leading-relaxed", msg.isRead ? "text-foreground" : "text-white")}>
                          {msg.message}
                        </p>
                        <p className={cn("text-[10px] mt-1 text-right", msg.isRead ? "text-muted-foreground" : "text-white/60")}>
                          {new Date(msg._creationTime).toLocaleString("ar-SA", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!msg.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(msg._id)}
                          className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center hover:bg-violet-200 transition"
                          title="تعيين كمقروء"
                        >
                          <span className="text-[8px] text-violet-600 font-bold">✓</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg._id)}
                        className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center hover:bg-red-100 transition"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7 text-violet-400" />
                  </div>
                  <p className="font-medium text-foreground text-sm">
                    {userRole === 'doctor' ? 'لا توجد رسائل من السكرتيرات' : 'لا توجد رسائل من الأطباء'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">الرسائل الجديدة ستظهر هنا</p>
                </div>
              )
            ) : (
              trashMessages && trashMessages.length > 0 ? (
                trashMessages.map((msg: Message) => (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2 opacity-60"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                      {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-muted border border-dashed border-border">
                        <p className="text-xs font-semibold mb-0.5 text-muted-foreground">{msg.senderName}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleRestore(msg._id)}
                        className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition" title="استعادة">
                        <RotateCcw className="w-3 h-3 text-green-600" />
                      </button>
                      <button onClick={() => handlePermanentDelete(msg._id)}
                        className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition" title="حذف نهائي">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Trash2 className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground text-sm">سلة المحذوفات فارغة</p>
                </div>
              )
            )}
          </div>

          {/* Compose Area */}
          {activeTab === 'inbox' && (
            <div className="border-t border-border bg-card p-3 space-y-2.5">
              {recipients && recipients.length > 0 && (
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  disabled={isSending}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50 text-sm"
                >
                  <option value="">
                    {userRole === 'doctor' ? '← اختر سكرتيرة' : '← اختر دكتور'}
                  </option>
                  {recipients.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  placeholder={userRole === 'doctor' ? 'اكتب رسالة...' : 'اكتب رسالة...'}
                  rows={2}
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50 text-sm resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim() || !selectedRecipientId}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl h-10 w-10 p-0 shrink-0 shadow-lg shadow-violet-500/20"
                >
                  {isSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
