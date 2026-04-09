"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, User, Stethoscope, AlertCircle,
  CheckCircle2, XCircle, Hourglass, PlusCircle, MapPin, FileText,
  Receipt, Download, CreditCard, ChevronRight, Trash2, X, Send,
  ClipboardList, Heart, Baby, Shield, Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@clerk/nextjs'
import { SignInButton } from '@clerk/nextjs'

const statusConfig = {
  pending: {
    label: 'Pending', labelAr: 'قيد الانتظار',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    icon: Hourglass, dot: 'bg-amber-400', glow: 'shadow-amber-100 dark:shadow-amber-950',
  },
  confirmed: {
    label: 'Confirmed', labelAr: 'مؤكد',
    className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
    icon: CheckCircle2, dot: 'bg-teal-400', glow: 'shadow-teal-100 dark:shadow-teal-950',
  },
  completed: {
    label: 'Completed', labelAr: 'مكتمل',
    className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
    icon: CheckCircle2, dot: 'bg-slate-400', glow: '',
  },
  cancelled: {
    label: 'Cancelled', labelAr: 'ملغى',
    className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    icon: XCircle, dot: 'bg-red-400', glow: '',
  },
} as const

function formatDate(ts: number, lang: string) {
  return new Date(ts).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── Guest / not-logged-in wall ─────────────────────────────────────────────
function LoginWall({ lang }: { lang: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10"
        >
          <Calendar className="w-12 h-12 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">
          {lang === 'ar' ? 'سجّل دخولك لرؤية مواعيدك' : 'Sign in to view your appointments'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {lang === 'ar'
            ? 'تحتاج إلى تسجيل الدخول للوصول إلى صفحة مواعيدك وفواتيرك'
            : 'You need to sign in to access your appointments and invoices'}
        </p>
        <SignInButton mode="modal">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 shadow-lg shadow-primary/20 gap-2">
            <User className="w-4 h-4" />
            {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Button>
        </SignInButton>
      </motion.div>
    </div>
  )
}

// ── Invoice card ───────────────────────────────────────────────────────────
interface InvoiceData {
  _id: string
  invoiceNumber: string
  patientName: string
  doctorName: string
  _creationTime: number
  patientCondition: string
  medications: Array<{ name: string; dosage?: string }>
  doctorFees: number
  medicationFees?: number
  totalAmount?: number
  status: string
  notes?: string
}

function InvoiceCard({ invoice, lang }: { invoice: InvoiceData; lang: string }) {
  const [expanded, setExpanded] = useState(false)

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
        h1 { color: #0d9488; } table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border: 1px solid #e2e8f0; text-align: ${lang === 'ar' ? 'right' : 'left'}; }
        th { background: #f8fafc; } .total { font-size: 1.2em; font-weight: bold; color: #0d9488; }
        .notice { background: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin-top: 24px; }
      </style></head><body>
      <h1>🏥 HealWell — ${lang === 'ar' ? 'فاتورة طبية' : 'Medical Invoice'}</h1>
      <p><strong>${lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>${lang === 'ar' ? 'اسم المريض' : 'Patient'}:</strong> ${invoice.patientName}</p>
      <p><strong>${lang === 'ar' ? 'الطبيب' : 'Doctor'}:</strong> ${invoice.doctorName}</p>
      <p><strong>${lang === 'ar' ? 'التاريخ' : 'Date'}:</strong> ${new Date(invoice._creationTime).toLocaleDateString()}</p>
      <p><strong>${lang === 'ar' ? 'الحالة الطبية' : 'Condition'}:</strong> ${invoice.patientCondition}</p>
      <h3>${lang === 'ar' ? 'الأدوية الموصوفة' : 'Prescribed Medications'}</h3>
      <table><tr><th>${lang === 'ar' ? 'الدواء' : 'Medication'}</th><th>${lang === 'ar' ? 'الجرعة' : 'Dosage'}</th></tr>
      ${invoice.medications.map((m: { name: string; dosage?: string }) => `<tr><td>${m.name}</td><td>${m.dosage || '—'}</td></tr>`).join('')}
      </table>
      <p><strong>${lang === 'ar' ? 'أتعاب الطبيب' : 'Doctor Fees'}:</strong> ${invoice.doctorFees} SAR</p>
      ${invoice.medicationFees ? `<p><strong>${lang === 'ar' ? 'تكاليف الأدوية' : 'Medication Fees'}:</strong> ${invoice.medicationFees} SAR</p>` : ''}
      <div class="notice">
        <strong>📍 ${lang === 'ar' ? 'تعليمات الدفع' : 'Payment Instructions'}</strong><br/>
        ${lang === 'ar'
          ? 'يرجى التوجه إلى مكتب المحاسبة في المستشفى لإتمام عملية الدفع وتسديد المبالغ المستحقة.'
          : 'Please proceed to the hospital accounting office to complete your payment.'}
      </div>
      </body></html>
    `
    const win = window.open('', '_blank')
    if (win) { win.document.write(printContent); win.document.close(); win.print() }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
    >
      <div className="h-1 w-full bg-linear-to-r from-teal-400 to-primary" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-bold text-base">{invoice.invoiceNumber}</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {lang === 'ar' ? 'د.' : 'Dr.'} {invoice.doctorName}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(invoice._creationTime).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={invoice.status === 'paid'
              ? 'bg-teal-50 text-teal-700 border-teal-200 text-xs'
              : 'bg-amber-50 text-amber-700 border-amber-200 text-xs'}>
              {invoice.status === 'paid'
                ? (lang === 'ar' ? 'مدفوع' : 'Paid')
                : (lang === 'ar' ? 'في انتظار الدفع' : 'Pending Payment')}
            </Badge>
            <div className="text-lg font-bold text-primary">
              {invoice.doctorFees} SAR
            </div>
          </div>
        </div>

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          {expanded
            ? (lang === 'ar' ? 'إخفاء التفاصيل' : 'Hide details')
            : (lang === 'ar' ? 'عرض التفاصيل' : 'Show details')}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    {lang === 'ar' ? 'الحالة الطبية' : 'Medical Condition'}
                  </div>
                  <div className="text-sm bg-muted/40 rounded-lg px-3 py-2">{invoice.patientCondition}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {lang === 'ar' ? 'الأدوية الموصوفة' : 'Prescribed Medications'}
                  </div>
                  <div className="space-y-1.5">
                    {invoice.medications.map((med: { name: string; dosage?: string }, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium">{med.name}</span>
                        {med.dosage && <span className="text-muted-foreground text-xs">{med.dosage}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {invoice.notes && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                    <span className="font-semibold">{lang === 'ar' ? 'ملاحظات: ' : 'Notes: '}</span>
                    {invoice.notes}
                  </div>
                )}

                {/* Payment notice */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                        {lang === 'ar' ? '📍 خطوات الدفع' : '📍 Payment Steps'}
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed space-y-1.5">
                        <div>
                          <strong>1.</strong> {lang === 'ar' 
                            ? 'احفظ أو اطبع هذه الفاتورة' 
                            : 'Save or print this invoice'}
                        </div>
                        <div>
                          <strong>2.</strong> {lang === 'ar' 
                            ? 'توجه إلى مكتب المحاسبة في المستشفى برقم الفاتورة' 
                            : 'Visit the hospital accounting office with the invoice number'}
                        </div>
                        <div>
                          <strong>3.</strong> {lang === 'ar' 
                            ? 'تحقق من تكاليف الأدوية الكاملة' 
                            : 'Verify medication costs with the accountant'}
                        </div>
                        <div>
                          <strong>4.</strong> {lang === 'ar' 
                            ? 'أكمل عملية الدفع وستحصل على الإيصال' 
                            : 'Complete payment and receive the receipt'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    {lang === 'ar' ? 'ملخص التكاليف' : 'Cost Summary'}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'أتعاب الطبيب:' : 'Doctor Fees:'}</span>
                      <span className="font-semibold">{invoice.doctorFees} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'تكاليف الأدوية:' : 'Medication Fees:'}</span>
                      <span className="font-semibold text-amber-600">
                        {invoice.medicationFees ? `${invoice.medicationFees} SAR` : (lang === 'ar' ? 'سيتم تحديثها' : 'To be confirmed')}
                      </span>
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-600 pt-1.5 mt-1.5 flex justify-between font-bold text-base">
                      <span>{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                      <span className="text-primary">
                        {invoice.totalAmount ? `${invoice.totalAmount} SAR` : (lang === 'ar' ? 'قيد الحساب' : 'To be calculated')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5 text-xs"
                    onClick={handlePrint}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'حفظ / طباعة' : 'Save / Print'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Profile Completion Wall ────────────────────────────────────────────────
function ProfileCompletionWall({ lang, currentUser }: { lang: string; currentUser: { _id: string; name: string; email: string } }) {
  const updateProfile = useMutation(api.patients.updatePatientProfile)
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [hasChronicDisease, setHasChronicDisease] = useState(false)
  const [chronicDiseases, setChronicDiseases] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!fullName.trim() || !age || !dateOfBirth) {
      toast.error(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        fullName: fullName.trim(),
        age: parseInt(age),
        dateOfBirth,
        hasChronicDisease,
        chronicDiseases: hasChronicDisease ? chronicDiseases : undefined,
      })
      toast.success(lang === 'ar' ? 'تم حفظ بياناتك بنجاح!' : 'Profile saved successfully!')
    } catch {
      toast.error(lang === 'ar' ? 'فشل حفظ البيانات' : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10"
          >
            <ClipboardList className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">
            {lang === 'ar' ? 'أكمل ملفك الشخصي أولاً' : 'Complete Your Profile First'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {lang === 'ar'
              ? 'يجب إكمال بياناتك الشخصية قبل حجز أي موعد أو الوصول إلى مواعيدك'
              : 'You must complete your personal information before booking or viewing appointments'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              {lang === 'ar' ? 'الاسم الثلاثي *' : 'Full Name (3 parts) *'}
            </Label>
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={lang === 'ar' ? 'محمد أحمد العلي' : 'John Michael Smith'}
              className="rounded-xl"
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Baby className="w-3.5 h-3.5 text-primary" />
              {lang === 'ar' ? 'العمر *' : 'Age *'}
            </Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: 30' : 'e.g. 30'}
              className="rounded-xl"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {lang === 'ar' ? 'تاريخ الميلاد *' : 'Date of Birth *'}
            </Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Chronic Disease */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-primary" />
              {lang === 'ar' ? 'هل تعاني من أمراض مزمنة؟' : 'Do you have chronic diseases?'}
            </Label>
            <div className="flex gap-3">
              <button
                onClick={() => setHasChronicDisease(true)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  hasChronicDisease
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {lang === 'ar' ? 'نعم' : 'Yes'}
              </button>
              <button
                onClick={() => setHasChronicDisease(false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  !hasChronicDisease
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {lang === 'ar' ? 'لا' : 'No'}
              </button>
            </div>
            {hasChronicDisease && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Input
                  value={chronicDiseases}
                  onChange={e => setChronicDiseases(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: سكري، ضغط الدم، ربو...' : 'e.g. Diabetes, Hypertension, Asthma...'}
                  className="rounded-xl mt-2"
                />
              </motion.div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-11"
          >
            {saving
              ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
              : (lang === 'ar' ? 'حفظ البيانات والمتابعة' : 'Save & Continue')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Patient File Card ──────────────────────────────────────────────────────
function PatientFileCard({ patient, lang }: { patient: { _id: string; name: string; email: string; fullName?: string; age?: number; dateOfBirth?: string; hasChronicDisease?: boolean; chronicDiseases?: string }, lang: string }) {
  const [open, setOpen] = useState(false)
  const shortId = patient._id.toString().slice(-8).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all"
    >
      <div className="h-1 w-full bg-linear-to-r from-primary to-teal-400" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-bold text-base">{patient.fullName || patient.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                ID: {shortId}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
            {open ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'عرض الملف' : 'View File')}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</div>
                  <div className="font-medium">{patient.fullName || '—'}</div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'العمر' : 'Age'}</div>
                  <div className="font-medium">{patient.age ?? '—'}</div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</div>
                  <div className="font-medium">{patient.dateOfBirth || '—'}</div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</div>
                  <div className="font-medium text-xs truncate">{patient.email}</div>
                </div>
                <div className="col-span-2 bg-muted/40 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'أمراض مزمنة' : 'Chronic Diseases'}</div>
                  <div className="font-medium">
                    {patient.hasChronicDisease
                      ? (patient.chronicDiseases || (lang === 'ar' ? 'نعم (غير محدد)' : 'Yes (unspecified)'))
                      : (lang === 'ar' ? 'لا يوجد' : 'None')}
                  </div>
                </div>
                <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'رقم المريض' : 'Patient ID'}</div>
                  <div className="font-mono font-bold text-primary">{patient._id}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const { isSignedIn } = useAuth()
  const currentUser  = useQuery(api.patients.getUser)
  const appointments = useQuery(api.appointments.myAppointments)
  const invoices     = useQuery(api.invoices.myInvoices)
  const updateStatus = useMutation(api.appointments.updateStatus)
  const cancelAppt   = useMutation(api.appointments.cancelAppointmentWithNotification)
  const patientSoftDelete = useMutation(api.appointments.patientSoftDelete)

  const [cancelId,    setCancelId]   = useState<Id<"appointments"> | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling,  setCancelling] = useState(false)
  const [deleteId,    setDeleteId]   = useState<Id<"appointments"> | null>(null)
  const [deleting,    setDeleting]   = useState(false)
  const [filter,      setFilter]     = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [activeTab,   setActiveTab]  = useState<'appointments' | 'invoices' | 'myfile'>('appointments')
  const { lang } = useI18n()

  // Show login wall for guests
  if (!isSignedIn) return <LoginWall lang={lang} />

  // Show profile completion wall for patients who haven't completed their profile
  if (currentUser !== undefined && currentUser && currentUser.role === 'guest' && !currentUser.profileCompleted) {
    return <ProfileCompletionWall lang={lang} currentUser={currentUser} />
  }

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await cancelAppt({ appointmentId: cancelId, reason: cancelReason })
      toast.success(lang === 'ar' ? 'تم إلغاء الموعد' : 'Appointment cancelled')
      setCancelId(null)
      setCancelReason('')
    } catch {
      toast.error(lang === 'ar' ? 'فشل الإلغاء' : 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await patientSoftDelete({ appointmentId: deleteId })
      toast.success(lang === 'ar' ? 'تم حذف الموعد من قائمتك' : 'Appointment removed from your list')
      setDeleteId(null)
    } catch {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

    const filtered = appointments?.filter(a => filter === 'all' || a.status === filter)

  const counts = {
    all:       appointments?.length ?? 0,
    pending:   appointments?.filter(a => a.status === 'pending').length ?? 0,
    confirmed: appointments?.filter(a => a.status === 'confirmed').length ?? 0,
    completed: appointments?.filter(a => a.status === 'completed').length ?? 0,
    cancelled: appointments?.filter(a => a.status === 'cancelled').length ?? 0,
  }

  const filterTabs: { key: typeof filter; label: string; labelAr: string }[] = [
    { key: 'all',       label: 'All',       labelAr: 'الكل' },
    { key: 'pending',   label: 'Pending',   labelAr: 'انتظار' },
    { key: 'confirmed', label: 'Confirmed', labelAr: 'مؤكدة' },
    { key: 'completed', label: 'Completed', labelAr: 'مكتملة' },
    { key: 'cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-125 h-125 bg-primary/6 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-teal-300/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
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
                {lang === 'ar' ? 'تتبّع وأدر مواعيدك والفواتير الطبية' : 'Track your appointments and medical invoices'}
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

        {/* ── Main Tabs ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-1 bg-muted/60 p-1 rounded-2xl mb-8 w-fit"
        >
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'appointments'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {lang === 'ar' ? 'الحجوزات' : 'Appointments'}
            {counts.all > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'appointments' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {counts.all}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'invoices'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="w-4 h-4" />
            {lang === 'ar' ? 'سجل الفواتير' : 'Invoice History'}
            {(invoices?.length ?? 0) > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'invoices' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {invoices?.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('myfile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'myfile'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            {lang === 'ar' ? 'ملفي' : 'My File'}
          </button>
        </motion.div>

        {/* ── APPOINTMENTS TAB ─────────────────────────────────────── */}
        {activeTab === 'appointments' && (
          <AnimatePresence mode="wait">
            <motion.div key="appointments-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {/* Stats strip */}
              {appointments && appointments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: lang === 'ar' ? 'إجمالي' : 'Total',     value: counts.all,       color: 'text-foreground',  bg: 'bg-card' },
                    { label: lang === 'ar' ? 'انتظار' : 'Pending',    value: counts.pending,   color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
                    { label: lang === 'ar' ? 'مؤكدة'  : 'Confirmed',  value: counts.confirmed, color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-950/30' },
                    { label: lang === 'ar' ? 'مكتملة' : 'Completed',  value: counts.completed, color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-800/30' },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className={`${s.bg} border border-border rounded-2xl p-4 text-center`}
                    >
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Filter pills */}
              {appointments && appointments.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-6">
                  {filterTabs.map(tab => (
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
                </div>
              )}

              {/* Appointment cards */}
              {appointments === undefined ? (
                <div className="grid gap-4">
                  {Array(3).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
                </div>
              ) : appointments.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
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
                    {lang === 'ar' ? 'احجز موعدك الأول مع أحد أطبائنا المتخصصين' : 'Book your first appointment with one of our expert doctors'}
                  </p>
                  <Link href="/all-doctors">
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 shadow-lg shadow-primary/20">
                      {lang === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
                    </Button>
                  </Link>
                </motion.div>
              ) : filtered?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  {lang === 'ar' ? 'لا توجد مواعيد في هذه الفئة' : 'No appointments in this category'}
                </div>
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
                          className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                        >
                          <div className={`h-1 w-full ${cfg?.dot ?? 'bg-muted'}`} />
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <motion.div
                                whileHover={{ scale: 1.08, rotate: 3 }}
                                className="w-14 h-14 bg-linear-to-br from-primary/20 to-teal-100 dark:to-teal-900/40 rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-primary/10"
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
                              {apt.status === 'cancelled' && (
                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => setDeleteId(apt._id)}
                                  className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-red-200 transition-colors font-medium flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  {lang === 'ar' ? 'حذف من قائمتي' : 'Remove'}
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
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── INVOICES TAB ────────────────────────────────────────── */}
        {activeTab === 'invoices' && (
          <AnimatePresence mode="wait">
            <motion.div key="invoices-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {invoices === undefined ? (
                <div className="grid gap-4">
                  {Array(3).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
                </div>
              ) : invoices.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Receipt className="w-12 h-12 text-primary" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">
                    {lang === 'ar' ? 'لا توجد فواتير بعد' : 'No invoices yet'}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {lang === 'ar'
                      ? 'ستظهر فواتيرك الطبية هنا بعد إنشائها من قبل طبيبك'
                      : 'Your medical invoices will appear here after your doctor creates them'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {invoices.map((inv) => (
                    <InvoiceCard key={inv._id} invoice={inv} lang={lang} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── MY FILE TAB ───────────────────────────────────────────── */}
        {activeTab === 'myfile' && (
          <AnimatePresence mode="wait">
            <motion.div key="myfile-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {currentUser === undefined ? (
                <div className="h-40 rounded-2xl bg-muted animate-pulse" />
              ) : currentUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {lang === 'ar' ? 'ملفك الشخصي — يظهر هذا الملف للطبيب والسكرتيرة عند البحث عنك' : 'Your patient file — visible to your doctor and secretary when they look you up'}
                  </div>
                  <PatientFileCard patient={currentUser} lang={lang} />
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Cancel modal */}
      <AnimatePresence>
        {cancelId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setCancelId(null); setCancelReason('') }}
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
                {lang === 'ar' ? 'إلغاء الموعد' : 'Cancel Appointment'}
              </h3>
              <p className="text-muted-foreground text-sm text-center mb-5 leading-relaxed">
                {lang === 'ar'
                  ? 'هل تريد إلغاء هذا الموعد؟ يمكنك إضافة سبب اختياري.'
                  : 'Do you want to cancel this appointment? You can add an optional reason.'}
              </p>
              
              {/* Reason input */}
              <div className="mb-6 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {lang === 'ar' ? '📝 السبب (اختياري)' : '📝 Reason (Optional)'}
                </Label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder={lang === 'ar' ? 'شرح السبب...' : 'Explain your reason...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setCancelId(null); setCancelReason('') }}>
                  {lang === 'ar' ? 'احتفظ به' : 'Keep it'}
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/20 gap-1.5"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === 'ar' ? 'جارٍ...' : 'Cancelling...'}
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      {lang === 'ar' ? 'نعم، إلغاء' : 'Yes, Cancel'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete modal - for cancelled appointments */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}
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
                className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5"
              >
                <Trash2 className="w-8 h-8 text-slate-500" />
              </motion.div>
              <h3 className="font-bold text-xl text-center mb-2">
                {lang === 'ar' ? 'حذف الموعد من قائمتك؟' : 'Remove from your list?'}
              </h3>
              <p className="text-muted-foreground text-sm text-center mb-7 leading-relaxed">
                {lang === 'ar'
                  ? 'سيختفي هذا الموعد من قائمتك فقط. لن يتأثر سجل المستشفى.' 
                  : 'This appointment will be removed from your list only. Hospital records are not affected.'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteId(null)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white rounded-full"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (lang === 'ar' ? 'جارٍ...' : 'Removing...') : (lang === 'ar' ? 'نعم، احذف' : 'Yes, Remove')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
