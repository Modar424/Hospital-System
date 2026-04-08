"use client"

import React, { createContext, useContext, useSyncExternalStore, useEffect, ReactNode } from 'react'

export type Lang = 'en' | 'ar'

export const translations = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_doctors: 'Doctors',
    nav_appointments: 'My Appointments',
    nav_about: 'About Us',
    nav_faq: 'FAQ',
    nav_signin: 'Sign In',
    nav_signup: 'Sign Up',

    // Hero
    hero_badge: 'World-Class Healthcare',
    hero_title: 'Advanced Medical Care For You',
    hero_subtitle: 'Connect with top specialists and book appointments seamlessly. Your health is our priority.',
    hero_book: 'Book Appointment',
    hero_find: 'Find Doctors',
    hero_dept: 'Department',
    hero_dept_placeholder: 'Select department',
    hero_doctor: 'Doctor',
    hero_doctor_placeholder: 'Any available doctor',
    hero_date: 'Date & Time',
    hero_notes: 'Notes (optional)',
    hero_notes_placeholder: 'Describe your symptoms...',
    hero_submit: 'Book Now',
    hero_submitting: 'Booking...',
    hero_trusted: 'Trusted by 50,000+ patients',
    hero_available: 'Available 24/7',
    hero_certified: 'Certified Specialists',
    hero_quick_booking: 'Quick Booking',
    hero_signin_prompt: 'Sign in to book an appointment',
    hero_loading_doctors: 'Loading doctors...',
    hero_doctor_optional: 'Select Doctor (optional)',
    hero_loading: 'Loading...',
    hero_no_doctors: 'No doctors available',
    hero_stat_doctors: 'Doctors',
    hero_stat_patients: 'Patients',
    hero_stat_satisfaction: 'Satisfaction',
    hero_success: 'Appointment booked successfully!',
    hero_error: 'Failed to book appointment',
    hero_error_department: 'Please select a department',
    hero_error_date: 'Please select a date',
    hero_error_future_date: 'Please select a future date',
    hero_dept_cardiology: 'Cardiology',
    hero_dept_neurology: 'Neurology',
    hero_dept_pediatrics: 'Pediatrics',
    hero_dept_orthopedics: 'Orthopedics',

    // Categories
    cat_title: 'Our Medical Specialties',
    cat_subtitle: 'Specialized medical care across a wide range of departments, ensuring comprehensive treatment for you and your family.',
    cat_badge: 'Specialties',

    // Top Doctors
    all_doctors_badge: 'Our Team',
    all_doctors_title_prefix: 'Our',
    all_doctors_title_highlight: 'Expert Doctors',
    all_doctors_subtitle: 'Find the right specialist for your needs',
    all_doctors_search_placeholder: 'Search by name or specialty...',
    all_doctors_empty: 'No doctors found matching your search.',
    doctors_title: 'Top Specialists',
    doctors_subtitle: 'Our team of experienced doctors is dedicated to providing the best possible care.',
    doctors_view_all: 'View All Doctors',
    doctors_book: 'Book Appointment',
    doctors_certified: 'Certified',
    doctors_exp: 'yrs exp',

    // Stats
    stat_doctors: 'Expert Doctors',
    stat_departments: 'Departments',
    stat_patients: 'Happy Patients',
    stat_experience: 'Years Experience',

    // Footer
    footer_tagline: 'Providing world-class healthcare with a personal touch. Your health is our priority.',
    footer_quick: 'Quick Links',
    footer_contact: 'Contact',
    footer_newsletter: 'Newsletter',
    footer_newsletter_desc: 'Stay updated with health tips and news.',
    footer_newsletter_placeholder: 'Your email',
    footer_newsletter_btn: 'Join',
    footer_newsletter_joining: 'Joining...',
    footer_privacy: 'We respect your privacy',
    footer_rights: 'All rights reserved.',
    footer_back_top: 'Back to top',
    footer_home: 'Home',
    footer_find_doctor: 'Find a Doctor',
    footer_book: 'Book Appointment',
    footer_about: 'About Us',
    footer_faq: 'FAQ',
    footer_help: 'Help Center',
    footer_privacy_policy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_support: 'Contact Support',

    // About
    about_badge: 'About HealWell',
    about_hero_title: 'Caring for Lives, One Patient at a Time',
    about_hero_subtitle: 'Since 1999, HealWell has been the region\'s most trusted name in advanced healthcare. We blend cutting-edge technology with genuine human compassion.',
    about_meet_doctors: 'Meet Our Doctors',
    about_book: 'Book a Visit',
    about_stat1: 'Years of Excellence',
    about_stat2: 'Patients Treated',
    about_stat3: 'Expert Physicians',
    about_stat4: 'Patient Satisfaction',
    about_mission_badge: 'Our Mission',
    about_mission_title: 'Redefining What Healthcare Can Be',
    about_mission_body: 'Our mission is simple: provide world-class medical care that is accessible, compassionate, and results-driven.',
    about_vision_badge: 'Our Vision',
    about_vision_title: 'A Healthier Tomorrow for Everyone',
    about_vision_body: 'We envision a future where every person has access to exceptional medical care — regardless of background or circumstance.',
    about_values_title: 'The Values That Guide Us',
    about_values_subtitle: 'Every decision we make, every procedure we perform is grounded in these core principles.',
    about_v1_title: 'Compassionate Care',
    about_v1_desc: 'We treat every patient with empathy, dignity, and respect — because healing begins with how we make you feel.',
    about_v2_title: 'Safety First',
    about_v2_desc: 'Our rigorous safety protocols and accredited facilities ensure that every procedure meets the highest standards.',
    about_v3_title: 'Precision Medicine',
    about_v3_desc: 'Advanced diagnostics and personalized treatment plans tailored to your unique health needs.',
    about_v4_title: 'Excellence',
    about_v4_desc: 'Board-certified specialists and continuous training ensure you receive care that leads the field.',
    about_team_title: 'Meet Our Leadership',
    about_team_subtitle: 'World-class physicians leading the way in their respective specialties.',
    about_cta_title: 'Ready to Experience Better Healthcare?',
    about_cta_subtitle: 'Book an appointment today and discover why thousands of families trust HealWell.',
    about_cta_btn: 'Book Appointment',
    about_cta_faq: 'Have Questions?',

    // FAQ
    faq_badge: 'Help Center',
    faq_title: 'Frequently Asked Questions',
    faq_subtitle: 'Find answers to the most common questions about our services, appointments, and care.',
    faq_search: 'Search questions...',
    faq_no_results: 'No results found for',
    faq_still_title: 'Still Have Questions?',
    faq_still_subtitle: 'Our support team is available Monday–Friday, 8 AM – 8 PM. We\'re always happy to help.',
    faq_consult: 'Book a Consultation',
    faq_contact: 'Contact Support',
    faq_cat1: 'Appointments',
    faq_cat2: 'Insurance & Payments',
    faq_cat3: 'Medical Records',
    faq_cat4: 'Emergency & Urgent Care',

    // Language toggle
    lang_label: 'العربية',

    // AI Chat
    chat_greeting: 'Hello! I\'m your HealWell assistant. How can I help you today?',
    chat_input_placeholder: 'Type a message...',
    chat_error_connection: 'I\'m having trouble connecting. Please try again.',
    chat_online: 'Online',
    chat_title: 'HealWell AI',
    chat_suggestion_appointments: 'My appointments',
    chat_suggestion_doctor: 'Find doctor by specialty',
    chat_suggestion_hours: 'Hospital hours',
  },

  ar: {
    // Nav
    nav_home: 'الرئيسية',
    nav_doctors: 'الأطباء',
    nav_appointments: 'مواعيدي',
    nav_about: 'من نحن',
    nav_faq: 'الأسئلة الشائعة',
    nav_signin: 'تسجيل الدخول',
    nav_signup: 'إنشاء حساب',

    // Hero
    hero_badge: 'رعاية صحية عالمية المستوى',
    hero_title: 'رعاية طبية متقدمة من أجلك',
    hero_subtitle: 'تواصل مع أفضل الأطباء المتخصصين واحجز مواعيدك بسهولة. صحتك هي أولويتنا.',
    hero_book: 'احجز موعدًا',
    hero_find: 'ابحث عن طبيب',
    hero_dept: 'القسم',
    hero_dept_placeholder: 'اختر القسم',
    hero_doctor: 'الطبيب',
    hero_doctor_placeholder: 'أي طبيب متاح',
    hero_date: 'التاريخ والوقت',
    hero_notes: 'ملاحظات (اختياري)',
    hero_notes_placeholder: 'صف أعراضك...',
    hero_submit: 'احجز الآن',
    hero_submitting: 'جارٍ الحجز...',
    hero_trusted: 'يثق بنا أكثر من 50,000 مريض',
    hero_available: 'متاح 24/7',
    hero_certified: 'متخصصون معتمدون',
    hero_quick_booking: 'حجز سريع',
    hero_signin_prompt: 'سجّل الدخول لحجز موعد',
    hero_loading_doctors: 'جارٍ تحميل الأطباء...',
    hero_doctor_optional: 'اختر الطبيب (اختياري)',
    hero_loading: 'جارٍ التحميل...',
    hero_no_doctors: 'لا يوجد أطباء متاحون',
    hero_stat_doctors: 'الأطباء',
    hero_stat_patients: 'المرضى',
    hero_stat_satisfaction: 'رضا المرضى',
    hero_success: 'تم حجز الموعد بنجاح!',
    hero_error: 'فشل في حجز الموعد',
    hero_error_department: 'يرجى اختيار القسم',
    hero_error_date: 'يرجى اختيار التاريخ',
    hero_error_future_date: 'يرجى اختيار تاريخ مستقبلي',
    hero_dept_cardiology: 'أمراض القلب',
    hero_dept_neurology: 'الأعصاب',
    hero_dept_pediatrics: 'طب الأطفال',
    hero_dept_orthopedics: 'العظام',

    // Categories
    cat_title: 'تخصصاتنا الطبية',
    cat_subtitle: 'رعاية طبية متخصصة تشمل طيفًا واسعًا من الأقسام، لضمان علاج شامل ومتكامل لك ولأفراد عائلتك.',
    cat_badge: 'التخصصات',

    // Top Doctors
    all_doctors_badge: 'فريقنا',
    all_doctors_title_prefix: 'أطباؤنا',
    all_doctors_title_highlight: 'الخبراء',
    all_doctors_subtitle: 'اعثر على الاختصاصي المناسب لاحتياجاتك',
    all_doctors_search_placeholder: 'ابحث بالاسم أو التخصص...',
    all_doctors_empty: 'لم يتم العثور على أطباء مطابقين لبحثك.',
    doctors_title: 'أبرز المتخصصين',
    doctors_subtitle: 'فريقنا من الأطباء ذوي الخبرة مكرّس لتقديم أفضل رعاية ممكنة.',
    doctors_view_all: 'عرض جميع الأطباء',
    doctors_book: 'احجز موعدًا',
    doctors_certified: 'معتمد',
    doctors_exp: 'سنوات خبرة',

    // Stats
    stat_doctors: 'طبيب متخصص معتمد',
    stat_departments: 'قسم طبي متخصص',
    stat_patients: 'مريض سعيد بخدمتنا',
    stat_experience: 'سنة من الخبرة الطبية',

    // Footer
    footer_tagline: 'نقدم رعاية صحية عالمية بلمسة إنسانية. صحتك هي أولويتنا.',
    footer_quick: 'روابط سريعة',
    footer_contact: 'تواصل معنا',
    footer_newsletter: 'النشرة الإخبارية',
    footer_newsletter_desc: 'ابقَ على اطلاع بنصائح صحية وأخبار.',
    footer_newsletter_placeholder: 'بريدك الإلكتروني',
    footer_newsletter_btn: 'اشتراك',
    footer_newsletter_joining: 'جارٍ الاشتراك...',
    footer_privacy: 'نحترم خصوصيتك',
    footer_rights: 'جميع الحقوق محفوظة.',
    footer_back_top: 'العودة للأعلى',
    footer_home: 'الرئيسية',
    footer_find_doctor: 'ابحث عن طبيب',
    footer_book: 'احجز موعدًا',
    footer_about: 'من نحن',
    footer_faq: 'الأسئلة الشائعة',
    footer_help: 'مركز المساعدة',
    footer_privacy_policy: 'سياسة الخصوصية',
    footer_terms: 'شروط الخدمة',
    footer_support: 'دعم العملاء',

    // About
    about_hero_title: 'نهتم بحياتك، مريض تلو الآخر',
    about_hero_subtitle: 'منذ عام 1999، كانت  Healwell الاسم الأكثر ثقةً في مجال الرعاية الصحية المتقدمة بالمنطقة. نجمع بين أحدث التقنيات وحرارة الإنسانية الحقيقية.',
    about_meet_doctors: 'تعرّف على أطبائنا',
    about_book: 'احجز زيارة',
    about_stat1: 'سنة من التميز',
    about_stat2: 'مريض تلقّى العلاج',
    about_stat3: 'طبيب متخصص',
    about_stat4: 'رضا المرضى',
    about_mission_badge: 'مهمتنا',
    about_mission_title: 'نُعيد تعريف معنى الرعاية الصحية',
    about_mission_body: 'مهمتنا بسيطة: تقديم رعاية طبية عالمية المستوى، ميسّرة وإنسانية ومبنية على النتائج.',
    about_vision_badge: 'رؤيتنا',
    about_vision_title: 'غدٌ أكثر صحةً للجميع',
    about_vision_body: 'نتطلع إلى مستقبل يحصل فيه كل شخص على رعاية طبية استثنائية، بصرف النظر عن خلفيته أو ظروفه.',
    about_values_title: 'القيم التي تُوجّهنا',
    about_values_subtitle: 'كل قرار نتخذه، وكل إجراء نُنفّذه، مبنيٌّ على هذه المبادئ الأساسية.',
    about_v1_title: 'رعاية بالقلب',
    about_v1_desc: 'نتعامل مع كل مريض بتعاطف واحترام وكرامة، لأن الشفاء يبدأ بالطريقة التي نجعلك تشعر بها.',
    about_v2_title: 'السلامة أولًا',
    about_v2_desc: 'بروتوكولات سلامة صارمة ومرافق معتمدة تضمن أن كل إجراء يلبّي أعلى المعايير.',
    about_v3_title: 'الطب الدقيق',
    about_v3_desc: 'تشخيص متقدم وخطط علاجية مُصمَّمة خصيصًا لاحتياجاتك الصحية الفريدة.',
    about_v4_title: 'التميز',
    about_v4_desc: 'أطباء معتمدون وتدريب مستمر يضمنان حصولك على رعاية في طليعة المجال.',
    about_team_title: 'فريق القيادة',
    about_team_subtitle: 'أطباء من المستوى العالمي يقودون مساراتهم التخصصية بكفاءة واحترافية عالية.',
    about_cta_title: 'هل أنت مستعد لتجربة رعاية صحية أفضل؟',
    about_cta_subtitle: 'احجز موعدًا اليوم واكتشف سبب ثقة آلاف العائلات بهيلويل.',
    about_cta_btn: 'احجز موعدًا',
    about_cta_faq: 'لديك أسئلة؟',

    // FAQ
    faq_badge: 'مركز المساعدة',
    faq_title: 'الأسئلة الشائعة',
    faq_subtitle: 'اعثر على إجابات أكثر الأسئلة شيوعًا حول خدماتنا ومواعيدنا ورعايتنا.',
    faq_search: 'ابحث في الأسئلة...',
    faq_no_results: 'لا توجد نتائج لـ',
    faq_still_title: 'لا تزال لديك أسئلة؟',
    faq_still_subtitle: 'فريق الدعم متاح من الاثنين إلى الجمعة، من الساعة 8 صباحًا حتى 8 مساءً. يسعدنا دائمًا مساعدتك.',
    faq_consult: 'احجز استشارة',
    faq_contact: 'تواصل مع الدعم',
    faq_cat1: 'المواعيد',
    faq_cat2: 'التأمين والمدفوعات',
    faq_cat3: 'السجلات الطبية',
    faq_cat4: 'الطوارئ والرعاية العاجلة',

    // Language toggle
    lang_label: 'English',

    // AI Chat
    chat_greeting: 'مرحباً! أنا مساعدك من HealWell. كيف يمكنني مساعدتك؟',
    chat_input_placeholder: 'اكتب رسالة...',
    chat_error_connection: 'يوجد مشكلة في الاتصال. يرجى المحاولة الاحقاً.',
    chat_online: 'متصل',
    chat_title: 'HealWell AI',
    chat_suggestion_appointments: 'مواعيدي',
    chat_suggestion_doctor: 'البحث عن طبيب متخصص',
    chat_suggestion_hours: 'ساعات العمل',
  },
}

type Translations = typeof translations['en']
type TranslationKey = keyof Translations

interface I18nContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  isRTL: false,
})

const LANG_EVENT = 'lang-change'

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem('lang')
  return saved === 'ar' || saved === 'en' ? saved : 'en'
}

function subscribeLangChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(LANG_EVENT, handler)

  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(LANG_EVENT, handler)
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore<Lang>(subscribeLangChange, readStoredLang, () => 'en')

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l)
    window.dispatchEvent(new Event(LANG_EVENT))
  }

  const t = (key: TranslationKey): string => {
    return (translations[lang] as Translations)[key] ?? (translations['en'] as Translations)[key] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
