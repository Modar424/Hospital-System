"use client"
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Doc } from '@/convex/_generated/dataModel'
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Award, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { getCategoryLabel } from '@/lib/category-labels'
import { BookAppointmentModal } from './BookAppointmentModal'

interface DoctorCardProps {
  doctor: Doc<"doctors">
  index?: number
}

function DoctorCard({ doctor, index = 0 }: DoctorCardProps) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const { t, lang } = useI18n()

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Card
        className="overflow-hidden border border-border bg-card rounded-2xl shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all duration-500 group h-full flex flex-col"
        style={{ boxShadow: hovered ? '0 20px 60px -10px rgb(13 148 136 / 0.25)' : '0 4px 20px -5px rgb(13 148 136 / 0.08)' }}
      >
        <div className="relative h-72 w-full overflow-hidden bg-linear-to-br from-primary/10 to-teal-50 dark:from-primary/20 dark:to-teal-950">
          {!imgError && doctor.image ? (
            <>
              <motion.div
                className="w-full h-full"
                animate={{ scale: hovered ? 1.08 : 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover object-center w-full h-full"
                  onError={() => setImgError(true)}
                  priority={false}
                />
              </motion.div>
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 5 : 0 }}
                transition={{ duration: 0.4 }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-lg"
              >
                <span className="text-3xl font-bold text-primary">{doctor.name.charAt(0)}</span>
              </motion.div>
            </div>
          )}

          <motion.div
            className="absolute top-3 right-3 z-10"
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Badge className="bg-primary/90 text-white border-0 text-xs backdrop-blur-sm shadow-lg">
              {getCategoryLabel(doctor.category, lang)}
            </Badge>
          </motion.div>

          <motion.div
            className="absolute bottom-3 left-3 z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">4.9</span>
            </div>
          </motion.div>
        </div>

        <CardHeader className="p-4 pb-2">
          <motion.h3
            className="font-bold text-base truncate text-foreground"
            animate={{ color: hovered ? 'var(--primary)' : undefined }}
            transition={{ duration: 0.3 }}
          >
            {doctor.name}
          </motion.h3>
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{doctor.location}</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1 space-y-2.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                {doctor.experience} {t('doctors_exp')}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">{t('doctors_certified')}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {doctor.expertise.slice(0, 2).map((exp, i) => (
              <motion.div key={exp} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Badge variant="outline" className="text-xs border-primary/20 text-muted-foreground bg-primary/3">
                  {exp}
                </Badge>
              </motion.div>
            ))}
            {doctor.expertise.length > 2 && (
              <Badge variant="outline" className="text-xs border-primary/20 text-muted-foreground">
                +{doctor.expertise.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <BookAppointmentModal 
            doctorId={doctor._id} 
            doctorName={doctor.name} 
            department={doctor.category}
          />
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default DoctorCard
