"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, HeartPulse, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export default function ContactPage() {
  const { t, isRTL, lang } = useI18n()

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setStatus('sending')
    // Simulate sending
    await new Promise(r => setTimeout(r, 1400))
    setStatus('success')
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    setTimeout(() => setStatus('idle'), 5000)
  }

  const infoCards = [
    {
      icon: MapPin,
      label: t('contact_info_address'),
      value: t('contact_info_address_val'),
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      icon: Phone,
      label: t('contact_info_phone'),
      value: t('contact_info_phone_val'),
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
    },
    {
      icon: Mail,
      label: t('contact_info_email'),
      value: t('contact_info_email_val'),
      color: 'text-primary',
      bg: 'bg-primary/5',
    },
    {
      icon: Clock,
      label: t('contact_info_hours'),
      value: t('contact_info_hours_val'),
      sub: t('contact_info_hours_weekend'),
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ]

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-teal-600 via-primary to-blue-700 py-24 px-4">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center text-white relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <HeartPulse className="w-4 h-4" />
            {t('contact_badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('contact_title')}</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">{t('contact_subtitle')}</p>
        </motion.div>
      </section>

      {/* Info Cards */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {infoCards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-lg text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3", card.bg)}>
                <card.icon className={cn("w-5 h-5", card.color)} />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{card.label}</p>
              <p className="text-sm font-medium text-foreground leading-snug">{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form + Map */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold mb-6">{t('contact_title')}</h2>

          {status === 'success' ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center text-center py-16 gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-700 dark:text-green-400">{t('contact_success')}</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t('contact_name')} *</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder={t('contact_name_placeholder')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t('contact_phone')}</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder={t('contact_phone_placeholder')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('contact_email')} *</label>
                <input name="email" value={form.email} onChange={handleChange} type="email"
                  placeholder={t('contact_email_placeholder')}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('contact_subject')}</label>
                <input name="subject" value={form.subject} onChange={handleChange}
                  placeholder={t('contact_subject_placeholder')}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('contact_message')} *</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={5}
                  placeholder={t('contact_message_placeholder')}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none" />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {t('contact_error')}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={status === 'sending' || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 h-11 shadow-lg shadow-primary/20 font-medium text-sm"
              >
                <Send className="w-4 h-4" />
                {status === 'sending' ? t('contact_sending') : t('contact_send')}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Map + Emergency */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('contact_map_title')}</h2>
            <div className="rounded-2xl overflow-hidden border border-border shadow-md h-64 bg-muted relative">
              <iframe
                src="https://www.google.com/maps?q=Healwell+Hospital+Bailey+Road+Patna+Bihar&output=embed"
                width="100%" height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>
          </div>

          {/* Emergency Card */}
          <div className="bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/60 rounded-xl flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-red-700 dark:text-red-400 text-lg">{t('contact_emergency')}</h3>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4 leading-relaxed">{t('contact_emergency_desc')}</p>
            <a href="tel:+15559110000"
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-lg shadow-red-500/20">
              <Phone className="w-4 h-4" />
              {t('contact_emergency_btn')}
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
