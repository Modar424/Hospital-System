"use client"

import { useI18n } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'

export function LangToggle() {
  const { lang, setLang, t } = useI18n()

  const toggle = () => setLang(lang === 'en' ? 'ar' : 'en')

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="relative flex items-center gap-1.5 h-10 px-3 rounded-full bg-muted hover:bg-primary/10 border border-border hover:border-primary/40 transition-colors duration-200 text-sm font-medium"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4 text-primary shrink-0" />
      <AnimatePresence mode="wait">
        <motion.span
          key={lang}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="text-foreground leading-none"
        >
          {t('lang_label')}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
