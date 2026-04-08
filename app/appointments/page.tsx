"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, User, Stethoscope, AlertCircle,
  CheckCircle2, XCircle, Hourglass, PlusCircle, MapPin, FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

const statusConfig = {
  pending: {
    label: 'Pending',
    labelAr: 'قيد الانتظار',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    icon: Hourglass,
    dot: 'bg-amber-400',
    glow: 'shadow-amber-100 dark:shadow-amber-950',
  },
  confirmed: {
    label: 'Confirmed',
    labelAr: 'مؤكد',
    className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
    icon: CheckCircle2,
    dot: 'bg-teal-400',
    glow: 'shadow-teal-100 dark:shadow-teal-950',
  },
  completed: {
    label: 'Completed',
    labelAr: 'مكتمل',
    className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
    icon: CheckCircle2,
    dot: 'bg-slate-400',
    glow: '',
  },
  cancelled: {
    label: 'Cancelled',
    labelAr: 'ملغى',
    className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    icon: XCircle,
    dot: 'bg-red-400',
    glow: '',
  },
} as const

function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr)
  return d.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AppointmentsPage() {
  const appointments = useQuery(api.appointments.myAppointments)
  const updateStatus = useMutation(api.appointments.updateStatus)
  const [cancelId, setCancelId] = useState<Id<"appointments"> | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const { lang } = useI18n()

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await updateStatus({ appointmentId: cancelId, status: 'cancelled' })
      toast.success(lang === 'ar' ? 'تم إلغاء الموعد' : 'Appointment cancelled')
      setCancelId(null)
    } catch {
      toast.error(lang === 'ar' ? 'فشل الإلغاء' : 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  const filtered = appointments?.filter(a => filter === 'all' || a.status === filter)

  const counts = {
    all: appointments?.length ?? 0,
    pending: appointments?.filter(a => a.status === 'pending').length ?? 0,
    confirmed: appointments?.filter(a => a.status === 'confirmed').length ?? 0,
    completed: appointments?.filter(a => a.status === 'completed').length ?? 0,
    cancelled: appointments?.filter(a => a.status === 'cancelled').length ?? 0,
  }

  const tabs: { key: typeof filter; label: string; labelAr: string }[] = [
    { key: 'all',       label: 'All',       labelAr: 'الكل' },
    { key: 'pending',   label: 'Pending',   labelAr: 'انتظار' },
    { key: 'confirmed', label: 'Confirmed', labelAr: 'مؤكدة' },
    { key: 'completed', label: 'Completed', labelAr: 'مكتملة' },
    { key: 'cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-300/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4"
          >
            {lang === 'ar' ? 'لوحة المواعيد' : 'My Dashboard'}
          </motion.span>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {lang === 'ar' ? 'مواعيدي' : 'My Appointments'}
              </h1>
              <p className="text-muted-foreground">
                {lang === 'ar' ? 'تتبّع وأدر مواعيدك القادمة والسابقة' : 'Track and manage your upcoming and past appointments'}
              </p>
            </div>
            <Link href="/all-doctors">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full gap-2 shadow-lg shadow-primary/20">
                  <PlusCircle className="w-4 h-4" />
                  {lang === 'ar' ? 'حجز جديد' : 'New Booking'}
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Stats strip */}
        {appointments && appointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            {[
              { label: lang === 'ar' ? 'إجمالي' : 'Total', value: counts.all, color: 'text-foreground', bg: 'bg-card' },
              { label: lang === 'ar' ? 'انتظار' : 'Pending', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { label: lang === 'ar' ? 'مؤكدة' : 'Confirmed', value: counts.confirmed, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
              { label: lang === 'ar' ? 'مكتملة' : 'Completed', value: counts.completed, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/30' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className={`${s.bg} border border-border rounded-2xl p-4 text-center`}
              >
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Filter tabs */}
        {appointments && appointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-2 flex-wrap mb-6"
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  filter === tab.key
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.label}
                {tab.key !== 'all' && counts[tab.key] > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Content */}
        {appointments === undefined ? (
          <div className="grid gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10"
            >
              <Calendar className="w-12 h-12 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">
              {lang === 'ar' ? 'لا توجد مواعيد بعد' : 'No appointments yet'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {lang === 'ar'
                ? 'احجز موعدك الأول مع أحد أطبائنا المتخصصين'
                : 'Book your first appointment with one of our expert doctors'}
            </p>
            <Link href="/all-doctors">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 shadow-lg shadow-primary/20">
                {lang === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
              </Button>
            </Link>
          </motion.div>
        ) : filtered?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            {lang === 'ar' ? 'لا توجد مواعيد في هذه الفئة' : 'No appointments in this category'}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-4">
              {filtered?.map((apt, i) => {
                const cfg = statusConfig[apt.status as keyof typeof statusConfig]
                const StatusIcon = cfg?.icon ?? Stethoscope
                const canCancel = apt.status === 'pending' || apt.status === 'confirmed'

                return (
                  <motion.div
                    key={apt._id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.96 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    whileHover={{ y: -2 }}
                    className={`bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 ${cfg?.glow ? `hover:shadow-lg` : ''}`}
                  >
                    {/* Status accent bar */}
                    <div className={`h-1 w-full ${cfg?.dot ?? 'bg-muted'}`} />

                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Doctor avatar */}
                        <motion.div
                          whileHover={{ scale: 1.08, rotate: 3 }}
                          className="w-14 h-14 bg-gradient-to-br from-primary/20 to-teal-100 dark:to-teal-900/40 rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-primary/10"
                        >
                          <Stethoscope className="w-7 h-7 text-primary" />
                        </motion.div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="font-bold text-base text-foreground truncate">
                            {apt.doctor?.name ?? (lang === 'ar' ? 'طبيب سيُحدد' : 'Doctor TBD')}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                              <span>{apt.department}</span>
                            </div>
                            {apt.doctor?.location && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                <span className="truncate">{apt.doctor.location}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span>{formatDate(apt.date, lang)}</span>
                          </div>

                          {apt.notes && (
                            <div className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1 bg-muted/50 rounded-lg px-2.5 py-1.5 max-w-xs">
                              <FileText className="w-3 h-3 text-primary/60 shrink-0 mt-0.5" />
                              <span className="truncate">{apt.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg?.className ?? ''}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {lang === 'ar' ? cfg?.labelAr : cfg?.label ?? apt.status}
                        </div>

                        {canCancel && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setCancelId(apt._id)}
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900 transition-colors font-medium"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCancelId(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-5"
              >
                <AlertCircle className="w-8 h-8 text-red-500" />
              </motion.div>

              <h3 className="font-bold text-xl text-center mb-2">
                {lang === 'ar' ? 'إلغاء الموعد؟' : 'Cancel Appointment?'}
              </h3>
              <p className="text-muted-foreground text-sm text-center mb-7 leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متأكد من إلغاء هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to cancel this appointment? This action cannot be undone.'}
              </p>

              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button variant="outline" className="w-full rounded-full" onClick={() => setCancelId(null)}>
                    {lang === 'ar' ? 'احتفظ به' : 'Keep it'}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/20"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling
                      ? (lang === 'ar' ? 'جارٍ...' : 'Cancelling...')
                      : (lang === 'ar' ? 'نعم، إلغاء' : 'Yes, Cancel')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
