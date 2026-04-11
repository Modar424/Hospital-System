"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, User, Clock, CheckCircle2,
  XCircle, Hourglass, FileText, Receipt, Plus, X,
  ChevronDown, ChevronUp, Bell, ClipboardList, MessageSquare,
  AlertCircle, Send, Eye, EyeOff, LogIn, ShieldCheck, Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import MessagePanel from '@/components/MessagePanel'

type NavItem = 'patients' | 'notifications' | 'messages'

interface Appointment {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any
  date: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  hasInvoice?: boolean
  hasReport?: boolean
}

interface Patient {
  _id: string
  name: string
  email: string
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function canCreateInvoice(apt: Appointment): boolean {
  if (apt.status !== 'confirmed' && apt.status !== 'completed') return false
  if (apt.hasInvoice) return false
  return true
}

function canCreateReport(apt: Appointment): boolean {
  if (apt.status !== 'confirmed' && apt.status !== 'completed') return false
  if (apt.hasReport) return false
  return true
}

// ── Doctor Auth Screen ─────────────────────────────────────────────────────
function DoctorAuthScreen({ onSuccess }: { onSuccess: (name: string) => void }) {
  const verifyAndLink = useMutation(api.doctors.verifyAndLinkDoctor)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !password.trim()) { toast.error('Please enter your name and password'); return }
    setLoading(true)
    try {
      const result = await verifyAndLink({ name: name.trim(), password })
      toast.success('Welcome, Dr. ' + result.doctorName + '!')
      onSuccess(result.doctorName)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Stethoscope className="w-10 h-10 text-teal-600" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-1">Doctor Dashboard</h1>
          <p className="text-muted-foreground text-sm">Enter your name and password to access your patients</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-7 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. Dr. James Harrison"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Your dashboard password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 shadow-lg shadow-teal-500/20 mt-2"
              onClick={handleSubmit} disabled={loading || !name.trim() || !password.trim()}>
              <LogIn className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-5">
            Your password is set by the hospital admin. Contact administration if you need access.
          </p>
        </div>
        <div className="text-center mt-5">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Site</Link>
        </div>
      </motion.div>
    </div>
  )
}

// ── Invoice Modal ──────────────────────────────────────────────────────────
function InvoiceModal({ appointment, patientName, onClose }: { appointment: Appointment; patientName: string; onClose: () => void }) {
  const createInvoice = useMutation(api.invoices.createInvoice)
  const [condition, setCondition] = useState('')
  const [fees, setFees] = useState('')
  const [notes, setNotes] = useState('')
  const [medications, setMedications] = useState([{ name: '', dosage: '' }])
  const [submitting, setSubmitting] = useState(false)

  const addMed = () => setMedications(p => [...p, { name: '', dosage: '' }])
  const removeMed = (i: number) => setMedications(p => p.filter((_, idx) => idx !== i))
  const updateMed = (i: number, f: 'name' | 'dosage', v: string) =>
    setMedications(p => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m))

  const handleSubmit = async () => {
    if (!condition.trim()) { toast.error('Please enter patient condition'); return }
    if (!fees || isNaN(Number(fees)) || Number(fees) < 0) { toast.error('Please enter valid fees'); return }
    setSubmitting(true)
    try {
      await createInvoice({
        appointmentId: appointment._id,
        patientCondition: condition,
        medications: medications.filter(m => m.name.trim()).map(m => ({ name: m.name, dosage: m.dosage || undefined })),
        doctorFees: Number(fees),
        notes: notes.trim() || undefined,
      })
      toast.success('Invoice created and sent to patient!')
      onClose()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setSubmitting(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-card rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Create Invoice</h3>
              <p className="text-xs text-muted-foreground">{patientName} · {formatDate(appointment.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Patient Condition *</label>
            <textarea value={condition} onChange={e => setCondition(e.target.value)} rows={2}
              placeholder="Describe the patient's condition..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Prescribed Medications</label>
              <button onClick={addMed} className="text-xs text-primary flex items-center gap-1 font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            <div className="space-y-2">
              {medications.map((med, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Medication name"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dosage"
                    className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {medications.length > 1 && (
                    <button onClick={() => removeMed(i)} className="text-red-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Doctor Fees (SAR) *</label>
            <input type="number" value={fees} onChange={e => setFees(e.target.value)} placeholder="e.g. 200" min="0"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <p className="text-xs text-muted-foreground mt-1">Medication fees will be completed by the accountant</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional notes..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-full" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full gap-2 shadow-lg shadow-primary/20"
              onClick={handleSubmit} disabled={submitting}>
              <Send className="w-4 h-4" />{submitting ? 'Sending...' : 'Create & Send'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Report Modal ───────────────────────────────────────────────────────────
function ReportModal({ appointment, patientName, onClose }: { appointment: Appointment; patientName: string; onClose: () => void }) {
  const createReport = useMutation(api.reports.createReport)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '' }])
  const [submitting, setSubmitting] = useState(false)

  const addMed = () => setMedications(p => [...p, { name: '', dosage: '', frequency: '' }])
  const removeMed = (i: number) => setMedications(p => p.filter((_, idx) => idx !== i))
  const updateMed = (i: number, f: 'name' | 'dosage' | 'frequency', v: string) =>
    setMedications(p => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m))

  const handleSubmit = async () => {
    if (!diagnosis.trim()) { toast.error('Please enter diagnosis'); return }
    setSubmitting(true)
    try {
      await createReport({
        appointmentId: appointment._id,
        diagnosis,
        medications: medications.filter(m => m.name.trim()).map(m => ({ name: m.name, dosage: m.dosage || undefined, frequency: m.frequency || undefined })),
        notes: notes.trim() || undefined,
      })
      toast.success('Report created successfully!')
      onClose()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setSubmitting(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-card rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Medical Report</h3>
              <p className="text-xs text-muted-foreground">{patientName} · {formatDate(appointment.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Diagnosis *</label>
            <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3}
              placeholder="Enter patient's diagnosis..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Prescribed Medications</label>
              <button onClick={addMed} className="text-xs text-teal-600 flex items-center gap-1 font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            <div className="space-y-2">
              {medications.map((med, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Drug name"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  <input value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dose"
                    className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  <input value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Freq."
                    className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  {medications.length > 1 && (
                    <button onClick={() => removeMed(i)} className="text-red-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional clinical notes..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-full" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-full gap-2 shadow-lg shadow-teal-500/20"
              onClick={handleSubmit} disabled={submitting}>
              <Send className="w-4 h-4" />{submitting ? 'Saving...' : 'Save Report'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Appointment Item ───────────────────────────────────────────────────────
function AppointmentItem({ apt, onCreateInvoice, onCreateReport }: { apt: Appointment; onCreateInvoice: () => void; onCreateReport: () => void }) {
  const updateStatus = useMutation(api.appointments.updateStatus)
  const [completing, setCompleting] = useState(false)

  const canInvoice = canCreateInvoice(apt)
  const canReport = canCreateReport(apt)
  const canComplete = (apt.status === 'pending' || apt.status === 'confirmed') && apt.hasReport && apt.hasInvoice

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await updateStatus({ appointmentId: apt._id, status: 'completed' })
      toast.success('Appointment marked as completed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to complete appointment')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground truncate">{formatDate(apt.date)}</span>
        {apt.hasReport && (
          <Badge className="text-xs bg-green-50 text-green-700 border-green-200 border shrink-0">
            <FileText className="w-3 h-3 mr-1" /> Report ✓
          </Badge>
        )}
        {apt.hasInvoice && (
          <Badge className="text-xs bg-teal-50 text-teal-700 border-teal-200 border shrink-0">
            <Receipt className="w-3 h-3 mr-1" /> Invoice ✓
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canComplete && (
          <button onClick={handleComplete} disabled={completing}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium disabled:opacity-50">
            <CheckCircle2 className="w-3.5 h-3.5" /> {completing ? 'Completing...' : 'Complete'}
          </button>
        )}
        {canReport && (
          <button onClick={onCreateReport}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors font-medium">
            <FileText className="w-3.5 h-3.5" /> Report
          </button>
        )}
        {canInvoice && (
          <button onClick={onCreateInvoice}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" /> Invoice
          </button>
        )}
      </div>
    </div>
  )
}

// ── Patient Card ───────────────────────────────────────────────────────────
function PatientCard({ group }: { group: { patient: Patient; appointments: Appointment[] } }) {
  const [expanded, setExpanded] = useState(false)
  const [invoiceApt, setInvoiceApt] = useState<Appointment | null>(null)
  const [reportApt, setReportApt] = useState<Appointment | null>(null)

  const pending   = group.appointments.filter(a => a.status === 'pending')
  const confirmed = group.appointments.filter(a => a.status === 'confirmed')
  const completed = group.appointments.filter(a => a.status === 'completed')
  const cancelled = group.appointments.filter(a => a.status === 'cancelled')
  const activeCount = pending.length + confirmed.length

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200">
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{group.patient.name}</div>
                <div className="text-xs text-muted-foreground">{group.patient.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeCount > 0 && <Badge className="bg-primary/10 text-primary border-0 text-xs">{activeCount} active</Badge>}
              <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {pending.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Hourglass className="w-3.5 h-3.5" /> Pending ({pending.length})
                      </div>
                      <div className="space-y-2">{pending.map(apt => <AppointmentItem key={apt._id} apt={apt} onCreateInvoice={() => setInvoiceApt(apt)} onCreateReport={() => setReportApt(apt)} />)}</div>
                    </div>
                  )}
                  {confirmed.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed ({confirmed.length})
                      </div>
                      <div className="space-y-2">{confirmed.map(apt => <AppointmentItem key={apt._id} apt={apt} onCreateInvoice={() => setInvoiceApt(apt)} onCreateReport={() => setReportApt(apt)} />)}</div>
                    </div>
                  )}
                  {completed.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Completed ({completed.length})
                      </div>
                      <div className="space-y-2">{completed.map(apt => <AppointmentItem key={apt._id} apt={apt} onCreateInvoice={() => setInvoiceApt(apt)} onCreateReport={() => setReportApt(apt)} />)}</div>
                    </div>
                  )}
                  {cancelled.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Cancelled ({cancelled.length})
                      </div>
                      <div className="space-y-2">{cancelled.map(apt => <AppointmentItem key={apt._id} apt={apt} onCreateInvoice={() => setInvoiceApt(apt)} onCreateReport={() => setReportApt(apt)} />)}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <AnimatePresence>
        {invoiceApt && <InvoiceModal appointment={invoiceApt} patientName={group.patient.name} onClose={() => setInvoiceApt(null)} />}
        {reportApt && <ReportModal appointment={reportApt} patientName={group.patient.name} onClose={() => setReportApt(null)} />}
      </AnimatePresence>
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  const currentUser  = useQuery(api.patients.getUser)
  const groups       = useQuery(api.appointments.getMyPatientsAppointments)
  const notifications= useQuery(api.notifications.myNotifications)
  const doctorMessageCount = useQuery(api.doctorSecretaryMessages.getDoctorUnreadMessageCount)
  const markRead     = useMutation(api.notifications.markAsRead)
  const unreadCount  = useQuery(api.notifications.getUnreadCount)

  const [activeNav,    setActiveNav]    = useState<NavItem>('patients')
  const [verifiedName, setVerifiedName] = useState<string | null>(null)
  const [messagePanelOpen, setMessagePanelOpen] = useState(false)

  if (currentUser === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!currentUser || currentUser.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">This page is only for doctors.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
      </div>
    )
  }

  // يظهر شاشة التحقق إذا لم يتحقق في هذه الجلسة
  if (!verifiedName) {
    return <DoctorAuthScreen onSuccess={(name) => setVerifiedName(name)} />
  }

  const totalPatients  = groups?.length ?? 0
  const totalPending   = groups?.reduce((acc, g) => acc + g.appointments.filter((a: Appointment) => a.status === 'pending').length, 0) ?? 0
  const totalConfirmed = groups?.reduce((acc, g) => acc + g.appointments.filter((a: Appointment) => a.status === 'confirmed').length, 0) ?? 0

  const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
    { key: 'patients',      label: 'My Patients',  icon: ClipboardList },
    { key: 'messages',      label: 'Messages',     icon: MessageSquare },
    { key: 'notifications', label: 'Notifications',icon: Bell          },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">HealWell</div>
            <div className="text-xs text-slate-400">Doctor Panel</div>
          </div>
        </div>

        <div className="px-2 mb-6">
          <div className="bg-slate-800 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-0.5">Signed in as</div>
            <div className="font-semibold text-white text-sm truncate"> {verifiedName}</div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveNav(key)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeNav === key ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800')}>
              <Icon className="w-4 h-4" />
              {label}
              {key === 'notifications' && (unreadCount ?? 0) > 0 && (
                <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full font-semibold',
                  activeNav === key ? 'bg-white/20 text-white' : 'bg-red-500 text-white')}>
                  {unreadCount}
                </span>
              )}
              {key === 'messages' && (doctorMessageCount ?? 0) > 0 && (
                <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full font-semibold',
                  activeNav === key ? 'bg-white/20 text-white' : 'bg-violet-500 text-white')}>
                  {doctorMessageCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-800 space-y-1">
          <button onClick={() => setVerifiedName(null)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogIn className="w-4 h-4 rotate-180" /> Lock Dashboard
          </button>
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white justify-start gap-2">
              ← Back to Site
            </Button>
          </Link>
        </div>

      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">

        {activeNav === 'patients' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">My Patients</h1>
              <p className="text-muted-foreground text-sm mt-0.5">View appointments and create invoices for completed visits</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Patients',  value: totalPatients,  color: 'text-primary',   bg: 'bg-primary/10', icon: User         },
                { label: 'Pending Appts',   value: totalPending,   color: 'text-amber-600', bg: 'bg-amber-100',  icon: Hourglass    },
                { label: 'Confirmed Appts', value: totalConfirmed, color: 'text-teal-600',  bg: 'bg-teal-100',   icon: CheckCircle2 },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Receipt className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Invoice rule:</strong> You can only create invoices for <strong>confirmed</strong> appointments whose day has already passed.
              </p>
            </div>

            {groups === undefined ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No patients yet</p>
                <p className="text-sm mt-1">Patients will appear once appointments are booked with you</p>
              </div>
            ) : (
              <div className="space-y-3">{groups.map(group => <PatientCard key={group.patient._id} group={group} />)}</div>
            )}
          </motion.div>
        )}

        {activeNav === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Messages from the admin</p>
            </div>
            {notifications === undefined ? (
              <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, i) => (
                  <motion.div key={notif._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={cn('bg-card border rounded-2xl p-5', notif.isRead ? 'border-border' : 'border-primary/40 shadow-md shadow-primary/5')}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', notif.isRead ? 'bg-muted' : 'bg-primary/10')}>
                          <Bell className={cn('w-5 h-5', notif.isRead ? 'text-muted-foreground' : 'text-primary')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{notif.type === 'meeting_request' ? 'Meeting Request' : 'Notification'}</span>
                            {!notif.isRead && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">New</span>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                          {notif.scheduledAt && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(notif.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{new Date(notif._creationTime).toLocaleDateString()}</span>
                        {!notif.isRead && (
                          <button onClick={() => markRead({ notificationId: notif._id })}
                            className="text-xs px-3 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
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
      </main>

      {/* Message Panel */}
      <MessagePanel 
        userRole="doctor"
        isOpen={messagePanelOpen} 
        onClose={() => setMessagePanelOpen(false)} 
      />
    </div>
  )
}
