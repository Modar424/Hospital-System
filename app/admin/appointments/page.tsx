"use client"
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600 border-red-200' },
} as const

export default function AdminAppointmentsPage() {
  const appointments = useQuery(api.appointments.getAppointments)
  const updateStatus = useMutation(api.appointments.updateStatus)

  const handleStatusUpdate = async (id: Id<"appointments">, status: "confirmed" | "cancelled" | "completed") => {
    try {
      await updateStatus({ appointmentId: id, status })
      toast.success(`Appointment ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (!appointments) {
    return <div className="p-10 text-center text-muted-foreground">Loading appointments...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Appointment Management</h1>
        <Link href="/admin/doctors/add">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">Add Doctor</Button>
        </Link>
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
              {appointments.map((apt) => (
                <tr key={apt._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(apt.date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{apt.patient?.name ?? 'Unknown'}</div>
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
                          <button onClick={() => handleStatusUpdate(apt._id, "confirmed")}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Confirm">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleStatusUpdate(apt._id, "cancelled")}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => handleStatusUpdate(apt._id, "completed")}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                          Mark Done
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
