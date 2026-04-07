"use client"
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { Activity, Calendar, UserPlus, Users } from 'lucide-react'
import { motion } from 'framer-motion'

function Stats() {
  const stats = useQuery(api.stats.getStats)

  const statItems = [
    { label: 'Expert Doctors',      value: stats?.doctors     ?? 0,  icon: Users,    suffix: '+' },
    { label: 'Departments',          value: stats?.departments ?? 0,  icon: Activity, suffix: ''  },
    { label: 'Happy Patients',       value: stats?.patients    ?? 0,  icon: UserPlus, suffix: 'K+' },
    { label: 'Years Experience',     value: stats?.experience  ?? 0,  icon: Calendar, suffix: '+'  },
  ]

  return (
    <section className="py-14 bg-linear-to-r from-primary to-teal-600 relative overflow-hidden">
      {/* Decorative circles */}
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
              className="flex flex-col items-center text-white text-center"
            >
              <div className="mb-3 p-3 bg-white/15 backdrop-blur-sm rounded-2xl">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-4xl font-bold mb-1">
                {stats ? item.value.toLocaleString() : '…'}
                {stats && item.suffix}
              </h3>
              <p className="text-white/75 text-sm font-medium">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
