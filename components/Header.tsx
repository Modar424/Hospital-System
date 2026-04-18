"use client"

import { Stethoscope, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LangToggle } from '@/components/LangToggle'
import { useI18n } from '@/lib/i18n'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const Header = () => {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useI18n()
  const currentUser = useQuery(api.patients.getUser)

  const role = currentUser?.role

  // Base nav links for everyone
  const publicLinks = [
    { href: '/',            label: t('nav_home') },
    { href: '/all-doctors', label: t('nav_doctors') },
    { href: '/about',       label: t('nav_about') },
    { href: '/faq',         label: t('nav_faq') },
    { href: '/contact',     label: t('nav_contact') },
  ]

  // Role-specific dashboard link
  const dashboardLink = (() => {
    if (!isSignedIn || !role) return null
    if (role === 'admin')     return { href: '/admin',     label: t('admin_dashboard_label') }
    if (role === 'doctor')    return { href: '/doctor',    label: t('doctor_dashboard_label') }
    if (role === 'secretary') return { href: '/secretary', label: t('secretary_dashboard_label') }
    // guest: show appointments
    return { href: '/appointments', label: t('nav_appointments') }
  })()

  const navLinks = [
    ...publicLinks,
    ...(dashboardLink ? [dashboardLink] : []),
  ]

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span>HealWell</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          {isSignedIn ? (
            <UserButton />
          ) : (
            <div className="hidden md:flex gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">{t('nav_signin')}</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm" className="bg-primary hover:bg-primary/90">{t('nav_signup')}</Button>
              </SignInButton>
            </div>
          )}

          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-md overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block text-sm font-medium py-2 px-3 rounded-lg transition-colors",
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!isSignedIn && (
                <div className="flex gap-2 pt-2">
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm" className="w-full">{t('nav_signin')}</Button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">{t('nav_signup')}</Button>
                  </SignInButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Header
