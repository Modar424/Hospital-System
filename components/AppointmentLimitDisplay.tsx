"use client"

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion } from 'framer-motion'
import {
  AlertCircle, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface AppointmentLimitDisplayProps {
  patientId: Id<"patients">
  onLimitReached?: () => void
}

export default function AppointmentLimitDisplay({
  const { lang } = useI18n() 
  patientId, 
  onLimitReached 
}: AppointmentLimitDisplayProps) {
  const limitStatus = useQuery(api.appointmentLimits.canBookAppointment, { patientId })
  const activeAppointments = useQuery(api.appointmentLimits.getActiveAppointments, { patientId })

  if (!limitStatus) return null

  const percentage = (limitStatus.currentCount / limitStatus.maxAllowed) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        limitStatus.canBook
          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
          : "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {limitStatus.canBook ? (
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "font-semibold mb-2",
            limitStatus.canBook ? "text-blue-900" : "text-red-900"
          )}>
            {limitStatus.canBook ? "يمكنك حجز موعد جديد" : "لقد وصلت للحد الأقصى"}
          </h3>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-sm font-medium",
                limitStatus.canBook ? "text-blue-700" : "text-red-700"
              )}>
                الحجوزات النشطة
              </span>
              <span className={cn(
                "text-sm font-bold",
                limitStatus.canBook ? "text-blue-700" : "text-red-700"
              )}>
                {limitStatus.currentCount}/{limitStatus.maxAllowed}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full transition-all",
                  percentage <= 66
                    ? "bg-green-500"
                    : percentage <= 100
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
              />
            </div>
          </div>

          {/* Status Message */}
          <p className={cn(
            "text-sm mb-3",
            limitStatus.canBook ? "text-blue-700" : "text-red-700"
          )}>
            {limitStatus.canBook
              ? `لديك ${limitStatus.remaining} مقاعد متاحة للحجز`
              : "يرجى إلغاء أحد الحجوزات أو انتظار اكتمال موعد لحجز موعد جديد"}
          </p>

          {/* Active Appointments */}
          {activeAppointments && activeAppointments.length > 0 && (
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold mb-2 text-foreground/70">{lang === 'ar' ? 'الحجوزات النشطة:' : 'Active Bookings:'}</p>
              <div className="space-y-2">
                {activeAppointments.slice(0, 3).map((apt: any) => (
                  <div key={apt._id} className="flex items-start gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        {apt.doctor?.name || "طبيب"}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(apt.date).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!limitStatus.canBook && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={() => onLimitReached?.()}
              >
                عرض الحجوزات
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
