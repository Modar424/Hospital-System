"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Stethoscope, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600 border-red-200' },
} as const

export default function AppointmentsPage() {
  const appointments = useQuery(api.appointments.myAppointments)
  const updateStatus = useMutation(api.appointments.updateStatus)
  const [cancelId, setCancelId] = useState<Id<"appointments"> | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await updateStatus({ appointmentId: cancelId, status: 'cancelled' })
      toast.success('Appointment cancelled')
      setCancelId(null)
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
        <p className="text-muted-foreground">Track and manage your upcoming and past appointments</p>
      </motion.div>

      {appointments === undefined ? (
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No appointments yet</h3>
          <p className="text-muted-foreground mb-6">Book your first appointment with one of our expert doctors</p>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">Book Appointment</Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt, i) => (
            <motion.div
              key={apt._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">
                    {apt.doctor?.name ?? 'Doctor TBD'}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {apt.department}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(apt.date).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  className={`text-xs border ${statusConfig[apt.status as keyof typeof statusConfig]?.className ?? ''}`}
                >
                  {statusConfig[apt.status as keyof typeof statusConfig]?.label ?? apt.status}
                </Badge>
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelId(apt._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg">Cancel Appointment?</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCancelId(null)}>
                Keep it
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
