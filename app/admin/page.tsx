"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion } from 'framer-motion'
import {
  Calendar, Users, CheckCircle2, Stethoscope,
  TrendingUp, Clock, XCircle, Plus, LayoutDashboard,
  ClipboardList, ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const statusConfig = {
  pending:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600 border-red-200' },
} as const

type NavItem = 'dashboard' | 'appointments' | 'doctors' | 'users'

export default function AdminDashboardPage() {
  const appointments  = useQuery(api.appointments.getAppointments)
  const doctors       = useQuery(api.doctors.getDoctors)
  const allUsers      = useQuery(api.patients.getAllUsers)
  const updateStatus  = useMutation(api.appointments.updateStatus)
  const setRole       = useMutation(api.patients.setRole)

  const [activeNav,    setActiveNav]    = useState<NavItem>('dashboard')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page,         setPage]         = useState(0)
  const PER_PAGE = 20

  // ── Stats ──────────────────────────────────────────────────
  const total        = appointments?.length ?? 0
  const todayStr     = new Date().toDateString()
  const todayCount   = appointments?.filter(a => new Date(a.date).toDateString() === todayStr).length ?? 0
  const confirmedCnt = appointments?.filter(a => a.status === 'confirmed').length ?? 0
  const confirmedPct = total > 0 ? Math.round((confirmedCnt / total) * 100) : 0

  const mostBooked = (() => {
    if (!appointments) return null
    const counts: Record<string, number> = {}
    appointments.forEach(a => { if (a.doctor?.name) counts[a.doctor.name] = (counts[a.doctor.name] ?? 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : null
  })()

  const filtered = statusFilter === 'all'
    ? appointments
    : appointments?.filter(a => a.status === statusFilter)

  const paginated = filtered?.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  // Reset page when filter changes
  useEffect(() => { setPage(0) }, [statusFilter])

  const handleStatus = async (id: Id<"appointments">, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateStatus({ appointmentId: id, status })
      toast.success(`Appointment ${status}`)
    } catch { toast.error('Failed to update') }
  }

  const handleRoleToggle = async (userId: Id<"patients">, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'guest' : 'admin'
    try {
      await setRole({ userId, role: newRole as 'admin' | 'guest' })
      toast.success(`Role changed to ${newRole}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error'
      toast.error(msg)
    }
  }

  const statCards = [
    { label: 'Total Appointments', value: total,             icon: Calendar,    color: 'text-primary',     bg: 'bg-primary/10'  },
    { label: "Today's",            value: todayCount,        icon: Clock,       color: 'text-blue-600',    bg: 'bg-blue-100'    },
    { label: 'Confirmed %',        value: `${confirmedPct}%`,icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Doctors',            value: doctors?.length ?? 0, icon: Stethoscope, color: 'text-violet-600', bg: 'bg-violet-100' },
  ]

  const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { key: 'appointments', label: 'Appointments', icon: ClipboardList   },
    { key: 'doctors',      label: 'Doctors',      icon: Users           },
    { key: 'users',        label: 'Users',        icon: ShieldCheck     },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-slate-200 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white">HealWell</span>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveNav(key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeNav === key
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
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

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">

        {/* ── DASHBOARD ── */}
        {activeNav === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border-t-4 border-t-primary border border-border rounded-2xl p-5 shadow-sm"
                >
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {mostBooked && (
              <div className="bg-card border border-border rounded-2xl p-5 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Most Booked Doctor</div>
                  <div className="font-semibold text-lg">Dr. {mostBooked}</div>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Recent Appointments</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveNav('appointments')} className="text-primary text-xs">
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {appointments?.slice(0, 5).map(apt => (
                  <div key={apt._id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium">{apt.patient?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {apt.doctor?.name ? `Dr. ${apt.doctor.name}` : apt.department} · {new Date(apt.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={`text-xs border ${statusConfig[apt.status as keyof typeof statusConfig]?.className}`}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeNav === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Appointments</h1>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border capitalize transition-colors',
                      statusFilter === s
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {['Date', 'Patient', 'Doctor', 'Department', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated?.map(apt => (
                      <tr key={apt._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(apt.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{apt.patient?.name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{apt.patient?.email}</div>
                        </td>
                        <td className="px-4 py-3">{apt.doctor?.name ? `Dr. ${apt.doctor.name}` : '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{apt.department}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs border ${statusConfig[apt.status as keyof typeof statusConfig]?.className}`}>
                            {apt.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {apt.status === 'pending' && (
                              <>
                                <button onClick={() => handleStatus(apt._id, 'confirmed')}
                                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Confirm">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleStatus(apt._id, 'cancelled')}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {apt.status === 'confirmed' && (
                              <button onClick={() => handleStatus(apt._id, 'completed')}
                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                                Mark Done
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">No appointments found.</div>
                )}
              </div>

              {/* Pagination */}
              {(filtered?.length ?? 0) > PER_PAGE && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
                  <span>
                    Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered?.length ?? 0)} of {filtered?.length ?? 0}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * PER_PAGE >= (filtered?.length ?? 0)}
                      className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── DOCTORS ── */}
        {activeNav === 'doctors' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Doctors</h1>
              <Link href="/admin/doctors/add">
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full">
                  <Plus className="w-4 h-4" /> Add Doctor
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
                    <div className="text-xs text-muted-foreground">{doc.category}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{doc.location}</div>
                    <Badge className="mt-2 text-xs bg-primary/10 text-primary border-0">
                      {doc.experience}+ yrs exp
                    </Badge>
                  </div>
                </motion.div>
              )) ?? Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── USERS ── */}
        {activeNav === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold mb-2">Users & Roles</h1>
            <p className="text-muted-foreground text-sm mb-6">Manage user access levels. Promote or demote users.</p>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {['Name', 'Email', 'Role', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allUsers?.map(u => (
                    <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          'text-xs border',
                          u.role === 'admin'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        )}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                          className={cn(
                            'text-xs px-3 py-1.5 rounded-full border transition-colors',
                            u.role === 'admin'
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-primary/30 text-primary hover:bg-primary/5'
                          )}
                        >
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allUsers?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
              )}
            </div>
          </motion.div>
        )}

      </main>
    </div>
  )
}
