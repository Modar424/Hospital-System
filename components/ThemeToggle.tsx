"use client"

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved === 'dark' || (!saved && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  if (!mounted) return <div className="w-10 h-10" />

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="relative w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-primary/10 border border-border hover:border-primary/40 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {dark ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
