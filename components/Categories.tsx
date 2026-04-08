"use client"
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import React, { useRef, useEffect, useState } from 'react'
import * as Icons from "lucide-react"
import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useI18n } from '@/lib/i18n'

function Categories() {
  const categories = useQuery(api.categories.get)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (!categories || categories.length === 0) return
    let direction = 1
    const step = 1.5
    const tick = () => {
      if (isPaused || !scrollRef.current) return
      const el = scrollRef.current
      el.scrollLeft += step * direction
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) direction = -1
      if (el.scrollLeft <= 0) direction = 1
    }
    const id = setInterval(tick, 16)
    return () => clearInterval(id)
  }, [categories, isPaused])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4"
          >
            {t('cat_badge')}
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cat_title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('cat_subtitle')}
          </p>
        </motion.div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 w-10 h-10 bg-card border border-border rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {categories?.map((category, index) => {
              const IconComponent = (Icons[category.icon as keyof typeof Icons] || Icons.Activity) as LucideIcon
              return (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 30, scale: 0.85 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6, scale: 1.05, transition: { duration: 0.25 } }}
                  className="group shrink-0 w-44 p-6 bg-card border border-border rounded-2xl hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-3"
                  style={{ scrollSnapAlign: 'start', boxShadow: '0 2px 12px -3px rgb(13 148 136 / 0.06)' }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors duration-300 shadow-sm"
                    whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">
                    {category.name}
                  </h3>
                  <motion.div className="w-0 h-0.5 bg-primary rounded-full group-hover:w-8 transition-all duration-300" />
                </motion.div>
              )
            }) || Array(6).fill(0).map((_, i) => (
              <div key={i} className="shrink-0 w-44 h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 w-10 h-10 bg-card border border-border rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </section>
  )
}

export default Categories
