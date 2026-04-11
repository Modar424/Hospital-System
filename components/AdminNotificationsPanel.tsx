"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, FileText, DollarSign,
  Eye, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AdminNotification {
  _id: Id<"notifications">
  _creationTime: number
  fromUserId: string
  toUserId: string
  type: "financial_report" | "admin_report_notification" | string
  message: string
  isRead: boolean
  scheduledAt?: number
}

interface AdminNotificationsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminNotificationsPanel({ isOpen, onClose }: AdminNotificationsProps) {
  const allNotifications = useQuery(api.adminNotifications.getAdminNotifications) as AdminNotification[] | undefined
  const markAsRead = useMutation(api.adminNotifications.markAdminNotificationAsRead)

  const [expandedId, setExpandedId] = useState<Id<"notifications"> | null>(null)

  // Filter only financial reports
  const notifications = allNotifications?.filter(n => n.type === "financial_report")
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0

  const handleMarkAsRead = async (notifId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId: notifId })
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  const getIcon = (type: string) => {
    if (type === "financial_report") {
      return <DollarSign className="w-5 h-5 text-green-600" />
    }
    return <FileText className="w-5 h-5 text-blue-600" />
  }

  const getTypeLabel = (type: string) => {
    if (type === "financial_report") {
      return "تقرير مالي"
    }
    return "تقرير طبي"
  }

  const getTypeColor = (type: string) => {
    if (type === "financial_report") {
      return "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800"
    }
    return "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
  }

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
          <div className="sticky top-0 bg-linear-to-r from-slate-900 to-slate-800 text-white p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">الفواتير المالية</h2>
                <p className="text-sm text-slate-300">
                  {unreadCount ? `${unreadCount} فاتورة جديدة` : "لا توجد فواتير جديدة"}
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
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all cursor-pointer",
                    notif.isRead
                      ? "bg-muted/50 border-border"
                      : `${getTypeColor(notif.type)}`
                  )}
                  onClick={() =>
                    setExpandedId(expandedId === notif._id ? null : notif._id)
                  }
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {getTypeLabel(notif.type)}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif._creationTime).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!notif.isRead) {
                          handleMarkAsRead(notif._id)
                        }
                      }}
                    >
                      {notif.isRead ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded View */}
                  <AnimatePresence>
                    {expandedId === notif._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/50"
                      >
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {notif.message}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">لا توجد إشعارات</h3>
                <p className="text-sm text-muted-foreground">
                  جميع الإشعارات المالية والتقارير ستظهر هنا
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-muted/50 border-t border-border p-4 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              إغلاق
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
