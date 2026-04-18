"use client"
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { Activity, Calendar, UserPlus, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

function Stats() {
  const stats = useQuery(api.stats.getStats)
  const { t } = useI18n()

  const statItems = [
    { label: t('stat_doctors'),    value: stats?.doctors     ?? 0, icon: Users,    suffix: '+' },
    { label: t('stat_departments'),value: stats?.departments ?? 0, icon: Activity, suffix: '' },
    { label: t('stat_patients'),   value: stats?.patients    ?? 0, icon: UserPlus, suffix: 'K+' },
    { label: t('stat_experience'), value: stats?.experience  ?? 0, icon: Calendar, suffix: '+' },
  ]

  return (
    <section className="py-14 bg-linear-to-r from-primary to-teal-600 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/5 rounded-full" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center to-teal-600 text-center"
            >
              <div className="mb-3 p-3 bg-white/70 backdrop-blur-sm rounded-2xl">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-4xl font-bold mb-1">
                {stats ? item.value.toLocaleString() : '…'}
                {stats && item.suffix}
              </h3>
              <p className="to-teal-600 text-sm font-medium">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
