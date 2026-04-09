"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CheckCircle2, XCircle, Clock, Stethoscope,
  User, FileText, Search, ClipboardList,
  Receipt, ChevronDown, ChevronUp,
  AlertCircle, Hourglass, TrendingUp, Trash2, X, Send
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────
type NavItem = 'appointments' | 'invoices' | 'reports' | 'patients'

// تعريف نوع الـ Status
type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface StatusConfig {
  label: string
  labelAr: string
  className: string
  icon: React.ComponentType<{ className?: string }>
  dot: string
}

const statusConfig: Record<AppointmentStatus, StatusConfig> = {
  pending: {
    label: 'Pending', labelAr: 'قيد الانتظار',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Hourglass, dot: 'bg-amber-400',
  },
  confirmed: {
    label: 'Confirmed', labelAr: 'مؤكد',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: CheckCircle2, dot: 'bg-teal-400',
  },
  completed: {
    label: 'Completed', labelAr: 'مكتمل',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: CheckCircle2, dot: 'bg-slate-400',
  },
  cancelled: {
    label: 'Cancelled', labelAr: 'ملغى',
    className: 'bg-red-50 text-red-600 border-red-200',
    icon: XCircle, dot: 'bg-red-400',
  },
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── Appointment Row ────────────────────────────────────────────────────────

// تعريف Interface للـ Patient و Doctor
interface PatientInfo {
  _id: string
  name: string
  email: string
}

interface DoctorInfo {
  _id: string
  name: string
}

interface Appointment {
  _id: Id<"appointments">  // استخدام Id من Convex بدلاً من any
  date: number
  status: AppointmentStatus
  patient?: PatientInfo
  doctor?: DoctorInfo
  department: string
  notes?: string
  hasInvoice?: boolean
  hasReport?: boolean
}

function AppointmentRow({
  apt,
  onConfirm,
  onCancel,
  onComplete,
  onDelete,
}: {
  apt: Appointment
  onConfirm: () => void
  onCancel: () => void
  onComplete: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig[apt.status]
  const StatusIcon = cfg?.icon ?? Stethoscope

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Color accent */}
      <div className={`h-1 w-full ${cfg?.dot ?? 'bg-muted'}`} />

      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Patient info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base truncate">
                  {apt.patient?.name ?? '—'}
                </span>
                {/* Has report badge */}
                {apt.hasReport ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                    <FileText className="w-3 h-3" /> ✓ تقرير
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                    <FileText className="w-3 h-3" /> — بلا تقرير
                  </span>
                )}
                {/* Has invoice badge */}
                {apt.hasInvoice ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                    <FileText className="w-3 h-3" /> فاتورة
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                    <FileText className="w-3 h-3" /> بلا فاتورة
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{apt.patient?.email}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-primary/60" />
                  {apt.doctor?.name ? `Dr. ${apt.doctor.name}` : apt.department}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary/60" />
                  {formatDate(apt.date)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: status + actions */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
            <Badge className={cn('text-xs border inline-flex items-center gap-1', cfg?.className)}>
              <StatusIcon className="w-3 h-3" />
              {cfg?.label ?? apt.status}
            </Badge>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              {apt.status === 'pending' && (
                <>
                  <button
                    onClick={onConfirm}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}
              {apt.status === 'confirmed' && (
                <>
                  <button
                    onClick={onComplete}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Done
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}
              {apt.status === 'cancelled' && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium"
                >
                  <XCircle className="w-3.5 h-3.5" /> حذف
                </button>
              )}
            </div>
          </div>
        </div>
        {apt.notes && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Hide notes' : 'View notes'}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>{apt.notes}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Cancel Appointment Modal (for Secretary) ───────────────────────────────
function CancelAppointmentModal({ appointment, onClose }: { 
  appointment: Appointment; 
  onClose: () => void;
}) {
  const cancelAppt = useMutation(api.appointments.cancelAppointmentWithNotification)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCancel = async () => {
    if (!reason.trim()) { 
      toast.error('Please enter cancellation reason'); 
      return; 
    }
    setSubmitting(true)
    try {
      await cancelAppt({ appointmentId: appointment._id, reason: reason.trim() })
      toast.success('Appointment cancelled successfully')
      onClose()
    } catch (e) { 
      toast.error(e instanceof Error ? e.message : 'Failed to cancel') 
    } finally { 
      setSubmitting(false) 
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-card rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Cancel Appointment</h3>
              <p className="text-xs text-muted-foreground">{formatDate(appointment.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            This action will cancel the appointment and notify the patient.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cancellation Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Why are you cancelling this appointment?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full" 
              onClick={onClose} 
              disabled={submitting}>
              Keep Appointment
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full gap-2 shadow-lg shadow-red-500/20"
              onClick={handleCancel} 
              disabled={submitting}>
              <XCircle className="w-4 h-4" />
              {submitting ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface Invoice {
  _id: Id<"invoices">
  invoiceNumber: string
  patientName: string
  doctorName: string
  patientCondition: string
  doctorFees: number
  medicationFees?: number
  status: 'paid' | 'pending'
  _creationTime: number
}

// تعريف Interface للـ Report
interface Report {
  _id: Id<"reports">
  appointmentId: Id<"appointments">
  patientId: Id<"patients">
  doctorId?: Id<"doctors">
  patientName: string
  doctorName: string
  diagnosis: string
  medications: Array<{
    name: string
    dosage?: string
    frequency?: string
  }>
  notes?: string
  createdAt: number
  patient?: PatientInfo
  doctor?: DoctorInfo
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SecretaryPage() {
  const appointments = useQuery(api.appointments.getAppointments) as Appointment[] | undefined
  const invoices     = useQuery(api.invoices.getAllInvoices) as Invoice[] | undefined
  const reports      = useQuery(api.reports.allReports) as Report[] | undefined
  const allPatients  = useQuery(api.patients.getAllPatients)
  const updateStatus = useMutation(api.appointments.updateStatus)
  const secretarySoftDelete = useMutation(api.appointments.secretarySoftDelete)
  const secretarySoftDeleteInvoice = useMutation(api.invoices.secretarySoftDeleteInvoice)
  const secretarySoftDeleteReport = useMutation(api.reports.secretarySoftDeleteReport)

  const [activeNav,    setActiveNav]    = useState<NavItem>('appointments')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [search,       setSearch]       = useState('')
  const [confirmModal, setConfirmModal] = useState<{ id: Id<"appointments">; action: 'confirm' | 'cancel' | 'complete' } | null>(null)
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null)  // ✨ جديد
  const [deleteApptId,    setDeleteApptId]    = useState<Id<"appointments"> | null>(null)
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<Id<"invoices"> | null>(null)
  const [deleteReportId,  setDeleteReportId]  = useState<Id<"reports"> | null>(null)
  const [processing,   setProcessing]   = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<Id<"patients"> | null>(null)

  // ── Stats ──────────────────────────────────────────────────────────────
  const total      = appointments?.length ?? 0
  const pending    = appointments?.filter(a => a.status === 'pending').length ?? 0
  const confirmed  = appointments?.filter(a => a.status === 'confirmed').length ?? 0
  const todayStr   = new Date().toDateString()
  const todayCount = appointments?.filter(a => new Date(a.date).toDateString() === todayStr).length ?? 0

  // ── Filter + Search ────────────────────────────────────────────────────
  const filtered = appointments
    ?.filter(a => statusFilter === 'all' || a.status === statusFilter)
    ?.filter(a => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        a.patient?.name?.toLowerCase().includes(q) ||
        a.patient?.email?.toLowerCase().includes(q) ||
        a.doctor?.name?.toLowerCase().includes(q) ||
        a.department?.toLowerCase().includes(q)
      )
    })

  const handleAction = async () => {
    if (!confirmModal) return
    
    // ✨ إذا كانت cancel، افتح Modal بدلاً من تنفيذ مباشرة
    if (confirmModal.action === 'cancel') {
      const apt = appointments?.find(a => a._id === confirmModal.id)
      if (apt) {
        setCancellingApt(apt)
      }
      setConfirmModal(null)
      return
    }

    setProcessing(true)
    try {
      const statusMap: Record<'confirm' | 'cancel' | 'complete', AppointmentStatus> = {
        confirm:  'confirmed',
        cancel:   'cancelled',
        complete: 'completed',
      }
      await updateStatus({
        appointmentId: confirmModal.id,
        status: statusMap[confirmModal.action],
      })
      toast.success(
        confirmModal.action === 'confirm'  ? 'Appointment confirmed ✓' :
        confirmModal.action === 'complete' ? 'Marked as completed ✓'  :
        'Appointment cancelled'
      )
      setConfirmModal(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setProcessing(false)
    }
  }

  const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
    { key: 'appointments', label: 'Appointments', icon: ClipboardList },
    { key: 'reports',      label: 'Reports',      icon: FileText      },
    { key: 'invoices',     label: 'Invoices',     icon: Receipt       },
    { key: 'patients',     label: 'Patients',     icon: User          },
  ]

  const statCards = [
    { label: 'Total',     value: total,     icon: Calendar,    color: 'text-primary',   bg: 'bg-primary/10'  },
    { label: "Today",     value: todayCount,icon: Clock,       color: 'text-blue-600',  bg: 'bg-blue-100'    },
    { label: 'Pending',   value: pending,   icon: Hourglass,   color: 'text-amber-600', bg: 'bg-amber-100'   },
    { label: 'Confirmed', value: confirmed, icon: CheckCircle2,color: 'text-teal-600',  bg: 'bg-teal-100'    },
  ]

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">HealWell</div>
            <div className="text-xs text-slate-400">Secretary Panel</div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveNav(key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeNav === key
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === 'appointments' && pending > 0 && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full font-semibold',
                  activeNav === key ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                )}>
                  {pending}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white justify-start gap-2">
              ← Back to Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-auto">

        {/* ══ APPOINTMENTS ══════════════════════════════════════════════ */}
        {activeNav === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Appointments</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Confirm, cancel, or complete patient appointments
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                >
                  <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient, doctor, department..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'text-xs px-3 py-2 rounded-xl border capitalize transition-colors font-medium',
                      statusFilter === s
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-card'
                    )}
                  >
                    {s}
                    {s === 'pending' && pending > 0 && (
                      <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                        statusFilter === s ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                      )}>{pending}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {appointments === undefined ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No appointments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered?.map(apt => (
                  <AppointmentRow
                    key={apt._id}
                    apt={apt}
                    onConfirm={()  => setConfirmModal({ id: apt._id, action: 'confirm'  })}
                    onCancel={()   => setConfirmModal({ id: apt._id, action: 'cancel'   })}
                    onComplete={()=> setConfirmModal({ id: apt._id, action: 'complete' })}
                    onDelete={()   => setDeleteApptId(apt._id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ INVOICES ═════════════════════════════════════════════════ */}
        {activeNav === 'invoices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Invoices</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                All invoices created by doctors
              </p>
            </div>

            {invoices === undefined ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No invoices yet</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['Invoice #', 'Patient', 'Doctor', 'Condition', 'Doctor Fees', 'Med Fees', 'Status', 'Date', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map(inv => (
                        <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary font-medium whitespace-nowrap">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{inv.patientName}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{inv.doctorName}</td>
                          <td className="px-4 py-3 max-w-40">
                            <span className="truncate block text-muted-foreground text-xs" title={inv.patientCondition}>
                              {inv.patientCondition}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                            {inv.doctorFees} SAR
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {inv.medicationFees != null
                              ? <span className="font-semibold">{inv.medicationFees} SAR</span>
                              : <span className="text-muted-foreground text-xs italic">Pending</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn('text-xs border', inv.status === 'paid'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}>
                              {inv.status === 'paid' ? 'Paid' : 'Pending Payment'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(inv._creationTime).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDeleteInvoiceId(inv._id as Id<"invoices">)}
                              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Delete invoice"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ REPORTS ═══════════════════════════════════════════════════ */}
        {activeNav === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Medical Reports</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                All medical reports created by doctors
              </p>
            </div>

            {reports === undefined ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reports yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report, i) => (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  >
                    {/* Color accent */}
                    <div className="h-1 w-full bg-linear-to-r from-teal-400 to-blue-400" />

                    <div className="p-5">
                      {/* Header: Patient + Doctor */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Patient</div>
                          <div className="text-lg font-bold">{report.patientName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-muted-foreground">Doctor</div>
                          <div className="text-lg font-bold text-primary">Dr. {report.doctorName}</div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(report.createdAt).toLocaleDateString('en-US', { 
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                        })} · {new Date(report.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>

                      {/* Diagnosis */}
                      <div className="mb-4 p-4 bg-muted/40 rounded-xl">
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnosis</div>
                        <div className="text-sm text-foreground">{report.diagnosis}</div>
                      </div>

                      {/* Medications */}
                      {report.medications && report.medications.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Medications Prescribed</div>
                          <div className="space-y-2">
                            {report.medications.map((med, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                                  {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm">{med.name}</div>
                                  {(med.dosage || med.frequency) && (
                                    <div className="text-xs text-muted-foreground">
                                      {med.dosage && <span>{med.dosage}</span>}
                                      {med.dosage && med.frequency && <span> • </span>}
                                      {med.frequency && <span>{med.frequency}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {report.notes && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1">Additional Notes</div>
                          <div className="text-sm text-amber-900 dark:text-amber-300">{report.notes}</div>
                        </div>
                      )}

                      {/* Delete button */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => setDeleteReportId(report._id as Id<"reports">)}
                          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Report
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PATIENTS TAB ─────────────────────────────────────────────── */}
        {activeNav === 'patients' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Patient Files</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Browse registered patients and view their full profile & appointments
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setSelectedPatientId(null) }}
                placeholder="Search patient by name or email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {allPatients === undefined ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : allPatients.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No registered patients yet</p>
              </div>
            ) : (() => {
              const filtered = allPatients.filter(p =>
                (p.fullName || p.name).toLowerCase().includes(patientSearch.toLowerCase()) ||
                p.email.toLowerCase().includes(patientSearch.toLowerCase())
              )
              return (
                <div className="space-y-3">
                  {filtered.map((patient) => {
                    const isOpen = selectedPatientId === patient._id
                    const shortId = patient._id.toString().slice(-8).toUpperCase()
                    return (
                      <motion.div
                        key={patient._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all"
                      >
                        <div className="h-1 w-full bg-linear-to-r from-primary to-teal-400" />
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-bold">{patient.fullName || patient.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">ID: {shortId}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedPatientId(isOpen ? null : patient._id as Id<"patients">)}
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              {isOpen ? 'Hide' : 'View File'}
                            </button>
                          </div>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                                  <div className="bg-muted/40 rounded-xl p-3">
                                    <div className="text-xs text-muted-foreground mb-1">Full Name</div>
                                    <div className="font-medium">{patient.fullName || '—'}</div>
                                  </div>
                                  <div className="bg-muted/40 rounded-xl p-3">
                                    <div className="text-xs text-muted-foreground mb-1">Age</div>
                                    <div className="font-medium">{patient.age ?? '—'}</div>
                                  </div>
                                  <div className="bg-muted/40 rounded-xl p-3">
                                    <div className="text-xs text-muted-foreground mb-1">Date of Birth</div>
                                    <div className="font-medium">{patient.dateOfBirth || '—'}</div>
                                  </div>
                                  <div className="bg-muted/40 rounded-xl p-3">
                                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                                    <div className="font-medium text-xs truncate">{patient.email}</div>
                                  </div>
                                  <div className="col-span-2 bg-muted/40 rounded-xl p-3">
                                    <div className="text-xs text-muted-foreground mb-1">Chronic Diseases</div>
                                    <div className="font-medium">
                                      {patient.hasChronicDisease
                                        ? (patient.chronicDiseases || 'Yes (unspecified)')
                                        : 'None'}
                                    </div>
                                  </div>
                                  <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                                    <div className="text-xs text-muted-foreground mb-1">Patient ID (Full)</div>
                                    <div className="font-mono font-bold text-primary text-xs break-all">{patient._id}</div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )
                  })}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No patients match your search</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}

      </main>

      {/* ── Invoice Delete Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteInvoiceId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !processing && setDeleteInvoiceId(null)}
          >
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-xl text-center mb-2">Delete Invoice?</h3>
              <p className="text-muted-foreground text-sm text-center mb-2 leading-relaxed">
                This invoice will be hidden from your view. If the patient has also deleted it, it will be sent for <strong>Admin approval</strong> before permanent deletion.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteInvoiceId(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/20"
                  disabled={processing}
                  onClick={async () => {
                    if (!deleteInvoiceId) return
                    setProcessing(true)
                    try {
                      await secretarySoftDeleteInvoice({ invoiceId: deleteInvoiceId })
                      toast.success('Invoice deleted from your view')
                      setDeleteInvoiceId(null)
                    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
                    finally { setProcessing(false) }
                  }}
                >
                  {processing ? 'Deleting...' : 'Yes, Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Delete Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteReportId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !processing && setDeleteReportId(null)}
          >
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-xl text-center mb-2">Delete Medical Report?</h3>
              <p className="text-muted-foreground text-sm text-center mb-2 leading-relaxed">
                This report will be hidden from your view. If the patient has also deleted it, it will be <strong>permanently removed</strong> from the database.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteReportId(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/20"
                  disabled={processing}
                  onClick={async () => {
                    if (!deleteReportId) return
                    setProcessing(true)
                    try {
                      await secretarySoftDeleteReport({ reportId: deleteReportId })
                      toast.success('Report deleted')
                      setDeleteReportId(null)
                    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
                    finally { setProcessing(false) }
                  }}
                >
                  {processing ? 'Deleting...' : 'Yes, Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !processing && setConfirmModal(null)}
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
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5',
                  confirmModal.action === 'confirm'  ? 'bg-teal-100'  :
                  confirmModal.action === 'complete' ? 'bg-blue-100'  : 'bg-red-100'
                )}
              >
                {confirmModal.action === 'confirm'  && <CheckCircle2 className="w-8 h-8 text-teal-600" />}
                {confirmModal.action === 'complete' && <CheckCircle2 className="w-8 h-8 text-blue-600" />}
                {confirmModal.action === 'cancel'   && <AlertCircle  className="w-8 h-8 text-red-500"  />}
              </motion.div>

              <h3 className="font-bold text-xl text-center mb-2">
                {confirmModal.action === 'confirm'  ? 'Confirm Appointment?' :
                 confirmModal.action === 'complete' ? 'Mark as Completed?'  : 'Cancel Appointment?'}
              </h3>
              <p className="text-muted-foreground text-sm text-center mb-7">
                {confirmModal.action === 'confirm'  ? 'The patient will receive a confirmation email.' :
                 confirmModal.action === 'complete' ? 'This will mark the appointment as completed.'   :
                 'Are you sure you want to cancel this appointment?'}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setConfirmModal(null)}
                  disabled={processing}
                >
                  Go Back
                </Button>
                <Button
                  className={cn(
                    'flex-1 rounded-full text-white shadow-lg',
                    confirmModal.action === 'confirm'  ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'  :
                    confirmModal.action === 'complete' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'  :
                    'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                  )}
                  onClick={handleAction}
                  disabled={processing}
                >
                  {processing ? 'Processing...' :
                    confirmModal.action === 'confirm'  ? 'Yes, Confirm'  :
                    confirmModal.action === 'complete' ? 'Yes, Complete' : 'Yes, Cancel'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete cancelled appointment modal */}
      <AnimatePresence>
        {deleteApptId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !processing && setDeleteApptId(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-xl text-center mb-2">Delete Cancelled Appointment?</h3>
              <p className="text-muted-foreground text-sm text-center mb-7 leading-relaxed">
                This will remove the appointment from the doctor&apos;s dashboard and your view.
                If the patient has already deleted it, it will be permanently removed from the database.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteApptId(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/20"
                  disabled={processing}
                  onClick={async () => {
                    if (!deleteApptId) return
                    setProcessing(true)
                    try {
                      await secretarySoftDelete({ appointmentId: deleteApptId })
                      toast.success('Appointment deleted successfully')
                      setDeleteApptId(null)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Failed to delete')
                    } finally {
                      setProcessing(false)
                    }
                  }}
                >
                  {processing ? 'Deleting...' : 'Yes, Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✨ Cancel Appointment Modal */}
      <AnimatePresence>
        {cancellingApt && (
          <CancelAppointmentModal 
            appointment={cancellingApt} 
            onClose={() => setCancellingApt(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}