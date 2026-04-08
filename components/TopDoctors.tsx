"use client"
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import DoctorCard from '@/components/DoctorCard'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

function TopDoctors() {
  const doctors = useQuery(api.doctors.getDoctors)
  const topDoctors = doctors ? doctors.slice(0, 4) : []
  const { t } = useI18n()

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4"
        >
          <div>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-3"
            >
              {t('doctors_badge')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t('doctors_title')}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              {t('doctors_subtitle')}
            </p>
          </div>
          <Link href="/all-doctors">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              {t('doctors_view_all')} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors ? (
            topDoctors.map((doc, i) => (
              <DoctorCard key={doc._id} doctor={doc} index={i} />
            ))
          ) : (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-card border border-border animate-pulse" />
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default TopDoctors
