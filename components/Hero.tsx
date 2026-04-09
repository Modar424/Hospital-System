"use client"

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { Id, Doc } from '@/convex/_generated/dataModel'
import { useWatch } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Calendar, Heart, Shield } from 'lucide-react'
import { useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'

const HospitalScene = dynamic(() => import('@/components/HospitalScene'), { ssr: false })

type FormData = {
  department: string
  doctorId?: string
  date: string
  notes?: string
}

const Hero = () => {
  const { t } = useI18n()
  const { isSignedIn } = useUser()
  const currentUser = useQuery(api.patients.getUser)
  const createAppointment = useMutation(api.appointments.createAppointment)
  const categories = useQuery(api.categories.get)

  const formSchema = z.object({
    department: z.string().min(1, t('hero_error_department')),
    doctorId: z.string().optional(),
    date: z.string().min(1, t('hero_error_date')).refine(
      (d) => new Date(d) > new Date(),
      { message: t('hero_error_future_date') }
    ),
    notes: z.string().optional(),
  })

  // Typing effect state
  const [displayText, setDisplayText] = useState('')
  const fullText = t('hero_title')

  useEffect(() => {
    const timer = setTimeout(() => {
      // If the language changed, restart the typing animation from the first character.
      if (!fullText.startsWith(displayText)) {
        setDisplayText(fullText.slice(0, 1))
        return
      }

      if (displayText.length < fullText.length) {
        setDisplayText(fullText.slice(0, displayText.length + 1))
      }
    }, 60)

    return () => clearTimeout(timer)
  }, [displayText, fullText])

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDateTime = now.toISOString().slice(0, 16)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { department: '', doctorId: '', date: '', notes: '' },
  })

  const selectedDepartment = useWatch({ control: form.control, name: 'department' })
  const doctors = useQuery(
    api.doctors.getDoctorsByCategory,
    selectedDepartment ? { category: selectedDepartment } : 'skip'
  )

  const onSubmit = async (data: FormData) => {
    try {
      await createAppointment({
        department: data.department,
        doctorId: data.doctorId ? (data.doctorId as Id<"doctors">) : undefined,
        date: data.date,
        notes: data.notes,
      })
      toast.success(t('hero_success'))
      form.reset()
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('hero_error')
      toast.error(msg)
    }
  }

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background hero-mesh">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center py-16">
        {/* Left: Hero text + booking form */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              <span className="flex flex-wrap gap-3">
                {displayText.split(' ').map((word, idx) => (
                  <span 
                    key={idx}
                    className={word === 'Care' ? 'w-1/4' : ''}
                  >
                    {word === 'Medical' || word === 'Care' ? (
                      <span className="text-primary">{word}</span>
                    ) : (
                      word
                    )}
                  </span>
                ))}
                {displayText.length < fullText.length && (
                  <span className="animate-pulse">|</span>
                )}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              {t('hero_subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full shadow-lg shadow-primary/25">
              <Calendar className="w-4 h-4" />
              {t('hero_book')}
            </Button>
            <Link href="/all-doctors">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 rounded-full">
                <Shield className="w-4 h-4 mr-2" />
                {t('hero_find')}
              </Button>
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex gap-12 pt-2 items-center">
            {[['500+', t('hero_stat_doctors')], ['10K+', t('hero_stat_patients')], ['98%', t('hero_stat_satisfaction')]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-primary">{num}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ml-4"
            >
              <Heart className="w-4 h-4" />
              {t('hero_badge')}
            </motion.div>
          </div>

          {/* Booking form / Sign-in gate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border max-w-md"
          >
            <h3 className="text-xl font-semibold mb-4 text-foreground">{t('hero_quick_booking')}</h3>

            {!isSignedIn ? (
              <div className="text-center space-y-4 py-4">
                <p className="text-muted-foreground text-sm">{t('hero_signin_prompt')}</p>
                <SignInButton mode="modal">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full">
                    {t('nav_signin')}
                  </Button>
                </SignInButton>
              </div>
            ) : currentUser && currentUser.role === 'guest' && !currentUser.profileCompleted ? (
              <div className="text-center space-y-4 py-4">
                <p className="text-muted-foreground text-sm">Please complete your profile before booking an appointment.</p>
                <Link href="/appointments">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                    Complete Profile to Book
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Department Selection */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(v) => { field.onChange(v); form.setValue('doctorId', '') }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-border focus:border-primary">
                            <SelectValue placeholder={t('hero_dept_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat._id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          )) ?? (
                            <>
                              <SelectItem value="Cardiology">{t('hero_dept_cardiology')}</SelectItem>
                              <SelectItem value="Neurology">{t('hero_dept_neurology')}</SelectItem>
                              <SelectItem value="Pediatrics">{t('hero_dept_pediatrics')}</SelectItem>
                              <SelectItem value="Orthopedics">{t('hero_dept_orthopedics')}</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          min={minDateTime}
                          {...field}
                          className="border-border focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Doctor Selection */}
                {selectedDepartment && (
                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-border focus:border-primary">
                              {field.value ? (
                                <span>{doctors?.find(d => d._id === field.value)?.name}</span>
                              ) : (
                                <SelectValue placeholder={
                                  doctors === undefined 
                                    ? t('hero_loading_doctors')
                                    : t('hero_doctor_optional')
                                } />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctors && doctors.length > 0 ? (
                              doctors.map((doctor: Doc<"doctors">) => (
                                <SelectItem key={doctor._id} value={doctor._id}>
                                  {doctor.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                {doctors === undefined ? t('hero_loading') : t('hero_no_doctors')}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={t('hero_notes_placeholder')}
                          {...field}
                          className="border-border focus:border-primary resize-none min-h-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-full">
                  {t('hero_submit')}
                </Button>
              </form>
            </Form>
            )}
          </motion.div>
        </motion.div>

        {/* Right: 3D Hospital Scene */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="h-180 w-full rounded-2xl overflow-hidden shadow-2xl border border-border/50">
            <HospitalScene />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
