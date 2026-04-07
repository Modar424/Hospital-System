"use client"
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import React, { useRef } from 'react'
import * as Icons from "lucide-react"
import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

function Categories() {
  const categories = useQuery(api.categories.get)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-primary">Medical Specialties</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Specialized medical care across a wide range of departments, ensuring comprehensive treatment for you and your family.
          </p>
        </motion.div>

        <div className="relative">
          {/* Left button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 w-10 h-10 bg-card border border-border rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrollable container */}
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group shrink w-44 p-6 bg-card border border-border rounded-2xl hover:border-primary/60 hover:bg-teal-50/60 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col items-center text-center gap-3"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors duration-300">
                    <IconComponent className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </motion.div>
              )
            }) || Array(6).fill(0).map((_, i) => (
              <div key={i} className="shrink w-44 h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>

          {/* Right button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 w-10 h-10 bg-card border border-border rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Categories
