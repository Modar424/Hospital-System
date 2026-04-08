"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, Search, ArrowRight, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

const faqData = {
  en: [
    {
      category: 'Appointments',
      items: [
        { q: 'How do I book an appointment?', a: 'You can book an appointment through our website by clicking "Book Appointment" on any doctor\'s profile, or by calling our helpline at +1 (555) 123-4567. Online bookings are available 24/7.' },
        { q: 'Can I reschedule or cancel my appointment?', a: 'Yes, you can reschedule or cancel through your account dashboard up to 2 hours before your appointment time. For urgent changes, please call our front desk directly.' },
        { q: 'How early should I arrive for my appointment?', a: 'We recommend arriving 15 minutes before your scheduled time. For first visits, please arrive 20 minutes early to complete registration paperwork.' },
        { q: 'Are telemedicine / virtual appointments available?', a: 'Yes! Many of our specialists offer secure video consultations. You will see a "Virtual Visit" option on eligible doctors\' profiles when booking.' },
      ],
    },
    {
      category: 'Insurance & Payments',
      items: [
        { q: 'What insurance plans do you accept?', a: 'We accept most major insurance providers including BlueCross BlueShield, Aetna, UnitedHealth, Cigna, and Medicare/Medicaid. Contact us to verify your specific plan.' },
        { q: 'Do you offer payment plans?', a: 'Yes, we offer flexible payment plans for patients without insurance or with high deductibles. Our financial counselors can discuss options during your visit or by phone.' },
        { q: 'How do I get an estimate of my costs before treatment?', a: 'You can request a Good Faith Estimate before any scheduled service. Contact our billing department at billing@healwell.com or call ext. 200.' },
      ],
    },
    {
      category: 'Medical Records',
      items: [
        { q: 'How can I access my medical records?', a: 'Your records are available through your secure patient portal. You can also submit a medical records release form at any of our facilities or by mail.' },
        { q: 'How long does it take to receive my records?', a: 'Electronic records are available immediately through the patient portal. Physical copies are processed within 5–7 business days of receiving your signed request.' },
        { q: 'Is my health information kept private?', a: 'Absolutely. We comply fully with HIPAA regulations and employ bank-grade encryption for all digital health data. Your information is never shared without your explicit written consent.' },
      ],
    },
    {
      category: 'Emergency & Urgent Care',
      items: [
        { q: 'When should I go to the ER vs Urgent Care?', a: 'For life-threatening emergencies (chest pain, stroke symptoms, severe bleeding), call 911 or go to the ER immediately. For non-life-threatening but urgent issues, our urgent care center is open 7 days a week.' },
        { q: 'What are your emergency contact numbers?', a: 'Emergency hotline: +1 (555) 911-0000 (24/7). Nurse advice line: +1 (555) 123-NURSE. General inquiries: +1 (555) 123-4567.' },
      ],
    },
  ],
  ar: [
    {
      category: 'المواعيد',
      items: [
        { q: 'كيف أحجز موعدًا؟', a: 'يمكنك حجز موعد عبر موقعنا بالنقر على "احجز موعدًا" في ملف أي طبيب، أو بالاتصال على الخط الساخن +1 (555) 123-4567. الحجز الإلكتروني متاح على مدار الساعة.' },
        { q: 'هل يمكنني إعادة جدولة موعدي أو إلغاؤه؟', a: 'نعم، يمكنك إعادة الجدولة أو الإلغاء عبر لوحة تحكم حسابك حتى ساعتين قبل الموعد. للتغييرات العاجلة، يرجى الاتصال بمكتب الاستقبال مباشرةً.' },
        { q: 'كم قبل يجب أن أصل قبل موعدي؟', a: 'نوصي بالوصول قبل 15 دقيقة من وقتك المحدد. للزيارات الأولى، يُرجى الوصول مبكرًا بـ 20 دقيقة لإكمال أوراق التسجيل.' },
        { q: 'هل تتوفر مواعيد عبر الفيديو (تيليميديسين)؟', a: 'نعم! يقدم كثير من متخصصينا استشارات فيديو آمنة. ستجد خيار "زيارة افتراضية" في ملفات الأطباء المؤهلين عند الحجز.' },
      ],
    },
    {
      category: 'التأمين والمدفوعات',
      items: [
        { q: 'ما خطط التأمين التي تقبلونها؟', a: 'نقبل معظم شركات التأمين الكبرى، بما فيها BlueCross BlueShield وAetna وUnitedHealth وCigna وMedicare/Medicaid. تواصل معنا للتحقق من خطتك.' },
        { q: 'هل تقدمون خطط سداد؟', a: 'نعم، نقدم خطط دفع مرنة للمرضى غير المؤمّنين أو ذوي الخصومات العالية. يمكن لمستشارينا الماليين مناقشة الخيارات معك.' },
        { q: 'كيف أحصل على تقدير لتكاليف العلاج مسبقًا؟', a: 'يمكنك طلب تقدير بحسن النية قبل أي خدمة مجدولة. تواصل مع قسم الفواتير على billing@healwell.com أو على الرقم الداخلي 200.' },
      ],
    },
    {
      category: 'السجلات الطبية',
      items: [
        { q: 'كيف يمكنني الوصول إلى سجلاتي الطبية؟', a: 'سجلاتك متاحة عبر بوابة المريض الآمنة. يمكنك أيضًا تقديم نموذج الإفراج عن السجلات في أي من مرافقنا أو بالبريد.' },
        { q: 'كم يستغرق استلام سجلاتي؟', a: 'السجلات الإلكترونية متاحة فورًا عبر بوابة المريض. تُعالَج النسخ الورقية في غضون 5–7 أيام عمل من استلام طلبك الموقّع.' },
        { q: 'هل معلوماتي الصحية محفوظة؟', a: 'بالتأكيد. نلتزم تمامًا بلوائح HIPAA ونستخدم تشفيرًا بمستوى بنكي لجميع البيانات الصحية الرقمية. لن تُشارَك معلوماتك دون موافقتك الكتابية الصريحة.' },
      ],
    },
    {
      category: 'الطوارئ والرعاية العاجلة',
      items: [
        { q: 'متى أتجه لغرفة الطوارئ مقابل العيادة العاجلة؟', a: 'في حالات الخطر على الحياة (ألم الصدر، أعراض السكتة الدماغية، النزيف الشديد)، اتصل بالطوارئ أو توجه لغرفة الطوارئ فورًا. للحالات العاجلة غير الخطيرة، عيادتنا العاجلة مفتوحة 7 أيام.' },
        { q: 'ما أرقام الطوارئ لديكم؟', a: 'خط الطوارئ: +1 (555) 911-0000 (24/7). خط نصيحة الممرضة: +1 (555) 123-NURSE. الاستفسارات العامة: +1 (555) 123-4567.' },
      ],
    },
  ],
}

function AccordionItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div layout className="border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors duration-200">
      <button onClick={onClick} className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-primary/3 transition-colors duration-200">
        <span className="font-medium text-sm pr-4">{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <ChevronDown className="w-3.5 h-3.5 text-primary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border bg-primary/3 dark:bg-primary/5">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { t, lang } = useI18n()

  const data = faqData[lang]

  const filtered = data.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
              {t('faq_badge')}
            </motion.span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {t('faq_title')}
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">{t('faq_subtitle')}</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('faq_search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-full border-border focus:border-primary h-12 bg-card shadow-sm" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className="text-muted-foreground">{t('faq_no_results')} {search}</p>
            </motion.div>
          ) : (
            filtered.map((cat, ci) => (
              <motion.div key={cat.category} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.08 }} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold">{cat.category}</h2>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item) => {
                    const id = `${cat.category}-${item.q}`
                    return (
                      <AccordionItem key={id} q={item.q} a={item.a} isOpen={openItem === id} onClick={() => setOpenItem(openItem === id ? null : id)} />
                    )
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t('faq_still_title')}</h2>
            <p className="text-muted-foreground mb-6">{t('faq_still_subtitle')}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/appointments">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
                  {t('faq_consult')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Button variant="outline" className="rounded-full px-6 border-primary/30 hover:border-primary hover:bg-primary/5">
                {t('faq_contact')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
