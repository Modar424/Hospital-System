"use client"

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import DoctorCard from '@/components/DoctorCard'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function AllDoctorsPage() {
  const doctors = useQuery(api.doctors.getDoctors)
  const [search, setSearch] = useState('')

  const filtered = doctors?.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Our <span className="text-primary">Expert Doctors</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          Find the right specialist for your needs
        </p>
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-border focus:border-primary"
          />
        </div>
      </motion.div>

      {doctors === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(filtered ?? []).map((doctor, i) => (
            <motion.div
              key={doctor._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <DoctorCard doctor={doctor} />
            </motion.div>
          ))}
        </div>
      )}

      {filtered?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No doctors found matching your search.
        </div>
      )}
    </div>
  )
}
