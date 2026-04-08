"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Stethoscope, Mail, Phone, MapPin, ArrowUp } from 'lucide-react'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'

function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useI18n()

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email'); return }
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('You have been subscribed!')
      setEmail('')
    } catch {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const quickLinks = [
    { href: '/',             label: t('footer_home') },
    { href: '/all-doctors',  label: t('footer_find_doctor') },
    { href: '/appointments', label: t('footer_book') },
    { href: '/about',        label: t('footer_about') },
    { href: '/faq',          label: t('footer_faq') },
  ]

  const supportLinks = [
    { href: '/help',    label: t('footer_help') },
    { href: '/privacy', label: t('footer_privacy_policy') },
    { href: '/terms',   label: t('footer_terms') },
    { href: '/contact', label: t('footer_support') },
  ]

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-primary">HealWell</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">{t('footer_tagline')}</p>
            <div className="flex gap-3 mt-4">
              {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-slate-800 hover:bg-primary rounded-full transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold text-primary mb-4">{t('footer_quick')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-primary rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base font-semibold text-primary mb-4">{t('footer_contact')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>123 Medical Drive, City, ST 12345</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>care@healwell.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-base font-semibold text-primary mb-4">{t('footer_newsletter')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('footer_newsletter_desc')}</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('footer_newsletter_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-white shrink-0 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? t('footer_newsletter_joining') : t('footer_newsletter_btn')}
                </Button>
              </div>
              <p className="text-xs text-slate-500">{t('footer_privacy')}</p>
            </form>
            <ul className="mt-4 space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} HealWell. {t('footer_rights')}
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <ArrowUp className="w-4 h-4" />
            {t('footer_back_top')}
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
