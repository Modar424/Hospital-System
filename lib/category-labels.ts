import type { Lang } from '@/lib/i18n'

const categoryLabels: Record<string, { en: string; ar: string }> = {
  Cardiology: { en: 'Cardiology', ar: 'أمراض القلب' },
  Neurology: { en: 'Neurology', ar: 'الأعصاب' },
  Pediatrics: { en: 'Pediatrics', ar: 'طب الأطفال' },
  Orthopedics: { en: 'Orthopedics', ar: 'العظام' },
  Dermatology: { en: 'Dermatology', ar: 'الأمراض الجلدية' },
  Ophthalmology: { en: 'Ophthalmology', ar: 'طب العيون' },
  Oncology: { en: 'Oncology', ar: 'الأورام' },
  Gastroenterology: { en: 'Gastroenterology', ar: 'أمراض الجهاز الهضمي' },
  Psychiatry: { en: 'Psychiatry', ar: 'الطب النفسي' },
  Obstetrics: { en: 'Obstetrics', ar: 'التوليد' },
  Gynecology: { en: 'Gynecology', ar: 'أمراض النساء' },
  Urology: { en: 'Urology', ar: 'المسالك البولية' },
  Pulmonology: { en: 'Pulmonology', ar: 'أمراض الصدر' },
  Endocrinology: { en: 'Endocrinology', ar: 'الغدد الصماء' },
  Nephrology: { en: 'Nephrology', ar: 'أمراض الكلى' },
  Rheumatology: { en: 'Rheumatology', ar: 'أمراض الروماتيزم' },
  'Otolaryngology (ENT)': { en: 'Otolaryngology (ENT)', ar: 'الأنف والأذن والحنجرة' },
  Dentistry: { en: 'Dentistry', ar: 'طب الأسنان' },
  Radiology: { en: 'Radiology', ar: 'الأشعة' },
  Anesthesiology: { en: 'Anesthesiology', ar: 'طب التخدير' },
  'Emergency Medicine': { en: 'Emergency Medicine', ar: 'طب الطوارئ' },
  Immunology: { en: 'Immunology', ar: 'علم المناعة' },
  Hematology: { en: 'Hematology', ar: 'أمراض الدم' },
  'General Surgery': { en: 'General Surgery', ar: 'الجراحة العامة' },
  Geriatrics: { en: 'Geriatrics', ar: 'طب كبار السن' },
}

export function getCategoryLabel(categoryName: string, lang: Lang) {
  return categoryLabels[categoryName]?.[lang] ?? categoryName
}
