"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CheckCircle2, XCircle, Clock, Stethoscope,
  User, FileText, Search, ClipboardList, MessageSquare,
  Receipt, ChevronDown, ChevronUp, Trash2,
  AlertCircle, Hourglass, Users, Bell, RotateCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import MessagePanel from '@/components/MessagePanel'

// ── Types ─────────────────────────────────────────────────────────────────
type NavItem = 'appointments' | 'invoices' | 'reports' | 'messages' | 'profiles' | 'trash'

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

interface CancelledAppointment extends Appointment {
  patientProfile?: {
    phone?: string
    dateOfBirth?: string
    gender?: string
    bloodType?: string
    address?: string
    medicalHistory?: string[]
    allergies?: string[]
    notes?: string
  }
  doctor?: DoctorInfo & {
    category?: string
    expertise?: string[]
    experience?: number
    contact?: string
    bio?: string
  }
}

function AppointmentRow({
  apt,
  onConfirm,
  onCancel,
  onComplete,
  onMoveToTrash,
}: {
  apt: Appointment
  onConfirm: () => void
  onCancel: () => void
  onComplete: () => void
  onMoveToTrash?: () => void
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
                  {apt.doctor?.name ? `${apt.doctor.name}` : apt.department}
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
              {(apt.status === 'cancelled' || apt.status === 'completed') && onMoveToTrash && (
                <button
                  onClick={onMoveToTrash}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> سلة محذوفات
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expand notes */}
        {apt.notes && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide notes' : 'View notes'}
          </button>
        )}
        <AnimatePresence>
          {expanded && apt.notes && (
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
      </div>
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
  const secretaryMessageCount = useQuery(api.doctorSecretaryMessages.getSecretaryUnreadMessageCount)
  const allProfiles  = useQuery(api.patientProfiles.getAllPatientProfiles)
  const cancelledAppointments = useQuery(api.trash.getCancelledAppointments) as Appointment[] | undefined
  const updateStatus = useMutation(api.appointments.updateStatus)
  const markInvoicePaid = useMutation(api.invoices.markInvoicePaid)
  const moveAppointmentToTrash = useMutation(api.trash.moveAppointmentToTrash)
  const permanentDeleteAppointment = useMutation(api.trash.permanentDeleteAppointment)
  const restoreAppointment = useMutation(api.trash.restoreAppointment)

  const [activeNav,    setActiveNav]    = useState<NavItem>('appointments')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [search,       setSearch]       = useState('')
  const [confirmModal, setConfirmModal] = useState<{ id: Id<"appointments">; action: 'confirm' | 'cancel' | 'complete' } | null>(null)
  const [processing,   setProcessing]   = useState(false)
  const [messagePanelOpen, setMessagePanelOpen] = useState(false)
  const [expandedTrashItems, setExpandedTrashItems] = useState<Record<string, boolean>>({})
  const [trashTab, setTrashTab] = useState<'completed' | 'cancelled'>('completed')

  // ── Stats ──────────────────────────────────────────────────────────────
  const total      = appointments?.length ?? 0
  const pending    = appointments?.filter(a => a.status === 'pending').length ?? 0
  const confirmed  = appointments?.filter(a => a.status === 'confirmed').length ?? 0
  const cancelled  = cancelledAppointments?.length ?? 0
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

  // ── Actions ────────────────────────────────────────────────────────────
  const handleAction = async () => {
    if (!confirmModal) return
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

  // ── Move to Trash ──────────────────────────────────────────────────────
  const handleMoveToTrash = (appointmentId: Id<"appointments">) => async () => {
    try {
      await moveAppointmentToTrash({ appointmentId })
      toast.success('تم نقل الموعد إلى السلة ✓')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل نقل الموعد')
    }
  }

  const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
    { key: 'appointments', label: 'Appointments',     icon: ClipboardList },
    { key: 'profiles',     label: 'Patient Profiles', icon: Users         },
    { key: 'messages',     label: 'Messages',         icon: MessageSquare },
    { key: 'reports',      label: 'Reports',          icon: FileText      },
    { key: 'invoices',     label: 'Invoices',         icon: Receipt       },
    { key: 'trash',        label: 'Trash',            icon: Trash2        },
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
              {key === 'messages' && (secretaryMessageCount ?? 0) > 0 && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full font-semibold',
                  activeNav === key ? 'bg-white/20 text-white' : 'bg-violet-500 text-white'
                )}>
                  {secretaryMessageCount ?? 0}
                </span>
              )}
              {key === 'trash' && cancelled > 0 && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full font-semibold',
                  activeNav === key ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                )}>
                  {cancelled}
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
                    onMoveToTrash={handleMoveToTrash(apt._id)}
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
                        {['Invoice #', 'Patient', 'Doctor', 'Condition', 'Doctor Fees', 'Med Fees', 'Status', 'Date'].map(h => (
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
                            <div className="flex items-center gap-2">
                              <Badge className={cn('text-xs border', inv.status === 'paid'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                              )}>
                                {inv.status === 'paid' ? 'Paid' : 'Pending Payment'}
                              </Badge>
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await markInvoicePaid({ invoiceId: inv._id })
                                      toast.success('تم تعليم الفاتورة كمدفوعة ✓')
                                    } catch (e) {
                                      toast.error(e instanceof Error ? e.message : 'فشل')
                                    }
                                  }}
                                  className="text-xs px-2 py-0.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1"
                                >
                                  <Bell className="w-3 h-3" /> دفع
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(inv._creationTime).toLocaleDateString()}
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
                          <div className="text-lg font-bold text-primary">{report.doctorName}</div>
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
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ PROFILES ══════════════════════════════════════════════ */}
        {activeNav === 'profiles' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Patient Profiles</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Medical profiles for all registered patients</p>
            </div>
            {allProfiles === undefined ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : allProfiles.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No patient profiles yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allProfiles.map((profile, i) => (
                  <motion.div key={profile._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{profile.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.patientEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground truncate">
                            ID: {profile.patientId}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(profile.patientId);
                              toast.success('تم نسخ ID المريض');
                            }}
                            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        profile.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                        profile.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700')}>
                        {profile.gender === 'male' ? 'ذكر' : profile.gender === 'female' ? 'أنثى' : 'آخر'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-muted-foreground block">فصيلة الدم</span>
                        <span className="font-semibold text-foreground">{profile.bloodType}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-muted-foreground block">تاريخ الميلاد</span>
                        <span className="font-semibold text-foreground">{profile.dateOfBirth}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-muted-foreground block">الهاتف</span>
                        <span className="font-semibold text-foreground">{profile.phone}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-muted-foreground block">طوارئ</span>
                        <span className="font-semibold text-foreground truncate block">{profile.emergencyContact}</span>
                      </div>
                    </div>
                    {(profile.allergies?.length > 0 || profile.medicalHistory?.length > 0) && (
                      <div className="mt-3 space-y-1.5">
                        {profile.allergies?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground ml-1">حساسية:</span>
                            {profile.allergies.map((a: string, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">{a}</span>
                            ))}
                          </div>
                        )}
                        {profile.medicalHistory?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground ml-1">تاريخ طبي:</span>
                            {profile.medicalHistory.map((h: string, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100">{h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ MESSAGES ══════════════════════════════════════════════ */}
        {activeNav === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => setMessagePanelOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-medium transition-all shadow-lg shadow-violet-500/20"
            >
              <MessageSquare className="w-5 h-5" />
              فتح لوحة الرسائل
            </button>
          </motion.div>
        )}

        {/* ══ TRASH (CANCELLED & COMPLETED APPOINTMENTS) ════════════════════════ */}
        {activeNav === 'trash' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">سلة المحذوفات</h2>
                <p className="text-sm text-muted-foreground mt-1">إدارة المواعيد الملغاة والمكتملة والمحذوفة</p>
              </div>
              {cancelled > 0 && (
                <div className="px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold">
                  {cancelled} موعد
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setTrashTab('completed')}
                className={cn(
                  'px-4 py-3 font-medium text-sm transition-colors border-b-2',
                  trashTab === 'completed'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                )}
              >
               Completed
                {(cancelledAppointments?.filter(apt => apt.status === 'completed').length ?? 0) > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {cancelledAppointments?.filter(apt => apt.status === 'completed').length ?? 0}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTrashTab('cancelled')}
                className={cn(
                  'px-4 py-3 font-medium text-sm transition-colors border-b-2',
                  trashTab === 'cancelled'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                )}
              >
               Cancelled
                {(cancelledAppointments?.filter(apt => apt.status === 'cancelled').length ?? 0) > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    {cancelledAppointments?.filter(apt => apt.status === 'cancelled').length ?? 0}
                  </span>
                )}
              </button>
            </div>

            {!cancelledAppointments || cancelledAppointments.filter(apt => apt.status === trashTab).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center py-16"
              >
                <div className="text-center">
                  <Trash2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    {trashTab === 'completed' ? 'لا توجد مواعيد مكتملة' : 'لا توجد مواعيد ملغاة'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">سلة المحذوفات فارغة</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {cancelledAppointments
                    .filter(apt => apt.status === trashTab)
                    .map((apt: CancelledAppointment) => {
                      const isExpanded = expandedTrashItems[apt._id] ?? false
                      const toggleExpanded = () => {
                        setExpandedTrashItems((prev) => ({
                          ...prev,
                          [apt._id]: !prev[apt._id]
                        }))
                      }
                      return (
                        <motion.div
                          key={apt._id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={cn(
                            'bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200',
                            trashTab === 'completed' ? 'border-slate-200' : 'border-red-200'
                          )}
                        >
                          {/* Main header - collapsible */}
                          <button
                            onClick={toggleExpanded}
                            className="w-full p-5 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              {/* Patient info */}
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={cn(
                                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                                  trashTab === 'completed' ? 'bg-slate-100' : 'bg-red-100'
                                )}>
                                  <User className={cn('w-5 h-5', trashTab === 'completed' ? 'text-slate-600' : 'text-red-600')} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="font-semibold text-base truncate">
                                      {apt.patient?.name ?? '—'}
                                    </div>
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
                                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                    <span>{apt.patient?.email}</span>
                                    {apt.patientProfile?.phone && (
                                      <>
                                        <span>•</span>
                                        <span>{apt.patientProfile.phone}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                                    {apt.doctor?.name && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Stethoscope className={cn('w-3 h-3', trashTab === 'completed' ? 'text-slate-600/60' : 'text-red-600/60')} />
                                        {apt.doctor.name}
                                        {apt.doctor.category && <span className={cn(trashTab === 'completed' ? 'text-slate-600/60' : 'text-red-600/60')}>({apt.doctor.category})</span>}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className={cn('w-3 h-3', trashTab === 'completed' ? 'text-slate-600/60' : 'text-red-600/60')} />
                                      {formatDate(apt.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Expand icon */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-sm text-muted-foreground">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                  'overflow-hidden border-t',
                                  trashTab === 'completed' ? 'border-slate-200' : 'border-red-200'
                                )}
                              >
                                <div className="p-5">
                                  {/* Action buttons only */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await restoreAppointment({
                                            appointmentId: apt._id,
                                            status: trashTab === 'completed' ? 'completed' : ('cancelled' as const)
                                          })
                                          toast.success('تم استعادة الموعد بنجاح')
                                        } catch {
                                          toast.error('فشل في استعادة الموعد')
                                        }
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors font-medium"
                                    >
                                      <RotateCcw className="w-4 h-4" /> استعادة
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm('هل أنت متأكد من حذف هذا الموعد نهائياً؟')) {
                                          try {
                                            await permanentDeleteAppointment({
                                              appointmentId: apt._id
                                            })
                                            toast.success('تم حذف الموعد نهائياً')
                                          } catch {
                                            toast.error('فشل في حذف الموعد')
                                          }
                                        }
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium"
                                    >
                                      <Trash2 className="w-4 h-4" /> حذف نهائي
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

      </main>

      {/* Message Panel */}
      <MessagePanel 
        userRole="secretary"
        isOpen={messagePanelOpen} 
        onClose={() => setMessagePanelOpen(false)} 
      />

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
    </div>
  )
}