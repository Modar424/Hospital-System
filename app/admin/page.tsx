"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion, AnimatePresence } from 'framer-motion'
import {
   Users, Stethoscope, TrendingUp, Clock,
  Plus, LayoutDashboard, ShieldCheck, Bell, Send,
  UserCheck, X, CheckCircle2, Edit2, Trash2, Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import AdminNotificationsPanel from '@/components/AdminNotificationsPanel'
import { FileText } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { getCategoryLabel } from '@/lib/category-labels'

type NavItem = 'dashboard' | 'doctors' | 'users' | 'notify' | 'pharmacy' | 'reports'
type Role = 'admin' | 'guest' | 'doctor' | 'secretary'

const roleConfig: Record<Role, { label: string; color: string }> = {
  admin:     { label: 'Admin',     color: 'bg-primary/10 text-primary border-primary/20' },
  doctor:    { label: 'Doctor',    color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800' },
  secretary: { label: 'Secretary', color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800' },
  guest:     { label: 'Patient',   color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
}

export default function AdminDashboardPage() {
  const { lang, t } = useI18n()
  const appointments  = useQuery(api.appointments.getAppointments)
  const doctors       = useQuery(api.doctors.getDoctors)
  const allUsers      = useQuery(api.patients.getAllUsers)
  const patientStats  = useQuery(api.patients.getPatientStats)
  const unreadNotifCount = useQuery(api.adminNotifications?.getAdminUnreadCount ?? (() => 0))
  const setRole       = useMutation(api.patients.setRole)
  const sendNotif     = useMutation(api.notifications.sendMeetingRequest)
  const setDoctorPass = useMutation(api.doctors.setDoctorPassword)
  const deleteDoctor  = useMutation(api.doctors.deleteDoctor)

  const [activeNav,    setActiveNav]    = useState<NavItem>('dashboard')
  const [notifTarget,  setNotifTarget]  = useState<string>('')
  const [notifMsg,     setNotifMsg]     = useState<string>('')
  const [notifDate,    setNotifDate]    = useState<string>('')
  const [sending,      setSending]      = useState(false)
  const [passModal,    setPassModal]    = useState<{ id: Id<"doctors">; name: string } | null>(null)
  const [newPass,      setNewPass]      = useState('')
  const [deleteModal,  setDeleteModal]  = useState<{ id: Id<"doctors">; name: string } | null>(null)
  const [isDeleting,   setIsDeleting]   = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalPatients = patientStats?.totalPatients ?? 0
  const todayPatients = patientStats?.todayPatients ?? 0
  const todayStr      = new Date().toDateString()
  const todayAppts    = appointments?.filter(a => new Date(a.date).toDateString() === todayStr).length ?? 0

  const mostBooked = (() => {
    if (!appointments) return null
    const counts: Record<string, number> = {}
    appointments.forEach(a => { if (a.doctor?.name) counts[a.doctor.name] = (counts[a.doctor.name] ?? 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : null
  })()

  const doctorUsers = allUsers?.filter(u => u.role === 'doctor') ?? []
  const adminCount = allUsers?.filter(u => u.role === 'admin').length ?? 0

  const statCards = [
    { label: lang === 'ar' ? 'إجمالي المرضى' : 'Total Patients',    value: totalPatients, icon: Users,      color: 'text-primary',     bg: 'bg-primary/10'  },
    { label: lang === 'ar' ? 'مرضى اليوم' : "Today's Patients",  value: todayPatients, icon: UserCheck,  color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-950/40'    },
    { label: lang === 'ar' ? 'المواعيد اليوم' : "Today's Appts",     value: todayAppts,    icon: Clock,      color: 'text-amber-600',   bg: 'bg-amber-100 dark:bg-amber-950/40'  },
    { label: lang === 'ar' ? 'إجمالي الأطباء' : 'Total Doctors',     value: doctors?.length ?? 0, icon: Stethoscope, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-950/40' },
  ]

  const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: lang === 'ar' ? 'لوحة البيانات' : 'Dashboard',          icon: LayoutDashboard },
    { key: 'doctors',   label: lang === 'ar' ? 'الأطباء' : 'Doctors',            icon: Stethoscope     },
    { key: 'users',     label: lang === 'ar' ? 'المستخدمون والأدوار' : 'Users & Roles',      icon: ShieldCheck     },
    { key: 'notify',    label: lang === 'ar' ? 'إرسال إشعار' : 'Send Notification',  icon: Bell            },
    { key: 'reports',   label: t('admin_reports'),   icon: FileText        },
  ]

  const [doctorPickModal, setDoctorPickModal] = useState<{ userId: Id<"patients">; userName: string } | null>(null)

  const handleRoleChange = async (userId: Id<"patients">, newRole: Role, doctorId?: Id<"doctors">) => {
    try {
      await setRole({ userId, role: newRole, doctorId })
      toast.success(`Role updated to ${roleConfig[newRole].label}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  const handleSendNotif = async () => {
    if (!notifTarget || !notifMsg.trim()) {
      toast.error(t('admin_notif_validation'))
      return
    }
    setSending(true)
    try {
      await sendNotif({
        toDoctorUserId: notifTarget as Id<"patients">,
        message: notifMsg,
        scheduledAt: notifDate ? new Date(notifDate).getTime() : undefined,
      })
      toast.success(t('admin_notif_success'))
      setNotifMsg('')
      setNotifDate('')
      setNotifTarget('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin_notif_fail'))
    } finally {
      setSending(false)
    }
  }

  const handleDeleteDoctor = async () => {
    if (!deleteModal) return
    try {
      setIsDeleting(true)
      await deleteDoctor({ doctorId: deleteModal.id })
      toast.success(`${deleteModal.name} ${t('admin_delete_success')}`)
      setDeleteModal(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin_delete_fail'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">HealWell</div>
            <div className="text-xs text-slate-400">{t('admin_panel')}</div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'reports') {
                  setNotificationsOpen(true)
                } else {
                  setActiveNav(key)
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeNav === key
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
              {key === 'reports' && unreadNotifCount ? (
                <Badge className="bg-red-500 text-white rounded-full text-xs px-2 py-0.5">
                  {unreadNotifCount}
                </Badge>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white justify-start gap-2">
              {t('admin_back_site')}
            </Button>
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-auto">

        {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
        {activeNav === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">{t('admin_overview')}</h1>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Most booked doctor */}
            {mostBooked && (
              <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('admin_most_booked')}</div>
                  <div className="font-semibold text-lg">{mostBooked}</div>
                </div>
              </div>
            )}

            {/* Recent appointments — view only */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">{t('admin_recent_appts')}</h2>
                <Badge className="bg-muted text-muted-foreground text-xs border-0">
                  {t('admin_view_only')}
                </Badge>
              </div>
              <div className="space-y-2">
                {appointments?.slice(0, 6).map(apt => (
                  <div key={apt._id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium">{apt.patient?.name ?? t('admin_unknown_patient')}</div>
                      <div className="text-xs text-muted-foreground">
                        {apt.doctor?.name ? `${apt.doctor.name}` : apt.department} · {new Date(apt.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={cn('text-xs border', {
                      'bg-amber-50 text-amber-700 border-amber-200':  apt.status === 'pending',
                      'bg-teal-50 text-teal-700 border-teal-200':     apt.status === 'confirmed',
                      'bg-slate-100 text-slate-600 border-slate-200': apt.status === 'completed',
                      'bg-red-50 text-red-600 border-red-200':        apt.status === 'cancelled',
                    })}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
                {(!appointments || appointments.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">{t('admin_no_appts')}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ DOCTORS ════════════════════════════════════════════════════ */}
        {activeNav === 'doctors' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">{t('admin_doctors')}</h1>
              <Link href="/admin/doctors/add">
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full">
                  <Plus className="w-4 h-4" /> {t('admin_add_doctor')}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors?.map((doc, i) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">{doc.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{getCategoryLabel(doc.category, lang)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{doc.location}</div>
                    <Badge className="mt-2 text-xs bg-primary/10 text-primary border-0">
                      {doc.experience}+ {t('admin_yrs_exp')}
                    </Badge>
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {/* Set Password Button */}
                      <button
                        onClick={() => setPassModal({ id: doc._id, name: doc.name })}
                        className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        title={t('admin_set_pass_title')}
                      >
                        {t('admin_set_pass_btn')}
                      </button>

                      {/* Edit Button */}
                      <Link href={`/admin/doctors/${doc._id}/edit`}>
                        <button
                          className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-blue-400/40 hover:text-blue-600 transition-colors flex items-center gap-1"
                          title={t('admin_edit')}
                        >
                          <Edit2 className="w-3 h-3" />
                          {t('admin_edit')}
                        </button>
                      </Link>

                      {/* Delete Button with AlertDialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => setDeleteModal({ id: doc._id, name: doc.name })}
                            className="text-xs px-2.5 py-1 rounded-full border border-border text-red-600/60 hover:border-red-400/40 hover:text-red-600 transition-colors flex items-center gap-1"
                            title={t('admin_delete_doctor')}
                          >
                            <Trash2 className="w-3 h-3" />
                            {t('admin_delete')}
                          </button>
                        </AlertDialogTrigger>
                        {deleteModal?.id === doc._id && (
                          <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin_delete_title')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin_delete_desc').replace('هذا الطبيب؟', `<strong>${deleteModal.name}</strong>؟`)}
                                {lang !== 'ar' && <><strong>{deleteModal.name}</strong>? This action cannot be undone and will also delete all associated appointments.</>}
                                {lang === 'ar' && <>هل أنت متأكد من حذف <strong>{deleteModal.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء وسيؤدي إلى حذف جميع المواعيد المرتبطة.</>}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-3 justify-end">
                              <AlertDialogCancel>{t('admin_cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDoctor()}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                    {t('admin_deleting')}
                                  </>
                                ) : (
                                  t('admin_delete')
                                )}
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              )) ?? Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ USERS & ROLES ═══════════════════════════════════════════════ */}
        {activeNav === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold mb-2">{t('admin_users_title')}</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t('admin_users_subtitle')}
            </p>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {[t('admin_col_name'), t('admin_col_email'), t('admin_col_role'), t('admin_col_change')].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allUsers?.map(u => (
                      <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-xs border', roleConfig[u.role as Role]?.color)}>
                            {roleConfig[u.role as Role]?.label ?? u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {u.role === 'admin' && adminCount === 1 && (
                              <span className="text-[11px] px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                                {t('admin_last_admin')}
                              </span>
                            )}
                            {(['guest', 'doctor', 'secretary', 'admin'] as Role[]).map(r => (
                              r !== u.role && !(u.role === 'admin' && adminCount === 1 && r !== 'admin') && (
                                <button
                                  key={r}
                                  onClick={() => {
                                    if (r === 'doctor') {
                                      setDoctorPickModal({ userId: u._id, userName: u.name })
                                    } else {
                                      handleRoleChange(u._id, r)
                                    }
                                  }}
                                  className={cn(
                                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                                    roleConfig[r].color,
                                    'hover:opacity-80'
                                  )}
                                >
                                  → {roleConfig[r].label}
                                </button>
                              )
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">{t('admin_no_users')}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ SEND NOTIFICATION ═══════════════════════════════════════════ */}
        {activeNav === 'notify' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
            <h1 className="text-2xl font-bold mb-2">{t('admin_notify_title')}</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {t('admin_notify_subtitle')}
            </p>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              {/* Doctor selector */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin_select_doctor')}</label>
                {doctorUsers.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">
                    {t('admin_no_doctor_users')} <button onClick={() => setActiveNav('users')} className="text-primary underline">{t('admin_no_doctor_users2')}</button> {t('admin_no_doctor_users3')}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {doctorUsers.map(doc => (
                      <button
                        key={doc._id}
                        onClick={() => setNotifTarget(doc._id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                          notifTarget === doc._id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <div className="w-9 h-9 bg-teal-100 dark:bg-teal-950/40 rounded-lg flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.email}</div>
                        </div>
                        {notifTarget === doc._id && (
                          <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Meeting time (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin_meeting_time')} <span className="text-muted-foreground font-normal">{t('admin_meeting_optional')}</span>
                </label>
                <input
                  type="datetime-local"
                  value={notifDate}
                  onChange={e => setNotifDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin_message_label')}</label>
                <textarea
                  value={notifMsg}
                  onChange={e => setNotifMsg(e.target.value)}
                  rows={4}
                  placeholder={t('admin_message_placeholder')}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">{notifMsg.length}/500</div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full gap-2 shadow-lg shadow-primary/20"
                onClick={handleSendNotif}
                disabled={sending || !notifTarget || !notifMsg.trim()}
              >
                <Send className="w-4 h-4" />
                {sending ? t('admin_sending_btn') : t('admin_send_btn')}
              </Button>
            </div>
          </motion.div>
        )}

      </main>
      {/* ── Set Doctor Password Modal ────────────────────────────── */}
      <AnimatePresence>
        {passModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setPassModal(null); setNewPass('') }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg">{t('admin_set_pass_title')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{passModal.name}</p>
                </div>
                <button onClick={() => { setPassModal(null); setNewPass('') }} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder={t('admin_set_pass_placeholder')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4" />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setPassModal(null); setNewPass('') }}>{t('admin_cancel')}</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full"
                  disabled={!newPass.trim()}
                  onClick={async () => {
                    try {
                      await setDoctorPass({ doctorId: passModal.id, password: newPass.trim() })
                      toast.success(t('admin_pass_success'))
                      setPassModal(null); setNewPass('')
                    } catch { toast.error(t('admin_pass_fail')) }
                  }}>
                  {t('admin_save_password')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Doctor Picker Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {doctorPickModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDoctorPickModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg">{t('admin_link_doctor')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('admin_link_doctor_subtitle')} <strong>{doctorPickModal.userName}</strong>
                  </p>
                </div>
                <button onClick={() => setDoctorPickModal(null)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {doctors?.map(doc => (
                  <button
                    key={doc._id}
                    onClick={async () => {
                      await handleRoleChange(doctorPickModal.userId, 'doctor', doc._id)
                      setDoctorPickModal(null)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-950/40 rounded-xl flex items-center justify-center shrink-0">
                      <span className="font-bold text-teal-700 dark:text-teal-400">{doc.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{getCategoryLabel(doc.category, lang)} · {doc.location}</div>
                    </div>
                  </button>
                ))}
                {(!doctors || doctors.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('admin_no_doctors_found')} <Link href="/admin/doctors/add" className="text-primary underline">{t('admin_add_doctor_first')}</Link>.
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => setDoctorPickModal(null)}
              >
                {t('admin_cancel')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Admin Notifications Panel ──────────────────────────────── */}
      <AdminNotificationsPanel 
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  )
}
