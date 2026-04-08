"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Heart, Shield, Award, Users, Target, Eye, Stethoscope, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const team = [
  { name: 'Dr. Sarah Al-Rashid', role_en: 'Chief Medical Officer',   role_ar: 'المدير الطبي',          specialty: 'Cardiology' },
  { name: 'Dr. James Chen',      role_en: 'Head of Surgery',         role_ar: 'رئيس قسم الجراحة',      specialty: 'Neurosurgery' },
  { name: 'Dr. Amira Khalil',    role_en: 'Director of Pediatrics',  role_ar: 'مدير قسم طب الأطفال',   specialty: 'Pediatrics' },
  { name: 'Dr. Michael Torres',  role_en: 'Radiology Lead',          role_ar: 'رئيس قسم الأشعة',       specialty: 'Diagnostic Imaging' },
]

const missionPoints = {
  en: ['Evidence-based treatment protocols', 'Transparent, honest communication', 'Continuous innovation in care delivery', 'Community health and preventive medicine'],
  ar: ['بروتوكولات علاجية مبنية على الأدلة', 'تواصل شفاف وصادق', 'ابتكار مستمر في تقديم الرعاية', 'صحة المجتمع والطب الوقائي'],
}

export default function AboutPage() {
  const { t, lang } = useI18n()
  const dbStats = useQuery(api.stats.getStats)

  const stats = [
    { value: `${dbStats?.experience || 25}+`, label: t('about_stat1'), icon: Award },
    { value: `${dbStats?.patients ? `${(dbStats.patients / 1000).toFixed(0)}K+` : '50K+'}`, label: t('about_stat2'), icon: Users },
    { value: `${dbStats?.doctors || 200}+`, label: t('about_stat3'), icon: Stethoscope },
    { value: '98%', label: t('about_stat4'), icon: Heart },
  ]

  const values = [
    { icon: Heart,   title: t('about_v1_title'), description: t('about_v1_desc') },
    { icon: Shield,  title: t('about_v2_title'), description: t('about_v2_desc') },
    { icon: Target,  title: t('about_v3_title'), description: t('about_v3_desc') },
    { icon: Award,   title: t('about_v4_title'), description: t('about_v4_desc') },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-175 h-175 bg-primary/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-125 h-125 bg-teal-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="flex-1 text-center lg:text-start max-w-2xl mx-auto lg:mx-0"
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5, ease: 'easeInOut' }}
                className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6"
              >
                {t('about_badge')}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeInOut' }}
                className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 leading-tight"
              >
                {t('about_hero_title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeInOut' }}
                className="text-lg text-muted-foreground leading-relaxed mb-8"
              >
                {t('about_hero_subtitle')}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6, ease: 'easeInOut' }}
                className="flex flex-wrap gap-3 justify-center lg:justify-start"
              >
                <Link href="/all-doctors">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 shadow-lg shadow-primary/25">
                    {t('about_meet_doctors')} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/appointments">
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 hover:border-primary hover:bg-primary/5">
                    {t('about_book')}
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6, ease: 'easeInOut' }}
                className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start"
              >
                {[
                  { icon: Shield, label: lang === 'ar' ? 'معتمد دوليًا' : 'Internationally Certified' },
                  { icon: Award, label: lang === 'ar' ? '+25 سنة خبرة' : '25+ Years Experience' },
                  { icon: Heart, label: lang === 'ar' ? '+50,000 مريض' : '50,000+ Patients' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm">
                    <b.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground">{b.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Doctor images grid with glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
               className="relative shrink-0 hidden lg:flex flex-col gap-6 lg:ml-auto lg:mr-8"
            >
              {/* Main large doctor card */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/20 via-teal-200/30 to-emerald-200/20 blur-xl scale-95 translate-y-4 group-hover:scale-100 group-hover:blur-2xl transition-all duration-500" />
                <div
                  className="relative w-full max-w-2xl rounded-3xl overflow-hidden border border-white/40 shadow-2xl shadow-primary/20 group-hover:shadow-primary/50 transition-all duration-500 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(240,253,244,0.25) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
                  
                  {/* Image container */}
                  <motion.div 
                    className="relative overflow-hidden w-full h-137.5"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Image 
                      src="/images/Lucid_Origin_a_surreal_and_vibrant_cinematic_photo_of_A_profes_0.jpg" 
                      alt="Medical Team" 
                      width={800}
                      height={550}
                      className="w-full h-full object-cover brightness-100 group-hover:brightness-110 transition-all duration-500"
                    />
                  </motion.div>



                  {/* Hover overlay effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(13,148,136,0.08) 100%)' }}
                  />
                </div>
              </div>


            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center text-white">
                <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-80 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">{t('about_mission_badge')}</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">{t('about_mission_title')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{t('about_mission_body')}</p>
              <ul className="space-y-3">
                {missionPoints[lang].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">{t('about_vision_badge')}</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">{t('about_vision_title')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{t('about_vision_body')}</p>
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-6">
                <blockquote className="text-sm italic text-foreground leading-relaxed">
                  {lang === 'ar'
                    ? '"نحن لا نعالج المرض فحسب — بل نرعى الإنسان بأكمله. وعدنا أن نكون شريكك في الصحة في كل مرحلة من مراحل حياتك."'
                    : '"We don\'t just treat illness — we nurture the whole person. Our promise is to be your partner in health at every stage of life."'}
                </blockquote>
                <p className="text-xs text-primary font-semibold mt-3">— Dr. Sarah Al-Rashid</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('about_values_title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('about_values_subtitle')}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('about_team_title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('about_team_subtitle')}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }} className="text-center bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-teal-100 dark:to-teal-900 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary border-2 border-primary/20 shadow-md group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all duration-300 relative">
                  {member.name.split(' ')[1]?.charAt(0) ?? member.name.charAt(0)}
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <h3 className="font-bold text-sm mb-0.5">{member.name}</h3>
                <p className="text-xs text-primary font-medium mb-2">{lang === 'ar' ? member.role_ar : member.role_en}</p>
                <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{member.specialty}</span>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('about_cta_title')}</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">{t('about_cta_subtitle')}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/appointments">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-semibold shadow-lg">{t('about_cta_btn')}</Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline" className="text-dark border-white/40 hover:bg-white/10 rounded-full px-8">{t('about_cta_faq')}</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
