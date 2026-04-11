"use client"

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Star, Phone, ArrowLeft, Clock, Award, Briefcase, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@clerk/nextjs'
import { SignInButton } from '@clerk/nextjs'

export default function DoctorProfilePage() {
  const params = useParams()
  const { isSignedIn } = useAuth()
  const id = params.id as Id<"doctors">
  const doctor = useQuery(api.doctors.getDoctorById, { id })
  const createAppointment = useMutation(api.appointments.createAppointment)
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)

  const handleBook = async () => {
    if (!date || !doctor) return
    setBooking(true)
    try {
      await createAppointment({
        department: doctor.category,
        doctorId: doctor._id,
        date,
        notes,
      })
      toast.success('Appointment booked successfully!')
      setDate('')
      setNotes('')
    } catch (error) {
      console.error('Booking error:', error)
      let msg = 'Failed to book appointment'
      if (error instanceof Error) {
        msg = error.message
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        msg = (error as { message: string }).message
      }
      toast.error(msg)
    } finally {
      setBooking(false)
    }
  }

  if (doctor === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (doctor === null) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Doctor not found.</p>
        <Link href="/all-doctors">
          <Button className="mt-4 bg-primary hover:bg-primary/90 text-white rounded-full">Back to Doctors</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link href="/all-doctors" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Doctors
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-br from-primary/5 to-teal-50 rounded-2xl border border-border p-6 flex items-start gap-6"
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 border-4 border-white shadow-lg">
              <span className="text-4xl font-bold text-primary">{doctor.name.charAt(0)}</span>
            </div>
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl font-bold text-foreground">{doctor.name}</h1>
              <Badge className="bg-primary/10 text-primary border-0 text-sm">{doctor.category}</Badge>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                ))}
                <span className="text-sm text-muted-foreground ml-2">4.0 / 5.0</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{doctor.location}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary" />{doctor.contact}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { icon: Briefcase, label: 'Experience', value: `${doctor.experience}+ yrs` },
              { icon: Award, label: 'Specialty', value: doctor.category },
              { icon: Clock, label: 'Availability', value: 'Mon – Fri' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-semibold text-sm text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-semibold text-lg mb-3">About</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{doctor.bio}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-semibold text-lg mb-3">Areas of Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {doctor.expertise.map((exp) => (
                <Badge key={exp} variant="outline" className="border-primary/30 text-foreground bg-primary/5 px-3 py-1">
                  {exp}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 h-fit sticky top-24"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">Book Appointment</h2>
          </div>

          {!isSignedIn ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in to book an appointment with this doctor.
              </p>
              <SignInButton mode="modal">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-2.5 font-medium shadow-md shadow-primary/20">
                  Sign In to Book
                </Button>
              </SignInButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Select Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-border focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Notes <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms..."
                  className="w-full min-h-25 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={handleBook}
                disabled={!date || booking}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-2.5 font-medium shadow-md shadow-primary/20"
              >
                {booking ? 'Booking…' : 'Confirm Booking'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You&apos;ll receive a confirmation email after booking
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
